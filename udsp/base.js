import {
	UniqID,
	assign,
	construct,
	each,
	hasValue
} from '@universalweb/acid';
import { randomBuffer, randomConnectionId, toBase64 } from '#crypto';
import { calculatePacketOverhead } from './calculatePacketOverhead.js';
import { cipherSuites } from './cryptoMiddleware/index.js';
import dgram from 'dgram';
export class UDSP {
	constructor(options) {
		this.cipherSuiteName = cipherSuites.version[this.version][0].name;
		this.cipherSuiteId = cipherSuites.version[this.version][0].id;
		this.cipherSuites = cipherSuites.available[this.version];
	}
	generateConnectionID(size) {
		const target = randomConnectionId(size || this.connectionIdSize || 8);
		return target;
	}
	async setupSocket() {
		const ipVersion = this.ipVersion;
		const socket = dgram.createSocket(ipVersion);
		this.socket = socket;
		// Make sure there is as graceful as possible shutdown
		process.on('beforeExit', (code) => {
			console.log('Before Exit', code);
		});
	}
	addMethod(methods) {
		const thisContext = this;
		each(methods, (method, methodName) => {
			thisContext[methodName] = method.bind(thisContext);
		});
		return this;
	}
	connectionGracePeriod = 30000;
	stateCodeDescriptions = ['initializing', 'initialized', 'failed to initialize'];
	state = 0;
	/*
      	* A puzzle used to challenge clients to ensure authenticity, connection liveliness, and congestion control.
      	* Slow down account creation.
      	* Generate viat or do some sort of computational work.
    */
	puzzleFlag = false;
	/*
		* IPv6 enforced
	*/
	ipVersion = 'udp6';
	events = construct(Map);
	streamIdGenerator = construct(UniqID);
	// Eventually make this like .js or something in-between of JS/HTML/CSS maybe single modular files or ones that are similar to JSX
	defaultExtension = 'html';
	packetCount = 0;
	dataPacketCount = 0;
	headPacketCount = 0;
	maxPacketFlood = 0;
	heapSize = 0;
	throttle = false;
	debounce = false;
	randomId = randomBuffer(8);
	version = 1;
}
