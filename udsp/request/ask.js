/*
	* Client side request
	* Client sends a request to the server & awaits a response if there is one
*/
import {
	UniqID,
	assign,
	construct,
	each,
	eachArray,
	get,
	hasLength,
	hasValue,
	isArray,
	isBuffer,
	isMap,
	isPlainObject,
	omit,
	promise,
	stringify
} from '@universalweb/acid';
import { askRPC, replyRPC } from './rpc/rpcCodes.js';
import { decode, encode } from '#utilities/serialize';
import {
	failed,
	info,
	msgReceived,
	msgSent
} from '#logs';
import { Base } from './base.js';
import { clientRequestObject } from './objects/client/request.js';
import { clientResponseObject } from './objects/client/response.js';
import { getMethodId } from '../methods/index.js';
import { objectGetSetMethods } from './objects/objectGetSetMethods.js';
export class Ask extends Base {
	constructor(method = 0, path, parameters, data, head, options = {}, source) {
		super(source);
		const {
			requestQueue,
			streamIdGenerator,
			destination
		} = source;
		console.log('Ask', path);
		const id = streamIdGenerator.get();
		this.id = id;
		this.method = getMethodId(method);
		if (parameters) {
			this.parameters = parameters;
		}
		if (path) {
			this.path = path;
		}
		this.maxFrameSize = destination.maxFrameSize;
		const requestObject = {
			source: this
		};
		if (data) {
			requestObject.data = data;
		}
		if (head) {
			requestObject.head = head;
		}
		this.request = clientRequestObject(requestObject);
		this.response = clientResponseObject({
			source: this,
		});
		requestQueue.set(id, this);
	}
	completeReceived() {
		console.log('Ask complete', this);
		this.setState(askRPC.received);
		this.clearSendDataReadyTimeout();
		this.sendEnd();
		this.end();
		this.readyState = 4;
		this.flush();
		this.accept(this.response);
	}
	isAsk = true;
	static type = 'ask';
}
export async function ask(source) {
	return construct(Ask, source);
}
