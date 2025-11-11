import { binaryArraySearch, insertSortedBuffer } from '#blocks/audit/utils';
import { each, times } from '@universalweb/utilitylib';
import { encodeSync } from '#utilities/serialize';
import { randomBuffer } from '#crypto/utils.js';
/*
	Total amount awarded to arbiters take % of the total mined
	Give out total based on the total number of arbiter blocks submitted to unique transactions
	Distribute the total reward based on decreasing amounts from most verifications to least
	___________
	All auditors sign off on a block hash BFT agrees on a block hash
	All auditors are forced to confirm work because if they sign off on a hash without knowing it then they risk their stake
	This forces all auditors to be in sync with the network and confirm the work they are signing off on and not try and game the system
	Auditors are then rewarded based on the hash order based on the total TX hash tries they have signed off on
	__________
	Awards are distributed in the next block based on the contents of the previous audit block submitted.
	In the next block the awards are finalized by creating transactions from the system wallet which can be one TX block with many recipients.
	___________
	TX Fee must be more than minimum of Reserve + Recycle Fee + Minimum TX Fee set by network
	__________
	Take total amount of TX fee for Arbiters
		An amount of the TX fee can be set aside for auditors as well which is added to the auditor reward split.
	Take out Viat Reserve % or flat amount (1% or minimum fee amount)
	Take out Viat Recycle % to be recycled back into network
	GET arbiter block hashes closest to the TX hash that are more than TX hash in sorted order
	IF Not enough Arbiter blocks enough to qualify the TX then TX is marked invalid
	IF Current qualified arbiter list < Total qualified arbiters
		PREPEND arbiter block hashes that take place before the TX hash in sorted order up to the qualified limit
	Distribute the total reward based on decreasing amounts to each arbiter block hash in sorted order
	__________
	Any remaining amount that could not be distributed due to rounding errors is added to the recycle amount
*/
console.clear();
const amountMined = 2 ** 12;
const amountThatQualify = 10;
const amountNeededToBeQualified = 4;
const stateExample = {
	arbiters: {},
	transactions: {},
	rewards: {},
};
times(30, (index) => {
	stateExample.transactions[index] = {
		arbiters: [],
		hash: randomBuffer(10),
	};
	stateExample.arbiters[index] = {
		transactions: [],
		hash: randomBuffer(10),
	};
});
each(stateExample.transactions, (transaction, key) => {
	each(stateExample.arbiters, (arbiter, index) => {
		insertSortedBuffer(transaction.arbiters, arbiter.hash);
	});
});
function distributeReward(totalReward, recipients, decreaseFactor = null, result = {}) {
	if (!recipients || recipients.length === 0) {
		return [];
	}
	const distribution = [];
	let remaining = totalReward;
	let totalRewards = 0;
	const recipientCount = recipients.length;
	if (decreaseFactor === null) {
		// Default decreasing ratio approach
		const totalParts = recipients.reduce((sum, _, i) => {
			return sum + (i + 1);
		}, 0);
		for (let i = 0; i < recipientCount; i++) {
			const recipient = recipients[i];
			// Weight decreases as we go down the list
			const weight = recipientCount - i;
			const share = (weight / totalParts) * totalReward;
			const amount = Math.floor(share);
			console.log('Distribution step:', i, 'Share:', share, 'Amount:', amount, 'Remaining:', remaining - amount);
			if (amount <= 0) {
				break;
			}
			distribution.push({
				buffer: recipient,
				amount,
			});
			totalRewards += amount;
			remaining -= amount;
		}
	} else {
		// Geometric decrease using the provided factor
		const n = recipients.length;
		const weights = [];
		for (let i = 0; i < n; i++) {
			weights.push(decreaseFactor ** (n - i - 1));
		}
		const totalParts = weights.reduce((sum, w) => {
			return sum + w;
		}, 0);
		for (let i = 0; i < recipients.length; i++) {
			const recipient = recipients[i];
			const share = (weights[i] / totalParts) * totalReward;
			const amount = Math.floor(share);
			if (amount <= 0) {
				break;
			}
			distribution.push({
				buffer: recipient,
				amount,
			});
			remaining -= amount;
			totalRewards += amount;
		}
	}
	if (remaining) {
		console.log(`Final distribution max hit: Remaining ${remaining} added to recycle`);
		distribution.push({
			recycle: true,
			amount: remaining,
		});
	}
	result.totalRewards = totalRewards;
	result.remaining = remaining;
	result.distribution = distribution;
	console.log('Final distribution:', distribution.length, recipients.length, remaining, totalRewards);
	return distribution;
}
function computeAwards(transaction, decreaseFactor = undefined) {
	const hashIndex = binaryArraySearch(transaction.arbiters, transaction.hash);
	transaction.hashIndex = hashIndex;
	if (transaction.arbiters.length < amountNeededToBeQualified) {
		transaction.awardedArbiters = [];
		transaction.invalid = true;
		transaction.error = 'Not enough arbiters to qualify';
		console.log('Not enough arbiters to qualify transaction:', transaction);
		return;
	}
	transaction.awardedArbiters = transaction.arbiters.slice(
		hashIndex + 1,
		hashIndex + 1 + amountThatQualify
	);
	if (transaction.awardedArbiters.length < amountThatQualify) {
		const needed = amountThatQualify - transaction.awardedArbiters.length;
		const startIndex = Math.max(0, hashIndex - needed);
		const list = transaction.arbiters.slice(startIndex, hashIndex);
		transaction.awardedArbiters.unshift(...list);
		console.log('Unshifted arbiters for transaction:', list);
		console.log('Needed more arbiters for transaction:', transaction, needed, startIndex, hashIndex);
		// process.exit();
	}
	if (transaction.awardedArbiters.length === 0) {
		console.log('No Awarded Arbiters for transaction:', transaction);
		// process.exit();
	}
	if (transaction.awardedArbiters.length > amountThatQualify) {
		console.log('Too many awarded arbiters for transaction:', transaction.awardedArbiters);
		// process.exit();
	}
	// console.log(transaction.awardedArbiters);
	transaction.awards = distributeReward(amountMined, transaction.awardedArbiters, decreaseFactor);
	// console.log('Transaction Awards:', transaction.awards);
	if (hashIndex < 2) {
		// console.log('Qualified', transaction);
	}
}
each(stateExample.transactions, (transaction, key) => {
	computeAwards(transaction, Math.E);
});
console.dir(stateExample, {
	depth: 8,
});
// console.log(encodeSync([1, 2]).length, Buffer.alloc(1).length);
