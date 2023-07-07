import { construct, UniqID } from '@universalweb/acid';
import { actions } from './server/actions/index.js';
import { cryptography } from '#udsp/cryptography';
import dgram from 'dgram';
class UDSP {
	constructor() {
		return this.initialize();
	}
	async calculatePacketOverhead() {
		const packetOverhead = 2;
		this.encryptPacketOverhead = this.cryptography.encryptOverhead;
		this.packetOverhead = packetOverhead + this.encryptPacketOverhead + this.connectionIdSize;
		this.packetMaxPayload = this.maxPacketSize - this.packetOverhead;
		this.packetMaxPayloadSafeEstimate = this.packetMaxPayload - 10;
		console.log(`Packet Overhead: ${this.packetOverhead} bytes`);
		console.log(`connectionIdSize Overhead: ${this.connectionIdSize} bytes`);
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
