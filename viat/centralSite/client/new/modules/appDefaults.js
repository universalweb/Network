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
	items: [
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
		{
			icon: '&#xebf4;',
			id: 'sidebar',
			title: 'Sidebar',
			onClick: 'open-dashboard-sidebar',
		},
	],
	subtitle: 'TERMINAL',
};
export const DOCK = {
	items: [
		{
			active: true,
			icon: '&#xe25e;',
			label: 'wallet',
			title: 'Wallet',
		},
		{
			active: false,
			icon: '&#xf14c;',
			label: 'explorer',
			title: 'Explorer',
		},
		{
			active: false,
			icon: '&#xf0ec;',
			label: 'exchange',
			title: 'Exchange (Coming Soon)',
		},
		{
			active: false,
			icon: '&#xf074;',
			label: 'swap',
			title: 'Swap (Coming Soon)',
		},
		{
			active: false,
			icon: '&#xf07b0;',
			label: 'analytics',
			title: 'Analytics (Coming Soon)',
		},
	],
};
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
		value: 'ed25519',
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
		value: 'Dilithium',
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
		label: 'Client',
		value: 'Web',
	},
	{
		label: 'Network',
		value: 'MAINNET',
	},
	{
		label: 'Version',
		value: 'v1.0.0',
	},
];
export const ACTIVITY_TABS = [
	'All', 'Inbound', 'Outbound',
];
export const ACCOUNT_PANEL = {
	profileLabel: 'Profile',
};
export const WALLET_PANEL = {
	activity: '21',
	received: '17,894',
	sent: '25.000',
};
export const CENTER_BAR = {
	actions: [
		{
			className: 'green-hover',
			icon: '&#xf188f;',
			id: 'faucet',
			title: 'Faucet',
		},
		{
			icon: '&#xf1d8;',
			id: 'send',
			title: 'Send',
		},
	],
};
