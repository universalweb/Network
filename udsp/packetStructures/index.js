import { IntroHeaderSchema, PacketSchema, file_packet } from './src/gen/packet_pb.js';
import { create, fromBinary, toBinary } from '@bufbuild/protobuf';
import { decode, encode, encodeStrict } from '#utilities/serialize';
import { gzip, zstdCompress } from 'node:zlib';
import { hash256 } from '#crypto/hash/shake256.js';
import { randomBuffer } from '#crypto/utils.js';
function generateFlagsByte(shortHeaderMode, byte2, byte3, byte4, byte5, byte6, byte7, byte8) {
	let byte = 0;
	if (shortHeaderMode) {
		byte |= 1 << 0;
	}
	return byte;
}
function createPacket(flags, headers, payload) {
	return [
		flags,
		headers,
		payload,
	];
}
/*
message IntroHeader {
	bytes flags = 1;
	bytes connection_id = 2;
	bytes rpc = 3;
	bytes time_sent = 4;
	bytes cipher_id = 5;
	bytes version = 6;
}
*/
const packet = {
	flags: Buffer.from([1]),
	connectionId: Buffer.from([
		2, 3, 4, 5, 6, 7, 8, 9,
	]),
	rpc: Buffer.from([10]),
	timeSent: Buffer.from([
		11, 12, 13, 14, 15, 16, 17, 18,
	]),
	cipherId: Buffer.from([
		19, 20, 21, 22, 23, 24, 25, 26,
	]),
	version: Buffer.from([
		27, 28, 29, 30,
	]),
};
const packetCBOR = [
	Buffer.from([1]),
	Buffer.from([
		2, 3, 4, 5, 6, 7, 8, 9,
	]),
	Buffer.from([10]),
	Buffer.from([
		11, 12, 13, 14, 15, 16, 17, 18,
	]),
	Buffer.from([
		19, 20, 21, 22, 23, 24, 25, 26,
	]),
	Buffer.from([
		27, 28, 29, 30,
	]),
];
console.log(packetCBOR);
console.log(IntroHeaderSchema);
IntroHeaderSchema.fields.forEach((f) => {
	console.log(`name: ${f.name}, number: ${f.num}, kind: ${f.kind}, T?: ${f.T}`);
});
const protobuffer = toBinary(IntroHeaderSchema, create(IntroHeaderSchema, packet));
console.log(fromBinary(IntroHeaderSchema, protobuffer));
console.log((await encode(packetCBOR)).length, protobuffer.length);
console.log((await encode([await encode(packetCBOR)])).length);
