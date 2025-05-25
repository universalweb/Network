// DEMO SCRIPT TO CALCULATE PACKET SIZES MUST BE BELOW MTU EX: IPv6 1280 bytes
import { encode } from '#utilities/serialize';
import { introHeaderRPC } from '../udsp/protocolHeaderRPCs.js';
import kyber768 from '#crypto/keyExchange/kyber768.js';
import { randomConnectionId } from '#udsp/connectionId';
import xChaCha from '#crypto/cipher/xChaCha.js';
const {
	encrypt,
	overhead
} = xChaCha;
//  Includes port
const ipv6BytesChangeAddress = 18;
// estimate packet sizes
export async function createServerIntroPacket() {
	const keypair = await kyber768.keyExchangeKeypair();
	const [
		cipherData,
		sharedSecret
	] = await kyber768.encapsulate(keypair.publicKey);
	const newEccKey = randomConnectionId(32);
	const newAddress = randomConnectionId(18);
	const header = [
		randomConnectionId(8),
		introHeaderRPC,
		Buffer.concat([cipherData, newEccKey])
	];
	const frameArray = [
		undefined,
		0,
		randomConnectionId(8),
		undefined,
		newAddress,
		// Version
		1
	];
	const frame = await encode(frameArray);
	const encrypted = await encrypt(frame, newEccKey, frame);
	// KEEP UNDER 1280
	// Kyber CipherDATA (1088) is smaller than PublicKey (1184)
	// 1197 bytes with encryption overhead
	// 32 Is classical ECC Public Key
	console.log(await encode([header, encrypted]).length, cipherData.length);
}
await createServerIntroPacket();
export async function createClientIntroPacket() {
	const keypair = await kyber768.keyExchangeKeypair();
	const header = [
		undefined,
		0,
		randomConnectionId(4),
		await kyber768.getPublicKey(keypair),
		1,
		1,
	];
	// KEEP UNDER 1280
	// MAX ESTIMATE 1241 bytes with encryption overhead (NOT ALL CLIENT INTRO IS ENCRYPTED)
	const frame = await encode([header]);
	console.log(frame.length + overhead, kyber768.publicKeySize);
}
await createClientIntroPacket();
