import { askRPC, replyRPC } from './rpcCodes.js';
import { hasValue, isNotNumber, isNumber } from '@universalweb/acid';
import { isMethodCodeValid, isRequestMethodCodeValid } from '../../isMethodCodeValid.js';
export async function onSetup(id, rpc, packetId, data, frame, source, rinfo) {
	if (source.receivedSetupPacket) {
		console.log('Received Setup Packet Already RESEND ANSWER');
		return;
	}
	source.clearSetupTimeout();
	const { isAsk } = source;
	source.totalReceivedUniquePackets++;
	source.receivedSetupPacket = true;
	let requestMethodRPC;
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
			requestMethodRPC,
			totalIncomingPathSize,
			totalIncomingParametersSize,
			totalIncomingHeadSize,
			totalIncomingDataSize
		] = frame;
		// if (isRequestMethodCodeValid(requestMethodRPC) === false) {
		// 	source.close();
		// 	return;
		// }
		source.method = requestMethodRPC;
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
		if (source.totalIncomingHeadSize) {
			source.sendHeadReady();
		} else if (source.totalIncomingDataSize) {
			console.log('SKIPPED HEAD READY');
			source.sendDataReady();
		} else {
			console.log('SKIPPED DATA READY');
			source.completeReceived();
		}
	} else {
		source.setState(replyRPC.onSetup);
		if (source.totalIncomingPathSize) {
			// CHECK TO SEE IF GET REQUEST BUT NO PATH THEN SET '/' as the PATH
			source.sendPathReady();
		} else if (source.totalIncomingParametersSize) {
			console.log('SKIPPED PATH READY');
			source.sendParametersReady();
		} else if (source.totalIncomingHeadSize) {
			console.log('SKIPPED PARAMETERS READY');
			source.sendHeadReady();
		} else if (source.totalIncomingDataSize) {
			console.log('SKIPPED HEAD READY');
			source.sendDataReady();
		} else {
			console.log('SKIPPED DATA READY');
			source.completeReceived();
		}
	}
}
