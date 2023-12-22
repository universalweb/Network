import { hasValue, isNotNumber, isNumber } from '@universalweb/acid';
export async function onSetup(id, rpc, packetId, data, frame, source) {
	if (source.receivedSetupPacket) {
		return;
	}
	const { isAsk } = source;
	source.totalReceivedUniquePackets++;
	source.receivedSetupPacket = true;
	let method;
	let totalIncomingHeadSize;
	let totalIncomingDataSize;
	let totalIncomingPathSize;
	let totalIncomingParametersSize;
	if (isAsk) {
		[, , totalIncomingHeadSize, totalIncomingDataSize] = frame;
	} else {
		[, , method = 0, totalIncomingPathSize, totalIncomingParametersSize, totalIncomingHeadSize, totalIncomingDataSize] = frame;
		if (isNotNumber(method) || method < 0 || method > 10) {
			source.close();
			return;
		}
		source.method = method;
	}
	console.log(`Setup Packet Received HEADER:${totalIncomingHeadSize} DATA:${totalIncomingDataSize}`);
	if (hasValue(totalIncomingPathSize) && isNumber(totalIncomingPathSize)) {
		source.totalIncomingPathSize = totalIncomingPathSize;
	}
	if (hasValue(totalIncomingParametersSize) && isNumber(totalIncomingParametersSize)) {
		source.totalIncomingParametersSize = totalIncomingParametersSize;
	}
	if (hasValue(totalIncomingHeadSize) && isNumber(totalIncomingHeadSize)) {
		source.totalIncomingHeadSize = totalIncomingHeadSize;
	}
	if (hasValue(totalIncomingDataSize) && isNumber(totalIncomingDataSize)) {
		source.totalIncomingDataSize = totalIncomingDataSize;
	}
	if (isAsk) {
		source.sendHeadReady();
	} else {
		source.sendPathReady();
	}
}
