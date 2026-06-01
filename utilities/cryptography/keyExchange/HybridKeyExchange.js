/*
 * HybridKeyExchange — fast-auth classical + post-quantum AKE for the UDSP network layer.
 *
 * Fewest-packets hybrid (a temporary transitional scheme). The server certificate carries
 * LONG-TERM key-exchange keypairs — both x25519 and ML-KEM — and authentication IS the encryption:
 * only the real server can complete the exchange against its long-term private keys.
 *
 * Flow (single round, client drives off the server cert):
 *   Kyber ONE way  — client encapsulates to the server's long-term Kyber public → ciphertext.
 *   X25519 TWO way — client ephemeral × server long-term public.
 *   The client derives the session up front (onClientInitialization) and sends, in one packet:
 *       clientEphemeralX25519Public(32) ‖ kyberCiphertext(1088)
 *   The server decapsulates with its long-term Kyber private, runs x25519 against the client's
 *   ephemeral public, and lands the identical session key. The server reply is a bare ack.
 *
 * Session key = KDF(x25519Secret, kyberSecret, clientX25519Public, serverX25519Public). The Kyber
 * public is intentionally OMITTED — the kyberSecret already uniquely binds the server's Kyber key,
 * so re-hashing the public adds work without value. Provider-agnostic via the injected adapters.
 *
 * Trade-off: the server half is long-term (no server ephemeral), so this favours minimal packets +
 * server authentication over full forward secrecy — by design, for the temporary hybrid.
 */
