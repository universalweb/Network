#!/usr/bin/env node
import { Command, program } from 'commander';
import { decode } from '#utilities/serialize';
import { wallet } from './wallet/wallet.js';
async function createWallet(filename, filepath, key) {
	const walletInstance = await wallet();
	// console.log(filename, filepath);
	await walletInstance.saveToFile(filename, filepath, key);
	return walletInstance;
}
program
	.description('CLI VIAT WALLET SCRIPT')
	.argument('<filename>', 'Wallet File Name')
	.argument('<filepath>', 'File Directory to save the Wallet')
	.argument('[key]', 'File Directory to save the Wallet')
	.action(async (filename, filepath, key) => {
		// Execute the function
		const result = await createWallet(filename, filepath, key);
		// console.log(await decode(await result.exportBinary()));
	});
program.addHelpText('after', `
Example Commands:
  ./createWalletCLI.js walletFilename.bin /FILE/PATH/TO/SAVE/TO
`);
program.option('-v, --verbose', 'Enable verbose output');
// Parse command-line arguments
program.parse(process.argv);
// CLI COMMAND ./createWalletCLI.js walletFilename.bin /FILE/PATH/TO/SAVE/TO
