import { askRPC, replyRPC } from './rpcCodes.js';
import { hasValue, isNotNumber, isNumber } from '@universalweb/acid';
import { isMethodCodeValid } from '../../isMethodCodeValid.js';
export async function onSetup(id, rpc, packetId, data, frame, source, rinfo) {
	if (source.receivedSetupPacket) {
		console.log('Received Setup Packet Already RESEND ANSWER');
		return;
	}
	source.clearSetupTimeout();
	const { isAsk } = source;
	source.totalReceivedUniquePackets++;
	source.receivedSetupPacket = true;
	let rpcMethod;
	let totalIncomingHeadSize;
	let totalIncomingDataSize;
	let totalIncomingPathSize;
	let totalIncomingParametersSize;
	if (isAsk) {
		[
			,
			,
			totalIncomingHeadSize,
			totalIncomingDataSize
		] = frame;
	} else {
		[
			,
			,
			rpcMethod,
			totalIncomingPathSize,
			totalIncomingParametersSize,
			totalIncomingHeadSize,
			totalIncomingDataSize
		] = frame;
		if (isMethodCodeValid(rpcMethod) === false) {
			source.close();
			return;
		}
		source.method = rpcMethod;
	}
	console.log(`Setup Packet Received HEADER SIZE:${totalIncomingHeadSize} DATA:${totalIncomingDataSize}`);
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
		source.setState(askRPC.onSetup);
		source.sendHeadReady();
	} else {
		source.setState(replyRPC.onSetup);
		source.sendPathReady();
	}
}
