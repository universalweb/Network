import {
	UniqID,
	assign,
	construct,
	currentPath,
	has,
	hasValue,
	intersection,
	isArray,
	isString,
	isTrue,
	isUndefined,
	omit,
	promise
} from '@universalweb/acid';
import { configure, info, success } from '#logs';
import { connectionIdToBuffer, generateConnectionId } from '#udsp/connectionId';
import { createEvent, removeEvent, triggerEvent } from '#udsp/events';
/*
  	* Client Module
	* UDSP - Universal Data Stream Protocol
	* UW Universal Web
	* uw:// Universal Web Protocol preferred
	* udsp:// UDSP Protocol
	* Establishes a UDP based bi-directional real-time connection between client and server.
*/
// Default System imports
import {
	decode,
	encode
} from '#utilities/serialize';
import {
	emptyNonce,
	randomConnectionId,
	toBase64,
} from '#crypto';
import { getAlgorithm, processPublicKey } from '../cryptoMiddleware/index.js';
import { getCertificate, parseCertificate } from '#certificate';
import { Ask } from '../request/ask.js';
import { UDSP } from '#udsp/base';
import { calculatePacketOverhead } from '../calculatePacketOverhead.js';
import { configCryptography } from './configCryptography.js';
import dgram from 'dgram';
// Client specific imports to extend class
import { emit } from '../requestMethods/emit.js';
import { fetchRequest } from '../requestMethods/fetch.js';
import { get } from '../requestMethods/get.js';
import { getIPDetails } from './getIPDetails.js';
import { getLocalIpVersion } from '../../utilities/network/getLocalIP.js';
import { getWANIPAddress } from '../../utilities/network/getWANIPAddress.js';
import { keychainGet } from '#keychain';
import { onListening } from './listening.js';
import { onPacket } from './onPacket.js';
import { post } from '../requestMethods/post.js';
import { processFrame } from '../processFrame.js';
import { sendPacket } from '../sendPacket.js';
import { setDestination } from './setDestination.js';
import { uwRequest } from '#udsp/requestMethods/request';
import { watch } from '#watch';
// UNIVERSAL WEB Client Class
export class Client extends UDSP {
	constructor(options) {
		super(options);
		console.log('-------CLIENT INITIALIZING-------\n');
		return this.initialize(options);
	}
	static description = `The Universal Web's UDSP client module to initiate connections to a UDSP Server.`;
	static type = 'client';
	isClient = true;
	async initialize(options) {
		this.initializeBase(options);
		await this.setDefaults();
		if (options) {
			this.options = options;
		}
		await this.setDestination();
		await this.getIPDetails();
		await this.setProfile();
		console.log('ipVersion', this.ipVersion);
		console.log('destination', this.destination);
		await this.configCryptography();
		this.assignId();
		await this.calculatePacketOverhead();
		await this.setupSocket();
		await this.attachEvents();
		if (this.options.autoConnect) {
			await this.connect();
		}
		return this;
	}
	async getKeychainSave(keychain) {
		return keychainGet(keychain);
	}
	async setProfile() {
		const {
			keychain,
			profile
		} = this.options;
		if (isString(profile)) {
			this.profile = await parseCertificate(profile);
		}
		if (keychain) {
			console.log('Loading Keychain', keychain);
			this.profile = await this.getKeychainSave(keychain);
		}
	}
	async attachEvents() {
		const thisClient = this;
		this.socket.on('error', (err) => {
			console.log('CLIENT UDP SERVER ERROR');
			thisClient.triggerEvent(thisClient.events, 'socket.error', this);
			return thisClient.onError && thisClient.onError(err);
		});
		this.socket.on('listening', () => {
			return thisClient.onListening();
		});
		this.socket.on('message', (packet, rinfo) => {
			console.log(rinfo);
			return thisClient.onPacket(packet, rinfo);
		});
	}
	connect() {
		return this.ensureHandshake();
	}
	assignId() {
		const connectionIdString = generateConnectionId(this.connectionIdSize);
		this.connectionIdSize = this.destination.clientConnectionIdSize || 4;
		this.id = connectionIdToBuffer(connectionIdString);
		this.connectionIdString = connectionIdString;
		success(`Assigned ClientId ${connectionIdString}`);
		Client.connections.set(connectionIdString, this);
	}
	async calculatePacketOverhead() {
		return calculatePacketOverhead(this.cipherSuite, this.destination.connectionIdSize, this.destination);
	}
	reKey() {
		const thisClient = this;
		success(`client reKeyed -> ID: ${thisClient.connectionIdString}`);
	}
	async close(message) {
		console.log(`Client CLOSING. ${this.connectionIdString}`);
		Client.connections.delete(this.connectionIdString);
		await this.sendEnd();
		await this.setDisconnected();
		await this.socket.close();
		this.triggerEvent(this.events, 'closed', this);
		console.log(`Client CLOSED. ${this.connectionIdString}`);
	}
	destory() {
		console.log('Destory Client Object - buffer cleanup');
		this.triggerEvent(this.events, 'destroyed', this);
		this.close();
	}
	async send(message, headers, footer, repeat) {
		console.log(`client.send to Server`, this.destination.ip, this.destination.port);
		return sendPacket(message, this, this.socket, this.destination, headers, footer, repeat);
	}
	async reconnect() {
		await this.initialize();
		await this.connect();
	}
	async ask(method, path, parameters, data, head, options) {
		if (!this.connected) {
			await this.reconnect();
		}
		const ask = construct(Ask, [method, path, parameters, data, head, options, this]);
		return ask;
	}
	loadCertificate(certificate) {
		this.destination.certificate = parseCertificate(certificate);
		this.configCryptography();
	}
	proccessCertificateChunk(message) {
		const {
			pid,
			cert,
			last
		} = message;
		this.certificateChunks[pid] = cert;
		if (last) {
			this.loadCertificate(Buffer.concat(this.certificateChunks));
			this.sendHandshake(message);
		}
	}
	async intro(frame, header) {
		if (!frame || !isArray(frame)) {
			this.close('No intro message', frame);
			return;
		}
		if (this.newKeypair) {
			return;
		}
		console.log('Got server Intro', frame);
		const [streamid_undefined, rpc, serverConnectionId, reKey, serverRandomToken] = frame;
		this.destination.id = serverConnectionId;
		this.destination.connectionIdSize = serverConnectionId.length;
		this.newKeypair = reKey;
		await this.setNewDestinationKeys();
		console.log('New Server Connection ID', toBase64(serverConnectionId));
		if (serverRandomToken) {
			this.serverRandomToken = serverRandomToken;
			console.log('Server Random Token', toBase64(serverRandomToken));
		}
		this.handshaked();
	}
	discovery(frame, header) {
	}
	end(frame, header) {
		this.close('Server Ended Connection');
	}
	setPublicKeyHeader(header = []) {
		const key = this.encryptionKeypair.publicKey;
		console.log('Setting Public Key in UDSP Header', toBase64(key));
		const { encryptServerConnectionId } = this;
		if (encryptServerConnectionId) {
			console.log('Encrypting Public Key in UDSP Header');
			header.push(this.boxCryptography.boxSeal(header.key, this.destination.connectionIdKeypair));
		} else {
			header.push(key);
		}
		return header;
	}
	setCryptographyHeaders(header = []) {
		const key = this.encryptionKeypair.publicKey;
		console.log('Setting Cryptography in UDSP Header', toBase64(key));
		const {
			cipherSuiteName,
			cipherSuite,
			version
		} = this;
		header.push(cipherSuite.id, version);
		return header;
	}
	setDiscoveryHeaders(header = []) {
		const key = this.encryptionKeypair.publicKey;
		console.log('Setting Cryptography in UDSP Header', toBase64(key));
		const {
			cipherSuiteName,
			cipherSuite,
			version
		} = this;
		header.push(cipherSuite.id, version);
		const requestCertificate = this.hasCertificate === false;
		if (requestCertificate) {
			header.push(requestCertificate);
		}
		return header;
	}
	sendIntro() {
		console.log('Sending Intro');
		this.state = 1;
		const header = [0];
		this.setPublicKeyHeader(header);
		this.setCryptographyHeaders(header);
		const message = [];
		return this.send(message, header);
	}
	/*
		* Send Discovery
		* Generate & sign a random nonce include it in the header then send it to the server
		* Server verifies client most likely has the private key
		* sends cert chunked with one time encryption using client public key
		* Client saves cert and restarts the connection with the new data
	*/
	sendDiscovery() {
		console.log('Sending Discovery');
		this.state = 0;
		const header = [2];
		this.setPublicKeyHeader(header);
		this.setCryptographyOptionsHeaders(header);
		const message = [];
		this.discoverySent = true;
		return this.send(message, header);
	}
	sendEnd() {
		if (this.state === 0) {
			return;
		}
		console.log('Sending CLIENT END');
		this.state = 0;
		return this.send([false, 1], false, null, true);
	}
	ensureHandshake() {
		if (this.connected === true) {
			console.log('ALREADY CONNECTED');
			return true;
		}
		if (this.handshakeCompleted) {
			return this.awaitHandshake;
		}
		this.awaitHandshake = promise((accept) => {
			console.log('HANDSHAKE AWAITING');
			this.handshakeCompleted = accept;
		});
		this.sendIntro();
		return this.awaitHandshake;
	}
	setConnected() {
		this.connected = true;
		this.state = 2;
		this.readyState = 1;
		this.triggerEvent(this.events, 'connected', this);
	}
	setDisconnected() {
		this.connected = null;
		this.state = 0;
		this.readyState = 0;
		this.triggerEvent(this.events, 'disconnected', this);
	}
	async handshaked(message) {
		console.log('Handshake Completed with new keys');
		await this.calculatePacketOverhead();
		this.setConnected();
		if (this.handshakeCompleted) {
			this.handshakeCompleted(this);
		}
	}
	async setSessionKeys(generatedKeys) {
		// console.log(this.destination.encryptionKeypair);
		if (this.destination.encryptionKeypair || generatedKeys) {
			this.sessionKeys = generatedKeys || this.publicKeyCryptography.clientSessionKeys(this.encryptionKeypair, this.destination.encryptionKeypair);
			if (this.sessionKeys) {
				success(`Created Shared Keys`);
				success(`receiveKey: ${toBase64(this.sessionKeys.receiveKey)}`);
				success(`transmitKey: ${toBase64(this.sessionKeys.transmitKey)}`);
			}
		}
	}
	async setNewDestinationKeys() {
		if (this.newKeypair) {
			this.destination.encryptionKeypair = {
				publicKey: this.newKeypair
			};
			await this.setSessionKeys();
		}
	}
	createEvent(...args) {
		return createEvent(this.events, ...args);
	}
	removeEvent(...args) {
		removeEvent(this.events, ...args);
	}
	triggerEvent(...args) {
		triggerEvent(this.events, ...args);
	}
	request = uwRequest;
	fetch = fetchRequest;
	post = post;
	get = get;
	processFrame = processFrame;
	emit = emit;
	onListening = onListening;
	onPacket = onPacket;
	setDestination = setDestination;
	configCryptography = configCryptography;
	getIPDetails = getIPDetails;
	static connections = new Map();
	async setDefaults() {
		this.newKeypair = null;
		this.serverRandomToken = null;
		this.handshakeCompleted = null;
		this.awaitHandshake = null;
		this.destination = {
			connectionIdSize: 8,
			overhead: {}
		};
		this.autoConnect = false;
		this.certificateChunks = [];
		this.requestQueue = construct(Map);
		this.data = construct(Map);
		this.connectionIdSize = 4;
		this.ipVersion = 'udp4';
	}
}
export async function client(options) {
	console.log('Create Client');
	const uwClient = await construct(Client, [options]);
	return uwClient;
}
// Add the request export here for simple auto connect and then just grab contents to return called UDSP
// client is for a longer stateful connection request to a remote server
export { getCertificate };
