import {
	construct,
	hasValue,
	isTrue,
	jsonParse,
	noValue,
} from '@universalweb/utilitylib';
import { Base } from '../base.js';
import { decode } from '#utilities/serialize';
import { objectGetSetMethods } from '../objectGetSetMethods.js';
export class ServerResponse extends Base {
	// constructor(config) {
	// 	super(config);
	// }
	isResponse = true;
	isClientResponse = true;
	send(data) {
		this.sent = true;
		return this.source.send(data);
	}
	async setHeader(headerName, headerValue) {
		await this.source.setHeader(headerName, headerValue);
		return this;
	}
	async setHeaders(target) {
		await this.source.setHeaders(target);
		return this;
	}
	async sendStatus(statusCode, data) {
		await this.setHeader('status', statusCode);
		return this.send();
	}
	async sendNotFound() {
		return this.sendStatus(404);
	}
	async sendError() {
		return this.sendStatus(500);
	}
	async sendSuccess(data) {
		return this.sendStatus(200, data);
	}
	async sendEmpty() {
		return this.sendStatus(204);
	}
}
objectGetSetMethods.attachMethods(ServerResponse);
export function serverResponseObject(source) {
	return new ServerResponse(source);
}
