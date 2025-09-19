import { Wallet, wallet } from '#viat/wallet/wallet';
import {
	assign,
	currentPath,
	eachAsyncArray,
	extendClass,
	isBuffer,
} from '@universalweb/utilitylib';
import { getFiles, readStructured } from '#utilities/file';
import { blockTypes } from '../blocks/defaults.js';
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
import { toBase64 } from '#crypto/utils.js';
import { transactionBlock } from '#blocks/transactions/transaction/block';
import viat from '#viat/index';
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
		// this.reserveWallet = await wallet(null, {
		// 	cipherSuiteName: 'hybrid',
		// });
		this.reserveWallet = await wallet();
		this.genesisWallet = await wallet();
	}
	async createTransaction(core, walletArg) {
		const sender = (walletArg.getAddress) ? await walletArg.getAddress() : walletArg;
		const txBlock = await transactionBlock({
			data: {
				core,
			},
		});
		await txBlock.finalize();
		if (walletArg.getAddress) {
			await txBlock.sign(walletArg);
		}
		// await txBlock.setReceipt();
		// await txBlock.receipt.finalize();
		return txBlock;
	}
	async submitTransaction(txBlock) {
		const receipt = txBlock.receipt;
		txBlock.receipt = null;
		await this.setToAccount(txBlock);
		await this.setToAccount(receipt);
		return this;
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
	mempool = {
		cache: {
			transactions: new Map(),
			receipts: new Map(),
			wallets: new Map(),
			hybridWallets: new Map(),
			quantumWallets: new Map(),
		},
		accounts: new Map(),
	};
	async getAccount(address) {
		const keyString = (isBuffer(address)) ? toBase64(address) : address;
		const account = this.mempool.accounts.get(keyString);
		if (account) {
			return account;
		}
		const accountObject = {
			transactions: new Map(),
			receipts: new Map(),
		};
		this.mempool.accounts.set(keyString, accountObject);
		return accountObject;
	}
	async setToAccount(block) {
		const { blockType } = block;
		if (blockType === blockTypes.transaction) {
			const account = await this.getAccount(block.getCore('sender'));
			account.transactions.set(toBase64(await block.getHash()), block);
		} else if (blockType === blockTypes.receipt) {
			const account = await this.getAccount(block.getCore('receiver'));
			account.receipts.set(toBase64(await block.getTransaction()), block);
		} else if (blockType === blockTypes.wallet || blockType === blockTypes.hybridWallet || blockType === blockTypes.quantumWallet) {
			const account = await this.getAccount(await block.getAddress());
			account.wallet = block;
		}
	}
	async sortIntoMempool(block) {
		switch (block.blockType) {
			case blockTypes.transaction: {
				return this.setToAccount(block);
			}
			case blockTypes.receipt: {
				return this.setToAccount(block);
			}
			case blockTypes.wallet: {
				return this.setToAccount(block);
			}
			case blockTypes.hybridWallet: {
				return this.setToAccount(block);
			}
			case blockTypes.quantumWallet: {
				return this.setToAccount(block);
			}
			default: {
				break;
			}
		}
	}
	async setMempool(key, block, target) {
		const keyString = (isBuffer(key)) ? toBase64(key) : key;
		await target.set(keyString, block);
		return this;
	}
	async getMempool(key, target) {
		const keyString = (isBuffer(key)) ? toBase64(key) : key;
		return target.get(keyString);
	}
	async findInCache(key, blockType) {
		const keyString = (isBuffer(key)) ? toBase64(key) : key;
		switch (blockType) {
			case blockTypes.transaction: {
				return this.getMempool(keyString, this.mempool.cache.transactions);
			}
			case blockTypes.receipt: {
				return this.getMempool(keyString, this.mempool.cache.receipts);
			}
			case blockTypes.wallet: {
				return this.getMempool(keyString, this.mempool.cache.wallets);
			}
			case blockTypes.hybridWallet: {
				return this.getMempool(keyString, this.mempool.cache.hybridWallets);
			}
			case blockTypes.quantumWallet: {
				return this.getMempool(keyString, this.mempool.cache.quantumWallets);
			}
			default: {
				break;
			}
		}
	}
	async saveToMempool(block) {
		switch (block.blockType) {
			case blockTypes.transaction: {
				return this.setMempool(await block.getHash(), block, this.mempool.transactions);
			}
			case blockTypes.receipt: {
				return this.setMempool(await block.getTransaction(), block, this.mempool.receipts);
			}
			case blockTypes.wallet: {
				return this.setMempool(await block.getAddress(), block, this.mempool.wallets);
			}
			case blockTypes.hybridWallet: {
				return this.setMempool(await block.getAddress(), block, this.mempool.hybridWallets);
			}
			case blockTypes.quantumWallet: {
				return this.setMempool(await block.getAddress(), block, this.mempool.quantumWallets);
			}
			default: {
				break;
			}
		}
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
// await viatNetwork.createNetwork();
// console.log(viatNetwork.teamWallet);
// console.log(viatNetwork.genesisWalletBlock.block);
// console.log((await viatNetwork.genesisWalletBlock.exportBinary()).length);
// console.log('VIAT NETWORK', await viatNetwork.getFullPath());
// console.log('VIAT SAVE', await viatNetwork.createFilesystem());
