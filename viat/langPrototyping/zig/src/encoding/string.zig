const std = @import("std");

pub const EncodingError = error{OutputTooSmall};
const hexAlphabet: []const u8 = "0123456789abcdef";

pub fn hexEncode(input: []const u8, out: []u8) !usize {
    const need = input.len * 2;
    if (out.len < need) {
        return EncodingError.OutputTooSmall;
    }
    var i: usize = 0;
    for (input) |b| {
        const pos = i * 2;
        out[pos] = hexAlphabet[(b >> 4) & 0xF];
        out[pos + 1] = hexAlphabet[b & 0xF];
        i += 1;
    }
    return need;
}
const base64Alphabet: []const u8 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
pub fn base64Encode(input: []const u8, out: []u8, padding: bool) !usize {
    const in_len = input.len;
    const full_groups = in_len / 3;
    const remainder = in_len % 3;
    const out_len = 4 * ((in_len + 2) / 3);
    if (out.len < out_len) {
        return EncodingError.OutputTooSmall;
    }

    var in_idx: usize = 0;
    var out_idx: usize = 0;
    var i: usize = 0;
    while (i < full_groups) : (i += 1) {
        const b0 = input[in_idx];
        const b1 = input[in_idx + 1];
        const b2 = input[in_idx + 2];
        const combined: u32 = (@as(u32, b0) << 16) | (@as(u32, b1) << 8) | @as(u32, b2);
        out[out_idx + 0] = base64Alphabet[(combined >> 18) & 0x3F];
        out[out_idx + 1] = base64Alphabet[(combined >> 12) & 0x3F];
        out[out_idx + 2] = base64Alphabet[(combined >> 6) & 0x3F];
        out[out_idx + 3] = base64Alphabet[combined & 0x3F];
        in_idx += 3;
        out_idx += 4;
    }

    if (remainder == 1) {
        const b0 = input[in_idx];
        const combined: u32 = @as(u32, b0) << 16;
        out[out_idx + 0] = base64Alphabet[(combined >> 18) & 0x3F];
        out[out_idx + 1] = base64Alphabet[(combined >> 12) & 0x3F];
        if (padding) {
            out[out_idx + 2] = '=';
            out[out_idx + 3] = '=';
        } else {
            // when no padding, we still write the two chars and leave the rest unused
            out[out_idx + 2] = base64Alphabet[(combined >> 6) & 0x3F];
            // remove the last written but it's okay because caller expects exact out_len size
        }
        out_idx += 4;
    } else if (remainder == 2) {
        const b0 = input[in_idx];
        const b1 = input[in_idx + 1];
        const combined: u32 = (@as(u32, b0) << 16) | (@as(u32, b1) << 8);
        out[out_idx + 0] = base64Alphabet[(combined >> 18) & 0x3F];
        out[out_idx + 1] = base64Alphabet[(combined >> 12) & 0x3F];
        out[out_idx + 2] = base64Alphabet[(combined >> 6) & 0x3F];
        if (padding) {
            out[out_idx + 3] = '=';
        }
        out_idx += 4;
    }

    return out_len;
}

test "hexEncode basic" {
    const s = "\x01\x23\x45"; // bytes 0x01 0x23 0x45
    var buf: [6]u8 = undefined;
    const written = try hexEncode(s, buf[0..]);
    try std.testing.expectEqual(6, written);
    try std.testing.expectEqualStrings("012345", buf[0..written]);
}

test "base64Encode basic with padding" {
    const s = "foo"; // 'foo' -> 'Zm9v'
    var buf: [8]u8 = undefined;
    const written = try base64Encode(s, buf[0..], true);
    try std.testing.expectEqual(4, written);
    try std.testing.expectEqualStrings("Zm9v", buf[0..written]);
}

test "base64Encode with remainder 1" {
    const s = "f"; // 'f' -> 'Zg=='
    var buf: [4]u8 = undefined;
    const written = try base64Encode(s, buf[0..], true);
    try std.testing.expectEqual(4, written);
    try std.testing.expectEqualStrings("Zg==", buf[0..written]);
}

test "base64Encode with remainder 2" {
    const s = "fo"; // 'fo' -> 'Zm8='
    var buf: [4]u8 = undefined;
    const written = try base64Encode(s, buf[0..], true);
    try std.testing.expectEqual(4, written);
    try std.testing.expectEqualStrings("Zm8=", buf[0..written]);
}
