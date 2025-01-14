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
	isEmpty,
	isString,
	isTrue,
	isUndefined,
	omit,
	promise
} from '@universalweb/acid';
import {
	checkIntroTimeout,
	clearIntroTimeout,
	intro,
	introHeader,
	sendIntro
} from './protocolEvents/intro.js';
import { connectionIdToBuffer, generateConnectionIdString } from '#udsp/connectionId';
import { createEvent, removeEvent, triggerEvent } from '#udsp/events';
import {
	decode,
	encode
} from '#utilities/serialize';
import { defaultClientConnectionIdSize, defaultServerConnectionIdSize } from '../../defaults.js';
import {
	discoveryHeaderRPC,
	endHeaderRPC,
	extendedHandshakeHeaderRPC,
	introHeaderRPC
} from '../protocolHeaderRPCs.js';
import {
	discoveryRPC,
	endRPC,
	extendedHandshakeRPC,
	introRPC
} from '../protocolFrameRPCs.js';
import { extendedHandshake, sendExtendedHandshake, sendExtendedHandshakeHeader } from './protocolEvents/extendedHandshake.js';
import {
	toBase64,
	toHex,
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
import { keychainGet } from '../certificate/keychain.js';
import { onListening } from './listening.js';
import { onPacket } from './onPacket.js';
import { post } from '../requestMethods/post.js';
import { publicDomainCertificate } from '../certificate/domain.js';
import { sendPacket } from '../sendPacket.js';
import { setDestination } from './setDestination.js';
import { socketOnError } from './socketOnError.js';
import { uwProfile } from '../../UWProfile/index.js';
import { uwRequest } from '#udsp/requestMethods/request';
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
		const destinationStatus = await this.setDestination();
		if (destinationStatus === false) {
			return this;
		}
		await this.getIPDetails();
		await this.setProfile();
		console.log('ipVersion', this.ipVersion);
		console.log('destination', this.destination);
		this.assignId();
		await this.calculatePacketOverhead();
		await this.setupSocket();
		await this.attachEvents();
		if (this.options.autoConnect) {
			await this.connect();
		}
		return this;
	}
	async setProfile() {
		const {
			profile,
			profilePassword
		} = this.options;
		if (profile) {
			this.profile = await uwProfile(profile, profilePassword);
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
		const connectionIdString = generateConnectionIdString(this.connectionIdSize);
		this.connectionIdString = connectionIdString;
		this.id = connectionIdToBuffer(connectionIdString);
		console.log(`Assigned ClientId ${connectionIdString}`);
		Client.connections.set(connectionIdString, this);
	}
	async calculatePacketOverhead() {
		return calculatePacketOverhead(this.cipherSuite, this.destination.connectionIdSize, this.destination);
	}
	reKey() {
		const thisClient = this;
		console.log(`client reKeyed -> ID: ${thisClient.connectionIdString}`);
	}
	async send(frame, header, footer, repeat) {
		if (!this.destination.ip) {
			console.log(`Can't send - No Destination IP`);
			return;
		}
		if (this.state >= closingState) {
			console.log(`Can't send - Connection Closed`);
			return false;
		}
		console.log(`client.send to Server`, this.destination.ip, this.destination.port);
		if (this.socket) {
			return sendPacket(frame, this, this.socket, this.destination, header, footer, repeat);
		}
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
	async discovered() {
		console.log('DISCOVERY COMPLETED -> CERTIFICATE LOADED');
		await this.updateState(discoveredState);
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
		destination.publicKey = encryptionKeypair?.publicKey || encryptionKeypair;
		// console.log(destination);
		destination.signatureKeypair = signatureKeypair?.publicKey || signatureKeypair;
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
	changeAddress(changeDestinationAddress, rinfo) {
		console.log('Change Server Address', changeDestinationAddress);
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
		console.log('Destination changed in INTRO', this.destination.ip, this.destination.port);
	}
	setPublicKeyHeader(header = []) {
		const preparedPublicKey = this.publicKey;
		console.log('setPublicKeyHeader', toHex(preparedPublicKey));
		header.push(preparedPublicKey);
		return header;
	}
	setCryptographyHeaders(header = []) {
		const key = this.publicKey;
		const {
			cipherSuite,
			version,
			id,
			connectionIdString
		} = this;
		console.log(`setCryptographyHeaders Cipher: ${cipherSuite.id} @ v${version} with ID: ${connectionIdString}`, `Public Key Size: ${key.length}`);
		console.log('Client ID', connectionIdString);
		header.push(id, cipherSuite.id, version);
		return header;
	}
	connect() {
		if (!this.destination.ip) {
			console.log(`Can't connect - No Destination IP`);
			return;
		} else if (this.state === connectedState) {
			console.log('ALREADY CONNECTED');
			return this;
		} else if (this.handshakeCompleted) {
			return this.awaitHandshake;
		}
		this.awaitHandshake = promise((accept) => {
			console.log('HANDSHAKE AWAITING');
			this.handshakeCompleted = accept;
		});
		this.sendIntro();
		return this.awaitHandshake;
	}
	checkIntroTimeout = checkIntroTimeout;
	clearIntroTimeout = clearIntroTimeout;
	sendIntro = sendIntro;
	introHeader = introHeader;
	intro = intro;
	extendedHandshake = extendedHandshake;
	sendExtendedHandshake = sendExtendedHandshake;
	sendExtendedHandshakeHeader = sendExtendedHandshakeHeader;
	async setSession(cipherData, frame, header, packetDecoded) {
		this.cipherSuite.clientSetSession(this, this.destination, cipherData, frame, header, packetDecoded);
		if (this.receiveKey) {
			console.log(`Created Shared Keys`);
			console.log(`receiveKey: ${toHex(this.receiveKey)}`);
			console.log(`transmitKey: ${toHex(this.transmitKey)}`);
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
		this.latency = (Date.now() - this.introTimestamp) + 100;
		console.log(`CLIENT CONNECTED. Latency: ${this.latency}ms`);
		this.fire(this.events, 'connected', this);
	}
	async sendEnd() {
		if (this.state === connectingState || this.state === connectedState || this.state === closingState) {
			console.log('Sending CLIENT END');
			const frame = [false, endRPC];
			return this.send(frame, false, null, true);
		}
	}
	end(frame, header) {
		this.close('Server Ended Connection');
	}
	removeClient() {
		Client.connections.delete(this.connectionIdString);
	}
	async close(message) {
		console.log(`Client CLOSING. ${this.connectionIdString}`);
		this.clearIntroTimeout();
		if (this.state === connectedState) {
			await this.sendEnd();
		}
		this.removeClient();
		await this.updateState(closingState);
		await this.updateReadyState(2);
		await this.setDisconnected();
		await this.socket?.close();
		await this.updateReadyState(3);
		this.fire(this.events, 'closed', this);
		console.log(`Client CLOSED. ${this.connectionIdString}`);
		if (this.handshakeCompleted) {
			this.handshakeCompleted(false);
		}
	}
	async setDisconnected() {
		this.connected = null;
		await this.updateState(closedState);
		await this.updateReadyState(3);
		this.fire(this.events, 'disconnected', this);
	}
	async reconnect(options) {
		if (this.state === closedState) {
			await this.initialize(options || this.options);
			await this.connect();
		}
	}
	async destory(errorMessage = 'unknown') {
		if (this.state !== destroyedState) {
			console.log(`Destory Client - reason ${errorMessage}`);
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
		this.nextSession = null;
		this.serverRandomToken = null;
		this.handshakeCompleted = null;
		this.awaitHandshake = null;
		this.destination = {
			connectionIdSize: defaultServerConnectionIdSize,
			overhead: {},
			// False is smaller than an empty buffer by a singular byte
			id: false,
		};
		this.autoConnect = false;
		this.certificateChunks = [];
		this.requestQueue = construct(Map);
		this.data = construct(Map);
		this.connectionIdSize = defaultClientConnectionIdSize;
		this.ipVersion = 'udp4';
		this.readyState = 0;
		this.introAttempts = 0;
		this.latency = 100;
		this.gracePeriod = 10000;
	}
}
export async function client(options) {
	console.log('Create Client');
	const uwClient = await construct(Client, [options]);
	return uwClient;
}
// Add the request export here for simple auto connect and then just grab contents to return called UDSP
// client is for a longer stateful connection request to a remote server
