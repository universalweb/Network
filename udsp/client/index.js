/*
	* Client Module
	* UDSP - Universal Data Stream Protocol
	* Universal Web (UW)
	* uw:// Universal Web Protocol
	* udsp:// UDSP Protocol
	* Establishes a UDP based bi-directional real-time connection between client and server.
*/
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
import {
	decode,
	encode
} from '#utilities/serialize';
import { defaultClientConnectionIdSize, defaultServerConnectionIdSize } from '../defaults.js';
import {
	emptyNonce,
	randomConnectionId,
	toBase64,
} from '#crypto';
import { Ask } from '../request/ask.js';
import { UDSP } from '#udsp/base';
import { calculatePacketOverhead } from '../calculatePacketOverhead.js';
import { clientStates } from '../states.js';
import { configCryptography } from './configCryptography.js';
import dgram from 'dgram';
// Client specific imports to extend class
import { emit } from '../requestMethods/emit.js';
import { fetchRequest } from '../requestMethods/fetch.js';
import { get } from '../requestMethods/get.js';
import { getIPDetails } from './getIPDetails.js';
import { getLocalIpVersion } from '../../utilities/network/getLocalIP.js';
import { getWANIPAddress } from '../../utilities/network/getWANIPAddress.js';
import { keychainGet } from '#udsp/certificate/keychain';
import { onListening } from './listening.js';
import { onPacket } from './onPacket.js';
import { post } from '../requestMethods/post.js';
import { publicDomainCertificate } from '../certificate/domain.js';
import { sendPacket } from '../sendPacket.js';
import { setDestination } from './setDestination.js';
import { socketOnError } from './socketOnError.js';
import { uwProfile } from '../certificate/profile.js';
import { uwRequest } from '#udsp/requestMethods/request';
import { watch } from '#watch';
const {
	inactiveState,
	discoveringState,
	discoveredState,
	connectingState,
	connectedState,
	closingState,
	closedState,
	destroyingState,
	destroyedState
} = clientStates;
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
		if (options.destinationCertificate) {
			await this.loadCertificate();
		}
		console.log(this);
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
			this.profile = await uwProfile(profile);
		}
		if (keychain) {
			console.log('Loading Keychain', keychain);
			this.profile = await this.getKeychainSave(keychain);
		}
	}
	async attachEvents() {
		const source = this;
		this.socket.on('error', (...args) => {
			return source.socketOnError(...args);
		});
		this.socket.on('listening', (...args) => {
			return source.onListening(...args);
		});
		this.socket.on('message', (packet, rinfo) => {
			// console.log('ORIGIN', rinfo);
			return source.onPacket(packet, rinfo);
		});
	}
	socketOnError = socketOnError;
	assignId() {
		const connectionIdString = generateConnectionId(this.connectionIdSize);
		this.id = connectionIdToBuffer(connectionIdString);
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
	async send(message, headers, footer, repeat) {
		console.log(`client.send to Server`, this.destination.ip, this.destination.port);
		return sendPacket(message, this, this.socket, this.destination, headers, footer, repeat);
	}
	async ask(method, path, parameters, data, head, options) {
		if (!this.connected) {
			await this.reconnect();
		}
		const ask = construct(Ask, [
			method,
			path,
			parameters,
			data,
			head,
			options,
			this
		]);
		return ask;
	}
	async loadCertificate() {
		console.log(this);
		const { options: { destinationCertificate } } = this;
		this.destination.certificate = await publicDomainCertificate(destinationCertificate);
		console.log(this.destination.certificate);
		await this.discovered();
		await this.processCertificate();
		await this.configCryptography();
	}
	async processCertificate() {
		const { destination, } = this;
		const { certificate } = destination;
		const {
			encryptionKeypair,
			signatureKeypair,
			version: certificateVersion,
			encryptConnectionId,
			protocolOptions,
			cipherSuites
		} = certificate.get();
		const version = certificate.getProtocolVersion();
		destination.encryptionKeypair = encryptionKeypair;
		destination.signatureKeypair = signatureKeypair;
		destination.protocolOptions = protocolOptions;
	}
	async proccessCertificateChunk(message) {
		const {
			pid,
			cert,
			last
		} = message;
		this.certificateChunks[pid] = cert;
		if (last) {
			await this.loadCertificate(Buffer.concat(this.certificateChunks));
			this.connect(message);
		}
	}
	async updateState(state) {
		this.state = state;
		console.log(`CLIENT State Updated -> ${this.state}`);
		await this.fire(this.events, 'state', this);
	}
	async updateReadyState(state) {
		this.readyState = state;
		console.log(`CLIENT READYState Updated -> ${this.readyState}`);
		await this.fire(this.events, 'readyState', this);
	}
	setDiscoveryHeaders(header = []) {
		const key = this.encryptionKeypair.publicKey;
		console.log('Setting Cryptography in UDSP Header', toBase64(key));
		const {
			cipherSuiteName,
			cipherSuite,
			version,
			id
		} = this;
		header.push(id, cipherSuite.id, version);
		return header;
	}
	/*
		* Send Discovery
		* Generate & sign a random nonce include it in the header then send it to the server
		* Server verifies client most likely has the private key
		* sends cert chunked with one time encryption using client public key
		* Client saves cert and restarts the connection with the new data
	*/
	async sendDiscovery() {
		if (this.state === inactiveState) {
			console.log('Sending Discovery');
			await this.updateState(discoveringState);
			const header = [2];
			this.setPublicKeyHeader(header);
			this.setCryptographyOptionsHeaders(header);
			const message = [];
			this.discoverySent = true;
			return this.send(message, header);
		}
	}
	async discovered() {
		console.log('DISCOVERY COMPLETED -> CERTIFICATE LOADED');
		await this.updateState(discoveredState);
	}
	discovery(frame, header) {
		this.discovered();
	}
	setPublicKeyHeader(header = []) {
		const preparedPublicKey = this.cipherSuite.preparedPublicKey;
		if (this.cipherSuite.preparedPublicKey) {
			header.push(preparedPublicKey);
			console.log('Setting Prepared Public Key in UDSP Header', toBase64(preparedPublicKey));
		} else {
			const publicKey = this.encryptionKeypair.publicKey;
			header.push(publicKey);
			console.log('Setting Public Key in UDSP Header', toBase64(publicKey));
		}
		return header;
	}
	setCryptographyHeaders(header = []) {
		const key = this.encryptionKeypair.publicKey;
		console.log('Setting Cryptography in UDSP Header', toBase64(key));
		const {
			cipherSuiteName,
			cipherSuite,
			version,
			id
		} = this;
		header.push(id, cipherSuite.id, version);
		return header;
	}
	connect() {
		if (this.state === 4) {
			console.log('ALREADY CONNECTED');
			return this;
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
	async sendIntro() {
		console.log('Sending Intro');
		await this.updateState(connectingState);
		const header = [0];
		this.setPublicKeyHeader(header);
		this.setCryptographyHeaders(header);
		const message = [];
		await this.send(message, header);
	}
	async intro(frame, header, rinfo) {
		if (!frame || !isArray(frame)) {
			this.close(frame);
			return;
		}
		if (this.newKeypair) {
			return;
		}
		const { destination } = this;
		console.log('Got server Intro', frame);
		const [
			streamid_undefined,
			rpc,
			serverConnectionId,
			newKeypair,
			serverRandomToken,
			changeDestinationAddress
		] = frame;
		this.destination.id = serverConnectionId;
		this.destination.connectionIdSize = serverConnectionId.length;
		this.newKeypair = newKeypair;
		await this.setNewDestinationKeys();
		console.log('New Server Connection ID', toBase64(serverConnectionId));
		if (changeDestinationAddress) {
			if (changeDestinationAddress === true) {
				this.destination.ip = rinfo.address;
				this.destination.port = rinfo.port;
			} else if (isArray(changeDestinationAddress)) {
				if (changeDestinationAddress[1]) {
					this.destination.ip = changeDestinationAddress[1];
				}
				if (changeDestinationAddress[0]) {
					this.destination.port = changeDestinationAddress[0];
				}
			} else if (isString(changeDestinationAddress)) {
				if (changeDestinationAddress.has(/:|\./)) {
					this.destination.ip = changeDestinationAddress;
				} else {
					this.destination.port = changeDestinationAddress;
				}
			}
			console.log('Destination changed in INTRO', this.destination.ip, destination.port);
		}
		if (serverRandomToken) {
			this.serverRandomToken = serverRandomToken;
			console.log('Server Random Token', toBase64(serverRandomToken));
		}
		this.handshaked();
	}
	async setSessionKeys() {
		// console.log(this.destination.encryptionKeypair);
		if (this.destination.encryptionKeypair) {
			this.sessionKeys = this.cipherSuite.clientSessionKeys(this.encryptionKeypair, this.destination.encryptionKeypair);
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
	async handshaked(message) {
		await this.calculatePacketOverhead();
		await this.setConnected();
		if (this.handshakeCompleted) {
			console.log('Handshake Completed with new keys');
			this.handshakeCompleted(this);
		}
	}
	async setConnected() {
		this.connected = true;
		await this.updateState(connectedState);
		await this.updateReadyState(1);
		this.fire(this.events, 'connected', this);
	}
	async sendEnd() {
		if (this.state === connectingState || this.state === connectedState || this.state === closingState) {
			console.log('Sending CLIENT END');
			return this.send([false, 1], false, null, true);
		}
	}
	end(frame, header) {
		this.close('Server Ended Connection');
	}
	async close(message) {
		if (this.state === connectingState || this.state === connectedState) {
			console.log(`Client CLOSING. ${this.connectionIdString}`);
			Client.connections.delete(this.connectionIdString);
			await this.updateState(closingState);
			await this.updateReadyState(2);
			await this.sendEnd();
			await this.setDisconnected();
			await this.socket.close();
			await this.updateState(closedState);
			await this.updateReadyState(3);
			this.fire(this.events, 'closed', this);
			console.log(`Client CLOSED. ${this.connectionIdString}`);
		}
	}
	async setDisconnected() {
		this.connected = null;
		await this.updateState(closedState);
		await this.updateReadyState(3);
		this.fire(this.events, 'disconnected', this);
	}
	async reconnect() {
		if (this.state === closedState) {
			await this.initialize();
			await this.connect();
		}
	}
	async destory() {
		if (this.state !== destroyedState) {
			console.log('Destory Client Object - buffer cleanup');
			await this.close();
			await this.updateState(destroyingState);
			// FLUSH DATA TEARDOWN NEEDED
			await this.updateState(destroyedState);
			this.fire(this.events, 'destroyed', this);
		}
	}
	on(...args) {
		return createEvent(this.events, ...args);
	}
	off(...args) {
		return removeEvent(this.events, ...args);
	}
	fire(eventName, ...args) {
		return triggerEvent(this.events, eventName, this, ...args);
	}
	request = uwRequest;
	fetch = fetchRequest;
	post = post;
	get = get;
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
			connectionIdSize: defaultServerConnectionIdSize,
			overhead: {},
			id: Buffer.alloc(0),
		};
		this.autoConnect = false;
		this.certificateChunks = [];
		this.requestQueue = construct(Map);
		this.data = construct(Map);
		this.connectionIdSize = defaultClientConnectionIdSize;
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
console.log(encode(Buffer.alloc(0)).length, encode(false).length);
