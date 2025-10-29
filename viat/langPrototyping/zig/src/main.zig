const std = @import("std");
const textEncoding = @import("encoding/string.zig");
const shake256 = @import("crypto/shake256.zig");
const address = @import("viat/address.zig");
pub fn main() !void {
    // Example 1: Basic SHAKE256 usage
    const input = "Hello World!";
    const output: [32]u8 = shake256.hash256(input); // Output can be any length you want
    std.debug.print("INPUT: {s}\n", .{input});
    // Print the whole encoded buffer at once (length is output.len * 2)
    var hexEncoded: [64]u8 = undefined;
    const written = try textEncoding.hexEncode(output[0..], hexEncoded[0..]);
    // s for string | d for decimal
    std.debug.print("OUTPUT: {s} {d}\n", .{ hexEncoded[0..written], written });
}
