import { hasValue } from '@universalweb/acid';
export async function calculatePacketOverhead(source) {
	const {
		maxPacketPayloadSize,
		maxPacketDataSize,
		maxPacketHeadSize,
		maxPacketPathSize,
		maxPacketParametersSize,
		cipherSuite,
		cipherSuiteName
	} = source;
	const encryptOverhead = cipherSuite?.encrypt?.overhead || 0;
	if (hasValue(encryptOverhead)) {
		source.encryptOverhead = encryptOverhead;
	}
	if (maxPacketPayloadSize) {
		if (!maxPacketDataSize) {
			source.maxPacketDataSize = maxPacketPayloadSize;
		}
		if (!maxPacketHeadSize) {
			source.maxPacketHeadSize = maxPacketPayloadSize;
		}
		if (!maxPacketParametersSize) {
			source.maxPacketParametersSize = maxPacketPayloadSize;
		}
		if (!maxPacketPathSize) {
			source.maxPacketPathSize = maxPacketPayloadSize;
		}
	} else {
		const packetInitialOverhead = 2;
		const connectionIdSize = source.clientConnectionIdSize || source.connectionIdSize;
		source.encryptPacketOverhead = source.encryptOverhead;
		source.packetOverhead = packetInitialOverhead + source.encryptPacketOverhead + connectionIdSize;
		source.maxPacketPayloadSize = source.maxPacketSize - source.packetOverhead;
		source.maxPayloadSizeSafeEstimate = source.maxPacketPayloadSize - 10;
		source.emptyPayloadOverHeadSize = 16 + 19;
		if (!maxPacketDataSize) {
			source.maxPacketDataSize = source.maxPacketPayloadSize - source.emptyPayloadOverHeadSize - 7;
		}
		if (!maxPacketHeadSize) {
			source.maxPacketHeadSize = source.maxPacketPayloadSize - source.emptyPayloadOverHeadSize;
		}
		if (!maxPacketParametersSize) {
			source.maxPacketParametersSize = source.maxPacketPayloadSize - source.emptyPayloadOverHeadSize;
		}
		if (!maxPacketPathSize) {
			source.maxPacketPathSize = source.maxPacketPayloadSize - source.emptyPayloadOverHeadSize;
		}
		console.log(`packetInitialOverhead: ${packetInitialOverhead} bytes`);
	}
	console.log(`encryptPacketOverhead: ${source.encryptPacketOverhead} bytes`);
	console.log(`Packet Overhead: ${source.packetOverhead} bytes`);
	console.log(`connectionIdSize Overhead: ${source.connectionIdSize} bytes`);
	console.log(`Max Payload Size Safe Estimate: ${source.maxPayloadSizeSafeEstimate} bytes`);
	console.log(`Max Payload Size: ${source.maxPacketPayloadSize} bytes`);
	console.log(`Max Data Size: ${source.maxPacketDataSize} bytes`);
	console.log(`Max Head Size: ${source.maxPacketHeadSize} bytes`);
	console.log(`Max Path Size: ${source.maxPacketPathSize} bytes`);
	console.log(`Max Paraneters Size: ${source.maxPacketParametersSize} bytes`);
	console.log(`Max Packet Size: ${source.maxPacketSize} bytes`);
}
