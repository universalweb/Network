import { gzip, zstdCompress } from 'node:zlib';
import aegis256 from '#crypto/cipher/AEGIS256.js';
// DEMO SCRIPT TO CALCULATE PACKET SIZES MUST BE BELOW MTU EX: IPv6 1280 bytes
import { encode } from '#utilities/serialize';
import { introHeaderRPC } from '#udsp/rpc/headerRPC';
import kyber768 from '#crypto/keyExchange/kyber768.js';
import { kyber768_x25519 } from '#crypto/keyExchange/kyber768_x25519.js';
import { promisify } from 'node:util';
import { randomConnectionId } from '#udsp/utilities/connectionId';
import xChaCha from '#crypto/cipher/xChaCha.js';
const brotliCompressAsync = promisify(gzip);
const {
	encrypt,
	overhead,
} = aegis256;
//  Includes port
const ipv6Size = 18;
const packetHeaders = 48;
const realisticMaxSize = 1232;
// estimate packet sizes
export async function createServerIntroPacket() {
	const keypair = await kyber768.keyExchangeKeypair();
	const [
		cipherData,
		sharedSecret,
	] = await kyber768.encapsulate(keypair.publicKey);
	const newEccKey = randomConnectionId(32);
	const newAddress = randomConnectionId(18);
	const header = [
		randomConnectionId(8),
		introHeaderRPC,
		Buffer.concat([cipherData, newEccKey]),
	];
	const frameArray = [
		undefined,
		introHeaderRPC,
		randomConnectionId(8),
		undefined,
		newAddress,
		// Version
		1,
	];
	const frame = await encode(frameArray);
	const encrypted = await encrypt(frame, newEccKey, frame);
	// KEEP UNDER 1280
	// Kyber CipherDATA (1088) is smaller than PublicKey (1184)
	// 1197 bytes with encryption overhead
	// 32 Is classical ECC Public Key
	const packetPayload = (await encode([header, encrypted])).length;
	console.log('createServerIntroPacket', packetPayload + packetHeaders, 'cipherData', cipherData.length);
}
await createServerIntroPacket();
export async function createClientIntroPacket() {
	const keypair = await kyber768.keyExchangeKeypair();
	const header = [
		undefined,
		introHeaderRPC,
		await kyber768.getPublicKey(keypair),
		Date.now(),
		// randomConnectionId(4),
		// 1,
	];
	// KEEP UNDER 1280
	// MAX ESTIMATE 1241 bytes with encryption overhead (NOT ALL CLIENT INTRO IS ENCRYPTED)
	const frame = await encode([header]);
	console.log('createClientIntroPacket', frame.length + 32 + packetHeaders, 'publicKeySize', kyber768.publicKeySize);
}
await createClientIntroPacket();
