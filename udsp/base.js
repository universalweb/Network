import {
	UniqID,
	assign,
	construct,
	each,
	hasValue
} from '@universalweb/acid';
import { currentVersion, stateCodeDescriptions } from '../defaults.js';
import {
	logError,
	logInfo,
	logSuccess,
	logVerbose,
	logWarning
} from '#utilities/classLogMethods';
import { randomBuffer, toBase64 } from '#utilities/cryptography/utils';
import { calculatePacketOverhead } from './calculatePacketOverhead.js';
import dgram from 'dgram';
import { randomConnectionId } from './connectionId.js';
export class UDSP {
	initializeBase(options) {
		if (options.logLevel) {
			this.logLevel = options.logLevel;
		}
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
		// TODO: CHANGE TO A BINARY FORMAT UNIQUE ID GENERATOR FOR SMALLER PACKET SIZE
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
			source.logInfo('Before Exit', code);
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
	stateCodeDescriptions = stateCodeDescriptions;
	logError = logError;
	logWarning = logWarning;
	logInfo = logInfo;
	logVerbose = logVerbose;
	logSuccess = logSuccess;
}
