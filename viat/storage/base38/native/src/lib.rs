// TODO: NEEDS TO BE OPTIMIZED VERY SLOW
use napi::bindgen_prelude::Buffer;
use napi_derive::napi;
use once_cell::sync::Lazy;
use std::cell::RefCell;

const ALPH: &[u8] = b"abcdefghijklmnopqrstuvwxyz0123456789-_";
const BASE: u32 = 38;
const BASEG: u64 = 38u64 * 38 * 38 * 38; // 38^4 = 2,085,136
const RADIX_U64: u64 = 1u64 << 32;       // 2^32

// thresholds to count digits in first group without loop
const T1: u32 = 38;                 // 38^1
const T2: u32 = 38 * 38;            // 38^2
const T3: u32 = 38 * 38 * 38;       // 38^3

// Size estimators
const LOG256_OVER_38: f64 = 1.524282665;
const LOG38_OVER_256: f64 = 0.656103048;

// Reusable per-thread scratch buffers
thread_local! {
  static DG_BUF: RefCell<Vec<u32>> = RefCell::new(Vec::new()); // base-(38^4) digits (encode)
  static LIMBS_BUF: RefCell<Vec<u32>> = RefCell::new(Vec::new()); // base-(2^32) limbs (decode)
  static TMP_BYTES: RefCell<Vec<u8>> = RefCell::new(Vec::new());  // temporary bytes (decode)
}

// Reverse table (full 256, -1 = invalid)
static REVERSE: Lazy<[i16; 256]> = Lazy::new(|| {
  let mut rev = [-1i16; 256];
  for (i, &c) in ALPH.iter().enumerate() {
    rev[c as usize] = i as i16;
  }
  rev
});

#[inline(always)]
fn first_group_len(v: u32) -> usize {
  if v < T1 { 1 } else if v < T2 { 2 } else if v < T3 { 3 } else { 4 }
}

#[napi(js_name = "encode_base38")]
pub fn encode_base38(input: Buffer) -> String {
  let input = input.as_ref();
  let len = input.len();
  if len == 0 { return String::new(); }

  // Count leading zero bytes
  let mut i = 0usize;
  while i < len && unsafe { *input.get_unchecked(i) } == 0 { i += 1; }
  let leading = i;
  if leading == len { return "a".repeat(leading); }

  // Pack remaining bytes into big-endian 32-bit limbs
  let bytes_left = len - leading;
  let rem = bytes_left & 3;
  let limbs_len = (bytes_left + 3) >> 2;
  let mut limbs = Vec::<u32>::with_capacity(limbs_len);
  if rem != 0 {
    let mut limb: u32 = 0;
    for _ in 0..rem {
      limb = (limb << 8) | unsafe { *input.get_unchecked(i) } as u32;
      i += 1;
    }
    limbs.push(limb);
  }
  while i + 4 <= len {
    let limb = ((unsafe { *input.get_unchecked(i) } as u32) << 24)
      | ((unsafe { *input.get_unchecked(i + 1) } as u32) << 16)
      | ((unsafe { *input.get_unchecked(i + 2) } as u32) << 8)
      |  (unsafe { *input.get_unchecked(i + 3) } as u32);
    limbs.push(limb);
    i += 4;
  }

  // Estimate base38 digits -> groups and allocate digit groups
  let est_digits = (bytes_left as f64 * LOG256_OVER_38).ceil() as usize + 1;
  let size_g = ((est_digits + 3) >> 2) + 1; // ceil(digits/4) + 1
  let mut used = 0usize;
  let dg = DG_BUF.with(|rc| {
    let mut v = rc.borrow_mut();
    if v.len() < size_g { v.resize(size_g, 0); } else { v.fill(0); }
    unsafe { std::slice::from_raw_parts_mut(v.as_mut_ptr(), size_g) }
  });

  // Convert base-(2^32) limbs -> base-(38^4) groups
  for limb in limbs.into_iter() {
    let mut carry = limb as u64;
    let mut j = size_g as isize - 1;
    let mut k = 0usize;
    while (carry != 0 || k < used) && j >= 0 {
      let idx = j as usize;
      let x = carry + (unsafe { *dg.get_unchecked(idx) } as u64) * RADIX_U64;
      let q = x / BASEG; // const-div -> strength-reduced
      unsafe { *dg.get_unchecked_mut(idx) = (x - q * BASEG) as u32; }
      carry = q;
      j -= 1;
      k += 1;
    }
    if k > used { used = k; }
  }

  // Skip leading zero groups
  let mut p = size_g - used;
  while p < size_g && unsafe { *dg.get_unchecked(p) } == 0 { p += 1; }
  if p == size_g { return "a".repeat(leading); }

  // Determine output length
  let first = unsafe { *dg.get_unchecked(p) };
  let first_cnt = first_group_len(first);
  let groups = size_g - p;
  let out_len = leading + first_cnt + (groups - 1) * 4;

  // Build ASCII output
  let mut out = Vec::<u8>::with_capacity(out_len);
  out.extend(std::iter::repeat(b'a').take(leading));

  // First group (no left padding) — write once
  {
    let mut tmp = [0u8; 4];
    let mut vv = first;
    for t in (0..first_cnt).rev() {
      let d = (vv % BASE) as usize;
      vv /= BASE;
      tmp[t] = unsafe { *ALPH.get_unchecked(d) };
    }
    out.extend_from_slice(&tmp[..first_cnt]);
  }

  // Remaining groups (exactly 4 digits, left-padded)
  for g in (p + 1)..size_g {
    let mut vv = unsafe { *dg.get_unchecked(g) };
    let d3 = (vv % BASE) as usize; vv /= BASE;
    let d2 = (vv % BASE) as usize; vv /= BASE;
    let d1 = (vv % BASE) as usize; vv /= BASE;
    let d0 = (vv % BASE) as usize;
    unsafe {
      out.push(*ALPH.get_unchecked(d0));
      out.push(*ALPH.get_unchecked(d1));
      out.push(*ALPH.get_unchecked(d2));
      out.push(*ALPH.get_unchecked(d3));
    }
  }

  unsafe { String::from_utf8_unchecked(out) }
}

