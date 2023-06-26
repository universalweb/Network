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
		const { contentType } = this;
		if (this.data) {
			this.data = await assembleData(this.data, this.response, contentType);
			console.log('Assembled', this.data);
		}
		this.destroy();
		await this.accept(this);
	}
	async send(data) {
		const thisAsk = this;
		const {
			packetTemplate,
			contentType,
			maxPacketSize,
			sid
		} = this;
		if (data) {
			this.request.data = data;
		}
		console.log('Reply.send', this.response);
		if (this.request.data) {
			if (!isBuffer(this.request.data)) {
				this.request.data = this.dataToBuffer(this.request.data);
			}
			this.totalReplyDataSize = request.data?.length;
		}
		if (this.contentType) {
			this.request.head.contentType = this.contentType;
		}
		await bufferPacketization(this.request.data, sid, this.outgoingPackets, maxPacketSize, contentType);
		const awaitingResult = promise((accept) => {
			thisAsk.accept = accept;
		});
		thisAsk.sendAll();
		return awaitingResult;
	}
	isAsk = true;
	type = 'ask';
}
export async function ask(source) {
	return construct(Ask, omit);
}
