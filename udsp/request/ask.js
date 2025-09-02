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
	stringify,
} from '@universalweb/utilitylib';
import { askRPC, replyRPC } from './rpc/rpcCodes.js';
import { decode, encode } from '#utilities/serialize';
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
			destination,
		} = source;
		this.logInfo('Ask', path);
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
			source: this,
		};
		if (data) {
			requestObject.data = data;
		}
		if (head) {
			requestObject.head = head;
		}
		this.request = clientRequestObject(requestObject);
		// TODO: CONSIDER NOT USING SOURCE?
		this.response = clientResponseObject({
			source: this,
		});
		requestQueue.set(id, this);
	}
	async completeReceived() {
		this.logInfo('Ask complete', this.id);
		await this.setState(askRPC.received);
		await this.clearSendDataReadyTimeout();
		await this.sendEnd();
		await this.end();
		this.readyState = 4;
		await this.flush();
		this.accept(this.response);
	}
	isAsk = true;
	static type = 'ask';
}
export async function ask(...sources) {
	// console.log('Ask', sources);
	return new Ask(...sources);
}
