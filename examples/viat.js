// Viat FileSystem creation
// Genesis Block
// Give amount to main wallet
// Generate two wallets in the Viat network.
// Two wallets interact and send each other some amount of VIAT.
import { Wallet, wallet } from '#viat/index';
import { encode } from '#utilities/serialize';
import { toSmallestUnit } from '#viat/math/coin';
const amy = await wallet();
const mitzi = await wallet();
console.log('WALLET', amy, mitzi);
const mitziAddress = await mitzi.getAddress();
console.log('MITZI ADDRESS', mitziAddress);
// Amounts must be in the smallest unit (e.g., wei for Ethereum, satoshi for Bitcoin).
const sendAmount = toSmallestUnit(1n);
const manaAmount = 10000n;
const txBlock = await amy.createTransaction(sendAmount, mitziAddress, manaAmount);
console.log('TX BLOCK', txBlock.block);
console.log('RECEIPT BLOCK', txBlock.receipt.block);
const txBlockSize = (await encode(txBlock.block)).length;
const receiptBlockSize = (await encode(txBlock.receipt.block)).length;
console.log(txBlockSize + receiptBlockSize, 'bytes');
