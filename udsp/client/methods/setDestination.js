import {
	UniqID,
	assign,
	construct,
	currentPath,
	has,
	hasValue,
	intersection,
	isArray,
	isString,
	isTrue,
	isUndefined,
	omit,
	promise,
} from '@universalweb/utilitylib';
import { uwrl } from '#udsp/UWRL/index';
function setRecordInfo(destination, record) {
	destination.ip = record[2];
	destination.port = record[3];
	destination.record = record;
}
export async function setDestination() {
	const {
		destination,
		options: {
			url,
			ip,
			port,
			destinationCertificate,
		},
		ipVersion,
	} = this;
	if (url) {
		const urlObject = uwrl(url);
		this.destination.uwrl = urlObject;
		if (urlObject.ip) {
			this.destination.ip = urlObject.ip;
		}
		if (urlObject.port) {
			this.destination.port = urlObject.port;
		}
	}
	if (destination.certificate) {
		if (ipVersion === 'udp6') {
			const record = await destination.certificate.findRecord('aaaa', 'universalweb.io');
			if (record) {
				setRecordInfo(destination, record);
			}
		}
		if (!destination.ip) {
			const record = await destination.certificate.findRecord('a', 'universalweb.io');
			if (record) {
				setRecordInfo(destination, record);
				this.ipVersion = 'udp4';
			}
		}
		const realtime = destination.certificate.get('realtime');
		if (hasValue(realtime)) {
			if (isUndefined(this.realtime) || realtime === true) {
				this.realtime = realtime;
			} else if (this.realtime === true && realtime === false) {
				this.realtime = false;
			}
		}
	}
	if (!destination.ip) {
		this.logInfo('No IP address found for destination');
		this.close();
		return false;
	}
	if (!destination.port) {
		destination.port = 53;
	}
}
