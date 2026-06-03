import { createTransactionBlock } from './block.js';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
import wallet from '#viat/wallet/wallet';
const senderWallet = await wallet();
const exampleBlock = await createTransactionBlock({
	sender: viatCipherSuite.createBlockNonce(20),
	receiver: viatCipherSuite.createBlockNonce(20),
	amount: 1000n,
	mana: 10n,
	parent: viatCipherSuite.createBlockNonce(64),
}, senderWallet);
console.log('Transaction Block', exampleBlock.block);
console.log('preHash size', exampleBlock.get('preHash')?.length);
console.log('hash size', exampleBlock.get('hash')?.length);
console.log('signature verified', await exampleBlock.verifySignature(senderWallet));
console.log('getDirectory', await exampleBlock.getDirectory());
console.log('getFile', await exampleBlock.getFile());
await exampleBlock.setReceipt();
await exampleBlock.receipt.finalize();
console.log('receipt', exampleBlock.receipt.block);
