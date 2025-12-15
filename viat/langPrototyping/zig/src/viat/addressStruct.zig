const std = @import("std");

const MyObj = struct {
    name: []const u8,
    version: i32,
};

pub fn main() void {
    const obj = MyObj{
        .name = "Viat",
        .version = 1,
    };
    std.debug.print("{s} v{}\n", .{ obj.name, obj.version });
}
