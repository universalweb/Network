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
	encode,
	decode
} from '#utilities/serialize';
import {
	omit,
	assign,
	construct,
	UniqID,
	isString,
	promise,
	isTrue,
	currentPath,
	hasValue,
	isUndefined,
	has,
	intersection,
	isArray
} from '@universalweb/acid';
import dgram from 'dgram';
import { success, configure, info } from '#logs';
import {
	toBase64,
	emptyNonce,
	randomConnectionId,
} from '#crypto';
import { getCertificate, parseCertificate } from '#certificate';
import { watch } from '#watch';
// Client specific imports to extend class
import { emit } from '../requestMethods/emit.js';
import { uwRequest } from '#udsp/requestMethods/request';
import { processFrame } from './processFrame.js';
import { onPacket } from './onPacket.js';
import { onListening } from './listening.js';
import { keychainGet } from '#keychain';
import { Ask } from '../request/ask.js';
import { fetchRequest } from '../requestMethods/fetch.js';
import { UDSP } from '#udsp/base';
import { sendPacket } from '../sendPacket.js';
import { post } from '../requestMethods/post.js';
import { get } from '../requestMethods/get.js';
import { getAlgorithm, processPublicKey } from '../cryptoMiddleware/index.js';
import { getWANIPAddress } from '../../utilities/network/getWANIPAddress.js';
import { getLocalIpVersion } from '../../utilities/network/getLocalIP.js';
import { calculatePacketOverhead } from '../calculatePacketOverhead.js';
import { generateConnectionId, connectionIdToBuffer } from '#udsp/connectionId';
let ipInfo;
let globalIpVersion;
try {
	ipInfo = await getWANIPAddress();
	if (ipInfo?.ip) {
		globalIpVersion = ipInfo?.ip.includes(':') ? 'udp6' : 'udp4';
	} else {
		globalIpVersion = 'udp4';
	}
} catch (error) {
	console.log('NO GLOBAL IP');
}
console.log('IP Version', globalIpVersion);
// UNIVERSAL WEB Client Class
export class Client extends UDSP {
	constructor(configuration) {
		super(configuration);
		console.log('-------CLIENT INITIALIZING-------\n');
		return this.initialize(configuration);
	}
	static description = `The Universal Web's UDSP client module to initiate connections to a UDSP Server.`;
	static type = 'client';
	isClient = true;
	configDefaults() {
		const {
			autoConnect,
			realtime
		} = this.configuration;
		this.autoConnect = autoConnect;
		this.realtime = realtime;
	}
	async setDestination() {
		const {
			destination,
			configuration: {
				ip,
				port,
				destinationCertificate
			},
			ipVersion
		} = this;
		if (isString(destinationCertificate)) {
			console.log('Loading Destination Certificate', destinationCertificate);
			const certificate = await getCertificate(destinationCertificate);
			assign(destination, certificate);
		} else {
			assign(destination, destinationCertificate);
		}
		if (destination.publicKey) {
			this.hasCertificate = true;
		}
		if (!destination.publicKey) {
			console.log('No destination certificate provided.');
		}
		if (ip) {
			destination.ip = ip;
		}
		if (isArray(destination.ip)) {
			if (ipVersion === 'udp6') {
				destination.ip = destination.ip.find((item) => {
					return item.includes(':') ? item : false;
				});
			}
			if (!destination.ip) {
				destination.ip = destination.ip.find((item) => {
					return item.includes('.') ? item : false;
				});
			}
		}
		if (destination.ip.includes(':')) {
			this.ipVersion = 'udp6';
		}
		if (port) {
			destination.port = port;
		}
		if (this.destination.clientConnectionIdSize) {
			this.connectionIdSize = this.destination.clientConnectionIdSize;
		}
		if (!this.destination.connectionIdSize) {
			this.destination.connectionIdSize = 8;
		}
		// console.log('Destination', destination.cryptography);
	}
	async getKeychainSave(keychain) {
		return keychainGet(keychain);
	}
	async setProfile() {
		const {
			keychain,
			profile
		} = this.configuration;
		if (isString(profile)) {
			this.profile = await parseCertificate(profile);
		}
		if (keychain) {
			console.log('Loading Keychain', keychain);
			this.profile = await this.getKeychainSave(keychain);
		}
	}
	async configCryptography() {
		// console.log(this.cryptography);
		const { destination, } = this;
		const {
			encryptConnectionId,
			publicKeyAlgorithm,
		} = destination;
		if (!destination.cipherSuites) {
			destination.cipherSuites = this.cipherSuites;
		}
		if (!has(destination.cipherSuites, this.cipherSuiteName)) {
			console.log('Default ciphersuite not available');
			this.cipherSuiteName = intersection(this.cipherSuites, destination.cipherSuites)[0];
			if (!this.cipherSuiteName) {
				console.log('No matching cipher suite found.');
				return false;
			}
		}
		this.publicKeyCryptography = getAlgorithm(publicKeyAlgorithm, this.version);
		this.cipherSuite = getAlgorithm(this.cipherSuiteName, this.version);
		console.log(this.cipherSuiteName);
		if (destination.boxCryptography) {
			this.boxCryptography = getAlgorithm(destination.boxCryptography, this.version);
		}
		this.compression = destination.compression;
		this.headerCompression = destination.headerCompression;
		if (destination.autoLogin && this.autoLogin) {
			this.autoLogin = true;
		}
		if (!this.keypair) {
			this.keypair = this.cipherSuite.keypair();
			success(`Created Connection Keypair`);
		}
		if (!this.encryptionKeypair) {
			this.encryptionKeypair = this.keypair;
		}
		const convertSignKeypairToEncryptionKeypair = processPublicKey(this.destination);
		if (convertSignKeypairToEncryptionKeypair) {
			this.destination.encryptionKeypair = convertSignKeypairToEncryptionKeypair;
		}
		await this.setSessionKeys();
		if (encryptConnectionId) {
			const {
				server: encryptServerCid,
				client: encryptClientCid,
				keypair: connectionIdKeypair
			} = encryptConnectionId;
			let encryptServer = hasValue(encryptServerCid);
			let encryptClient = hasValue(encryptClientCid);
			if (!encryptServer && !encryptClient) {
				encryptServer = true;
				encryptClient = true;
			}
			if (encryptServer) {
				this.encryptServerConnectionId = true;
				if (connectionIdKeypair) {
					this.destination.connectionIdKeypair = connectionIdKeypair;
				} else {
					this.destination.connectionIdKeypair = this.destination.encryptionKeypair;
				}
			}
			if (encryptClient) {
				this.encryptClientConnectionId = true;
			}
			console.log(`Encrypt Connection ID Server ${encryptServer} Client ${encryptClient}`);
		}
	}
	async attachEvents() {
		const thisClient = this;
		this.socket.on('error', (err) => {
			console.log('CLIENT UDP SERVER ERROR');
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
	async getIPDetails() {
		const destinationIp = this.destination.ip;
		if (isArray(destinationIp)) {
			if (globalIpVersion === 'udp4') {
				const ipv4ip = this.destination.ip.find((item) => {
					return item.includes(':') ? false : item;
				});
				if (ipv4ip) {
					this.destination.ip = ipv4ip;
					this.ipVersion = 'udp4';
				}
			} else {
				const ipv6ip = this.destination.ip.find((item) => {
					return item.includes(':') ? item : false;
				});
				if (ipv6ip) {
					this.destination.ip = ipv6ip;
					this.ipVersion = 'udp6';
				} else {
					this.destination.ip = [0];
					this.ipVersion = 'udp4';
				}
			}
		} else {
			this.ipVersion = this.destination.ip.includes(':') ? 'udp6' : 'udp4';
		}
	}
	async initialize(configuration) {
		const thisClient = this;
		this.configuration = configuration;
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
		if (this.autoConnect) {
			await this.connect();
		}
		return this;
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
	close(message, obj) {
		if (obj) {
			console.log(obj);
		}
		console.trace(this.connectionIdString, `client closed. code ${message?.state || message}`);
		this.socket.close();
		Client.connections.delete(this.connectionIdString);
	}
	async send(message, headers, footer) {
		console.log(`client.send to Server`, this.destination.ip, this.destination.port);
		return sendPacket(message, this, this.socket, this.destination, headers, footer);
	}
	ask(method, path, parameters, data, head, options) {
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
	async setSessionKeys(generatedKeys) {
		console.log(this.destination.encryptionKeypair);
		this.sessionKeys = generatedKeys || this.publicKeyCryptography.clientSessionKeys(this.encryptionKeypair, this.destination.encryptionKeypair);
		if (this.sessionKeys) {
			success(`Created Shared Keys`);
			success(`receiveKey: ${toBase64(this.sessionKeys.receiveKey)}`);
			success(`transmitKey: ${toBase64(this.sessionKeys.transmitKey)}`);
		}
	}
	async setNewDestinationKeys() {
		if (!(this.handshakeSet)) {
			this.destination.encryptionKeypair = {
				publicKey: this.newKeypair
			};
			if (this.destination.connectionIdKeypair) {
				this.destination.connectionIdKeypair = {
					publicKey: this.newConnectionKeypair || this.newKeypair
				};
			}
			await this.setSessionKeys();
			this.handshakeSet = true;
		}
	}
	async intro(frame, header) {
		if (!frame || !isArray(frame)) {
			this.close('No intro message', frame);
			return;
		}
		console.log('Got server Intro', frame);
		const [streamid_undefined, rpc, serverConnectionId, reKey, serverRandomToken, certSize, dataSize] = frame;
		this.destination.id = serverConnectionId;
		this.destination.connectionIdSize = serverConnectionId.length;
		this.newKeypair = reKey;
		await this.setNewDestinationKeys();
		console.log('New Server Connection ID', toBase64(serverConnectionId));
		if (serverRandomToken) {
			this.serverRandomToken = serverRandomToken;
			console.log('Server Random Token', toBase64(serverRandomToken));
		}
		if (certSize) {
			this.certSize = certSize;
		}
		this.handshaked();
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
		const message = [false, 0];
		this.introSent = true;
		this.send(message, header);
	}
	ensureHandshake() {
		if (this.connected === true) {
			console.log('ALREADY CONNECTED');
			return true;
		} else if (!this.handshakeCompleted) {
			this.awaitHandshake = promise((accept) => {
				console.log('HANDSHAKE AWAITING');
				this.handshakeCompleted = accept;
			});
			this.sendIntro();
		}
		return this.awaitHandshake;
	}
	async handshaked(message) {
		console.log('Handshake Completed with new keys');
		this.connected = true;
		this.state = 2;
		this.readyState = 1;
		await this.calculatePacketOverhead();
		this.handshakeCompleted();
	}
	proccessProtocolPacket(frame, header) {
		const rpc = frame[1];
		console.log('Processing Protocol Packet', frame);
		if (rpc === 0) {
			this.intro(frame, header);
		}
	}
	request = uwRequest;
	fetch = fetchRequest;
	post = post;
	get = get;
	processFrame = processFrame;
	emit = emit;
	onListening = onListening;
	onPacket = onPacket;
	destination = {
		overhead: {}
	};
	autoConnect = false;
	static connections = new Map();
	certificateChunks = [];
	requestQueue = construct(Map);
	data = construct(Map);
	connectionIdSize = 4;
	ipVersion = 'udp4';
}
export async function client(configuration) {
	console.log('Create Client');
	const uwClient = await construct(Client, [configuration]);
	return uwClient;
}
// Add the request export here for simple auto connect and then just grab contents to return called UDSP
// client is for a longer stateful connection request to a remote server
// udsp is for a single request to a remote server then closes after response
export { getCertificate };
