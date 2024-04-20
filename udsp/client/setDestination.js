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
	promise
} from '@universalweb/acid';
import { publicDomainCertificate } from '#udsp/certificate/domain';
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
			destinationCertificate
		},
		ipVersion
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
	if (ipVersion === 'udp6') {
		const record = this.certificate.findRecord('aaaa', 'universalweb.io');
		if (record) {
			setRecordInfo(destination, record);
		}
	}
	if (!destination.ip) {
		const record = this.certificate.findRecord('a', 'universalweb.io');
		if (record) {
			setRecordInfo(destination, record);
			this.ipVersion = 'udp4';
		}
	}
	if (!destination.ip) {
		console.log('No IP address found for destination was found');
		this.close();
	}
	if (!destination.port) {
		destination.port = 53;
	}
	// console.log('Destination', destination.cryptography);
}