import {
	clearBuffer,
	int32,
} from '#utilities/cryptography/utils';
import { KeyExchange } from './keyExchange.js';
import shake256 from '../hash/shake.js';
export class HybridKeyExchange extends KeyExchange {
	preferred = true;
	preferredPostQuantum = true;
	postQuantum = true;
	hash = shake256;
	sessionKeySize = int32;
	constructor(config) {
		super(config);
		this.dhPublicKeySize = this.dh.publicKeySize;
		this.dhPrivateKeySize = this.dh.privateKeySize;
		this.kemPublicKeySize = this.kem.publicKeySize;
		this.publicKeySize = this.dh.publicKeySize + this.kem.publicKeySize;
		this.privateKeySize = this.dh.privateKeySize + this.kem.seedSize;
		this.clientPublicKeySize = this.publicKeySize;
		this.clientPrivateKeySize = this.privateKeySize;
		this.serverPublicKeySize = this.publicKeySize;
		this.serverPrivateKeySize = this.privateKeySize;
		this.quantumPublicKeySize = this.kem.publicKeySize;
		this.noneQuantumPublicKeySize = this.dh.publicKeySize;
		// What the client transmits: ephemeral x25519 public ‖ kyber ciphertext
		this.introSize = this.dh.publicKeySize + this.kem.encryptedKeySize;
	}
	// Split the wire buffer: x25519 portion then KEM portion
	getDhKey(source) {
		return source.subarray(0, this.dhPublicKeySize);
	}
	getKemKey(source) {
		return source.subarray(this.dhPublicKeySize);
	}
	// Server long-term certificate keypair: x25519 + Kyber
	async keyExchangeKeypair() {
		const dhKeypair = await this.dh.generate();
		const kemKeypair = await this.kem.generate();
		return {
			dhKeypair,
			kemKeypair,
		};
	}
	// Client only needs an ephemeral x25519 keypair — it encapsulates to the server's long-term Kyber
	async clientEphemeralKeypair() {
		const dhKeypair = await this.dh.generate();
		return {
			dhKeypair,
		};
	}
	async serverEphemeralKeypair() {
		return this.keyExchangeKeypair();
	}
	async exportKeypair(source) {
		const dhPublicKey = await this.dh.exportPublicKey(source.dhKeypair.publicKey);
		const dhPrivateKey = await this.dh.exportPrivateKey(source.dhKeypair.privateKey);
		const kemPublicKey = Buffer.from(await this.kem.exportPublicKey(source.kemKeypair.publicKey));
		const kemPrivateKey = Buffer.from(await this.kem.exportPrivateKey(source.kemKeypair.privateKey));
		return {
			publicKey: Buffer.concat([dhPublicKey, kemPublicKey]),
			privateKey: Buffer.concat([dhPrivateKey, kemPrivateKey]),
		};
	}
	async initializeKeypair(source, target = {}) {
		target.dhKeypair = target.dhKeypair || {};
		target.kemKeypair = target.kemKeypair || {};
		if (source.publicKey) {
			target.dhKeypair.publicKey = this.dh.importPublicKey(source.publicKey.subarray(0, this.dhPublicKeySize));
			target.kemKeypair.publicKey = this.kem.importPublicKey(source.publicKey.subarray(this.dhPublicKeySize));
		}
		if (source.privateKey) {
			target.dhKeypair.privateKey = this.dh.importPrivateKey(source.privateKey.subarray(0, this.dhPrivateKeySize));
			target.kemKeypair.privateKey = this.kem.importPrivateKey(source.privateKey.subarray(this.dhPrivateKeySize));
		}
		return target;
	}
	async initializeCertificateKeypair(...args) {
		return this.initializeKeypair(...args);
	}
	isKeypairInitialized(source) {
		if (source.dhKeypair && source.kemKeypair) {
			return true;
		}
		return false;
	}
	/*
	 * Bind the two secrets and both x25519 publics into one 512-bit session hash (Kyber public
	 * omitted — the kyberSecret already binds it). Fixed arg order so both peers agree; the
	 * transmit/receive orientation is mirrored between client and server.
	 */
	async deriveSessionKeyHash(dhSharedSecret, kemSharedSecret, clientDhPublicKey, serverDhPublicKey) {
		return this.hash.concatHash512(
			dhSharedSecret,
			kemSharedSecret,
			clientDhPublicKey,
			serverDhPublicKey
		);
	}
	async createClientSession(source, destination, dhSharedSecret, kemSharedSecret) {
		const sessionKeyHash = await this.deriveSessionKeyHash(
			dhSharedSecret,
			kemSharedSecret,
			source.dhKeypair.publicKey,
			destination.dhKeypair.publicKey
		);
		clearBuffer(dhSharedSecret);
		clearBuffer(kemSharedSecret);
		source.sessionKeyHash = sessionKeyHash;
		source.transmitKey = sessionKeyHash.subarray(this.sessionKeySize);
		source.receiveKey = sessionKeyHash.subarray(0, this.sessionKeySize);
	}
	async createServerSession(source, destination, dhSharedSecret, kemSharedSecret) {
		const sessionKeyHash = await this.deriveSessionKeyHash(
			dhSharedSecret,
			kemSharedSecret,
			destination.dhKeypair.publicKey,
			source.dhKeypair.publicKey
		);
		clearBuffer(dhSharedSecret);
		clearBuffer(kemSharedSecret);
		source.sessionKeyHash = sessionKeyHash;
		source.receiveKey = sessionKeyHash.subarray(this.sessionKeySize);
		source.transmitKey = sessionKeyHash.subarray(0, this.sessionKeySize);
	}
	/*
	 * Client, before sending intro (dispatcher calls this in configCryptography): encapsulate to the
	 * server's long-term Kyber public, x25519 against the server's long-term public, derive the
	 * session, and stage the intro payload (ephemeral x25519 public ‖ kyber ciphertext).
	 */
	async onClientInitialization(source, destination) {
		const [
			kemCipherData,
			kemSharedSecret,
		] = await this.kem.encapsulate(destination.kemKeypair.publicKey);
		const dhSharedSecret = await this.dh.deriveSharedSecret(
			source.dhKeypair.privateKey,
			destination.dhKeypair.publicKey
		);
		source.cipherData = Buffer.concat([source.dhKeypair.publicKey, kemCipherData]);
		await this.createClientSession(source, destination, dhSharedSecret, kemSharedSecret);
	}
	async createClientIntro(source, destination, frame, header) {
		header[2] = source.cipherData;
	}
	/*
	 * Server: decapsulate with the long-term Kyber private, x25519 against the client's ephemeral
	 * public, derive the identical session. Handshake complete in one packet.
	 */
	async onClientIntroHeader(server, client, cipherData, header) {
		const clientDhPublicKey = this.getDhKey(cipherData);
		const kemCipherData = this.getKemKey(cipherData);
		client.dhKeypair = client.dhKeypair || {};
		client.dhKeypair.publicKey = this.dh.importPublicKey(clientDhPublicKey);
		const kemSharedSecret = await this.kem.decapsulate(kemCipherData, server.kemKeypair.privateKey);
		const dhSharedSecret = await this.dh.deriveSharedSecret(
			server.dhKeypair.privateKey,
			client.dhKeypair.publicKey
		);
		await this.createServerSession(server, client, dhSharedSecret, kemSharedSecret);
	}
	// Server reply is a bare ack — the session is already established on both sides
	async createServerIntro(source, destination, frame, header) {
		source.logInfo('Hybrid server ack');
	}
	async onServerIntroHeader(client, server, cipherData, header) {
		client.logInfo('Hybrid client synchronized');
	}
}
export default HybridKeyExchange;
