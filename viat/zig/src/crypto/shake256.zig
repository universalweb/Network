const std = @import("std");
const crypto = std.crypto;
pub fn hash256(input: []const u8) [32]u8 {
    var output: [32]u8 = undefined; // Output can be any length you want
    crypto.hash.sha3.Shake256.hash(input, &output, .{});
    return output;
}
pub fn hash512(input: []const u8) [64]u8 {
    var output: [64]u8 = undefined; // Output can be any length you want
    crypto.hash.sha3.Shake256.hash(input, &output, .{});
    return output;
}
pub fn hash1024(input: []const u8) [128]u8 {
    var output: [128]u8 = undefined; // Output can be any length you want
    crypto.hash.sha3.Shake256.hash(input, &output, .{});
    return output;
}
pub fn hashXOF(input: []const u8, size: usize) []u8 {
    var output: [size]u8 = undefined; // Output can be any length you want
    crypto.hash.sha3.Shake256.hash(input, &output, .{});
    return output;
}
