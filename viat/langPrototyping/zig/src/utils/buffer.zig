const std = @import("std");
pub fn concatSlicesWithAllocator(allocator: *std.mem.Allocator, slices: []const []const u8) ![]const u8 {
    const result = try std.mem.concat(allocator, u8, slices);
    return result;
}
