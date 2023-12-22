import {
	hasValue,
	isArray,
	isFalse,
	isNumber,
} from '@universalweb/acid';
import { onData, onDataReady } from './rpc/onData.js';
import { onHead, onHeadReady } from './rpc/onHead.js';
import { onParameters, onParametersReady } from './rpc/onParameters.js';
import { onPath, onPathReady } from './rpc/onPath.js';
import { destroy } from './destory.js';
import { onEnd } from './rpc/onEnd.js';
import { onError } from './rpc/onError.js';
import { onSetup } from './rpc/onSetup.js';
import { processEvent } from '#server/processEvent';
/**
 * 0 Intro Packet.
 * 1 Setup Packet.
 * 2 Path Ready Packet.
 * 3 Path Packet.
 * 4 Parameters Ready Packet.
 * 5 Parameters Packet.
 * 6 Head Ready Packet.
 * 7 Head Packet.
 * 8 Data Ready Packet.
 * 9 Data Packet.
 * 10 End Packet.
 * 11 Error Packet.
 */
const rpcFunctions = [() => {}, onSetup, onPathReady, onParametersReady, onHeadReady, onDataReady,
	onPath, onParameters, onHead, onData, onEnd, onError];
export async function onFrame(frame, header) {
	const source = this;
	const { isAsk } = source;
	source.lastActive = Date.now();
	if (!frame) {
		console.log(frame);
		return source.destroy('No Frame in Frame -> Packet');
	}
	console.log('On Packet event frame:', frame);
	const [
		id,
		rpc,
		packetId,
		data
	] = frame;
	console.log(`onPacket Stream Id ${id}`);
	source.totalReceivedPackets++;
	if (!isNumber(rpc)) {
		source.destroy('Invalid RPC Not a Number');
		return;
	}
	if (rpc < 0 || rpc > 11) {
		source.destroy('Invalid RPC Not a valid RPC Number');
		return;
	}
	const rpcFunction = rpcFunctions[Number(rpc)];
	if (!rpcFunction) {
		source.destroy('Invalid RPC Not a Function');
		return;
	}
	rpcFunction(id, rpc, packetId, data, frame, source);
}
