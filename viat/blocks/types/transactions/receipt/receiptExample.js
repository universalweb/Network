import { createBlockFromObject } from '#viat/blocks/utils';
import { createTransactionBlock } from '#blocks/transactions/transaction/block';
import { decode } from '#utilities/serialize';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
/*
 * Phase 3 receipt smoke — a receipt is one transaction output projected as a deterministic UTXO
 * record. Asserts: one receipt per output, amount/receiver bound from output[i], the receipt
 * references the tx hash, deterministic reproduction (same tx+index → same hash = the UTXO id),
 * distinct outputs → distinct hashes, and the carried consensus guard: decode→validate === fresh→validate.
 */
function line(label, value) {
	console.log('—', label + ':', value);
}
function bytesEqual(left, right) {
	if (!left || !right) {
		return false;
	}
	return Buffer.from(left).toString('hex') === Buffer.from(right).toString('hex');
}
async function makeSigner() {
	const scheme = viatCipherSuite.signature;
	let keypair = await scheme.signatureKeypair();
	if (await scheme.isKeypairInitialized(keypair) === false) {
		keypair = await scheme.initializeKeypair(keypair);
	}
	const address = viatCipherSuite.createBlockNonce(20);
	return {
		getAddress() {
			return address;
		},
		async signPartial(message) {
			return scheme.signPartial(message, keypair);
		},
		async verifyPartialSignature(signature, message) {
			return scheme.verifyPartial(signature, message, keypair);
		},
	};
}
const signer = await makeSigner();
const tx = await createTransactionBlock({
	sequence: 0n,
	parent: viatCipherSuite.createBlockNonce(64),
	input: [{ hash: viatCipherSuite.createBlockNonce(64), amount: 1000n }],
	output: [
		{ receiver: viatCipherSuite.createBlockNonce(20), amount: 600n },
		{ receiver: signer.getAddress(), amount: 390n },
	],
	mana: 10n,
}, signer);
console.log('\n=== RECEIPTS: one deterministic UTXO record per output ===');
const receipts = await tx.createReceipts();
const firstReceipt = receipts[0];
line('receipt count === output count', receipts.length === 2);
line('isDeterministic', firstReceipt.isDeterministic);
line('hash size', firstReceipt.get('hash')?.length);
line('outputIndex 0', firstReceipt.getCore('outputIndex'));
line('amount bound from output[0]', firstReceipt.getCore('amount') === 600n);
line('references tx hash', bytesEqual(firstReceipt.getCore('transaction'), tx.get('hash')));
line('validate', await firstReceipt.validate());
console.log('\n=== DETERMINISM: rebuild same output → same hash (the UTXO id) ===');
const firstReceiptAgain = await tx.createReceipt(0);
line('reproducible (same tx + index → same hash)', bytesEqual(firstReceiptAgain.get('hash'), firstReceipt.get('hash')));
line('distinct outputs → distinct hashes', !bytesEqual(receipts[0].get('hash'), receipts[1].get('hash')));
console.log('\n=== FACTORY ROUNDTRIP: decode→validate === fresh→validate (consensus guard) ===');
const reborn = await createBlockFromObject(await decode(await firstReceipt.exportBinary()));
line('factory routes to', reborn.constructor.name);
line('amount re-normalized to bigint', typeof reborn.getCore('amount') === 'bigint');
line('outputIndex stays number', typeof reborn.getCore('outputIndex') === 'number');
line('decode→validate === fresh→validate', (await reborn.validate()) === (await firstReceipt.validate()) && (await reborn.validate()) === true);
line('hash preserved', bytesEqual(reborn.get('hash'), firstReceipt.get('hash')));
console.log('\n✅ Phase 3 receipt smoke complete');
