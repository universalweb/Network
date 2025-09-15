/*
	Custom Base38 Encoding for more compact folder names on case insensitive systems
	Chars were chosen based on system safety/compatability and remaining lowercase
	CHAR LIST: abcdefghijklmnopqrstuvwxyz0123456789-_
*/
import { createRequire } from 'node:module';
const requireFn = createRequire(import.meta.url);
// Try to load native binding (prefer native)
// Commented out for now requires pre-build for installs
const native = null;
// Uncomment to test rust lib
// try {
// 	native = requireFn('./native/index.js');
// } catch {}
// Alphabet and lookups
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789-_';
const BASE = 38;
const ALPH0 = ALPHABET[0]; // 'a'
const ALPH0_CODE = ALPH0.charCodeAt(0);
const fromCharCode = String.fromCharCode;
const fromCharCodeApply = fromCharCode.apply.bind(fromCharCode);
// Precompute alphabet char codes for fast writes
const ALPH_CODES = new Uint16Array(BASE);
for (let i = 0; i < BASE; i++) {
	ALPH_CODES[i] = ALPHABET.charCodeAt(i);
}
// Reverse lookup (ASCII): -1 = invalid
const REVERSE = new Int16Array(128).fill(-1);
for (let i = 0; i < ALPHABET.length; i++) {
	REVERSE[ALPHABET.charCodeAt(i)] = i;
}
// Size estimation ratios
const RATIO_256_38 = Math.log(256) / Math.log(38); // digits ~= bytes * 1.5243
const RATIO_38_256 = Math.log(38) / Math.log(256); // bytes ~= digits * 0.6561
// Grouped-base constants (safe within IEEE-754 exact range with 2^32 limbs)
const GROUP = 4; // 4 base38 digits per group
const BASEG = 38 * 38 * 38 * 38; // 38^4 = 2,085,136
const RADIX = 2 ** 32; // 2^32
const INV_RADIX = 1 / RADIX;
// Fast first-group digit count thresholds
const T1 = 38; // 38^1
const T2 = 38 * 38; // 38^2
const T3 = 38 * 38 * 38;// 38^3
// Encode (JS fallback) using 2^32 limbs and base 38^4 grouping
function encode_base38_js(buffer) {
	if (!Buffer.isBuffer(buffer)) {
		return false;
	}
	const len = buffer.length;
	if (len === 0) {
		return '';
	}
	// Count leading zero bytes
	let i = 0;
	while (i < len && buffer[i] === 0) {
		i++;
	}
	const leadingZeros = i;
	if (i === len) {
		return ALPH0.repeat(leadingZeros);
	}
	// Pack remaining bytes into big-endian 32-bit limbs
	const bytesLeft = len - leadingZeros;
	const rem = bytesLeft & 3; // bytes % 4
	const limbsLen = (bytesLeft + 3) >> 2;
	const limbs = new Uint32Array(limbsLen);
	let w = 0;
	if (rem !== 0) {
		let limb = 0;
		for (let k = 0; k < rem; k++, i++) {
			limb = (limb << 8) | buffer[i];
		}
		limbs[w++] = limb >>> 0;
	}
	for (; i + 4 <= len; i += 4) {
		limbs[w++] =
      ((buffer[i] << 24) |
        (buffer[i + 1] << 16) |
        (buffer[i + 2] << 8) |
        buffer[i + 3]) >>> 0;
	}
	// Estimate number of base-38^4 digits and allocate
	const estDigits = Math.ceil(bytesLeft * RATIO_256_38);
	const sizeG = (Math.ceil(estDigits / GROUP) + 1) | 0;
	const digits = new Uint32Array(sizeG);
	let used = 0;
	// Convert base-(2^32) -> base-(38^4)
	for (let m = 0; m < w; m++) {
		let carry = limbs[m]; // 0..2^32-1
		let j = sizeG - 1;
		let k = 0;
		while ((carry !== 0 || k < used) && j >= 0) {
			const x = carry + digits[j] * RADIX; // <= (BASEG-1)*RADIX + (RADIX-1) < 2^53
			const q = Math.floor(x / BASEG);
			digits[j] = x - q * BASEG;
			carry = q;
			j--;
			k++;
		}
		if (k > used) {
			used = k;
		}
	}
	// Skip leading zero groups
	let p = sizeG - used;
	while (p < sizeG && digits[p] === 0) {
		p++;
	}
	if (p === sizeG) {
		return ALPH0.repeat(leadingZeros);
	}
	// Compute first group's digit count without division loop
	const first = digits[p];
	const firstCount = first < T1 ? 1 : first < T2 ? 2 : first < T3 ? 3 : 4;
	const groups = sizeG - p;
	const outLen = leadingZeros + firstCount + (groups - 1) * GROUP;
	// Build ASCII output (small -> charcodes, large -> Buffer)
	if (outLen <= 256) {
		const codes = new Uint16Array(outLen);
		let o = 0;
		for (; o < leadingZeros; o++) {
			codes[o] = ALPH0_CODE;
		}
		// First group (no left padding)
		let v = first >>> 0;
		for (let pos = o + firstCount - 1; pos >= o; pos--) {
			const d = v % BASE;
			codes[pos] = ALPH_CODES[d];
			v = (v / BASE) | 0;
		}
		o += firstCount;
		// Remaining groups (left-padded to 4 digits)
		for (let g = p + 1; g < sizeG; g++) {
			v = digits[g] >>> 0;
			const o3 = o + 3;
			codes[o3] = ALPH_CODES[v % BASE]; v = (v / BASE) | 0;
			codes[o3 - 1] = ALPH_CODES[v % BASE]; v = (v / BASE) | 0;
			codes[o3 - 2] = ALPH_CODES[v % BASE]; v = (v / BASE) | 0;
			codes[o3 - 3] = ALPH_CODES[v % BASE];
			o += 4;
		}
		return fromCharCodeApply(null, codes);
	} else {
		// Buffer path for larger outputs
		const out = Buffer.allocUnsafe(outLen);
		let o = 0;
		if (leadingZeros) {
			out.fill(ALPH0_CODE, 0, leadingZeros);
		}
		o = leadingZeros;
		// First group
		let v = first >>> 0;
		for (let pos = o + firstCount - 1; pos >= o; pos--) {
			const d = v % BASE;
			out[pos] = ALPH_CODES[d];
			v = (v / BASE) | 0;
		}
		o += firstCount;
		// Remaining groups
		for (let g = p + 1; g < sizeG; g++) {
			v = digits[g] >>> 0;
			const o3 = o + 3;
			out[o3] = ALPH_CODES[v % BASE]; v = (v / BASE) | 0;
			out[o3 - 1] = ALPH_CODES[v % BASE]; v = (v / BASE) | 0;
			out[o3 - 2] = ALPH_CODES[v % BASE]; v = (v / BASE) | 0;
			out[o3 - 3] = ALPH_CODES[v % BASE];
			o += 4;
		}
		return out.toString('ascii');
	}
}
// Decode (JS fallback) using base 38^4 grouping and 2^32 limbs
function decode_base38_js(str) {
	if (typeof str !== 'string') {
		return false;
	}
	const n = str.length;
	if (n === 0) {
		return Buffer.alloc(0);
	}
	// Count leading 'a'
	let i = 0;
	while (i < n && str.charCodeAt(i) === ALPH0_CODE) {
		i++;
	}
	const leadingZeros = i;
	if (i === n) {
		return Buffer.alloc(leadingZeros);
	}
	const digitsCount = n - leadingZeros;
	const firstLen = ((digitsCount - 1) % GROUP) + 1; // 1..4
	const groups = Math.ceil(digitsCount / GROUP);
	// Parse groups into base-(38^4) digits
	const dg = new Uint32Array(groups);
	let gi = 0;
	// First group (1..4 digits)
	let gval = 0;
	for (let t = 0; t < firstLen; t++, i++) {
		const code = str.charCodeAt(i);
		if (code >= 128) {
			return false;
		}
		const v = REVERSE[code];
		if (v < 0) {
			return false;
		}
		gval = gval * BASE + v;
	}
	dg[gi++] = gval >>> 0;
	// Remaining groups (exactly 4 digits each)
	const end = n;
	while (i < end) {
		// Unrolled 4-digit parse
		const c0 = REVERSE[str.charCodeAt(i++)];
		if (c0 < 0) {
			return false;
		}
		const c1 = REVERSE[str.charCodeAt(i++)];
		if (c1 < 0) {
			return false;
		}
		const c2 = REVERSE[str.charCodeAt(i++)];
		if (c2 < 0) {
			return false;
		}
		const c3 = REVERSE[str.charCodeAt(i++)];
		if (c3 < 0) {
			return false;
		}
		dg[gi++] = (((((c0 * BASE) + c1) * BASE + c2) * BASE) + c3) >>> 0;
	}
	// Estimate bytes and limbs
	const estBytes = (Math.ceil(digitsCount * RATIO_38_256) + 1) | 0;
	const limbsLen = (estBytes + 3) >> 2;
	const limbs = new Uint32Array(limbsLen);
	let used = 0;
	// Convert base-(38^4) -> base-(2^32)
	for (let g = 0; g < gi; g++) {
		let carry = dg[g]; // 0..BASEG-1
		let j = limbsLen - 1;
		let k = 0;
		while ((carry !== 0 || k < used) && j >= 0) {
			const x = limbs[j] * BASEG + carry; // < 2^53 (exact)
			const q = (x * INV_RADIX) | 0; // floor(x / 2^32)
			limbs[j] = x - q * RADIX; // low 32 bits
			carry = q;
			j--; k++;
		}
		if (k > used) {
			used = k;
		}
	}
	// Find first non-zero limb among used
	let limbStart = limbsLen - used;
	while (limbStart < limbsLen && limbs[limbStart] === 0) {
		limbStart++;
	}
	// Materialize bytes from limbs (big-endian per limb)
	const tmpLen = (limbsLen - limbStart) * 4;
	const tmp = new Uint8Array(tmpLen);
	let tb = 0;
	for (let idx = limbStart; idx < limbsLen; idx++) {
		const v = limbs[idx] >>> 0;
		tmp[tb++] = (v >>> 24) & 0xff;
		tmp[tb++] = (v >>> 16) & 0xff;
		tmp[tb++] = (v >>> 8) & 0xff;
		tmp[tb++] = v & 0xff;
	}
	// Skip leading zero bytes in tmp
	let b = 0;
	while (b < tb && tmp[b] === 0) {
		b++;
	}
	// Allocate result with leading zero prefix
	const outLen = leadingZeros + (tb - b);
	const out = Buffer.allocUnsafe(outLen);
	if (leadingZeros) {
		out.fill(0, 0, leadingZeros);
	}
	for (let t = b, o = leadingZeros; t < tb; t++, o++) {
		out[o] = tmp[t];
	}
	return out;
}
// Public API: prefer native when available, otherwise JS
const encodeBase38 = native?.encodeBase38 ?? encode_base38_js;
const decodeBase38 = native?.decodeBase38 ?? decode_base38_js;
const pure = {
	encodeBase38: encode_base38_js,
	decodeBase38: decode_base38_js,
};
export const api = {
	encodeBase38,
	decodeBase38,
	encode: encodeBase38,
	decode: decodeBase38,
	pure,
	native: Boolean(native),
};
export default api;
