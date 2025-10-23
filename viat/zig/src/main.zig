const std = @import("std");
const textEncoding = @import("encoding/string.zig");
const shake256 = @import("crypto/shake256.zig");
const address = @import("viat/address.zig");
const cbor = @import("zbor");
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

    const addr_opt = address.generateAddressStruct(
        "example-public-key",
        "aes-256-gcm",
        "1",
        "software",
        "backup-hash",
    );
    if (addr_opt) |addr| {
        std.debug.print(
            "AddressStruct -> cipher: {s}, walletType: {s}, version: {s}, publicKey: {s}, backupHash: {?s}\n",
            .{ addr.cipher, addr.walletType, addr.version, addr.publicKey, addr.backupHash },
        );
    } else {
        std.debug.print("AddressStruct generation failed because required fields were missing\n", .{});
    }
}
