export const version = 1;
export const blockTypes = {
	transaction: 0,
	receipt: 1,
	wallet: 2,
	generic: 3,
};
const fileTypes = {
	'vtx.block': 'Viat Transaction Block',
	'vr.block': 'Viat Receipt Block',
	'ab.block': 'Viat Abstract Block',
	'pf.block': 'Viat Profile Block',
	'lk.block': 'Viat Link Block',
	'w.block': 'Viat Wallet Block',
	'au.block': 'Viat Audit Block',
	'vvr.block': 'Viat Verification Block',
	'vg.block': 'Viat General Block',
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
	generic: '.vg.block',
};
const genericFilenames = {
	transaction: 'vtx.block',
	receipt: 'vr.block',
	abstract: 'vab.block',
	profile: 'vpf.block',
	link: 'vlk.block',
	wallet: 'vwl.block',
	audit: 'vau.block',
	verification: 'vvr.block',
	generic: 'vg.block',
};
export function createBlockDefaultsObject(blockName, blockNamePlural, letter) {
	const target = {
		urlPathname: letter,
		pathname: blockNamePlural,
		urlPathnameRegex: new RegExp(`/${letter}/`),
		pathnameRegex: new RegExp(`/${blockNamePlural}/`),
		directoryPathname: `/${blockNamePlural}/`,
		directoryURLPathname: `/${letter}/`,
	};
	return target;
}
export const blockDefaults = {
	version,
	blockTypes,
	fileTypes,
	fileExtensions,
	genericFilenames,
};
export default blockDefaults;
