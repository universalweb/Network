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
export async function getFullPathFromBlock(filepath, source) {
	const networkPath = (source) ? source().networkPath : undefined;
	const fullFilepath = (networkPath) ? path.join(networkPath, filepath) : filepath;
	return fullFilepath;
}
export async function loadBlock(filepath, config) {
	const blockObject = await readStructured(filepath);
	return createBlockFromObject(blockObject, config);
}
// SET Start time of nextwork creation invalidate anything before
// Auto remove any number with more or less integers that possible
export async function validateTimestamp(sourceBlock) {
	const timestamp = sourceBlock?.data?.meta?.timestamp;
	if (!timestamp) {
		return false;
	}
	if (sourceBlock.timestamp && sourceBlock.timestamp > Date.now()) {
		return false;
	}
	return true;
}
