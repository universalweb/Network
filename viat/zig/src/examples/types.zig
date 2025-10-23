// Zig equivalents for JavaScript primitives
//
// JavaScript has dynamic typing, while Zig is statically typed.
// These are the closest equivalents for primitive types.

const std = @import("std");

// JavaScript: number (integer)
// Zig: signed integers (i8, i16, i32, i64, etc.)
const js_int: i32 = 42;

// JavaScript: number (floating point)
// Zig: floating point types (f16, f32, f64, f128)
const js_float: f64 = 3.14;

// JavaScript: string
// Zig: byte slices ([]u8 or []const u8)
const js_string: []const u8 = "hello world";

// JavaScript: boolean
// Zig: bool
const js_boolean: bool = true;

// JavaScript: undefined
// Zig: no direct equivalent, but can use void or optionals
// For optional values, use ?T syntax
const js_undefined_like: ?i32 = null; // null represents absence of value

// JavaScript: null
// Zig: null is used with optionals, or void for no value
const js_null_like: ?i32 = null;

// JavaScript: symbol
// Zig: no built-in symbol type, but can use a struct or enum
const Symbol = struct {
    id: u64,

    // Struct method
    pub fn init(id: u64) Symbol {
        return Symbol{ .id = id };
    }

    pub fn getId(self: Symbol) u64 {
        return self.id;
    }
};

// JavaScript: Array
// Zig: arrays have fixed size at compile time
const js_array_like: [5]i32 = [_]i32{1, 2, 3, 4, 5};

// JavaScript: dynamic arrays (like Array)
// Zig: use slices or ArrayList from std
// (initialized in main)

// JavaScript: Object/Map
// Zig: use HashMap from std
// (initialized in main)

// JavaScript: bigint
// Zig: no built-in bigint, but can use external libraries or implement custom big integer handling
// For large integers, use u128 or i128 for fixed size
const js_bigint_like: u128 = 123456789012345678901234567890;

// Example usage
pub fn main() !void {
    std.debug.print("Integer: {}\n", .{js_int});
    std.debug.print("Float: {}\n", .{js_float});
    std.debug.print("String: {s}\n", .{js_string});
    std.debug.print("Boolean: {}\n", .{js_boolean});
    std.debug.print("Optional (null): {?}\n", .{js_null_like});
    std.debug.print("BigInt-like: {}\n", .{js_bigint_like});

    // Struct usage
    const symbol = Symbol.init(123);
    std.debug.print("Symbol ID: {}\n", .{symbol.getId()});

    // Array usage
    std.debug.print("Fixed array: ", .{});
    for (js_array_like) |item| {
        std.debug.print("{} ", .{item});
    }
    std.debug.print("\n", .{});

    // Dynamic array usage (simplified example)
    // In Zig, for truly dynamic arrays, use std.ArrayList
    // Here we show slicing from a fixed array
    var temp_array = [_]i32{10, 20, 30, 0, 0};
    const dynamic_slice = temp_array[0..3];
    std.debug.print("Dynamic slice length: {}\n", .{dynamic_slice.len});

    // HashMap usage
    var js_map_like = std.StringHashMap([]const u8).init(std.heap.page_allocator);
    defer js_map_like.deinit();
    try js_map_like.put("key1", "value1");
    try js_map_like.put("key2", "value2");
    if (js_map_like.get("key1")) |value| {
        std.debug.print("Map value for key1: {s}\n", .{value});
    }
}
