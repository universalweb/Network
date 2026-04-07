import { Block } from './block.js';
import { blockTypes } from '#viat/blocks/defaults';
import { GenesisBlock } from '#blocks/system/genesis/block';
import { GenesisWalletBlock } from '#blocks/system/wallet/block';
import path from 'path';
import { readStructured } from '#utilities/file';
import { ReceiptBlock } from '#blocks/transactions/receipt/block';
import { TransactionBlock } from '#blocks/transactions/transaction/block';
import { WalletBlock } from '#blocks/wallet/block';
export async function createBlockFromObject(blockObject, config) {
	switch (blockObject.data.meta.blockType) {
		case blockTypes.transaction: {
			return TransactionBlock.create(blockObject, config);
		} case blockTypes.receipt: {
			return ReceiptBlock.create(blockObject, config);
		} case blockTypes.wallet: {
			return WalletBlock.create(blockObject, config);
		} case blockTypes.genesis: {
			return GenesisBlock.create(blockObject, config);
		} case blockTypes.genesisWallet: {
			return GenesisWalletBlock.create(blockObject, config);
		} default: {
			return Block.create(blockObject, config);
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
