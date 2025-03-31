/*
	* Client Module
	* UDSP - Universal Data Stream Protocol
	* Universal Web (UW)
	* uw:// Universal Web Protocol
	* udsp:// UDSP Protocol
	* Establishes a UDP based bi-directional real-time connection between client and server.
*/
import {
	assign,
	construct,
	isBuffer,
	noValue
} from '@universalweb/acid';
import {
	checkIntroTimeout,
	clearIntroTimeout,
	clientIntroFrame,
	createClientIntro,
	intro,
	introHeader,
	sendIntro,
	setIntroHeaderDefaults
} from './protocolEvents/intro.js';
import {
	connect,
	reconnect,
	setConnected,
	setDisconnected
} from './connect.js';
import { connectionIdToBuffer, generateConnectionIdString } from '#udsp/connectionId';
import { end, sendEnd } from './protocolEvents/end.js';
import {
	extendedSynchronization,
	extendedSynchronizationHeader,
	sendExtendedSynchronization,
	sendExtendedSynchronizationHeader
} from './protocolEvents/extendedSynchronization.js';
import { fire, off, on } from './events.js';
import { send, sendAny } from './send.js';
import { UDSP } from '#udsp/base';
import { ask } from '../request/ask.js';
import { calculatePacketOverhead } from '../calculatePacketOverhead.js';
import { changeAddress } from './changeAddress.js';
import { closeSocket } from './close.js';
import { configCryptography } from './configCryptography.js';
import { destroy } from './destroy.js';
import { emit } from '../requestMethods/emit.js';
import { fetchRequest } from '../requestMethods/fetch.js';
import { get } from '../requestMethods/get.js';
import { getIPDetails } from './getIPDetails.js';
import { keychainGet } from '../certificate/keychain.js';
import { onListening } from './listening.js';
import { onPacket } from './onPacket.js';
import { onSocketError } from './onSocketError.js';
import { post } from '../requestMethods/post.js';
import { publicDomainCertificate } from '../certificate/domain.js';
import { setDefaults } from './setDefaults.js';
import { setDestination } from './setDestination.js';
import uwProfile from '../../cryptoID/index.js';
import { uwRequest } from '#udsp/requestMethods/request';
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
		this.logInfo(this);
		const destinationStatus = await this.setDestination();
		if (destinationStatus === false) {
			return this;
		}
		await this.getIPDetails();
		await this.setProfile();
		await this.assignId();
		await this.calculatePacketOverhead();
		await this.setupSocket();
		await this.attachEvents();
		if (this.options.autoConnect) {
			await this.connect();
		}
		this.logInfo('Client initialized successfully.');
		return this;
	}
	async synchronized(message) {
		await this.calculatePacketOverhead();
		await this.setConnected();
		if (this.completeSynchronization) {
			this.logInfo('Synchronization Completed with new keys');
			this.completeSynchronization(this);
		}
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
			return source.onSocketError(...args);
		});
		this.socket.on('listening', (...args) => {
			return source.onListening(...args);
		});
		this.socket.on('message', (packet, rinfo) => {
			// this.logInfo('ORIGIN', rinfo);
			return source.onPacket(packet, rinfo);
		});
	}
	async assignId() {
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
	send = send;
	sendAny = sendAny;
	async ask(method, path, parameters, data, head, options) {
		if (!this.connected) {
			await this.reconnect();
		}
		const createdAsk = ask(
			method,
			path,
			parameters,
			data,
			head,
			options,
			this
		);
		return createdAsk;
	}
	async loadCertificate() {
		this.logInfo(this);
		const { options: { destinationCertificate } } = this;
		this.destination.certificate = await publicDomainCertificate(destinationCertificate);
		this.logInfo(this.destination.certificate);
		await this.discovered();
		await this.processCertificate();
		await this.configCryptography();
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
		// this.logInfo(destination);
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
	// TODO: NEED BETTER WAY TO HANDLE GENERIC INSTEAD OF PUBLICKEY BUFFER?
	removeClient() {
		Client.connections.delete(this.connectionIdString);
	}
	changeAddress = changeAddress;
	checkIntroTimeout = checkIntroTimeout;
	clearIntroTimeout = clearIntroTimeout;
	clientIntroFrame = clientIntroFrame;
	createClientIntro = createClientIntro;
	setIntroHeaderDefaults = setIntroHeaderDefaults;
	sendIntro = sendIntro;
	introHeader = introHeader;
	intro = intro;
	extendedSynchronization = extendedSynchronization;
	extendedSynchronizationHeader = extendedSynchronizationHeader;
	sendExtendedSynchronization = sendExtendedSynchronization;
	sendExtendedSynchronizationHeader = sendExtendedSynchronizationHeader;
	connect = connect;
	setConnected = setConnected;
	setDisconnected = setDisconnected;
	reconnect = reconnect;
	sendEnd = sendEnd;
	end = end;
	close = closeSocket;
	destroy = destroy;
	onSocketError = onSocketError;
	on = on;
	off = off;
	fire = fire;
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
	setDefaults = setDefaults;
}
export async function client(options) {
	this.logInfo('Create Client');
	const uwClient = await construct(Client, [options]);
	return uwClient;
}
// Add the request export here for simple auto connect and then just grab contents to return called UDSP
// client is for a longer stateful connection request to a remote server
