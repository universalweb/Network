// Amy & Mitzi are two wallets in the Viat network.
// They can send and receive transactions, and each has a unique address.
// Genesis Block
// Give amount to main wallet
import { Wallet, wallet } from '#viat/index';
const amy = await wallet();
const mitzi = await wallet();
console.log('WALLET', amy, mitzi);
const mitziAddress = await mitzi.getAddress();
console.log('MITZI ADDRESS', mitziAddress);
amy.send(1n, mitziAddress);
