import { transactionBlock } from './block';
import viatCipherSuite from '#crypto/cipherSuite/viat';
const exampleBlock = await transactionBlock({
	total: 1000n,
	// transactions going out
	output: [
		{
			amount: 500n,
			receiver: viatCipherSuite.createBlockNonce(64),
		},
		{
			amount: 500n,
			receiver: viatCipherSuite.createBlockNonce(64),
		},
	],
	inputTotal: 1000n,
	// receipt ids
	input: [
		{
			hash: viatCipherSuite.createBlockNonce(64),
			amount: 1000n,
		},
	],
	mana: 1000n,
	sequence: 0n,
});
