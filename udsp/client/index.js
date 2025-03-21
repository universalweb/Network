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
	isBuffer,
	isEmpty,
	isString,
	isTrue,
	isUndefined,
	noValue,
	omit,
	promise
} from '@universalweb/acid';
import {
	checkIntroTimeout,
	clearIntroTimeout,
	clientIntroFrame,
	clientIntroHeader,
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
import {
	extendedHandshake,
	extendedHandshakeHeader,
	sendExtendedHandshake,
	sendExtendedHandshakeHeader
} from './protocolEvents/extendedHandshake.js';
import { sendPacket, sendPacketIfAny } from '../sendPacket.js';
import {
	toBase64,
	toHex,
} from '#crypto';
import { Ask } from '../request/ask.js';
import { UDSP } from '#udsp/base';
import { calculatePacketOverhead } from '../calculatePacketOverhead.js';
import { clientStates } from '../states.js';
import { configCryptography } from './configCryptography.js';
import { consoleLog } from '../consoleLog,js';
import dgram from 'dgram';
// Client specific imports to extend class
import { emit } from '../requestMethods/emit.js';
import { fetchRequest } from '../requestMethods/fetch.js';
import { get } from '../requestMethods/get.js';
import { getAddressStringFromBuffer } from '#utilities/network/ip';
import { getIPDetails } from './getIPDetails.js';
import { getLocalIpVersion } from '../../utilities/network/getLocalIP.js';
import { getWANIPAddress } from '../../utilities/network/getWANIPAddress.js';
import { keychainGet } from '../certificate/keychain.js';
import { msgSent } from '#logs';
import { onListening } from './listening.js';
import { onPacket } from './onPacket.js';
import { post } from '../requestMethods/post.js';
import { publicDomainCertificate } from '../certificate/domain.js';
import { setDestination } from './setDestination.js';
import { socketOnError } from './socketOnError.js';
import uwProfile from '../../profile/index.js';
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
		this.logInfo('-------CLIENT INITIALIZING-------\n');
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
		this.consoleLog(this);
		const destinationStatus = await this.setDestination();
		if (destinationStatus === false) {
			return this;
		}
		await this.getIPDetails();
		await this.setProfile();
		this.assignId();
		await this.calculatePacketOverhead();
		await this.setupSocket();
		await this.attachEvents();
		if (this.options.autoConnect) {
			await this.connect();
		}
		this.logInfo('Client initialized successfully.');
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
			// this.logInfo('ORIGIN', rinfo);
			return source.onPacket(packet, rinfo);
		});
	}
	socketOnError = socketOnError;
	assignId() {
		const connectionIdString = generateConnectionIdString(this.connectionIdSize);
		this.connectionIdString = connectionIdString;
		this.id = connectionIdToBuffer(connectionIdString);
		this.logInfo(`Assigned ClientId ${connectionIdString}`);
		Client.connections.set(connectionIdString, this);
	}
	async calculatePacketOverhead() {
		return calculatePacketOverhead(this.cipher, this.destination.connectionIdSize, this.destination);
	}
	reKey() {
		this.logInfo(`client reKeyed`);
	}
	async send(frame, header, footer, repeat) {
		if (!this.destination.ip) {
			this.logInfo(`Can't send - No Destination IP`);
			return;
		}
		if (this.state >= closingState) {
			this.logInfo(`Can't send - Connection Closed`);
			return false;
		}
		this.logInfo(`client.send to Server`);
		if (this.socket) {
			return sendPacket(frame, this, this.socket, this.destination, header, footer, repeat);
		}
	}
	async sendAny(frame, headers, footer, repeat) {
		msgSent(`socket sendPacketIfAny -> ID: ${this.connectionIdString}`);
		if (this.destroyed) {
			return;
		}
		return sendPacketIfAny(frame, this, this.socket, this.destination, headers, footer, repeat);
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
		this.consoleLog(this);
		const { options: { destinationCertificate } } = this;
		this.destination.certificate = await publicDomainCertificate(destinationCertificate);
		this.consoleLog(this.destination.certificate);
		await this.discovered();
		await this.processCertificate();
		await this.configCryptography();
	}
	async discovered() {
		this.logInfo('DISCOVERY COMPLETED -> CERTIFICATE LOADED');
		await this.updateState(discoveredState);
	}
	async processCertificate() {
		const { destination, } = this;
		const { certificate } = destination;
		const {
			keyExchangeKeypair,
			signatureKeypair,
			version: certificateVersion,
			encryptConnectionId,
			protocolOptions,
			ciphers,
		} = certificate.get();
		const version = certificate.getProtocolVersion();
		// Need function that can assign to source and decide publicKey or other properties
		destination.publicKey = keyExchangeKeypair?.publicKey || keyExchangeKeypair;
		this.keyExchange = certificate.keyExchangeAlgorithm;
		// this.consoleLog(destination);
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
		this.logInfo(`CLIENT State Updated -> ${this.state}`);
		await this.fire(this.events, 'state', this);
	}
	async updateReadyState(state) {
		this.readyState = state;
		this.logInfo(`CLIENT READYState Updated -> ${this.readyState}`);
		await this.fire(this.events, 'readyState', this);
	}
	// TODO: NEEDS SECURITY CHECKS FOR CHANGING DESTINATION
	changeAddress(addressBuffer, rinfo) {
		this.logInfo(`Change Server Address ${addressBuffer}`);
		if (noValue(addressBuffer)) {
			this.logInfo(`No Address Buffer`);
			return;
		}
		if (addressBuffer === true) {
			this.destination.ip = rinfo.address;
			this.destination.port = rinfo.port;
		} else if (isBuffer(addressBuffer)) {
			// ipv4BytesChangeAddress
			const addressArray = getAddressStringFromBuffer(addressBuffer);
			if (addressArray) {
				const [
					ipAddress,
					portNumber
				] = addressArray;
				if (ipAddress) {
					this.destination.ip = ipAddress;
				}
				if (portNumber) {
					this.destination.port = portNumber;
				}
			}
		}
		this.logInfo('Destination changed in INTRO');
	}
	// TODO: NEED BETTER WAY TO HANDLE GENERIC INSTEAD OF PUBLICKEY BUFFER?
	async setPublicKeyHeader(header = []) {
		if (this.keyExchange.setClientPublicKeyHeader) {
			return this.keyExchange.setClientPublicKeyHeader(this, header);
		}
		const preparedPublicKey = this.publicKeyBuffer || this.publicKey;
		header[2] = preparedPublicKey;
	}
	connect() {
		if (!this.destination.ip) {
			this.logInfo(`Can't connect - No Destination IP`);
			return;
		} else if (this.state === connectedState) {
			this.logInfo('ALREADY CONNECTED');
			return this;
		} else if (this.completeHandshake) {
			return this.awaitHandshake;
		}
		this.awaitHandshake = promise((accept) => {
			this.logInfo('HANDSHAKE AWAITING');
			this.completeHandshake = accept;
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
	extendedHandshakeHeader = extendedHandshakeHeader;
	sendExtendedHandshake = sendExtendedHandshake;
	sendExtendedHandshakeHeader = sendExtendedHandshakeHeader;
	async handshaked(message) {
		await this.calculatePacketOverhead();
		await this.setConnected();
		if (this.completeHandshake) {
			this.logInfo('Handshake Completed with new keys');
			this.completeHandshake(this);
		}
	}
	async setConnected() {
		this.connected = true;
		await this.updateState(connectedState);
		await this.updateReadyState(1);
		this.latency = (Date.now() - this.introTimestamp) + 100;
		this.logInfo(`CLIENT CONNECTED. Latency: ${this.latency}ms`);
		this.fire(this.events, 'connected', this);
	}
	async sendEnd() {
		if (this.state === connectingState || this.state === connectedState || this.state === closingState) {
			this.logInfo('Sending CLIENT END');
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
		this.logInfo(`Client CLOSING. ${this.connectionIdString}`);
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
		this.logInfo(`Client CLOSED. ${this.connectionIdString}`);
		if (this.completeHandshake) {
			this.completeHandshake(false);
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
	async destroy(errorCode = 0) {
		if (this.state !== destroyedState) {
			this.logInfo(`destroy Client - reason ${errorCode}`);
			await this.close();
			await this.updateState(destroyingState);
			// FLUSH DATA TEARDOWN NEEDED
			await this.updateState(destroyedState);
			this.fire(this.events, 'destroyed', this);
		}
	}
	async consoleLog(code, err) {
		await consoleLog(this, code, err);
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
	clientIntroHeader = clientIntroHeader;
	clientIntroFrame = clientIntroFrame;
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
		this.completeHandshake = null;
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
	this.logInfo('Create Client');
	const uwClient = await construct(Client, [options]);
	return uwClient;
}
// Add the request export here for simple auto connect and then just grab contents to return called UDSP
// client is for a longer stateful connection request to a remote server
