// Block nav experimentation
const wallets = {
	1: {
		id: 1,
		in: [],
		out: [],
	},
	2: {
		id: 2,
		in: [],
		out: [],
	}
};
const blocks = [];
function sendBlock(sender, receiver, amount) {
	const priorSenderBlock = wallets[sender].out.length ? wallets[sender].out.length - 1 : 0;
	const priorReceiverBlock = wallets[receiver].in.length ? wallets[receiver].in.length - 1 : 0;
	const newBlock = {
		// wallet ID generated from address then part of block hash 32byte
		senderLastBlockId: priorSenderBlock,
		receiverLastBlockId: priorReceiverBlock,
		sender,
		receiver,
		amount,
		timestamp: Date.now()
	};
	wallets[sender].out.push(newBlock);
	wallets[receiver].in.push(newBlock);
	blocks.push(newBlock);
	newBlock.id = blocks.length - 1;
	return newBlock;
}
console.log(sendBlock(1, 2, 5));
console.log(sendBlock(2, 1, 10));
console.log(wallets);
