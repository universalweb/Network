import VIAT_DEFAULTS from '#viat/defaults';
export const version = 1;
export const blockTypes = {
	transaction: 0,
	receipt: 1,
	wallet: 2,
	hybridWallet: 3,
	quantumWallet: 4,
	generic: 5,
	genesis: 6,
	genesisWallet: 7,
	genesisAudit: 8,
	walletAnchor: 9,
	receiptAnchor: 10,
	audit: 11,
};
export const hashSizes = {
	compact: VIAT_DEFAULTS.DEFAULT_HASH_SIZE,
	default: VIAT_DEFAULTS.DEFAULT_QUANTUM_HASH_SIZE,
	genesis: 256,
	quantum: 64,
};
export const nonceSizes = {
	default: VIAT_DEFAULTS.DEFAULT_NONCE_SIZE,
	mid: 24,
	genesis: 64,
	quantum: 32,
};
export const typeNames = {
	transaction: 'transaction',
	receipt: 'receipt',
	wallet: 'wallet',
	audit: 'audit',
	hybridWallet: 'hybridWallet',
	quantumWallet: 'quantumWallet',
	genesis: 'genesis',
	genesisWallet: 'genesisWallet',
	genesisAudit: 'genesisAudit',
};
export const typeNamesPlural = {
	transaction: 'transactions',
	receipt: 'receipts',
	wallet: 'wallets',
	audit: 'audits',
	hybridWallet: 'hybridWallets',
	quantumWallet: 'quantumWallets',
	genesis: 'genesis',
	genesisWallet: 'wallets',
	genesisAudit: 'audits',
};
export const walletTypes = {
	wallet: {
		size: VIAT_DEFAULTS.WALLETS.LEGACY.WALLET_SIZE,
		walletType: 'legacy',
		path: {
			default: typeNames.wallet,
			plural: typeNamesPlural.wallet,
		},
	},
	hybridWallet: {
		size: VIAT_DEFAULTS.WALLETS.HYBRID.WALLET_SIZE,
		walletType: 'hybrid-quantum',
		path: {
			default: typeNames.hybridWallet,
			plural: typeNamesPlural.hybridWallet,
		},
	},
	quantumWallet: {
		size: VIAT_DEFAULTS.WALLETS.QUANTUM.WALLET_SIZE,
		walletType: 'quantum',
		path: {
			default: typeNames.quantumWallet,
			plural: typeNamesPlural.quantumWallet,
		},
	},
};
export const filePaths = {
	transaction: '/transactions/',
	receipt: '/receipts/',
	wallet: '/wallets/',
	audit: '/audits/',
	hybridWallet: '/hybridwallets/',
	quantumWallet: '/quantumwallets/',
	genesis: '/',
	genesisWallet: '/',
	genesisAudit: '/audits/',
};
export const urlPaths = {
	transaction: '/t/',
	receipt: '/r/',
	wallet: '/w/',
	hybridWallet: '/hw/',
	quantumWallet: '/qw/',
	genesis: '/',
	genesisWallet: '/gw/',
	genesisAudit: '/ga/',
	audit: '/a/',
};
export const letters = {
	transaction: 't',
	receipt: 'r',
	wallet: 'w',
	hybridWallet: 'hw',
	quantumWallet: 'qw',
	genesis: 'g',
	genesisWallet: 'gw',
	genesisAudit: 'ga',
	audit: 'a',
};
export const fileTypes = {
	't.block': 'Viat Transaction Block',
	'r.block': 'Viat Receipt Block',
	'ab.block': 'Viat Abstract Block',
	'l.block': 'Viat Link Block',
	'w.block': 'Viat Wallet Block',
	'hw.block': 'Viat Hybrid Wallet Block',
	'qw.block': 'Viat Quantum Wallet Block',
	'a.block': 'Viat Audit Block',
	'v.block': 'Viat Verification Block',
	'g.block': 'Viat General Block',
	block: 'Viat Block',
};
export const fileExtensions = {
	transaction: '.t.block',
	receipt: '.r.block',
	abstract: '.ab.block',
	profile: '.p.block',
	link: '.l.block',
	wallet: '.w.block',
	hybridWallet: '.hw.block',
	quantumWallet: '.qw.block',
	audit: '.a.block',
	verification: '.v.block',
	generic: '.g.block',
	genesis: '.block',
	genesisWallet: '.block',
};
export const genericFilenames = {
	transaction: 't.block',
	receipt: 'r.block',
	abstract: 'ab.block',
	profile: 'p.block',
	link: 'l.block',
	wallet: 'w.block',
	hybridWallet: 'hw.block',
	quantumWallet: 'qw.block',
	audit: 'a.block',
	verification: 'v.block',
	generic: 'g.block',
	genesis: 'genesis.block',
	genesisWallet: 'genesisWallet.block',
	genesisAudit: 'genesisAudit.block',
};
export function createBlockDefaultsObject(source, blockName, blockNamePlural, letter) {
	const target = {
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
