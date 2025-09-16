import { Block, block } from './block.js';
import { blockTypes } from '#viat/blocks/defaults';
import { genesisBlock } from '#blocks/genesis/root/block';
import { genesisWalletBlock } from '#blocks/genesis/genesisWallet/block';
import path from 'path';
import { readStructured } from '#utilities/file';
import { receiptBlock } from '#blocks/transactions/receipt/block';
import { transactionBlock } from '#blocks/transactions/transaction/block';
import { walletBlock } from '#blocks/wallet/block';
export async function createBlockFromObject(blockObject, config) {
	switch (blockObject.data.meta.blockType) {
		case blockTypes.transaction: {
			return transactionBlock(blockObject, config);
		} case blockTypes.receipt: {
			return receiptBlock(blockObject, config);
		} case blockTypes.wallet: {
			return walletBlock(blockObject, config);
		} case blockTypes.genesis: {
			return genesisBlock(blockObject, config);
		} case blockTypes.genesisWallet: {
			return genesisWalletBlock(blockObject, config);
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
	// console.log(blockObject);
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
