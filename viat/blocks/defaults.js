export const version = 1;
export const blockTypes = {
	proof: 0,
	transaction: 1,
	receipt: 2,
	wallet: 3,
	generic: 4,
	genesis: 5,
	genesisWallet: 6,
	genesisAudit: 7,
};
export const filePaths = {
	transaction: '/transactions/',
	proof: '/proofs/',
	receipt: '/receipts/',
	wallet: '/wallets/',
	genesis: '/',
	genesisWallet: '/wallets/',
	genesisAudit: '/audits/',
};
export const fileTypes = {
	't.block': 'Viat Transaction Block',
	'p.block': 'Viat Proof Block',
	'r.block': 'Viat Receipt Block',
	'ab.block': 'Viat Abstract Block',
	'l.block': 'Viat Link Block',
	'w.block': 'Viat Wallet Block',
	'a.block': 'Viat Audit Block',
	'v.block': 'Viat Verification Block',
	'g.block': 'Viat General Block',
	block: 'Viat Block',
};
export const fileExtensions = {
	transaction: '.t.block',
	proof: '.p.block',
	receipt: '.r.block',
	abstract: '.ab.block',
	profile: '.p.block',
	link: '.l.block',
	wallet: '.w.block',
	audit: '.a.block',
	verification: '.v.block',
	generic: '.g.block',
	genesis: '.block',
	genesisWallet: '.block',
};
export const genericFilenames = {
	transaction: 't.block',
	proof: 'p.block',
	receipt: 'r.block',
	abstract: 'ab.block',
	profile: 'p.block',
	link: 'l.block',
	wallet: 'w.block',
	audit: 'a.block',
	verification: 'v.block',
	generic: 'g.block',
	genesis: 'genesis.block',
	genesisWallet: 'genesisWallet.block',
	genesisAudit: 'genesisAudit.block',
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
	filePaths,
};
export default blockDefaults;
