const std = @import("std");

pub const AddressStruct = struct {
    cipher: []const u8,
    walletType: []const u8,
    version: []const u8,
    publicKey: []const u8,
    backupHash: ?[]const u8,
};

pub fn generateAddressStruct(
    publicKey: ?[]const u8,
    cipherID: ?[]const u8,
    version: ?[]const u8,
    walletType: ?[]const u8,
    backupHash: ?[]const u8,
) ?AddressStruct {
    const pk = publicKey orelse return null;
    const backup = backupHash orelse return null;

    return AddressStruct{
        .cipher = cipherID orelse "0",
        .walletType = walletType orelse "0",
        .version = version orelse "0",
        .publicKey = pk,
        .backupHash = backup,
    };
}

test "generateAddressStruct uses provided values" {
    const public_key = "pubkey";
    const cipher_id = "cipher";
    const version = "1";
    const wallet_type = "hot";
    const backup = "ss";

    const address_opt = generateAddressStruct(
		public_key, 
		cipher_id, 
		version, 
		wallet_type, 
		backup
	);
    try std.testing.expect(address_opt != null);
    const address = address_opt.?;

    try std.testing.expectEqualStrings(cipher_id, address.cipher);
    try std.testing.expectEqualStrings(wallet_type, address.walletType);
    try std.testing.expectEqualStrings(version, address.version);
    try std.testing.expectEqualStrings(public_key, address.publicKey);
    try std.testing.expect(address.backupHash != null);
    try std.testing.expectEqualStrings(backup, address.backupHash.?);
}

test "generateAddressStruct falls back to defaults" {
    const public_key = "pubkey";
    const backup = "backup";

    const address_opt = generateAddressStruct(
		public_key, 
		null, 
		null,
		null, 
		backup
	);
    try std.testing.expect(address_opt != null);
    const address = address_opt.?;

    try std.testing.expectEqualStrings("0", address.cipher);
    try std.testing.expectEqualStrings("0", address.walletType);
    try std.testing.expectEqualStrings("0", address.version);
    try std.testing.expectEqualStrings(public_key, address.publicKey);
    try std.testing.expect(address.backupHash != null);
    try std.testing.expectEqualStrings(backup, address.backupHash.?);
}

test "generateAddressStruct returns null when public key missing" {
    const result = generateAddressStruct(null, null, null, null, "backup");
    try std.testing.expect(result == null);
}

test "generateAddressStruct returns null when backup hash missing" {
    const result = generateAddressStruct("pubkey", null, null, null, null);
    try std.testing.expect(result == null);
}
