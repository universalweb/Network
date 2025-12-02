// ZKP experiments
import crypto from 'crypto';
/**
 * --- 1. Hash function ---.
 */
function hash256(data) {
	return crypto.createHash('sha256').update(data).digest('hex');
}
/**
 * --- 2. Utilities ---.
 */
const randomBigInt = (bits = 256) => {
	return BigInt(`0x${crypto.randomBytes(bits / 8).toString('hex')}`);
};
/**
 * --- 3. Blinded commitment ---
 * Given a secret X and a blinding factor r, commit to B = X + r.
 */
function createCommitment(secretX, blindingR) {
	const B = secretX + blindingR;
	const commitment = hash256(B.toString());
	return {
		commitment,
		B,
	};
}
/**
 * --- 4. Mock proof generation ---
 * Prover knows X and r
 * Generates a proof that X != 0.
 */
function generateProof(secretX, blindingR) {
	if (secretX === 0n) {
		throw new Error('Cannot generate proof: X = 0');
	}
	// Helper variable for multiplicative inverse
	const Y = 1n / secretX; // Mock; in JS we simulate as BigInt won't do fractions
	// In practice, you'd use a finite field and proper inversion
	return {
		proofData: hash256((secretX + blindingR + 1n).toString()),
		Y,
	};
}
/**
 * --- 5. Proof verification ---
 * Verifier sees the commitment and the proof.
 */
function verifyProof(commitment, proof) {
	// Mock verification: check proofData is a string
	if (typeof proof.proofData !== 'string') {
		return false;
	}
	// In a real ZKP, algebraic circuit constraints would be checked
	return true;
}
/**
 * --- 6. Example usage ---.
 */
async function example() {
	const secretX = randomBigInt(128); // secret value
	const blindingR = randomBigInt(128); // blinding factor
	// Prover generates commitment
	const { commitment } = createCommitment(secretX, blindingR);
	console.log('Commitment C:', commitment);
	// Prover generates a "proof" that X != 0
	const proof = generateProof(secretX, blindingR);
	console.log('Proof generated:', proof.proofData);
	// Verifier checks proof
	const valid = verifyProof(commitment, proof);
	console.log('Proof valid?', valid);
	// Try cheating: X = 0
	try {
		generateProof(0n, blindingR);
	} catch (err) {
		console.log('Cheating attempt failed:', err.message);
	}
}
await example();
