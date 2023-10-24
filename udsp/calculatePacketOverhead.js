import { encode } from '#utilities/serialize';
import { assign, hasValue } from '@universalweb/acid';
const cache = {};
const maxDefaultPacketSize = 1280;
const packetInitialOverhead = 6;
export async function calculatePacketOverhead(source, assignTo) {
	const {
		cipherSuite,
		connectionIdSize
	} = source;
	const cached = cache[cipherSuite];
	if (cached) {
		assign(assignTo, cached);
		return;
	}
	const target = {};
	const encryptOverhead = cipherSuite?.encrypt?.overhead || 0;
	if (hasValue(encryptOverhead)) {
		target.encryptOverhead = encryptOverhead;
	}
	target.encryptPacketOverhead = source.encryptOverhead;
	target.packetOverhead = packetInitialOverhead + source.encryptPacketOverhead + connectionIdSize;
	target.maxPacketPayloadSize = maxDefaultPacketSize - source.packetOverhead;
	target.maxFrameSize = target.maxPacketPayloadSize - 7;
	console.log(`Max Packet Size: ${maxDefaultPacketSize} bytes`);
	console.log(`packetInitialOverhead: ${packetInitialOverhead} bytes`);
	console.log(`encryptPacketOverhead: ${source.encryptPacketOverhead} bytes`);
	console.log(`Packet Overhead: ${source.packetOverhead} bytes`);
	console.log(`connectionIdSize Overhead: ${source.connectionIdSize} bytes`);
	console.log(`Max Payload Size: ${source.maxPacketPayloadSize} bytes`);
	console.log(`Max Frame Size: ${source.maxFrameSize} bytes`);
	cache[cipherSuite] = target;
	assign(assignTo, target);
}
