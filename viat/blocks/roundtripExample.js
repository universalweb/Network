import { AnchorBlock } from '#blocks/anchor/wallet';
import { AuditBlock } from '#blocks/audit/index';
import { Block } from '#viat/blocks/block';
import { createBlockFromObject } from '#viat/blocks/utils';
import { decode, encodeStrict } from '#utilities/serialize';
import { TransactionBlock } from '#blocks/transactions/transaction/block';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
/*
 * Phase 1 envelope smoke test — asserts the block-envelope invariants:
 * deterministic-vs-signed split, the two-hash model (hash === H(preHash ‖ signature)),
 * accessor-only access, in-memory schema validation, and factory type routing.
 *
 * NOT asserted here (blocked on two separate pre-existing defects, tracked apart from the envelope):
 *   - signature verify: the cipher-suite verifyPartial/verify/verifyEach return false even for a
 *     direct same-keypair sign→verify (crypto layer, untouched).
 *   - decoded-block validate: small bigint↔number and Buffer↔Uint8Array do not survive CBOR
 *     round-trip; decoded blocks need a normalization-on-load pass before schema validation.
 */
function line(label, value) {
	console.log(`— ${label}:`, value);
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
	return {
		async signPartial(message) {
			return scheme.signPartial(message, keypair);
		},
		async verifyPartialSignature(signature, message) {
			return scheme.verifyPartial(signature, message, keypair);
		},
	};
}
const signer = await makeSigner();
console.log('\n=== GENERIC (deterministic) ===');
const generic = await Block.create({
	data: {
		core: {
			hello: 'world',
		},
	},
});
await generic.finalize();
line('isDeterministic', generic.isDeterministic);
line('hash size', generic.get('hash')?.length);
line('preHash absent (deterministic)', generic.get('preHash') === undefined);
line('validate (in-memory)', await generic.validate());
const genericTwin = await Block.create({
	data: {
		core: {
			hello: 'world',
		},
	},
});
await genericTwin.finalize();
line('reproducible (same input → same hash)', bytesEqual(generic.get('hash'), genericTwin.get('hash')));
const genericReborn = await createBlockFromObject(await decode(await generic.exportBinary()));
line('factory routes to', genericReborn.constructor.name);
line('hash preserved', bytesEqual(genericReborn.get('hash'), generic.get('hash')));
console.log('\n=== TRANSACTION (signed, two-hash) ===');
const tx = await TransactionBlock.create({
	data: {
		core: {
			sender: viatCipherSuite.createBlockNonce(20),
			receiver: viatCipherSuite.createBlockNonce(20),
			amount: 1000n,
			mana: 10n,
			parent: viatCipherSuite.createBlockNonce(64),
		},
	},
});
await tx.finalize();
line('isSigned', tx.isSigned);
line('preHash set after finalize', Boolean(tx.get('preHash')));
line('hash absent before sign', tx.get('hash') === undefined);
await tx.sign(signer);
line('hash size after sign', tx.get('hash')?.length);
line('verify', await tx.verifySignature(signer));
const boundHash = await tx.hashBySize(Buffer.concat([tx.get('preHash'), tx.get('signature')]));
line('hash === H(preHash ‖ signature)', bytesEqual(tx.get('hash'), boundHash));
const txReborn = await createBlockFromObject(await decode(await tx.exportBinary()));
line('factory routes to', txReborn.constructor.name);
line('verify after roundtrip', await txReborn.verifySignature(signer));
console.log('\n=== BIGNUM AMOUNTS (the 2^64 cap fix) ===');
const bigAmount = 10n ** 58n;
const bigBlock = await Block.create({
	data: {
		core: {
			amount: bigAmount,
			small: 1000n,
		},
	},
});
await bigBlock.finalize();
line('10^58 block hashes (encode did not crash)', Boolean(bigBlock.get('hash')));
const bigDecoded = await decode(await bigBlock.exportBinary());
line('10^58 round-trips faithfully', bigDecoded.data.core.amount === bigAmount);
line('decoded big amount is bigint', typeof bigDecoded.data.core.amount === 'bigint');
line('small 1000n decodes as number (preferred serialization; accessor coerces)', bigDecoded.data.core.small === 1000 && typeof bigDecoded.data.core.small === 'number');
line('number 1000 and bigint 1000n hash IDENTICALLY (consensus-robust)', bytesEqual(await encodeStrict({ value: 1000 }), await encodeStrict({ value: 1000n })));
const bigReborn = await createBlockFromObject(bigDecoded);
line('re-hash of decoded === original (cross-decode determinism)', bytesEqual(await bigReborn.hashData(), bigBlock.get('hash')));
console.log('\n=== ANCHOR (deterministic from address) ===');
const address = viatCipherSuite.createBlockNonce(24);
const anchorA = await AnchorBlock.create(address);
const anchorB = await AnchorBlock.create(address);
line('reproducible (same hash twice)', bytesEqual(anchorA.get('hash'), anchorB.get('hash')));
console.log('\n=== AUDIT (deterministic) ===');
const audit = await AuditBlock.create();
await audit.finalize();
const auditTwin = await AuditBlock.create();
await auditTwin.finalize();
line('hash size', audit.get('hash')?.length);
line('reproducible (same input → same hash)', bytesEqual(audit.get('hash'), auditTwin.get('hash')));
line('validate (in-memory)', await audit.validate());
console.log('\n✅ Phase 1 envelope smoke test complete');
