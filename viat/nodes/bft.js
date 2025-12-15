import * as bft from '#viat/consensus/math';
import { each, times } from '@universalweb/utilitylib';
import { Arbiter } from '#viat/nodes/miners/arbiter/index';
import { Auditor } from '#viat/nodes/miners/auditor/index';
import { encodeSync } from '#utilities/serialize';
import { hash256 } from '#crypto/hash/shake.js';
import { randomBuffer } from '#crypto/utils.js';
const numTransactions = 10;
const state = {
	arbiters: {},
	auditors: {},
	transactions: {},
};
times(1, (index) => {
	const id = hash256(randomBuffer(32)).toString('hex');
	state.transactions[id] = {
		id,
		amount: BigInt(1000 + index),
		fee: BigInt(10 + index),
	};
});
times(10, (index) => {
	state.arbiters[index] = new Arbiter({
		id: index,
	});
});
times(5, (index) => {
	state.auditors[index] = new Auditor({
		id: index,
	});
});
function processBlock(block) {
	each(state.arbiters, async (arbiter) => {
		const result = await arbiter.processBlock(block);
	});
}
