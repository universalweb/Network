// Various optimization strategies could be used but for now will be kept this way to get a full feel of each event
export async function loop(viatNetwork, amy, sendAmount, mitziAddress, manaAmount) {
	let count = 0;
	const tim = Date.now();
	for (let i = 0; i < 5000; i++) {
		const txBlock = await viatNetwork.createTransaction(amy, sendAmount, mitziAddress, manaAmount);
		await viatNetwork.saveBlock(txBlock);
		// console.clear();
		count++;
		if (Date.now() - tim >= 1000) {
			console.log(count, Date.now() - tim);
			break;
		}
	}
}
