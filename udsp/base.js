import { construct, UniqID } from '@universalweb/acid';
import { actions } from './server/actions/index.js';
import { cryptography } from '#udsp/cryptography';
import dgram from 'dgram';
import { randomConnectionId } from '#crypto';
export class UDSP {
	async calculatePacketOverhead() {
		const {
			connectionIdSize,
			maxPayloadSize,
			maxDataSize,
			maxHeadSize
		} = this;
		if (maxPayloadSize) {
			if (!maxDataSize) {
				this.maxDataSize = maxPayloadSize;
			}
			if (!maxHeadSize) {
				this.maxHeadSize = maxPayloadSize;
			}
		} else {
			const packetInitialOverhead = 2;
			this.encryptPacketOverhead = this.cryptography.encryptOverhead;
			this.packetOverhead = packetInitialOverhead + this.encryptPacketOverhead + this.connectionIdSize;
			this.maxPayloadSize = this.maxPacketSize - this.packetOverhead;
			this.maxPayloadSizeSafeEstimate = this.maxPayloadSize - 10;
			if (!maxDataSize) {
				this.maxDataSize = this.packetMaxPayload;
			}
			if (!maxHeadSize) {
				this.maxHeadSize = this.packetMaxPayload;
			}
		}
		console.log(`Packet Overhead: ${this.packetOverhead} bytes`);
		console.log(`connectionIdSize Overhead: ${this.connectionIdSize} bytes`);
		console.log(`Max Packet Size: ${this.maxPacketSize} bytes`);
		console.log(`Max Payload Size: ${this.maxPayloadSize} bytes`);
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
			socket.close();
		});
	}
	gracePeriod = 30000;
	maxPacketSize = 1328;
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
}
