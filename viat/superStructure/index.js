import { assign, currentPath } from '@universalweb/acid';
import { createViatFilesystem } from './createFilesystem.js';
import fs from 'fs-extra';
import { getHomeDirectory } from '#utilities/directory';
import path from 'path';
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
	async watchFolder() {
		const fullPath = await this.getFullPath();
		console.log('Watching folder:', fullPath);
		const thisObject = this;
		const watcher = await watch(fullPath, (...args) => {
			thisObject.dirWatcher(...args);
		});
		this.watcher = watcher;
		return this;
	}
	// Process Blocks either add new or remove from virtual?
	async dirWatcher(evt, filename) {
		if (evt === 'update' && filename) {
			console.log('Directory updated:', filename);
			// Handle the directory update event
			// You can add logic here to process the updated file or directory
		} else {
			console.log('Directory event:', evt, 'for file:', filename);
		}
	}
	async save() {
		await this.ensureDirectory();
		const fullPath = await this.getFullPath();
		console.log('Saving superstructure to:', fullPath);
		return this;
	}
	async ensureDirectory() {
		const fullPath = await this.getFullPath();
		await fs.ensureDir(fullPath);
		console.log('Ensuring superstructure directory exists at:', fullPath);
		return this;
	}
	async createFilesystem() {
		const fullPath = await this.getFullPath();
		await this.ensureDirectory();
		console.log('Creating VIAT filesystem at:', fullPath);
		await createViatFilesystem(fullPath);
		return this;
	}
	async setFullPath(fullPath) {
		this.fullPath = fullPath || await this.getFullPath();
		return this;
	}
	async getFullPath() {
		// Logic to get the full path of the superstructure
		return path.join(this.location, '/viat/network/', this.networkName);
	}
	async createGenesisBlock() {
	}
	async createGenesisWalletBlock() {
	}
	async getBlockPath(source) {
		// Logic to get the path of a block in the superstructure
		const fullPath = await this.getFullPath();
		const blockPath = await source.getPath();
		return path.join(fullPath, blockPath);
	}
	async insertBlock(source) {
		// Logic to insert a block into the superstructure
		console.log('Inserting block:', source);
		await source.save();
	}
	async appendBlock(source) {
		// Logic to append a block to the superstructure
		console.log('Appending block:', source);
	}
	async prependBlock(source) {
		// Logic to prepend a block to the superstructure
		console.log('Prepending block:', source);
	}
	async removeBlock(source) {
		// Logic to remove a block from the superstructure
		console.log('Removing block:', source);
	}
	networkName = 'mainnet';
}
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
