// Example demonstrating CBOR encoding/decoding with zbor
const std = @import("std");
const zbor = @import("zbor");

pub fn main() !void {
    std.debug.print("CBOR Example with zbor\n", .{});

    // Create some data to encode
    const data = struct {
        name: []const u8,
        age: u32,
        active: bool,
        scores: [3]f64,
    }{
        .name = "Alice",
        .age = 30,
        .active = true,
        .scores = [_]f64{95.5, 87.2, 91.8},
    };

    // Encode to CBOR
    var buffer: [1024]u8 = undefined;
    var stream = std.io.fixedBufferStream(&buffer);
    try zbor.encode(stream.writer(), data, .{});

    const encoded_len = stream.pos;
    std.debug.print("Encoded CBOR data ({} bytes): ", .{encoded_len});
    for (buffer[0..encoded_len]) |byte| {
        std.debug.print("{x:0>2} ", .{byte});
    }
    std.debug.print("\n", .{});

    // Decode from CBOR
    var fbs = std.io.fixedBufferStream(buffer[0..encoded_len]);
    const decoded = try zbor.decode(data, fbs.reader(), .{});

    std.debug.print("Decoded data:\n", .{});
    std.debug.print("  Name: {s}\n", .{decoded.name});
    std.debug.print("  Age: {}\n", .{decoded.age});
    std.debug.print("  Active: {}\n", .{decoded.active});
    std.debug.print("  Scores: ", .{});
    for (decoded.scores) |score| {
        std.debug.print("{d:.1} ", .{score});
    }
    std.debug.print("\n", .{});
}
