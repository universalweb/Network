import { eachArray, isArray } from '@universalweb/acid';
export async function sendPacketsById(packetArray, indexes) {
	const thisReply = this;
	if (isArray(indexes)) {
		eachArray(indexes, (id) => {
			const message = packetArray[id];
			thisReply.sendPacket({
				message
			});
		});
	} else {
		const message = packetArray[indexes];
		thisReply.sendPacket({
			message
		});
	}
}
