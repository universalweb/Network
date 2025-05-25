import {
	hasValue,
	isArray,
	isFalse,
	isNumber,
	isUndefined,
} from '@universalweb/acid';
import { onData, onDataReady } from '../rpc/onData.js';
import { onHead, onHeadReady } from '../rpc/onHead.js';
import { onParameters, onParametersReady } from '../rpc/onParameters.js';
import { onPath, onPathReady } from '../rpc/onPath.js';
import { destroy } from '../destroy.js';
import { isRequestRPCValid } from '../../rpc/isRequestRPCValid.js';
import { onEnd } from '../rpc/onEnd.js';
import { onError } from '../rpc/onError.js';
import { onSetup } from '../rpc/onSetup.js';
/**
 * 0 Setup Packet.
 * 1 Path Ready Packet.
 * 2 Path Packet.
 * 3 Parameters Ready Packet.
 * 4 Parameters Packet.
 * 5 Head Ready Packet.
 * 6 Head Packet.
 * 7 Data Ready Packet.
 * 8 Data Packet.
 * 9 End Packet.
 * 10 Error Packet.
 */
const rpcFunctions = [
	onSetup,
	onPathReady,
	onPath,
	onParametersReady,
	onParameters,
	onHeadReady,
	onHead,
	onDataReady,
	onData,
	onEnd,
	onError
];
export async function onFrame(frame, header, rinfo) {
	const source = this;
	const { isAsk } = source;
	source.lastActive = Date.now();
	if (!frame) {
		this.logInfo(frame);
		return source.destroy('No Frame in Frame -> Packet');
	}
	this.logInfo('On Packet event frame:', frame);
	const [
		id,
		rpc,
		packetId,
		data,
		lastPacket
	] = frame;
	this.logInfo(`onPacket Stream Id ${id}`, this);
	if (lastPacket) {
		this.logInfo('LAST PACKET RECEIVED', frame);
	}
	if (isRequestRPCValid(rpc) === false) {
		source.destroy('Invalid RPC');
		return;
	}
	source.totalReceivedPackets++;
	const rpcFunction = rpcFunctions[rpc];
	if (!rpcFunction) {
		source.destroy('Invalid RPC Not a Function');
		return;
	}
	rpcFunction(id, rpc, packetId, data, frame, source, rinfo);
}
