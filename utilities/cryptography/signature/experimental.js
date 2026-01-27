// NOTE: Testing and benchmarking file for PQ signature schemes
import dilithium65 from './dilithium65.js';
import { runBench } from '#utilities/benchmark';
import sphincs192 from './sphincs192.js';
async function createFunctions(algo, keypair) {
	const msg = Buffer.from('hello world');
	async function sign() {
		const sig = await algo.sign(msg, keypair);
		return sig;
	}
	const signature = await sign(msg);
	const api = {
		msg,
		signature,
		sign,
		async verify() {
			const valid = await algo.verify(signature, msg, keypair);
			return valid;
		},
	};
	api.verified = await api.verify();
	return api;
}
// const dil65API = await createFunctions(dilithium65, await dilithium65.signatureKeypair());
const sphincs192API = await createFunctions(sphincs192, await sphincs192.signatureKeypair());
// console.log('Dilithium65 API:', dil65API);
// console.log('SPHINCS192 API:', sphincs192API);
// Dilithium65 x 493,741 ops/sec (43 runs sampled)
// SPHINCS192 x 323,092 ops/sec (47 runs sampled)
// SPHINCS192 is ~34.5% slower than Dilithium65
// await runBench(dil65API.sign);
await runBench(sphincs192API.sign);
