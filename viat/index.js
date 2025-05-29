import { Superstructure, superstructure } from './superstructure/index.js';
import { Wallet, wallet } from './wallet/wallet.js';
import { transactionBlock } from './blocks/transaction/block.js';
// const example = await wallet();
// await example.generateAddress();
// const exampleBlock = await transactionBlock({
// 	amount: 1000n,
// 	receiver: example.address,
// 	sender: example.address,
// 	mana: 1000n,
// 	sequence: 0n
// });
// await exampleBlock.signFull(example);
// console.log('Wallet Example:', exampleBlock.block);
// console.log(await exampleBlock.verifyFullSignature(example));
export {
	Wallet, wallet, Superstructure, superstructure
};
