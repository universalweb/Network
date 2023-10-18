import {
	construct, UniqID, each, hasValue, assign
} from '@universalweb/acid';
import dgram from 'dgram';
import { randomConnectionId, randomBuffer } from '#crypto';
import { cipherSuites } from './cryptoMiddleware/index.js';
/* TODO
	Calculate encrypted connection ID overhead - add to existing overhead or force to specify in config the size encrypted
*/
export class UDSP {
	constructor(configuration) {
		this.cipherSuiteName = cipherSuites.version[this.version][0].name;
		this.cipherSuiteId = cipherSuites.version[this.version][0].id;
		this.cipherSuites = cipherSuites.available[this.version];
	}
	async calculatePacketOverhead() {
		const {
			maxPacketPayloadSize,
			maxPacketDataSize,
			maxPacketHeadSize,
			maxPacketPathSize,
			maxPacketParametersSize,
			cipherSuite,
			cipherSuiteName
		} = this;
		const encryptOverhead = cipherSuite?.encrypt?.overhead || 0;
		if (hasValue(encryptOverhead)) {
			this.encryptOverhead = encryptOverhead;
		}
		if (maxPacketPayloadSize) {
			if (!maxPacketDataSize) {
				this.maxPacketDataSize = maxPacketPayloadSize;
			}
			if (!maxPacketHeadSize) {
				this.maxPacketHeadSize = maxPacketPayloadSize;
			}
			if (!maxPacketParametersSize) {
				this.maxPacketParametersSize = maxPacketPayloadSize;
			}
			if (!maxPacketPathSize) {
				this.maxPacketPathSize = maxPacketPayloadSize;
			}
		} else {
			const packetInitialOverhead = 2;
			const connectionIdSize = (this.isClient) ? this.clientConnectionIdSize : this.connectionIdSize;
			this.encryptPacketOverhead = this.encryptOverhead;
			this.packetOverhead = packetInitialOverhead + this.encryptPacketOverhead + connectionIdSize;
			this.maxPacketPayloadSize = this.maxPacketSize - this.packetOverhead;
			this.maxPayloadSizeSafeEstimate = this.maxPacketPayloadSize - 10;
			this.emptyPayloadOverHeadSize = 16 + 19;
			if (!maxPacketDataSize) {
				this.maxPacketDataSize = this.maxPacketPayloadSize - this.emptyPayloadOverHeadSize - 7;
			}
			if (!maxPacketHeadSize) {
				this.maxPacketHeadSize = this.maxPacketPayloadSize - this.emptyPayloadOverHeadSize;
			}
			if (!maxPacketParametersSize) {
				this.maxPacketParametersSize = this.maxPacketPayloadSize - this.emptyPayloadOverHeadSize;
			}
			if (!maxPacketPathSize) {
				this.maxPacketPathSize = this.maxPacketPayloadSize - this.emptyPayloadOverHeadSize;
			}
			console.log(`packetInitialOverhead: ${packetInitialOverhead} bytes`);
		}
		console.log(`encryptPacketOverhead: ${this.encryptPacketOverhead} bytes`);
		console.log(`Packet Overhead: ${this.packetOverhead} bytes`);
		console.log(`connectionIdSize Overhead: ${this.connectionIdSize} bytes`);
		console.log(`Max Payload Size Safe Estimate: ${this.maxPayloadSizeSafeEstimate} bytes`);
		console.log(`Max Payload Size: ${this.maxPacketPayloadSize} bytes`);
		console.log(`Max Data Size: ${this.maxPacketDataSize} bytes`);
		console.log(`Max Head Size: ${this.maxPacketHeadSize} bytes`);
		console.log(`Max Path Size: ${this.maxPacketPathSize} bytes`);
		console.log(`Max Paraneters Size: ${this.maxPacketParametersSize} bytes`);
		console.log(`Max Packet Size: ${this.maxPacketSize} bytes`);
	}
	calculateReservedConnectionIdSize() {
		const { coreCount } = this;
		if (coreCount < 9) {
			this.reservedConnectionIdSize = 1;
		} else {
			this.reservedConnectionIdSize = 2;
		}
	}
	generateConnectionID() {
		const target = randomConnectionId(this.connectionIdSize || 8);
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
	maxPacketSize = 1280;
	connectionIdSize = 8;
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
	cachedPacketSizes = {};
}
