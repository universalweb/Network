import { askRPC, replyRPC } from './rpcCodes.js';
import { hasValue, isNotNumber, isNumber } from '@universalweb/acid';
import { isRequestRPCValid, isRequestTypeValid } from '../../rpc/isRequestRPCValid.js';
export async function onSetup(id, rpc, packetId, data, frame, source, rinfo) {
	if (source.receivedSetupPacket) {
		this.logInfo('Received Setup Packet Already RESEND ANSWER');
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
		// if (isRequestTypeValid(requestMethodRPC) === false) {
		// 	source.close();
		// 	return;
		// }
		source.method = requestMethodRPC;
	}
	this.logInfo(`Setup Packet Received HEADER SIZE:${totalIncomingHeadSize} DATA:${totalIncomingDataSize}`);
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
			this.logInfo('SKIPPED HEAD READY');
			source.sendDataReady();
		} else {
			this.logInfo('SKIPPED DATA READY');
			source.completeReceived();
		}
	} else {
		source.setState(replyRPC.onSetup);
		if (source.totalIncomingPathSize) {
			// CHECK TO SEE IF GET REQUEST BUT NO PATH THEN SET '/' as the PATH
			source.sendPathReady();
		} else if (source.totalIncomingParametersSize) {
			this.logInfo('SKIPPED PATH READY');
			source.sendParametersReady();
		} else if (source.totalIncomingHeadSize) {
			this.logInfo('SKIPPED PARAMETERS READY');
			source.sendHeadReady();
		} else if (source.totalIncomingDataSize) {
			this.logInfo('SKIPPED HEAD READY');
			source.sendDataReady();
		} else {
			this.logInfo('SKIPPED DATA READY');
			source.completeReceived();
		}
	}
}
