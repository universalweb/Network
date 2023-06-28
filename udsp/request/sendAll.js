import { eachArray } from '@universalweb/acid';
export async function sendAll() {
	const thisReply = this;
	console.log('outgoingPackets', thisReply.outgoingPackets);
	eachArray(thisReply.outgoingPackets, (packet) => {
		thisReply.sendPacket({
			message: packet
		});
	});
}
