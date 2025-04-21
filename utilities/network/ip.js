// IP address utilities
import { encode } from '#utilities/serialize';
import ip from 'ip';
import { isNotNumber } from '@universalweb/acid';
const ipv6Size = 16;
const ipv4Size = 4;
const ipv6HeaderSize = 40;
const ipv4HeaderSize = 20;
const udpHeaderSize = 8;
const ipv6BytesChangeAddress = 18;
const ipv4BytesChangeAddress = 6;
export function isValidIPv4(ipString) {
	return ip.isV4Format(ipString);
}
export function isValidIPv6(ipString) {
	return ip.isV6Format(ipString);
}
export function isValidIP(ipString) {
	return isValidIPv4(ipString) || isValidIPv6(ipString);
}
export function ipStringToBuffer(ipString) {
	if (!ipString) {
		return;
	}
	return ip.toBuffer(ipString);
}
export function ipBufferToString(buffer) {
	if (!buffer) {
		return;
	}
	return ip.toString(buffer);
}
export function isValidIPBuffer(buffer) {
	if (!buffer) {
		return;
	}
	return ip.isBuffer(buffer);
}
export function portNumberToBuffer(port) {
	if (isNotNumber(port)) {
		return;
	} else if (port < 0 || port > 65535) {
		// throw new RangeError('Port must be between 0 and 65535');
		return;
	}
	const target = Buffer.alloc(2);
	// Big-endian (network byte order)
	target.writeUInt16BE(port);
	return target;
}
export function bufferToPortNumber(buffer) {
	if (!buffer || buffer.length !== 2) {
		return;
	}
	return buffer.readUInt16BE();
}
export function ipv4FromBuffer(buffer) {
	if (!buffer || buffer.length < 6) {
		return;
	}
	const address = buffer.slice(0, 4);
	return ipBufferToString(address);
}
export function ipv6FromBuffer(buffer) {
	if (!buffer || buffer.length < 18) {
		return;
	}
	const address = buffer.slice(0, 16);
	return ipBufferToString(address);
}
export function portFromIPv4Buffer(buffer) {
	if (!buffer || buffer.length !== 6) {
		return;
	}
	const port = buffer.slice(4, 6);
	return bufferToPortNumber(port);
}
export function portFromIPv6Buffer(buffer) {
	if (!buffer || buffer.length !== 18) {
		return;
	}
	const port = buffer.slice(16, 18);
	return bufferToPortNumber(port);
}
export function isValidPort(port) {
	if (isNotNumber(port)) {
		return false;
	} else if (port < 0 || port > 65535) {
		return false;
	}
	return true;
}
export function getAddressStringFromBuffer(source) {
	if (!source || !source.length || source.length < 4 || source.length > 18) {
		return;
	}
	const sourceLength = source.length;
	if (sourceLength === 2) {
		return [null, bufferToPortNumber(source)];
	} else if (sourceLength === 4) {
		return [ipBufferToString(source)];
	} else if (sourceLength === 6) {
		return [ipv4FromBuffer(source), portFromIPv4Buffer(source)];
	} else if (sourceLength === 16) {
		return [ipBufferToString(source)];
	} else if (sourceLength === 18) {
		return [ipv6FromBuffer(source), portFromIPv6Buffer(source)];
	}
}
// console.log(ipStringToBuffer('::1').length);
// console.log(ipStringToBuffer('157.60.0.1').length);
// console.log(portNumberToBuffer(80).length);
// const example2 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
// const example = '::1';
// const example1 = '157.60.0.1';
// const portNumber = 65535;
// const exampleBuffer = Buffer.concat([ipStringToBuffer(example1), portNumberToBuffer(portNumber)]);
// console.log(getAddressStringFromBuffer(exampleBuffer));
// const binaryEncoded = encode(example);
// console.log(binaryEncoded.length);
// console.log(Buffer.from(example).length);
// console.log(ipBuffer(example).length);
