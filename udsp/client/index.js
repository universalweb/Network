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
	createIntro,
	intro,
	introHeader,
	sendIntro,
	setIntroFrame,
	setIntroHeader,
} from './protocolEvents/intro.js';
import {
	connect,
	reconnect,
	setConnected,
	setDisconnected
} from './methods/connect.js';
import { connectionIdToBuffer, generateConnectionIdString } from '#udsp/utilities/connectionId';
import { end, sendEnd } from './protocolEvents/end.js';
import {
	extendedSynchronizationFrame,
	extendedSynchronizationHeader,
	sendExtendedSynchronization,
} from './protocolEvents/extendedSynchronization.js';
import { fire, off, on } from './methods/events.js';
import { loadCertificate, onCertificateChunk, processCertificate } from './methods/certificate.js';
import { send, sendAny } from './methods/send.js';
import { setReadyState, setState } from './methods/state.js';
import { UDSP } from '#udsp/base';
import { ask } from '../request/ask.js';
import { calculatePacketOverhead } from '../utilities/calculatePacketOverhead.js';
import { changeAddress } from './methods/changeAddress.js';
import { closeSocket } from './methods/close.js';
import { configCryptography } from './methods/configCryptography.js';
import cryptoID from '#components/cryptoID/index';
import { destroy } from './methods/destroy.js';
import { emit } from '../requestMethods/emit.js';
import { fetchRequest } from '../requestMethods/fetch.js';
import { get } from '../requestMethods/get.js';
import { getIPDetails } from './utilities/getIPDetails.js';
import { keychainGet } from '#components/certificate/keychain';
import { onListening } from './methods/listening.js';
import { onPacket } from './methods/onPacket.js';
import { onSocketError } from './methods/onSocketError.js';
import { post } from '../requestMethods/post.js';
import { publicDomainCertificate } from '#components/certificate/domain';
import { setDefaults } from './methods/setDefaults.js';
import { setDestination } from './methods/setDestination.js';
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
		await this.attachSocketEvents();
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
			this.profile = await cryptoID(profile, profilePassword);
		}
	}
	async attachSocketEvents() {
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
	loadCertificate = loadCertificate;
	onCertificateChunk = onCertificateChunk;
	processCertificate = processCertificate;
	setState = setState;
	setReadyState = setReadyState;
	// TODO: NEED BETTER WAY TO HANDLE GENERIC INSTEAD OF PUBLICKEY BUFFER?
	removeClient() {
		Client.connections.delete(this.connectionIdString);
	}
	changeAddress = changeAddress;
	checkIntroTimeout = checkIntroTimeout;
	clearIntroTimeout = clearIntroTimeout;
	setIntroFrame = setIntroFrame;
	createIntro = createIntro;
	setIntroHeader = setIntroHeader;
	sendIntro = sendIntro;
	introHeader = introHeader;
	intro = intro;
	extendedSynchronizationFrame = extendedSynchronizationFrame;
	extendedSynchronizationHeader = extendedSynchronizationHeader;
	sendExtendedSynchronization = sendExtendedSynchronization;
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
