import {
	UniqID,
	assign,
	construct,
	each,
	extendClass,
	hasValue,
} from '@universalweb/utilitylib';
import {
	logBanner,
	logError,
	logInfo,
	logSuccess,
	logVerbose,
	logWarning,
} from '#utilities/logs/classLogMethods';
import { randomBuffer, toBase64 } from '#utilities/cryptography/utils';
import { calculatePacketOverhead } from './utilities/calculatePacketOverhead.js';
import { currentVersion } from '../defaults.js';
import dgram from 'dgram';
import eventMethods from '#udsp/events';
import { randomConnectionId } from './utilities/connectionId.js';
import { stateCodeDescriptions } from './defaults.js';
export class UDSP {
	initialize(options) {
	}
	setDefaults(options) {
		if (options.logLevel) {
			this.logLevel = options.logLevel;
		}
		this.setupEventEmitter();
		this.state = 0;
		/*
			* A puzzle used to challenge clients to ensure authenticity, connection liveliness, and congestion control.
			* VIAT POW
    	*/
		this.puzzleFlag = false;
		/*
			* IPv6 enforced
		*/
		this.ipVersion = 'udp6';
		// NOTE: CONSIDER ALTERNATIVE ID GENERATION METHODS
		this.streamIdGenerator = construct(UniqID);
		// NOTE: Eventually change to UWScript of some kind
		this.defaultExtension = 'html';
		this.packetCount = 0;
		this.dataPacketCount = 0;
		this.headPacketCount = 0;
		// TODO: IMPLEMENT A FLOOD MECHANISM
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
			source.logVerbose('Before Exit', code);
			source.emitEvent('socket.error', code);
		});
	}
	stateCodeDescriptions = stateCodeDescriptions;
	logError = logError;
	logWarning = logWarning;
	logInfo = logInfo;
	logBanner = logBanner;
	logVerbose = logVerbose;
	logSuccess = logSuccess;
}
extendClass(UDSP, eventMethods);
