// The Universal Web's UDSP server module
import {
	UniqID,
	assign,
	construct,
	currentPath,
	each,
	hasValue,
	isFunction,
	isNumber,
	isString,
	isTrue,
	isUndefined
} from '@universalweb/acid';
import {
	addClientCount,
	clientCheck,
	createServerClient,
	removeClient,
	subtractClientCount
} from './methods/clients.js';
import { attachSocketEvents, configureNetwork, setPort } from './methods/network.js';
import { configureCertificateCryptography, setCertificate } from './methods/certificate.js';
import { createEvent, removeEvent, triggerEvent } from '../events.js';
import { decode, encode } from '#utilities/serialize';
import { fire, off, on } from './methods/events.js';
import { introHeaderRPC, isIntroHeader } from '../protocolHeaderRPCs.js';
import { randomBuffer, toBase64 } from '#utilities/cryptography/utils';
import { UDSP } from '#udsp/base';
import { decodePacketHeaders } from '#udsp/encoding/decodePacket';
import { defaultServerConnectionIdSize } from './defaults.js';
import { listen } from './methods/listen.js';
import { noStreamID } from '../utilities/hasConnectionID.js';
import { onError } from './methods/onError.js';
import { onListen } from './methods/onListen.js';
import { onPacket } from './methods/onPacket.js';
import { sendPacket } from '#udsp/sendPacket';
const { seal } = Object;
/*
	* TODO:
 	* - Add flood protection for spamming new connections with the same connection id
 	* - Add flood protection for spamming new connections from the same origin
	* - Add new loadbalancer algo to distribute connections to servers equally
 */
export class Server extends UDSP {
	constructor(options) {
		// console.log = () => {};
		super(options);
		return this.initialize(options);
	}
	async initialize(options) {
		this.logInfo('-------SERVER INITIALIZING-------');
		this.initializeBase(options);
		assign(this, options);
		this.options = seal(assign({}, options));
		this.logInfo('OPTIONS', this.options);
		this.configConnectionId();
		await this.setCertificate();
		await this.configureCertificateCryptography();
		await this.configureNetwork();
		await this.setupSocket();
		await this.attachSocketEvents();
		this.logInfo('-------SERVER INITIALIZED-------');
		return this;
	}
	static description = 'UW Server Module';
	static type = 'server';
	isServer = true;
	isServerEnd = true;
	configureCertificateCryptography = configureCertificateCryptography;
	setCertificate = setCertificate;
	configConnectionId() {
		const {
			isWorker,
			coreCount
		} = this;
		if (isFunction(this.id)) {
			this.id = this.id(this);
			return;
		}
		if (coreCount && this.workerId) {
			const reservedConnectionIdSize = String(coreCount).length;
			this.reservedConnectionIdSize = reservedConnectionIdSize;
			const compiledId = this.workerId.padStart(reservedConnectionIdSize, '0');
			this.id = compiledId;
		} else if (!this.id) {
			this.id = '0';
		}
		this.logInfo('Config Server ID', this.id);
	}
	async send(packet, destination) {
		return sendPacket(packet, this, this.socket, destination);
	}
	addClientCount = addClientCount;
	subtractClientCount = subtractClientCount;
	clientCheck = clientCheck;
	createClient = createServerClient;
	removeClient = removeClient;
	// CHANGE FUNCTION TO RESPOND TO REQUESTS
	// TODO: ADD DEFAULT METHODS TO THIS FOR BUILT IN SUPPORT
	async onRequest(request, response, client) {
		this.logInfo('onRequest', request, response, client);
	}
	updateWorkerState() {
		this.syncWorkerState();
	}
	syncWorkerState() {
		const { clientCount } = this;
		this.logInfo(`Client count ${clientCount}`);
		process.send(encode([
			'state',
			{
				clientCount
			}
		]));
	}
	on = on;
	off = off;
	fire = fire;
	attachSocketEvents = attachSocketEvents;
	configureNetwork = configureNetwork;
	setPort = setPort;
	listen = listen;
	onError = onError;
	onListen = onListen;
	onPacket = onPacket;
	data = new Map();
	realTime = true;
	clientCount = 0;
	port = 80;
	ip = '::1';
	connectionIdSize = defaultServerConnectionIdSize;
	events = new Map();
	encryption = {};
	/*
		* All created clients (clients) represent a client to server bi-directional connection until it is closed by either party.
	*/
	// SWITCH TO BINARY SEARCH FOR CLIENTS FOR FASTER LOOKUP
	clients = construct(Map);
	initialGracePeriod = 5000;
}
export async function server(...args) {
	return construct(Server, args);
}
