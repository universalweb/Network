import { Wallet, wallet } from '#viat/wallet/wallet';
import {
	assign,
	currentPath,
	eachAsyncArray,
	extendClass,
} from '@universalweb/utilitylib';
import { getFiles, readStructured } from '#utilities/file';
import { createViatFilesystem } from './createFilesystem.js';
import { decode } from '#utilities/serialize';
import filesystemMethods from './methods/filesystem.js';
import { filesystemTypes } from '../storage/filesystems.js';
import fs from 'fs-extra';
import { genesisBlock } from '#blocks/genesis/root/block';
import genesisMethods from './methods/genesis.js';
import { genesisWalletBlock } from '#blocks/genesis/genesisWallet/block';
import { getHomeDirectory } from '#utilities/directory';
import { loadBlock } from '#viat/blocks/utils';
import logMethods from '#utilities/logs/classLogMethods';
import path from 'path';
import { transactionBlock } from '#blocks/transactions/transaction/block';
import viatDefaults from '#viat/defaults';
import walletBlock from '#blocks/wallet/block';
export class Superstructure {
	logLevel = 4;
	constructor(config = {}) {
		// Initialize any necessary properties
		this.logInfo('Superstructure initializing');
		this.directoryPath = config.directoryPath || getHomeDirectory();
		this.networkName = config.networkName || this.networkName;
		if (config.filesystem) {
			this.filesystem = config.filesystem;
		}
		return this.initialize();
	}
	async initialize() {
		await this.setFullPath();
		this.logInfo('Superstructure initialized');
		return this;
	}
	async createNetwork() {
		await this.createCoreNetworkWallets();
		await this.createFilesystem();
		await this.createGenesisBlock();
		await this.createGenesisWalletBlock({
			data: {
				core: {
					reserve: await this.reserveWallet.getAddress(),
					team: await this.teamWallet.getAddress(),
					genesisWallet: await this.genesisWallet.getAddress(),
				},
			},
		});
	}
	viatDefaults = viatDefaults;
	async createCoreNetworkWallets() {
		this.teamWallet = await wallet();
		this.reserveWallet = await wallet();
		this.genesisWallet = await wallet();
	}
	async createTransaction(walletArg, amount, receiver, mana = 1n) {
		const sender = (walletArg.getAddress) ? await walletArg.getAddress() : walletArg;
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
		if (walletArg.getAddress) {
			await txBlock.sign(walletArg);
		}
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
		const transactionsPath = await this.getFullPath(this.filesystem.getTransactionDirectory(address));
		const blocks = await getFiles(transactionsPath, {
			nameFilter: /vtx\.block$/,
			ignoreHidden: true,
			// excludeFolderNames: ['verifications'],
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
	async createWalletBlock(walletArg) {
		const source = await walletBlock(walletArg);
		await source.setParent(await this.genesisWalletBlock.hashBlock());
		await source.finalize();
		await source.sign(walletArg);
		await this.saveBlock(source);
		return source;
	}
	async readBlockFile(filePath) {
		const data = await loadBlock(filePath);
		return data;
	}
	filesystem = filesystemTypes.generic;
	networkName = 'mainnet';
}
extendClass(Superstructure, filesystemMethods);
extendClass(Superstructure, genesisMethods);
extendClass(Superstructure, logMethods);
export async function superstructure(...args) {
	const source = await (new Superstructure(...args));
	return source;
}
export default superstructure;
// const viatNetwork = await superstructure({
// 	networkName: 'mainnet',
// });
// console.log('VIAT NETWORK', viatNetwork);
// await viatNetwork.createGenesisBlock();
// await viatNetwork.createGenesisWalletBlock();
// console.log('VIAT NETWORK', await viatNetwork.getFullPath());
// console.log('VIAT SAVE', await viatNetwork.createFilesystem());
