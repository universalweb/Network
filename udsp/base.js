import {
	UniqID,
	assign,
	construct,
	each,
	hasValue
} from '@universalweb/acid';
import { randomBuffer, toBase64 } from '#crypto';
import { calculatePacketOverhead } from './calculatePacketOverhead.js';
import { cipherSuites } from '../cryptoMiddleware/index.js';
import { currentVersion } from '../defaults.js';
import dgram from 'dgram';
import { randomConnectionId } from './connectionId.js';
export class UDSP {
	initializeBase(options) {
		this.state = 0;
		/*
      	* A puzzle used to challenge clients to ensure authenticity, connection liveliness, and congestion control.
      	* Slow down account creation.
      	* Generate viat or do some sort of computational work.
    */
		this.puzzleFlag = false;
		/*
		* IPv6 enforced
	*/
		this.ipVersion = 'udp6';
		this.events = construct(Map);
		this.streamIdGenerator = construct(UniqID);
		// Eventually make this like .js or something in-between of JS/HTML/CSS maybe single modular files or ones that are similar to JSX
		this.defaultExtension = 'html';
		this.packetCount = 0;
		this.dataPacketCount = 0;
		this.headPacketCount = 0;
		this.maxPacketFlood = 0;
		this.heapSize = 0;
		this.randomId = randomBuffer(8);
		this.version = currentVersion;
	}
	generateConnectionID(size) {
		const target = randomConnectionId(size || this.connectionIdSize || 8);
		return target;
	}
	async setupSocket() {
		const source = this;
		const ipVersion = this.ipVersion;
		const socket = dgram.createSocket(ipVersion);
		this.socket = socket;
		// Make sure there is as graceful as possible shutdown
		process.on('beforeExit', (code) => {
			console.log('Before Exit', code);
			source.fire(source.events, 'socket.error', this);
		});
	}
	addMethod(methods) {
		const thisContext = this;
		each(methods, (method, methodName) => {
			thisContext[methodName] = method.bind(thisContext);
		});
		return this;
	}
	stateCodeDescriptions = [
		'initializing',
		'initialized',
		'failed to initialize'
	];
}
