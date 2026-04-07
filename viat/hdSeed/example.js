import { NETWORK_NAMES, PURPOSE, SCHEME_TYPES } from './defaults/index.js';
import { HDSeed } from './index.js';
import { encode } from './utils.js';
async function runHDSeedExamples() {
	console.log('--- Initiating HDSeed Examples ---');
	// 1. Initialize and Generate Master Pools
	console.log('\n1. Creating Master HD Tree...');
	const hdTree = await HDSeed.create({
		STATE: {
			network_name: NETWORK_NAMES.VIAT,
			encrypted: false,
		},
	});
	console.log('Master Pools Generated.');
	// 2. Derive a standard Post-Quantum Seed (e.g., for ML-DSA-44 Signature)
	console.log('\n2. Deriving Standard ML-DSA-44 Seed...');
	const standardSource = {
		purpose: PURPOSE.SIGN,
		scheme: SCHEME_TYPES.ML_DSA_44,
		id: 1,
	};
	const mlDsaSeed = await hdTree.getSeed(standardSource);
	console.log(`ML-DSA-44 Seed Generated (Length: ${mlDsaSeed.length} bytes)`);
	// 3. Derive a Trapdoor Seed
	console.log('\n3. Deriving Associated Trapdoor Seed...');
	// We want a trapdoor specifically tied to the exact same derivation ID
	const trapdoorSource = {
		scheme: SCHEME_TYPES.ML_DSA_44,
		id: 1,
	};
	const trapdoorSeed = await hdTree.getTrapdoorSeed(trapdoorSource);
	console.log(`Trapdoor Seed Generated (Length: ${trapdoorSeed.length} bytes)`);
	console.log('Are standard and trapdoor seeds identical?', mlDsaSeed.toString() === trapdoorSeed.toString());
	if (mlDsaSeed.toString() === trapdoorSeed.toString()) {
		console.error('Error: Standard and trapdoor seeds should not be identical!');
	}
	// 4. Export / Import State (Simulating saving to a secure enclave)
	console.log('\n4. Testing Export / Import...');
	const exportedState = await hdTree.exportObject();
	console.log('Exported State Keys:', Object.keys(exportedState));
	const importedTree = await HDSeed.create();
	await importedTree.importObject(exportedState);
	// Prove determinism
	const replicatedSeed = await importedTree.getSeed(standardSource);
	console.log('Is deterministic derivation successful?', mlDsaSeed.toString() === replicatedSeed.toString());
	if (mlDsaSeed.toString() !== replicatedSeed.toString()) {
		console.error('Error: Deterministic derivation failed', mlDsaSeed.toString(), replicatedSeed.toString());
	}
	// 5. Zeroizing memory for security
	console.log('\n5. Zeroizing Master Pools...');
	await hdTree.zeroBuffers();
	const wipedState = await hdTree.getAll();
	// Validate that the master buffers are wiped (all zeroes)
	const isSeedZeroed = wipedState.master_seed.every((byte) => {
		return byte === 0;
	});
	console.log('Are master_seed bytes completely zeroed?', isSeedZeroed);
	const walletSeed = await hdTree.getWalletSeed(standardSource, 64);
	console.log('Wallet Seed Generated:', walletSeed);
	console.log('\n--- Examples Complete ---');
}
// Execute
runHDSeedExamples().catch(console.error);
