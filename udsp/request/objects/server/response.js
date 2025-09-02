import {
	construct,
	hasValue,
	isTrue,
	jsonParse,
	noValue,
} from '@universalweb/utilitylib';
import { Base } from '../base.js';
import { UDSP_HEADERS } from '#udsp/headerCodes';
import { decode } from '#utilities/serialize';
import { objectGetSetMethods } from '../objectGetSetMethods.js';
import { statusCodes } from '#udsp/statusCodes';
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
		await this.setHeader(UDSP_HEADERS.STATUS, statusCode);
		return this.send();
	}
	async sendNotFound() {
		// Application (3), Semantic (3), Specific (2) → Resource not found
		return this.sendStatus(statusCodes.APPLICATION_NOT_FOUND);
	}
	async sendError() {
		// System (5), Semantic (2), Specific (0) → Internal error
		return this.sendStatus(statusCodes.SYSTEM_INTERNAL_ERROR);
	}
	async sendSuccess(data) {
		// 0 = OK / Success
		return this.sendStatus(statusCodes.OK, data);
	}
	async sendEmpty() {
		// 04 = No Content (success with no payload)
		return this.sendStatus(statusCodes.NO_CONTENT);
	}
}
objectGetSetMethods.attachMethods(ServerResponse);
export function serverResponseObject(source) {
	return new ServerResponse(source);
}
