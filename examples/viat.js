// Viat FileSystem creation
// Genesis Block
// Give amount to main wallet
// Generate two wallets in the Viat network.
// Two wallets interact and send each other some amount of VIAT.
import { Wallet, wallet } from '#viat/index';
const amy = await wallet();
const mitzi = await wallet();
console.log('WALLET', amy, mitzi);
const mitziAddress = await mitzi.getAddress();
console.log('MITZI ADDRESS', mitziAddress);
amy.send(1n, mitziAddress);
