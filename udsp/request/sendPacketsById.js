import { eachArray, isArray } from '@universalweb/acid';
export async function sendPacketsById(indexes) {
	const thisReply = this;
	if (isArray(indexes)) {
		eachArray(indexes, (id) => {
			const message = thisReply.outgoingPackets[id];
			thisReply.sendPacket({
				message
			});
		});
	} else {
		const message = thisReply.outgoingPackets[indexes];
		thisReply.sendPacket({
			message
		});
	}
}
