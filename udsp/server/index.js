import {
	construct,
	each,
	assign,
	UniqID,
	isFunction
} from 'Acid';
import {
	success,
	failed,
	imported,
	msgSent,
	info,
	msgReceived
} from '#logs';
import { currentPath } from '#utilities/directory';
import dgram from 'dgram';
import { on, off } from './events.js';
import { bindServer } from './bind.js';
import { emit } from './emit.js';
import { onError } from './onError.js';
import { onListen } from './onListen.js';
import { onPacket } from './onPacket.js';
import { sendPacket } from '#udsp/sendPacket';
import { actions } from './actions/index.js';
import { getCertificate } from '#certificate';
import { randomConnectionId, signKeypairToEncryptKeypair } from '#crypto';
const { seal } = Object;
/*
  * socket ID: SID
*/
export class Server {
	constructor(serverConfiguration) {
		return this.initialize(serverConfiguration);
	}
	description = 'Server';
	defaultExtension = 'js';
	port = 80;
	ip = '::1';
	realTime = true;
	gracePeriod = 30000;
	maxMTU = 1000;
	encoding = 'utf8';
	max = 1000;
	maxPayloadSize = 1000;
	serverPath = currentPath(import.meta);
	packetCount = 0;
	messageCount = 0;
	socketCount = 0;
	clientCount = 0;
	actions = construct(Map);
	stateCodeDescriptions = ['initializing', 'initialized', 'failed to initialize'];
	state = 0;
	/*
      	* A puzzle used to challenge clients to ensure authenticity, connection liveliness, and congestion control.
      	* Slow down account creation.
      	* Generate crypto currency for the Identity Registrar.
    */
	puzzleFlag = false;
	/*
		* IPv6 preferred.
	*/
	ipVersion = 'udp6';
	/*
		* All created clients (clients) represent a client to server bi-directional connection until it is closed by either party.
	*/
	// clients are referred to as clients
	clients = construct(Map);
	clientEvents = construct(Map);
	events = construct(Map);
	streamIdGenerator = construct(UniqID);
	// default file extension default is .js but WWW default is www
	async initialize(configuration) {
		console.log('-------SERVER INITIALIZING-------');
		const thisServer = this;
		thisServer.configuration = seal(assign({}, configuration));
		console.log(thisServer.configuration);
		assign(thisServer, thisServer.configuration);
		thisServer.server = dgram.createSocket(thisServer.ipVersion);
		const server = thisServer.server;
		thisServer.bindMethods({
			on,
			bindServer,
			onError,
			onListen,
			onPacket,
			off,
			emit
		});
		thisServer.bindActions(actions);
		if (thisServer.certificate) {
			thisServer.certificate = await getCertificate(thisServer.certificate);
			thisServer.publicCertificate = thisServer.certificate.certificateDecoded;
			thisServer.keypair = {
				publicKey: thisServer.certificate.publicKey,
				privateKey: thisServer.certificate.privateKey,
			};
		}
		if (thisServer.keypair) {
			thisServer.encryptKeypair = signKeypairToEncryptKeypair(thisServer.keypair);
		}
		if (thisServer.connectionIdCertificate) {
			thisServer.connectionIdCertificate = await getCertificate(thisServer.connectionIdCertificate);
		} else if (thisServer.publicCertificate.encryptConnectionId) {
			thisServer.connectionIdKeypair = thisServer.certificate;
		}
		if (thisServer.connectionIdKeypair) {
			thisServer.encryptConnectionId = true;
			thisServer.connectionIdKeypair = {
				publicKey: thisServer.connectionIdKeypair.publicKey,
				privateKey: thisServer.connectionIdKeypair.privateKey,
			};
		}
		if (configuration.randomId || !thisServer.id) {
			thisServer.id = randomConnectionId(4);
		}
		if (isFunction(thisServer.id)) {
			thisServer.id = await thisServer.id();
		}
		if (thisServer.publicCertificate) {
			const {
				ip: certIp,
				port: certPort
			} = thisServer.publicCertificate;
			const port = configuration.port || certPort;
			const ip = configuration.ip || certIp;
			console.log(thisServer.certificate, ip, port);
			this.ip = ip;
			this.port = port;
		}
		thisServer.server.on('error', thisServer.onError);
		thisServer.server.on('listening', thisServer.onListen);
		thisServer.server.on('message', thisServer.onPacket);
		await thisServer.bindServer();
		process.on('beforeExit', (code) => {
			server.close();
		});
		process.on('exit', (code) => {
			server.close();
		});
		thisServer.send = async function(packetConfig) {
			packetConfig.server = thisServer;
			packetConfig.isServer = true;
			if (!packetConfig.encryptKeypair) {
				packetConfig.encryptKeypair = thisServer.encryptKeypair;
			}
			return sendPacket(packetConfig, server);
		};
		console.log('-------SERVER INITIALIZED-------');
		return thisServer;
	}
	bindMethods(methods) {
		const thisServer = this;
		each(methods, (method, methodName) => {
			thisServer[methodName] = method.bind(thisServer);
		});
	}
	bindActions(methods) {
		const thisServer = this;
		each(methods, (method, methodName) => {
			thisServer.actions.set(methodName, method.bind(thisServer));
		});
	}
	setClientEvent(eventName, callback) {
		this.clientEvents.set(eventName, callback);
	}
	clientEvent(eventName, client) {
		success(`Client Client Event: ${eventName} -> SocketID: ${client.id}`);
		const foundEvent = this.clientEvents.get(eventName);
		if (foundEvent) {
			foundEvent(this, client);
		}
	}
}
export async function createServer(...args) {
	return construct(Server, args);
}
