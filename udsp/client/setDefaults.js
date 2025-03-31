import { construct } from '@universalweb/acid';
import { defaultClientConnectionIdSize } from './defaults.js';
import { defaultServerConnectionIdSize } from '../server/defaults.js';
export async function setDefaults() {
	this.nextSession = null;
	this.serverRandomToken = null;
	this.completeSynchronization = null;
	this.awaitSynchronization = null;
	this.destination = {
		connectionIdSize: defaultServerConnectionIdSize,
		overhead: {},
		// False is smaller than an empty buffer by a singular byte
		id: false,
	};
	this.autoConnect = false;
	this.certificateChunks = [];
	this.requestQueue = construct(Map);
	this.data = construct(Map);
	this.connectionIdSize = defaultClientConnectionIdSize;
	this.ipVersion = 'udp4';
	this.readyState = 0;
	this.introAttempts = 0;
	this.latency = 100;
	this.serverIntroTimeout = 300;
	this.gracePeriod = 10000;
}
