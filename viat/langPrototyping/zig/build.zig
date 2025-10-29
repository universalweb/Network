const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // Add zbor dependency
    const zbor_dep = b.dependency("zbor", .{});
    const zbor_mod = zbor_dep.module("zbor");

    const exe = b.addExecutable(.{
        .name = "viat",
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/main.zig"),
            .target = target,
            .optimize = optimize,
        }),
    });

    // Add zbor module to the executable
    exe.root_module.addImport("zbor", zbor_mod);

    b.installArtifact(exe);
}
