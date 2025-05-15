import block from './block.js';
export const version = 1;
export const blockTypes = {
	transactionBlockType: 0,
	receiptBlockType: 1,
	genericBlockType: 2,
	profileBlockType: 3,
	linkBlockType: 4,
	abstractBlockType: 5,
};
const fileTypes = {
	transaction: 'vtx.block',
	receipt: 'vr.block',
	abstract: 'vab.block',
	profile: 'vpf.block',
	link: 'vlk.block',
	wallet: 'vwl.block',
	audit: 'vau.block',
	verification: 'vvr.block',
	block: 'viat.block',
};
const fileExtensions = {
	transaction: '.vtx.block',
	receipt: '.vr.block',
	abstract: '.vab.block',
	profile: '.vpf.block',
	link: '.vlk.block',
	wallet: '.vwl.block',
	audit: '.vau.block',
	verification: '.vvr.block',
	block: '.viat.block',
};
export const blockDefaults = {
	version,
	blockTypes,
	fileTypes,
	fileExtensions,
};
export default blockDefaults;
