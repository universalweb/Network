const std = @import("std");

pub const LegacyAddressStruct = struct {
    cipher: []const u8,
    walletType: []const u8,
    version: []const u8,
    publicKey: []const u8,
    trapdoor: ?[]const u8,
};

pub fn generateLegacyAddressStruct(
    walletType: ?[]const u8,
    publicKey: ?[]const u8,
    cipherID: ?[]const u8,
    version: ?[]const u8,
    trapdoor: ?[]const u8,
) ?LegacyAddressStruct {
    const address: LegacyAddressStruct = LegacyAddressStruct{
        .walletType = walletType orelse "0",
        .version = version orelse "0",
        .cipher = cipherID orelse "0",
        .publicKey = publicKey,
        .trapdoor = trapdoor,
    };
    return address;
}
