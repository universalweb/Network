import fs from 'fs-extra';
import genesisWalletBlock from '#viat/blocks/genesisWallet/block';
import { getViatDirectory } from '#utilities/directory';
import { superstructure } from '#viat/superstructure/index';
import wallet from '#viat/wallet/wallet';
import walletBlock from '#viat/blocks/wallet/block';
await fs.remove(getViatDirectory());
const viatNetwork = await superstructure({
	networkName: 'mainnet',
});
async function createGenesisWallets(superstuct) {
	// Create wallets
	const teamWallet = await wallet();
	const reserveVaultWallet = await wallet();
	const originVaultWallet = await wallet();
	// Create wallet blocks
	const teamBlock = await superstuct.createWalletBlock(teamWallet);
	const reserveVaultBlock = await superstuct.createWalletBlock(reserveVaultWallet);
	const originVaultBlock = await superstuct.createWalletBlock(originVaultWallet);
	console.log('Team Wallet Block:', teamBlock.block);
	await superstuct.saveBlock(teamBlock);
	await superstuct.saveBlock(reserveVaultBlock);
	await superstuct.saveBlock(originVaultBlock);
	// Get addresses
	const teamAddress = await teamBlock.getAddress();
	const reserveVaultAddress = await reserveVaultBlock.getAddress();
	const originVaultAddress = await originVaultBlock.getAddress();
	// Create a genesis block and set each address as a separate property in its core
	const genesisWallet = await genesisWalletBlock();
	await genesisWallet.setCore('teamVault', teamAddress);
	await genesisWallet.setCore('reserveVault', reserveVaultAddress);
	await genesisWallet.setCore('originVault', originVaultAddress);
	await superstuct.setGenesisWalletBlock(genesisWallet);
}
console.log(await createGenesisWallets(viatNetwork));
