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
import { assembleData } from './request/assembleData.js';
import { Base } from './request/base.js';
import { bufferPacketization } from './request/bufferPacketization.js';
import { request } from '#udsp/request';
const dataEncodingTypesChunked = /stream|file|image|string/;
const dataEncodingTypesStructured = /json|msgpack|struct|/;
export class Ask extends Base {
	constructor(config, source) {
		super(config, source);
		const {
			message,
			options,
		} = config;
		const {
			queue,
			packetIdGenerator,
			maxPacketSize
		} = source;
		assign(this.request, message);
		// sid is a Stream ID
		const streamId = packetIdGenerator.get();
		this.request.sid = streamId;
		this.packetTemplate.sid = streamId;
		this.id = streamId;
		queue.set(streamId, this);
	}
	async assemble() {
		const { incomingDataEncoding } = this;
		if (this.data) {
			this.data = await assembleData(this.data, this.response, incomingDataEncoding);
			console.log('Assembled', this.data);
		}
		this.destroy();
		await this.accept(this);
	}
	async send() {
		const thisAsk = this;
		const {
			packetTemplate,
			dataEncoding,
			maxPacketSize,
			sid
		} = this;
		console.log('Reply.send', this.response);
		if (this.response.data) {
			if (!isBuffer(this.response.data)) {
				this.response.data = encode(this.response.data);
			}
			this.totalReplyDataSize = request.data?.length;
		}
		await bufferPacketization(this.request.data, sid, this.outgoingPackets, maxPacketSize, dataEncoding);
		thisAsk.sendAll();
		const awaitingResult = promise((accept) => {
			thisAsk.accept = accept;
		});
		return awaitingResult;
	}
	isAsk = true;
	type = 'ask';
}
export async function ask(source) {
	return construct(Ask, omit);
}
