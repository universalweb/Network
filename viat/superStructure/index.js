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
import genesisMethods from './methods/genesis.js';
import { genesisWalletBlock } from '#viat/blocks/genesisWallet/block';
import { getHomeDirectory } from '#utilities/directory';
import { getTransactionsPath } from '../blocks/transaction/uri.js';
import { loadBlock } from '#viat/blocks/utils';
import path from 'path';
import { transactionBlock } from '#viat/blocks/transaction/block';
import walletBlock from '#viat/blocks/wallet/block';
export class Superstructure {
	constructor(config = {}) {
		// Initialize any necessary properties
		console.log('Superstructure initializing');
		this.directoryPath = config.directoryPath || getHomeDirectory();
		this.networkName = config.networkName || this.networkName;
		return this.initialize();
	}
	async initialize() {
		await this.setFullPath();
		return this;
	}
	async createTransaction(wallet, amount, receiver, mana = 1n) {
		const sender = await wallet.getAddress();
		const txBlock = await transactionBlock({
			data: {
				core: {
					amount,
					receiver,
					sender,
					mana,
				},
			},
		});
		await txBlock.finalize();
		await txBlock.sign(wallet);
		await txBlock.setReceipt();
		// await txBlock.receipt.finalize();
		// await txBlock.receipt.sign(this);
		// console.log('Transaction Block:', txBlock.block);
		return txBlock;
	}
	async getAddressTransactions(address) {
		const transactionPaths = await this.getAddressTransactionPaths(address);
		return this.filesToBlockObjects(transactionPaths);
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
	async filesToBlockObjects(transactionPaths) {
		const blocks = [];
		await eachAsyncArray(transactionPaths, async (filepath) => {
			const data = await loadBlock(filepath);
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
	async loadSystemfiles() {
		await this.setGenesisBlock();
		await this.setGenesisWalletBlock();
		return this;
	}
	async createWalletBlock(wallet) {
		const source = await walletBlock(wallet);
		await source.setParent(await this.genesisWalletBlock.hashBlock());
		await source.finalize();
		await source.sign(wallet);
		await this.saveBlock(source);
		return source;
	}
	async readBlockFile(filePath) {
		const data = await loadBlock(filePath);
		return data;
	}
	networkName = 'mainnet';
}
extendClass(Superstructure, filesystemMethods);
extendClass(Superstructure, genesisMethods);
export async function superstructure(...args) {
	const source = await (new Superstructure(...args));
	return source;
}
export default superstructure;
// const viatNetwork = await superstructure({
// 	networkName: 'mainnet',
// });
// console.log('VIAT NETWORK', viatNetwork);
// console.log('VIAT NETWORK', await viatNetwork.getFullPath());
// console.log('VIAT SAVE', await viatNetwork.createFilesystem());
