// TODO: Cache Math Values Pre-Compute no need to do some of this per request
// TODO: Set a standard minimum packet overhead
import { assign, hasValue } from '@universalweb/acid';
import { encode } from '#utilities/serialize';
const cache = {};
export const maxDefaultPacketSize = 1280;
export const packetInitialOverhead = 6;
const zero = 0;
const seven = 7;
export async function calculatePacketOverhead(cipher, connectionIdSize, assignTo) {
	const cacheId = `${cipher.id}-${connectionIdSize}`;
	const cached = cache[cacheId];
	if (cached) {
		return assign(assignTo || {}, cached);
	}
	const target = {};
	const encryptOverhead = cipher?.overhead || zero;
	if (hasValue(encryptOverhead)) {
		target.encryptOverhead = encryptOverhead;
	}
	target.packetOverhead = packetInitialOverhead + encryptOverhead + connectionIdSize;
	target.maxPacketPayloadSize = maxDefaultPacketSize - target.packetOverhead;
	target.maxFrameSize = target.maxPacketPayloadSize - seven;
	console.log(`Max Packet Size: ${maxDefaultPacketSize} bytes`);
	console.log(`packetInitialOverhead: ${packetInitialOverhead} bytes`);
	console.log(`encryption Overhead: ${target.packetOverhead} bytes`);
	console.log(`Packet Overhead: ${target.packetOverhead} bytes`);
	console.log(`connectionIdSize Overhead: ${connectionIdSize} bytes`);
	console.log(`Max Payload Size: ${target.maxPacketPayloadSize} bytes`);
	console.log(`Max Frame Size: ${target.maxFrameSize} bytes`);
	cache[cacheId] = target;
	return assign(assignTo || {}, target);
}
