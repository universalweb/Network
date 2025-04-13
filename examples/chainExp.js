// Block nav experimentation
const wallets = {
	1: {
		id: 1,
		transactions: [],
	},
	2: {
		id: 2,
		transactions: [],
	}
};
const blocks = [];
/*
	Layers, Edges, Nodes, Joints, Connections, Properties, Neuron, Receptor,
	Relay, Transaction, State, Connector, Planes, Dimension, Path, Route, Grid, Mesh, Matrix, Chain, Block
	indexer
 */
function transactionBlock(sender, receiver, amount) {
	const priorBlock = wallets[sender].transactions.length ? wallets[sender].transactions.length - 1 : 0;
	const newBlock = {
		// wallet ID generated from address then part of block hash 32byte
		parent: priorBlock,
		sender,
		receiver,
		amount,
		timestamp: Date.now()
	};
	wallets[sender].transactions.push(newBlock);
	blocks.push(newBlock);
	newBlock.id = blocks.length - 1;
	return newBlock;
}
console.log(transactionBlock(1, 2, 5));
console.log(transactionBlock(2, 1, 10));
console.log(wallets);
