import {
	assign,
	currentPath,
	eachAsyncArray,
	extendClass,
} from '@universalweb/acid';
import { getFiles, readStructured } from '#utilities/file';
import { createViatFilesystem } from './createFilesystem.js';
import { decode } from '#utilities/serialize';
import filesystemMethods from './methods/filesystem.js';
import fs from 'fs-extra';
import { genesisBlock } from '../blocks/genesis/block.js';
import { getHomeDirectory } from '#utilities/directory';
import { getTransactionsPath } from '../blocks/transaction/uri.js';
import path from 'path';
import { transactionBlock } from '#viat/blocks/transaction/block';
import { watch } from '#utilities/watch';
export class Superstructure {
	constructor(config = {}) {
		// Initialize any necessary properties
		console.log('Superstructure initializing');
		this.location = config.location || getHomeDirectory();
		this.networkName = config.networkName || this.networkName;
		this.setFullPath();
		return this;
	}
	async createTransaction(wallet, amount, receiver, mana = 1n) {
		const sender = await wallet.getAddress();
		const txBlock = await transactionBlock({
			core: {
				amount,
				receiver,
				sender,
				mana,
			},
		});
		await txBlock.finalize();
		await txBlock.sign(wallet);
		await txBlock.setReceipt();
		// await txBlock.receipt.finalize();
		// await txBlock.receipt.sign(this);
		console.log('Transaction Block:', txBlock.block);
		return txBlock;
	}
	async getAddressTransactions(address) {
		const transactionPaths = await this.getAddressTransactionPaths(address);
		return this.pathsToBlocks(transactionPaths);
	}
	async getAddressTransactionPaths(address) {
		const transactionsPath = await this.getFullPath(getTransactionsPath(address));
		const blocks = await getFiles(transactionsPath, {
			nameFilter: /vtx\.block$/,
			ignoreHidden: true,
			excludeFolderNames: ['verifications'],
		});
		return blocks;
	}
	async pathsToBlocks(transactionPaths) {
		const blocks = [];
		await eachAsyncArray(transactionPaths, async (filepath) => {
			const data = await readStructured(filepath);
			blocks.push(data);
		});
		return blocks;
	}
	async getAddressAmountTotal(address, blocks) {
		const transactions = blocks || await this.getAddressTransactions(address);
		let total = 0n;
		await eachAsyncArray(transactions, (source) => {
			const amount = source?.data?.core?.amount;
			if (amount) {
				total += amount;
			}
		});
		return total;
	}
	async createGenesisBlock() {
		const genesis = await genesisBlock();
		await genesis.finalize();
		return genesis;
	}
	async createGenesisWalletBlock() {
	}
	networkName = 'mainnet';
}
extendClass(Superstructure, filesystemMethods);
export async function superstructure(...args) {
	const source = new Superstructure(...args);
	return source;
}
export default superstructure;
// const viatNetwork = await superstructure({
// 	networkName: 'mainnet',
// });
// console.log('VIAT NETWORK', viatNetwork);
// console.log('VIAT NETWORK', await viatNetwork.getFullPath());
// console.log('VIAT SAVE', await viatNetwork.createFilesystem());
