import { construct, UniqID } from '@universalweb/acid';
import { actions } from './server/actions/index.js';
import { cryptography } from '#udsp/cryptography';
import dgram from 'dgram';
import { randomConnectionId, randomBuffer } from '#crypto';
export class UDSP {
	async calculatePacketOverhead() {
		const {
			connectionIdSize,
			maxPayloadSize,
			maxDataSize,
			maxHeadSize,
			maxPathSize,
			maxParametersSize
		} = this;
		if (maxPayloadSize) {
			if (!maxDataSize) {
				this.maxDataSize = maxPayloadSize;
			}
			if (!maxHeadSize) {
				this.maxHeadSize = maxPayloadSize;
			}
			if (!maxParametersSize) {
				this.maxParametersSize = maxPayloadSize;
			}
			if (!maxPathSize) {
				this.maxPathSize = maxPayloadSize;
			}
		} else {
			const packetInitialOverhead = 2;
			this.encryptPacketOverhead = this.cryptography.encryptOverhead;
			this.packetOverhead = packetInitialOverhead + this.encryptPacketOverhead + this.connectionIdSize;
			this.maxPayloadSize = this.maxPacketSize - this.packetOverhead;
			this.maxPayloadSizeSafeEstimate = this.maxPayloadSize - 10;
			this.emptyPayloadOverHeadSize = 16;
			if (!maxDataSize) {
				this.maxDataSize = this.maxPayloadSize - this.emptyPayloadOverHeadSize;
			}
			if (!maxHeadSize) {
				this.maxHeadSize = this.maxPayloadSize - this.emptyPayloadOverHeadSize;
			}
			if (!maxParametersSize) {
				this.maxParametersSize = this.maxPayloadSize - this.emptyPayloadOverHeadSize;
			}
			if (!maxPathSize) {
				this.maxPathSize = this.maxPayloadSize - this.emptyPayloadOverHeadSize;
			}
			console.log(`packetInitialOverhead: ${packetInitialOverhead} bytes`);
		}
		console.log(`encryptPacketOverhead: ${this.encryptPacketOverhead} bytes`);
		console.log(`Packet Overhead: ${this.packetOverhead} bytes`);
		console.log(`connectionIdSize Overhead: ${this.connectionIdSize} bytes`);
		console.log(`Max Payload Size Safe Estimate: ${this.maxPayloadSizeSafeEstimate} bytes`);
		console.log(`Max Payload Size: ${this.maxPayloadSize} bytes`);
		console.log(`Max Data Size: ${this.maxDataSize} bytes`);
		console.log(`Max Head Size: ${this.maxHeadSize} bytes`);
		console.log(`Max Path Size: ${this.maxPathSize} bytes`);
		console.log(`Max Paraneters Size: ${this.maxParametersSize} bytes`);
		console.log(`Max Packet Size: ${this.maxPacketSize} bytes`);
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
	connectionGracePeriod = 30000;
	maxPacketSize = 1280;
	connectionIdSize = 8;
	actions = construct(Map);
	stateCodeDescriptions = ['initializing', 'initialized', 'failed to initialize'];
	state = 0;
	/*
      	* A puzzle used to challenge clients to ensure authenticity, connection liveliness, and congestion control.
      	* Slow down account creation.
      	* Generate viat or do some sort of computational work.
    */
	puzzleFlag = false;
	/*
		* IPv6 preferred.
	*/
	ipVersion = 'udp6';
	events = construct(Map);
	streamIdGenerator = construct(UniqID);
	defaultExtension = 'js';
	packetCount = 0;
	dataPacketCount = 0;
	headPacketCount = 0;
	maxPacketFlood = 0;
	heapSize = 0;
	throttle = false;
	debounce = false;
	randomId = randomBuffer(8);
}
