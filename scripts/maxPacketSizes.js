import { encapsulate, encryptionKeypair } from '../cryptoMiddleware/keyExchange/kyber768.js';
import { blake3 } from '@noble/hashes/blake3';
import { encode } from '#utilities/serialize';
import { encrypt } from '../cryptoMiddleware/encryption/XChaCha.js';
import { generateConnectionId } from '#udsp/connectionId';
// estimate packet sizes
export async function createServerIntroPacket() {
	const keypair = await encryptionKeypair();
	const {
		cipherText,
		sharedSecret
	} = await encapsulate(keypair.publicKey);
	const packet = [
		undefined,
		0,
		generateConnectionId(8),
		cipherText,
		true,
		'44488',
		true
	];
	console.log(sharedSecret);
	const header = [generateConnectionId(8), 0];
	const encrypted = encrypt(encode(packet), blake3(sharedSecret), encode(header));
	console.log(encode([header, encrypted]).length, keypair.publicKey.length);
}
createServerIntroPacket();
export async function createClientIntroPacket() {
	const keypair = await encryptionKeypair();
	const header = [
		undefined,
		0,
		generateConnectionId(4),
		keypair.publicKey,
		1,
		1,
	];
	console.log(encode([header]).length, keypair.publicKey.length);
}
createClientIntroPacket();
