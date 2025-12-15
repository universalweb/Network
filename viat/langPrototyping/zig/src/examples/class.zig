const std = @import("std");

/// A simple 'class-like' Counter type implemented as a Zig struct.
/// Shows constructor, methods, encapsulation and error handling.
pub const Counter = struct {
    // private field
    count: usize,

    /// Constructor
    pub fn init(start: usize) Counter {
        return Counter{ .count = start };
    }

    /// Increment by 1, return the new value
    pub fn inc(self: *Counter) usize {
        self.count += 1;
        return self.count;
    }

    /// Add an unsigned delta
    pub fn add(self: *Counter, delta: usize) usize {
        self.count += delta;
        return self.count;
    }

    /// Subtract an unsigned delta
    pub fn sub(self: *Counter, delta: usize) usize {
        self.count -= delta;
        return self.count;
    }

    /// Read-only accessor
    pub fn value(self: *const Counter) usize {
        return self.count;
    }
};

/// Example usage: creates a Counter, mutates it, and prints the result.
pub fn example() void {
    var c = Counter.init(5);
    _ = c.inc();
    _ = c.add(3);
    // print current value (should be 9)
    std.debug.print("Counter example -> value: {d}\n", .{c.value()});
}

test "Counter basic" {
    var c = Counter.init(0);
    try std.testing.expectEqual(1, c.inc());
    try std.testing.expectEqual(3, c.add(2));
    try std.testing.expectEqual(2, c.sub(1));
    try std.testing.expectEqual(2, c.value());
}
