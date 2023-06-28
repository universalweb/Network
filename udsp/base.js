import { construct, UniqID } from '@universalweb/acid';
import { actions } from './server/actions/index.js';
class UDSP {
	constructor() {
		return this.initialize();
	}
	async initialize() {
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
      	* Generate crypto currency or compute work.
    */
	puzzleFlag = false;
	/*
		* IPv6 preferred.
	*/
	ipVersion = 'udp6';
	events = construct(Map);
	streamIdGenerator = construct(UniqID);
}
