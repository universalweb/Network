// TODO: Cache Math Values Pre-Compute no need to do some of this per request
// TODO: Set a standard minimum packet overhead
import { assign, hasValue } from '@universalweb/utilitylib';
import { encode } from '#utilities/serialize';
const cache = {};
export const maxDefaultPacketSize = 1280;
export const packetInitialOverhead = 6;
const zero = 0;
const seven = 7;
export async function calculatePacketOverhead(cipher, connectionIdSize, assignTo, source) {
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
	source.logInfo(`Max Packet Size: ${maxDefaultPacketSize} bytes`);
	source.logInfo(`packetInitialOverhead: ${packetInitialOverhead} bytes`);
	source.logInfo(`encryption Overhead: ${target.packetOverhead} bytes`);
	source.logInfo(`Packet Overhead: ${target.packetOverhead} bytes`);
	source.logInfo(`connectionIdSize Overhead: ${connectionIdSize} bytes`);
	source.logInfo(`Max Payload Size: ${target.maxPacketPayloadSize} bytes`);
	source.logInfo(`Max Frame Size: ${target.maxFrameSize} bytes`);
	cache[cacheId] = target;
	return assign(assignTo || {}, target);
}
