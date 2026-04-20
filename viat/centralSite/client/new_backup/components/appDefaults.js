export const ACTIVITY_ENTRIES = [
	{
		direction: 'in',
		message: 'viat1m8p4...2n7qsa :: +12.400000000 VIAT :: CONFIRMED :: 0x8f2a9c1b',
		status: 'ok',
		timestamp: '00:00:01',
	},
	{
		direction: 'out',
		message: 'viat1qqtm...9kq1x8w :: -0.750000000 VIAT :: SENT TO viat1r9k2...v3mx0d',
		status: '',
		timestamp: '00:00:02',
	},
	{
		direction: 'in',
		message: 'viat1qqtm...9kq1x8w :: +1.000000000 VIAT :: RECEIVED FROM viat1m8p4...2n7qsa',
		status: 'ok',
		timestamp: '00:00:03',
	},
	{
		direction: 'out',
		message: 'viat1qqtm...9kq1x8w :: -2.145000000 VIAT :: GAS 0.000000000 :: PENDING',
		status: '',
		timestamp: '00:00:04',
	},
	{
		direction: 'in',
		message: 'viat1qqtm...9kq1x8w :: +0.250000000 VIAT :: CONFIRMED :: 0x1a9e4f22',
		status: 'ok',
		timestamp: '00:00:05',
	},
	{
		direction: 'out',
		message: 'viat1qqtm...9kq1x8w :: -18.000000000 VIAT :: SENT TO viat1e1d0...0a9k2m',
		status: '',
		timestamp: '00:00:06',
	},
	{
		direction: 'out',
		message: 'viat1qqtm...9kq1x8w :: -140.000000000 VIAT :: FLAGGED :: REVIEW REQUIRED',
		status: 'warn',
		timestamp: '00:00:07',
	},
	{
		direction: 'in',
		message: 'viat1qqtm...9kq1x8w :: +4.000000000 VIAT :: CONFIRMED :: 0xbc1qx7tr',
		status: 'ok',
		timestamp: '00:00:09',
	},
];
export const TOP_BAR = {
	actions: [
		{
			icon: '&#xf188f;',
			id: 'faucet',
			title: 'Faucet',
		},
		{
			icon: '&#xf007;',
			id: 'profile',
			title: 'Profile',
		},
		{
			icon: '&#xe615;',
			id: 'settings',
			title: 'Settings',
		},
	],
	network: 'MAINNET',
	subtitle: 'WALLET',
};
export const NAV_SECTIONS = [
	{
		items: [
			{
				active: true,
				kind: 'item',
				label: 'wallet',
			},
			{
				active: true,
				kind: 'item',
				label: 'explorer',
			},
		],
		label: 'ACCOUNT',
	},
];
export const NETWORK_DATA = [
	{
		className: 'good',
		key: 'Peers',
		value: '48 Active',
	},
	{
		key: 'Network',
		value: 'Viat Mainnet v1',
	},
	{
		className: 'good',
		key: 'Latency',
		value: '14 ms',
	},
	{
		rowType: 'latency-bar',
	},
	{
		className: 'pq',
		key: 'Connection',
		value: 'HTTP Hybrid Post-Quantum',
	},
];
export const CHAIN_STATUS = [
	{
		key: 'Block',
		value: '#4,291,842',
	},
	{
		className: 'good',
		key: 'Status',
		value: 'In Sync',
	},
	{
		className: 'pq',
		key: 'Algorithm',
		value: 'SHAKE-256 / CRYSTALS',
	},
];
export const WALLET_PARAMS = [
	{
		key: 'Scheme',
		value: 'ed25519+Dilithium',
	},
	{
		key: 'Version',
		value: 'v1.0.0',
	},
	{
		key: 'Seed Count',
		value: '1',
	},
	{
		key: 'HD Version',
		value: 'v1',
	},
	{
		key: 'Master Size',
		value: '1,024 B',
	},
	{
		className: 'pq',
		key: 'Trapdoor',
		value: 'Z3VpZGFuY2U...',
	},
	{
		key: 'Addr Size',
		value: '64 B',
	},
	{
		key: 'Trap Size',
		value: '32 B',
	},
	{
		key: 'Pub/Priv Key',
		value: '2.5/4.8 KB',
	},
	{
		key: 'Seed Size',
		value: '32 B',
	},
];
export const WALLET_AMOUNT = {
	amount: '142,894',
	amountFull: '142,894.500000000',
	label: 'RESOURCE ALLOCATION',
};
export const TRANSMIT = {
	amountLabel: 'Amount',
	amountPlaceholder: '0.00000000',
	buttonLabel: '[ EXECUTE TRANSFER ]',
	gasLabel: 'Gas',
	gasValue: '0',
	recipientLabel: 'Recipient Address',
	recipientPlaceholder: 'viat1...',
	tokenLabel: 'VIAT',
};
export const BOTTOM_BAR_COLUMNS = [
	{
		items: [
			{
				label: 'Version',
				value: 'v1.0.0',
			},
			{
				label: 'Client',
				value: 'VIAT Web',
			},
			{
				label: 'Key State',
				value: 'Secure',
			},
			{
				label: 'Encryption',
				value: 'PQ-Kyber1024',
			},
		],
		title: 'CLIENT MODULE',
	},
	{
		items: [
			{
				label: 'Symbol',
				value: 'VIAT',
			},
			{
				label: 'Decimals',
				value: '9',
			},
			{
				label: 'Protocol',
				value: 'UDSP v1',
			},
			{
				label: 'Consensus',
				value: 'Proof-of-Work',
			},
		],
		title: 'ASSET PROTOCOL',
	},
	{
		items: [
			{
				label: 'Network',
				value: 'Mainnet',
			},
			{
				label: 'Node ID',
				value: 'NODE-TYO-09',
			},
			{
				label: 'Peers',
				value: '48',
			},
			{
				label: 'Port',
				value: 'UDP/443',
			},
		],
		title: 'NODE STATUS',
	},
	{
		items: [
			{
				label: 'Domain',
				value: 'wallet.viat.network',
			},
			{
				label: 'Protocol',
				value: 'HTTPS + UDSP',
			},
			{
				label: 'TLS',
				value: 'PQ-Hybrid v1',
			},
			{
				label: 'Origin',
				value: 'viat.network',
			},
		],
		title: 'ACCESS POINT',
	},
	{
		items: [
			{
				label: 'Build',
				value: '2026.03.24',
			},
			{
				label: 'Environment',
				value: 'Production',
			},
			{
				label: 'CDN',
				value: 'None (P2P)',
			},
			{
				label: 'License',
				value: 'MIT',
			},
		],
		title: 'BUILD DATA',
	},
];
export const ACTIVITY_TABS = [
	'All', 'Inbound', 'Outbound',
];
export const ACCOUNT_PANEL = {
	actionLabel: '[ Create WALLET ]',
	profileLabel: 'Profile',
};
