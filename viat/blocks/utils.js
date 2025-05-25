import { Block, block } from './block.js';
import { blockTypes } from './defaults.js';
import path from 'path';
import { readStructured } from '#utilities/file';
import { receiptBlock } from './receipt/block.js';
import { transactionBlock } from './transaction/block.js';
export async function createBlockFromObject(blockObject, config) {
	switch (blockObject.type) {
		case blockTypes.transaction: {
			return transactionBlock(blockObject, config);
		} case blockTypes.receipt: {
			return receiptBlock(blockObject, config);
		} default: {
			return block(blockObject, config);
		}
	}
}
export async function loadBlock(filepath, pathPrefix) {
	const { source } = this;
	const fullFilepath = (pathPrefix) ? path.join(pathPrefix, filepath) : filepath;
	const blockObject = await readStructured(fullFilepath);
	const config = {
		source
	};
	if (source) {
		return createBlockFromObject(blockObject, config);
	}
}
export async function getBlockFromBlock(filepath, sourceBlock) {
	const { source } = sourceBlock;
	const networkPath = (source) ? source().networkPath : undefined;
	const fullFilepath = (networkPath) ? path.join(networkPath, filepath) : filepath;
	return fullFilepath;
}
