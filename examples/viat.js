console.log('VIAT TEST');
// Viat FileSystem creation
// Genesis Block
// Give amount to main wallet
// Generate two wallets in the Viat network.
// Two wallets interact and send each other some amount of VIAT.
// A woman named Amy sends a transaction to her cat named Mitzi to buy treats.
// Amy embodied the best of humanity, and this demo script is dedicated to her memory 1993-2025.
import { Wallet, wallet } from '#viat/index';
import { currentPath } from '@universalweb/utilitylib';
import { encode } from '#utilities/serialize';
import { getFiles } from '#utilities/file';
import { loop } from './viatBench.js';
import { remove } from 'fs-extra';
import { runBench } from '#utilities/benchmark';
import { superstructure } from '#viat/superstructure/index';
import { toSmallestUnit } from '#viat/math/coin';
import { walletBlock } from '#blocks/wallet/block';
const viatNetwork = await superstructure({
	networkName: 'mainnet',
});
await viatNetwork.loadSystemfiles();
// await viatNetwork.remove();
// await viatNetwork.createFilesystem();
// await viatNetwork.createGenesisBlock();
// await viatNetwork.createGenesisWalletBlock();
console.log('VIAT NETWORK', viatNetwork.genesisWalletBlock.block);
// console.log('genesisBlock', viatNetwork.genesisBlock.block);
// console.log('genesisWalletBlock', viatNetwork.genesisWalletBlock.block);
console.log('VIAT NETWORK', await viatNetwork.getFullPath());
const amy = await wallet();
const mitzi = await wallet();
const txCore = {
	amount: 0n,
	receiver: await mitzi.getAddress(),
	sender: await amy.getAddress(),
	mana: 0n,
};
async function exampleTX() {
	const txBlock = await viatNetwork.createTransaction(txCore, amy);
	await viatNetwork.saveBlock(txBlock);
	// await viatNetwork.saveBlock(txBlock.receipt);
	return txBlock;
}
// const exmplTX = await exampleTX();
// console.log('txblock', exmplTX.block);
// console.log('txblock', await exmplTX.getPath());
// console.log('txblock', await exmplTX.receipt.getPath());
// await exampleTX();
// await viatNetwork.submitTransaction(await exampleTX());
// console.log('mempool', viatNetwork.mempool);
await loop(exampleTX);
// const exmplTX = await exampleTX();
// console.log('txblock', exmplTX.block);
// console.log('txblock', await exmplTX.getPath());
// console.log('txblock SAVE', await viatNetwork.saveBlock(exmplTX));
// const amyWalletBlock = await viatNetwork.createWalletBlock(amy);
// console.log(amyWalletBlock.block);
// await amyBlock.finalize();
// await amyBlock.sign(amy);
// console.log('Wallet Block', amyBlock.block);
// console.log('WALLET', amy, mitzi);
// const mitziAddress = await mitzi.getAddress();
// const amyAddress = await amy.getAddress();
// console.log('MITZI ADDRESS', mitziAddress);
// console.log('AMY ADDRESS', amyAddress);
// console.log('TX BLOCK PATH', await txBlock.getPath());
// console.log('TX BLOCK', txBlock.block);
// console.log('RECEIPT BLOCK', txBlock.receipt.block);
// const txBlockSize = (await encode(txBlock.block)).length;
// const receiptBlockSize = (await encode(txBlock.receipt.block)).length;
// console.log(txBlockSize + receiptBlockSize, 'bytes');
// await viatNetwork.saveBlock(txBlock);
// await loop(viatNetwork, amy, sendAmount, mitziAddress, manaAmount);
// console.log(await viatNetwork.readBlockFile(await viatNetwork.getBlockPath(txBlock)));
