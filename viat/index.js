import { Superstructure, superstructure } from './superstructure/index.js';
import { Wallet, wallet } from './wallet/wallet.js';
import { transactionBlock } from './blocks/transaction/block.js';
// const sender = await wallet();
// const receiver = await wallet();
// await sender.generateAddress();
// const exampleBlock = await transactionBlock({
// 	amount: 1000n,
// 	receiver: receiver.address,
// 	sender: sender.address,
// 	mana: 1000n,
// 	sequence: 0n
// });
// await exampleBlock.signFull(sender);
// console.log('Wallet Example:', exampleBlock.block);
// console.log(await exampleBlock.verifyFullSignature(sender));
export {
	Wallet, wallet, Superstructure, superstructure
};
