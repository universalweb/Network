import { getCertificate, parseCertificate } from '#certificate';
import { uwrl } from '#udsp/UWRL';
import {
	omit,
	assign,
	construct,
	UniqID,
	isString,
	promise,
	isTrue,
	currentPath,
	hasValue,
	isUndefined,
	has,
	intersection,
	isArray
} from '@universalweb/acid';
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
	if (isString(destinationCertificate)) {
		console.log('Loading Destination Certificate', destinationCertificate);
		const certificate = await getCertificate(destinationCertificate);
		assign(destination, certificate);
	} else {
		assign(destination, destinationCertificate);
	}
	if (destination.publicKey) {
		this.hasCertificate = true;
	}
	if (!destination.publicKey) {
		console.log('No destination certificate provided.');
	}
	if (ip) {
		destination.ip = ip;
	}
	if (isArray(destination.ip)) {
		if (ipVersion === 'udp6') {
			destination.ip = destination.ip.find((item) => {
				return item.includes(':') ? item : false;
			});
		}
		if (!destination.ip) {
			destination.ip = destination.ip.find((item) => {
				return item.includes('.') ? item : false;
			});
		}
	}
	if (destination.ip.includes(':')) {
		this.ipVersion = 'udp6';
	}
	if (port) {
		destination.port = port;
	}
	if (this.destination.clientConnectionIdSize) {
		this.connectionIdSize = this.destination.clientConnectionIdSize;
	}
	if (!this.destination.connectionIdSize) {
		this.destination.connectionIdSize = 8;
	}
	// console.log('Destination', destination.cryptography);
}
