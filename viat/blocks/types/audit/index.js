//  Treat Audit Blocks as record of actions summarized via HASHES ->
// Store Blocks outside -> Store Account data outside Audit Blocks -> enforce computation of state changes
// Keep design agnostic to allow natural evolution of strategies
import {
	filePaths,
	genericFilenames,
	hashSizes,
	nonceSizes,
	typeNames,
} from '#viat/blocks/defaults';
import { Block } from '#viat/blocks/block';
import { assignToClass } from '@universalweb/utilitylib';
import path from 'path';
import { readStructured } from '#utilities/file';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
import wallet from '#viat/wallet/wallet';
export class AuditBlock extends Block {
	constructor(data, config) {
		super(config);
	}
	static async create(data, config) {
		const block = new AuditBlock(data, config);
		await block.initialize(data, config);
		return block;
	}
	async setDefaults() {
		await super.setDefaults();
		this.setCore({
			state: {
				prior: {},
				future: {},
			},
			output: {},
			legacyWallets: [],
			hybridWallets: [],
			quantumWallets: [],
			transactions: [],
			filters: {},
			version: this.version,
		});
	}
	async getFilePathPrefix() {
		return this.filesystem.pathPrefix.encode(await this.getHash());
	}
	async getFinalDirectory() {
		return this.filesystem.uniquePath.encode(await this.getHash());
	}
	async getDirectory() {
		return this.filesystem.getFullPath(await this.getHash());
	}
	async getFile() {
		return this.filesystem.getFile(await this.getHash());
	}
	async getURL() {
		return this.filesystem.getURL(await this.getHash());
	}
	async getFileURL() {
		return this.filesystem.getFileURL(await this.getHash());
	}
	// blockSchema = walletBlockSchema;
	typeName = typeNames.audit;
}
export default AuditBlock;
