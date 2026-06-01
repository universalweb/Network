/**
 * KyberKeyExchange — KEM handshake protocol for the UDSP network layer.
 *
 * Provider-agnostic: every key/algorithm operation is delegated to an injected
 * KeyExchangeKeyPair adapter (see pairs/), so swapping the native ML-KEM provider for pqclean,
 * noble, or a future KEM never touches this handshake logic. The exchange transfers ciphertext
 * (KEM), derives session keys via the base KeyExchange, and upgrades them for perfect forward secrecy.
 */
import {
	extendedAuthHeaderRPC,
	extendedSynchronizationHeaderRPC,
	headerExtendedSynchronizationRPC,
} from '#udsp/rpc/headerRPC';
import { KeyExchange } from './keyExchange.js';
import { clearBuffer } from '#utilities/cryptography/utils';
import shake256 from '../hash/shake.js';
export class KyberKeyExchange extends KeyExchange {
	preferred = true;
	postQuantum = true;
	// Full Kyber is TWO-way: client-ephemeral KEM (intro) + server-long-term KEM (extended-sync).
	// This flag is what makes the dispatcher fire the second round.
	extendedSynchronization = true;
	hash = shake256;
	async ephemeralKeypair() {
		const keypair = await this.keyPair.generate();
		const publicKeyBuffer = Buffer.from(await this.keyPair.exportPublicKey(keypair.publicKey));
		// Hashed once for faster session-key generation
		keypair.publicKeyBuffer = publicKeyBuffer;
		keypair.publicKeyHash = await this.hash.hash256(publicKeyBuffer);
		return keypair;
	}
	async clientEphemeralKeypair() {
		return this.ephemeralKeypair();
	}
	async serverEphemeralKeypair() {
		return this.ephemeralKeypair();
	}
	async initializeKeypair(source, target = {}) {
		// Capture raw bytes first — the dispatcher calls this with source === target, so importing
		// into target.publicKey would clobber source.publicKey before we hash it.
		const rawPublicKey = source.publicKey;
		const rawPrivateKey = source.privateKey;
		if (rawPublicKey) {
			target.publicKeyHash = await this.hash.hash256(rawPublicKey);
			target.publicKey = this.keyPair.importPublicKey(rawPublicKey);
		}
		if (rawPrivateKey) {
			target.privateKey = this.keyPair.importPrivateKey(rawPrivateKey);
		}
		return target;
	}
	async initializeCertificateKeypair(...args) {
		return this.initializeKeypair(...args);
	}
	async onClientInitialization(source, destination) {
		source.logInfo('onClientInitialization', destination);
	}
	async createClientIntro(source, destination, frame, header) {
		source.logInfo('Send Client Intro', source.cipherData);
		// Raw key buffer for the wire — header[2] is where the server reads the client's KEM public
		header[2] = source.publicKeyBuffer;
	}
	async onServerClientInitialization(source, destination) {
		source.logInfo('onServerClientInitialization');
	}
	async onClientIntroHeader(server, client, destinationPublicKey, header) {
		client.publicKeyHash = await this.hash.hash256(destinationPublicKey);
		client.publicKey = this.keyPair.importPublicKey(destinationPublicKey);
		const [
			cipherData,
			sharedSecret,
		] = await this.encapsulate(client.publicKey);
		server.sharedSecret = sharedSecret;
		server.cipherData = cipherData;
		server.logInfo('onClientIntroHeader', cipherData, sharedSecret);
		await this.createServerSession(server, client, server);
	}
	async createServerIntro(source, destination, frame, header) {
		source.logInfo('Send Server Intro', source.cipherData);
		// setIntroHeader already stamps the RPC marker; the KEM ciphertext rides in slot 2 (what the client reads)
		header[2] = source.cipherData;
	}
	async onServerIntroHeader(client, server, cipherData, header) {
		client.logInfo('onServerIntroHeader');
		if (cipherData) {
			client.sharedSecret = await this.decapsulate(cipherData, client.privateKey);
			await this.createClientSession(client, server, client);
			client.logInfo('sharedSecret', client.sharedSecret);
		}
	}
	async onServerIntroHeaderNoFrame(source, destination, cipherData, header) {
		source.logInfo('onServerIntroHeaderNoFrame');
	}
	async onServerIntro(source, destination, cipherData, frame, header) {
		source.logInfo('onServerIntro');
	}
	async onCreateClientExtendedSynchronization(client, server, frame, header) {
		const [
			cipherData,
			sharedSecret,
		] = await this.encapsulate(server.publicKey);
		headerExtendedSynchronizationRPC(header);
		header[2] = cipherData;
		client.cipherData = cipherData;
		client.sharedSecret = sharedSecret;
	}
	async serverExtendedSynchronizationHeader(server, client, frame, header) {
		const cipherData = header[2];
		const sharedSecret = await this.decapsulate(cipherData, server.privateKey);
		clearBuffer(server.cipherData);
		server.cipherData = null;
		server.sharedSecret = sharedSecret;
		await this.finalizeExtendedSynchronization(server, client);
	}
	async finalizeExtendedSynchronization(server, client) {
		await this.upgradeSessionKeys(server, client);
		await this.serverCleanupKeyClass(server);
	}
	async sendServerExtendedSynchronization(source, destination, frame, header) {
		header[1] = extendedSynchronizationHeaderRPC;
	}
	async clientExtendedSynchronizationHeader(client, server, header, packetDecoded) {
		await this.upgradeSessionKeys(client, server);
		client.cipherData = null;
	}
	async createServerEphemeralExtendedSyncAuth(server, client, frame, header) {
		header[1] = extendedAuthHeaderRPC;
		header[2] = server.publicKeyBuffer;
	}
	async onServerEphemeralExtendedSyncAuth(source, destination, frame, header) {
		source.logInfo('onServerEphemeralExtendedSyncAuth');
	}
	async clientAuth(client, server, frame, header) {
		client.logInfo('clientAuth');
	}
}
export default KyberKeyExchange;
