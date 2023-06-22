import { eachArray } from '@universalweb/acid';
export async function sendOutgoing() {
	const thisReply = this;
	console.log('outgoingPackets', thisReply.outgoingPackets.length);
	eachArray(thisReply.outgoingPackets, (packet) => {
		thisReply.sendPacket({
			message: packet
		});
	});
}
