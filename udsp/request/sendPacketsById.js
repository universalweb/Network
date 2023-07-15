import { eachArray, isArray } from '@universalweb/acid';
export async function sendPacketsById(packetArray, indexes) {
	const thisReply = this;
	if (isArray(indexes)) {
		eachArray(indexes, (id) => {
			const packet = packetArray[id];
			thisReply.sendPacket(packet);
		});
	} else {
		const packet = packetArray[indexes];
		thisReply.sendPacket(packet);
	}
}
