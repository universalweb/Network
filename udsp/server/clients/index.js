// GENERAL RULES
// DEFER COMPUTE TASKS
// DEFER MEMORY TASKS
// CLEAR MEMORY AS SOON AS POSSIBLE
// PRE COMPUTE WHAT YOU CAN
import { construct, extendClass, isNull } from '@universalweb/utilitylib';
import {
	createIntro,
	intro,
	introHeader,
	sendIntro,
	setIntroFrame,
	setIntroHeader,
} from './protocolEvents/intro.js';
import { end, sendEnd } from './methods/end.js';
import {
	extendedSynchronization,
	extendedSynchronizationHeader,
	sendExtendedSynchronization,
} from './protocolEvents/extendedSynchronization.js';
import { send, sendAny } from './methods/send.js';
import { attachProxyAddress } from './methods/attachProxyAddress.js';
import { calculatePacketOverhead } from '#udsp/utilities/calculatePacketOverhead';
import { defaultClientConnectionIdSize } from '../../client/defaults.js';
import { destroy } from './methods/destroy.js';
import eventMethods from '#udsp/events';
import { initialize } from './methods/initialize.js';
import logMethods from '#utilities/logs/classLogMethods';
import { onConnected } from './methods/onConnected.js';
import { randomBuffer } from '#utilities/cryptography/utils';
import { reply } from './methods/reply.js';
/**
 * @TODO
 */
export class Client {
	constructor(config) {
		const { server } = config;
		const client = this;
		const { certificate } = server;
		this.server = server;
		this.socket = server.socket;
		this.certificate = certificate;
		this.setupEventEmitter();
		return this.initialize(config);
	}
	destination = {
		overhead: {},
		connectionIdSize: defaultClientConnectionIdSize,
	};
	// TODO: ADD STATE CHECKING INSTEAD OF GRACE OR HEARTBEAT
	setState(state) {
		if (this.destroyed || isNull(this.destroyed)) {
			return;
		}
		this.state = state;
		this.logInfo(`CLIENT State Updated -> ${this.state}`);
	}
	// NOTE: Server (receives raw packet)
	//    └─► parses + authenticates + identifies Client
	//          └─► Client.handlePacket(packet)
	//                └─► Client.server.handleRequest(packet)
	//                      └─► App.handleRequest(packet, client)
	//                            └─► Router.route(packet, client)
	async onRequest(request, response) {
		const { server } = this;
		this.logVerbose('onRequest EVENT', request);
		if (this.onClientRequest) {
			await this.onClientRequest(request, response, this);
		}
		if (server) {
			return server.onRequest(request, response, this);
		}
	}
	async close(destroyCode) {
		await this.sendEnd();
		this.destroy(destroyCode);
	}
	destroy = destroy;
	updateLastActive() {
		this.lastActive = Date.now();
	}
	checkHeartbeat() {
		const lastActive = Date.now() - this.lastActive;
		if (lastActive > this.heartbeat) {
			this.close(1);
		}
	}
	initialGracePeriodCheck() {
		const source = this;
		const { initialGracePeriod } = source;
		source.initialGracePeriodTimeout = setTimeout(() => {
			const lastActive = Date.now() - source.lastActive;
			this.logInfo('Client Grace Period reached killing connection', lastActive > initialGracePeriod, source);
			if (source.state <= 1) {
				source.close(1);
			}
		}, initialGracePeriod);
	}
	clearInitialGracePeriodTimeout() {
		clearTimeout(this.initialGracePeriodTimeout);
	}
	async calculatePacketOverhead() {
		return calculatePacketOverhead(this.cipher, this.destination.connectionIdSize, this.destination, this);
	}
	attachProxyAddress = attachProxyAddress;
	send = send;
	sendAny = sendAny;
	reply = reply;
	sendEnd = sendEnd;
	end = end;
	setIntroHeader = setIntroHeader;
	setIntroFrame = setIntroFrame;
	introHeader = introHeader;
	intro = intro;
	createIntro = createIntro;
	sendIntro = sendIntro;
	extendedSynchronization = extendedSynchronization;
	extendedSynchronizationHeader = extendedSynchronizationHeader;
	sendExtendedSynchronization = sendExtendedSynchronization;
	state = null;
	randomId = randomBuffer(8);
	data = construct(Map);
	requestQueue = construct(Map);
	connectionIdSize = defaultClientConnectionIdSize;
	static type = 'serverClient';
	isServerClient = true;
	isServerEnd = true;
	initialize = initialize;
	onConnected = onConnected;
	initialGracePeriod = 1000;
	initialRealtimeGracePeriod = 2000;
}
extendClass(Client, logMethods);
extendClass(Client, eventMethods);
export async function createClient(config) {
	const client = await (new Client(config));
	client.logInfo(`Client has been created with sever connection id ${client.id}`);
	return client;
}
