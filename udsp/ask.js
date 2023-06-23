import {
	promise, assign, omit,
	eachArray, stringify,
	get,
	isBuffer, isPlainObject,
	isArray, isMap, construct,
	each, hasLength,
	hasValue
} from '@universalweb/acid';
import { decode, encode } from 'msgpackr';
import {
	failed, info, msgReceived, msgSent
} from '#logs';
import { destroy } from './request/destory';
import { assembleData } from './request/assembleData';
import { Base } from './request/base';
const dataEncodingTypesChunked = /stream|file|image|string/;
const dataEncodingTypesStructured = /json|msgpack|struct|/;
/**
 * @todo Prepare Request into singular object.
 * @todo Chunk body data while adding packit number to it.
 * @todo Send all chunks (consider sending pkt1 twice).
 * @todo
 */
export class Ask extends Base {
	constructor(config) {
		super(config);
		const {
			message,
			head,
			body,
			options,
			source,
			headers,
			footer,
			sourceContext,
			isClient
		} = config;
		const thisAsk = this;
		const {
			queue,
			packetIdGenerator,
			maxPacketSize
		} = source;
		let request;
		if (message) {
			console.log('Message Ask', message);
			request = message;
		} else {
			request = {};
			if (head) {
				request.head = head;
			}
			if (body) {
				request.body = body;
			}
		}
		if (headers) {
			this.headers = headers;
		}
		if (footer) {
			this.footer = footer;
		}
		const timeStamp = Date.now();
		thisAsk.created = timeStamp;
		// sid is a Stream ID
		const streamId = packetIdGenerator.get();
		request.sid = streamId;
		this.request = request;
		this.id = streamId;
		if (options.dataEncoding) {
			this.dataEncoding = options.dataEncoding;
		}
		this.source = function() {
			return source;
		};
		const { onData, } = options;
		this.on({
			onData,
		});
		this.maxPacketSize = maxPacketSize;
		queue.set(streamId, this);
	}
	async assemble() {
		const { incomingDataEncoding } = this;
		await assembleData(this.data, this.response, incomingDataEncoding);
		console.log('Assemble', this.response.body);
		await this.accept(this);
		this.destroy();
	}
	isAsk = true;
	type = 'ask';
}
export async function ask(source) {
	return construct(Ask, omit);
}
