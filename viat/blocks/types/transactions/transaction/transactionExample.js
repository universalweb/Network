import { createBlockFromObject } from '#viat/blocks/utils';
import { createTransactionBlock } from './block.js';
import { decode } from '#utilities/serialize';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
/*
 * Phase 2 transaction UTX smoke — asserts the sweep-and-condense invariants:
 * input[]/output[] shape, the three conservation checks (inputTotal === Σin, total === Σout,
 * inputTotal === total + mana), strict-schema validation, sign/verify, a 10^58 amount inside the
 * arrays, and that a decoded block re-normalizes its amounts to bigint and still validates + verifies.
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
console.log('\n=== TRANSACTION UTX (sweep two receipts, condense to recipient + change) ===');
const tx = await createTransactionBlock({
	sequence: 0n,
	parent: viatCipherSuite.createBlockNonce(64),
	input: [
		{ hash: viatCipherSuite.createBlockNonce(64), amount: 1000n },
		{ hash: viatCipherSuite.createBlockNonce(64), amount: 500n },
	],
	output: [
		{ receiver: viatCipherSuite.createBlockNonce(20), amount: 900n },
		{ receiver: signer.getAddress(), amount: 590n },
	],
	mana: 10n,
}, signer);
line('isSigned', tx.isSigned);
line('hash size after sign', tx.get('hash')?.length);
line('inputTotal (derived)', tx.getCore('inputTotal'));
line('total (derived)', tx.getCore('total'));
line('conservation inputTotal === total + mana', tx.getCore('inputTotal') === tx.getCore('total') + tx.getCore('mana'));
line('validate (schema + conservation)', await tx.validate());
line('verify', await tx.verifySignature(signer));
console.log('\n=== CONSERVATION REJECTS A BAD TX (mana left uncovered) ===');
const badTx = await createTransactionBlock({
	sequence: 0n,
	parent: viatCipherSuite.createBlockNonce(64),
	input: [{ hash: viatCipherSuite.createBlockNonce(64), amount: 1000n }],
	output: [{ receiver: viatCipherSuite.createBlockNonce(20), amount: 1000n }],
	mana: 10n,
}, signer);
line('inputTotal(1000) !== total(1000) + mana(10) → validate is false', await badTx.validate() === false);
console.log('\n=== BIGNUM AMOUNTS IN UTX ARRAYS (10^58) ===');
const bigUnit = 10n ** 58n;
const bigTx = await createTransactionBlock({
	sequence: 0n,
	parent: viatCipherSuite.createBlockNonce(64),
	input: [{ hash: viatCipherSuite.createBlockNonce(64), amount: bigUnit }],
	output: [{ receiver: viatCipherSuite.createBlockNonce(20), amount: bigUnit - 10n }],
	mana: 10n,
}, signer);
line('10^58 tx validates (conservation holds at scale)', await bigTx.validate());
line('verify', await bigTx.verifySignature(signer));
console.log('\n=== SCHEMA REJECTS INPUT-COUNT BOUNDARY VIOLATIONS ===');
const zeroInputTx = await createTransactionBlock({
	sequence: 0n,
	parent: viatCipherSuite.createBlockNonce(64),
	input: [],
	output: [{ receiver: viatCipherSuite.createBlockNonce(20), amount: 1000n }],
	mana: 10n,
}, signer);
line('0-input tx rejected (enforces no mint via TransactionBlock)', await zeroInputTx.validate() === false);
const tooManyInputs = Array.from({ length: 17 }, () => {
	return { hash: viatCipherSuite.createBlockNonce(64), amount: 1n };
});
const overInputTx = await createTransactionBlock({
	sequence: 0n,
	parent: viatCipherSuite.createBlockNonce(64),
	input: tooManyInputs,
	output: [{ receiver: viatCipherSuite.createBlockNonce(20), amount: 16n }],
	mana: 1n,
}, signer);
line('17-input tx rejected (exceeds MAX_TRANSACTION_INPUTS=16; conservation itself holds)', await overInputTx.validate() === false);
console.log('\n=== FACTORY ROUNDTRIP + RE-NORMALIZE + RE-VERIFY ===');
const reborn = await createBlockFromObject(await decode(await tx.exportBinary()));
line('factory routes to', reborn.constructor.name);
line('decoded amounts re-normalized to bigint', typeof reborn.getCore('inputTotal') === 'bigint' && typeof reborn.getCore('input')[0].amount === 'bigint');
line('re-validate (schema + conservation)', await reborn.validate());
line('verify after roundtrip', await reborn.verifySignature(signer));
line('hash preserved', bytesEqual(reborn.get('hash'), tx.get('hash')));
console.log('\n✅ Phase 2 transaction UTX smoke complete');
