export const version = 1;
export const blockTypes = {
	transaction: 0,
	receipt: 1,
	wallet: 2,
	generic: 3,
	genesis: 4,
	genesisWallet: 5,
	genesisAudit: 6,
};
export const filePaths = {
	transaction: '/transactions/',
	receipt: '/receipts/',
	wallet: '/wallets/',
	genesis: '/',
	genesisWallet: '/wallets/',
	genesisAudit: '/audits/',
};
export const fileTypes = {
	't.block': 'Viat Transaction Block',
	'r.block': 'Viat Receipt Block',
	'ab.block': 'Viat Abstract Block',
	'p.block': 'Viat Profile Block',
	'l.block': 'Viat Link Block',
	'w.block': 'Viat Wallet Block',
	'a.block': 'Viat Audit Block',
	'v.block': 'Viat Verification Block',
	'g.block': 'Viat General Block',
};
export const fileExtensions = {
	transaction: '.t.block',
	receipt: '.r.block',
	abstract: '.ab.block',
	profile: '.p.block',
	link: '.l.block',
	wallet: '.w.block',
	audit: '.a.block',
	verification: '.v.block',
	generic: '.g.block',
};
export const genericFilenames = {
	transaction: 't.block',
	receipt: 'r.block',
	abstract: 'ab.block',
	profile: 'p.block',
	link: 'l.block',
	wallet: 'w.block',
	audit: 'a.block',
	verification: 'v.block',
	generic: 'g.block',
	genesis: 'genesis.block',
	walletGenesis: 'walletGenesis.block',
	auditGenesis: 'auditGenesis.block',
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