#[napi(js_name = "decode_base38")]
pub fn decode_base38(s: String) -> Buffer {
  let bytes = s.as_bytes();
  let n = bytes.len();
  if n == 0 { return Buffer::from(Vec::<u8>::new()); }

  // Count leading 'a'
  let mut i = 0usize;
  while i < n && unsafe { *bytes.get_unchecked(i) } == b'a' { i += 1; }
  let leading = i;
  if leading == n { return Buffer::from(vec![0u8; leading]); }

  let digits_count = n - leading;
  let first_len = ((digits_count - 1) % 4) + 1; // 1..4
  let groups = (digits_count + 3) >> 2;

  // Parse base38 into base-(38^4) groups
  let mut gi = 0usize;
  let dg = DG_BUF.with(|rc| {
    let mut v = rc.borrow_mut();
    if v.len() < groups { v.resize(groups, 0); } else { v.fill(0); }
    unsafe { std::slice::from_raw_parts_mut(v.as_mut_ptr(), groups) }
  });

  // First group (1..4 digits)
  let mut gval: u32 = 0;
  for _ in 0..first_len {
    let ch = unsafe { *bytes.get_unchecked(i) };
    let v = unsafe { *REVERSE.get_unchecked(ch as usize) };
    if v < 0 { panic!("invalid base38 char"); }
    gval = gval * BASE + (v as u32);
    i += 1;
  }
  unsafe { *dg.get_unchecked_mut(gi) = gval; }
  gi += 1;

  // Remaining groups (exactly 4 digits each)
  while gi < groups {
    // Unrolled parse of 4 characters
    let c0 = unsafe { *bytes.get_unchecked(i) }; let v0 = unsafe { *REVERSE.get_unchecked(c0 as usize) }; i += 1;
    let c1 = unsafe { *bytes.get_unchecked(i) }; let v1 = unsafe { *REVERSE.get_unchecked(c1 as usize) }; i += 1;
    let c2 = unsafe { *bytes.get_unchecked(i) }; let v2 = unsafe { *REVERSE.get_unchecked(c2 as usize) }; i += 1;
    let c3 = unsafe { *bytes.get_unchecked(i) }; let v3 = unsafe { *REVERSE.get_unchecked(c3 as usize) }; i += 1;
    if v0 | v1 | v2 | v3 < 0 { panic!("invalid base38 char"); }
    let val = (((((v0 as u32) * BASE + v1 as u32) * BASE + v2 as u32) * BASE) + v3 as u32) as u32;
    unsafe { *dg.get_unchecked_mut(gi) = val; }
    gi += 1;
  }

  // Estimate bytes and limbs
  let est_bytes = (digits_count as f64 * LOG38_OVER_256).ceil() as usize + 1;
  let limbs_len = (est_bytes + 3) >> 2;
  let mut used = 0usize;
  let limbs = LIMBS_BUF.with(|rc| {
    let mut v = rc.borrow_mut();
    if v.len() < limbs_len { v.resize(limbs_len, 0); } else { v.fill(0); }
    unsafe { std::slice::from_raw_parts_mut(v.as_mut_ptr(), limbs_len) }
  });

  // Convert base-(38^4) -> base-(2^32) limbs
  for g in 0..gi {
    let mut carry = unsafe { *dg.get_unchecked(g) } as u64;
    let mut j = limbs_len as isize - 1;
    let mut k = 0usize;
    while (carry != 0 || k < used) && j >= 0 {
      let idx = j as usize;
      let x = (unsafe { *limbs.get_unchecked(idx) } as u64) * BASEG + carry;
      let q = x >> 32; // divide by 2^32
      unsafe { *limbs.get_unchecked_mut(idx) = (x - (q << 32)) as u32; }
      carry = q;
      j -= 1;
      k += 1;
    }
    if k > used { used = k; }
  }

  // Find first non-zero limb among used
  let mut limb_start = limbs_len.saturating_sub(used);
  while limb_start < limbs_len && unsafe { *limbs.get_unchecked(limb_start) } == 0 { limb_start += 1; }

  // Materialize bytes from limbs (big-endian per limb)
  let tmp_len = (limbs_len - limb_start) * 4;
  let tmp = TMP_BYTES.with(|rc| {
    let mut v = rc.borrow_mut();
    if v.len() < tmp_len { v.resize(tmp_len, 0); }
    unsafe { std::slice::from_raw_parts_mut(v.as_mut_ptr(), tmp_len) }
  });
  let mut tb = 0usize;
  for idx in limb_start..limbs_len {
    let val = unsafe { *limbs.get_unchecked(idx) };
    tmp[tb] = (val >> 24) as u8;
    tmp[tb + 1] = (val >> 16) as u8;
    tmp[tb + 2] = (val >> 8) as u8;
    tmp[tb + 3] = val as u8;
    tb += 4;
  }

  // Skip leading zero bytes in tmp
  let mut b = 0usize;
  while b < tb && unsafe { *tmp.get_unchecked(b) } == 0 { b += 1; }

  // Final result with leading zeros
  let out_len = leading + (tb - b);
  let mut out = Vec::<u8>::with_capacity(out_len);
  out.extend(std::iter::repeat(0u8).take(leading));
  out.extend_from_slice(&tmp[b..tb]);

  Buffer::from(out)
}
