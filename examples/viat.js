// Viat FileSystem creation
// Genesis Block
// Give amount to main wallet
// Generate two wallets in the Viat network.
// Two wallets interact and send each other some amount of VIAT.
// A woman named Amy sends a transaction to her cat named Mitzi to buy treats.
// Amy embodied the best of humanity, and this demo script is dedicated to her memory 1993-2025.
import { Wallet, wallet } from '#viat/index';
import { currentPath } from '@universalweb/Acid';
import { encode } from '#utilities/serialize';
import { getFiles } from '#utilities/file';
import { remove } from 'fs-extra';
import { superstructure } from '#viat/superstructure/index';
import { toSmallestUnit } from '#viat/math/coin';
import { walletBlock } from '#viat/blocks/wallet/block';
const viatNetwork = await superstructure({
	networkName: 'mainnet',
});
await viatNetwork.remove();
console.log('VIAT NETWORK', viatNetwork);
console.log('VIAT NETWORK', await viatNetwork.getFullPath());
const amy = await wallet();
const mitzi = await wallet();
const amyBlock = await walletBlock(amy);
await amyBlock.finalize();
await amyBlock.sign(amy);
// console.log('Wallet Block', amyBlock.block);
// // console.log('WALLET', amy, mitzi);
const mitziAddress = await mitzi.getAddress();
const amyAddress = await amy.getAddress();
console.log('MITZI ADDRESS', mitziAddress);
console.log('AMY ADDRESS', amyAddress);
// Amounts must be in the smallest unit (e.g., wei for Ethereum, satoshi for Bitcoin).
const sendAmount = toSmallestUnit(1n);
// In smallest amount
const manaAmount = 10000n;
const txBlock = await viatNetwork.createTransaction(amy, sendAmount, mitziAddress, manaAmount);
console.log('TX BLOCK PATH', await txBlock.getPath());
console.log('TX BLOCK', txBlock.block);
console.log('RECEIPT BLOCK', txBlock.receipt.block);
const txBlockSize = (await encode(txBlock.block)).length;
const receiptBlockSize = (await encode(txBlock.receipt.block)).length;
console.log(txBlockSize + receiptBlockSize, 'bytes');
await viatNetwork.saveBlock(txBlock);
console.log(await viatNetwork.getAddressTransactions(amyAddress));
