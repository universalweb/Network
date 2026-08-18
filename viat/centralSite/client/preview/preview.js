import '../modules/registerRoots.js';
/* ui-collection + ui-stat-table (dir name ≠ resolver rest) don't auto-resolve
   through registerRoots, so define them by side-effect import. */
import '../components/global/collection/collection.js';
import '../components/global/stat-table/stat-table.js';
/* ui-sidebar is fixed-position app-shell chrome only summoned here on demand, so
   it's pulled in explicitly rather than left to a lazy first-render resolve. */
import '../components/global/sidebar/sidebar.js';
import '../components/global/slideout/slideout.js';
import '../components/global/control-center/control-center.js';
import '../components/global/notification-item/notification-item.js';
import '../components/global/notification-center-item/notification-center-item.js';
import '../components/global/toast-item/toast-item.js';
import '../components/global/go-to/go-to.js';
/* Carry-down pattern demo (demo-carry-top/mid/leaf) — preview-only showcase of
   `.state=` shared-object deep-mutation propagation; not on the resolver path. */
import '../components/preview/carry-down-demo/carry-down-demo.js';
import { html, observeInView, WebComponent } from 'webcomponent';
import { BootScreen } from '../components/global/boot-screen/boot-screen.js';
import { NotificationItem } from '../components/global/notification-item/notification-item.js';
import { setScrollLockTarget } from '../components/global/scroll-lock.js';
import { UIToastItem } from '../components/global/toast-item/toast-item.js';
/* Row/head CSS for <ui-collection> shadow — host .demo-paged stays in preview.css. */
const PAGED_ROW_STYLES = new URL('./preview-paged-rows.css', import.meta.url).href;
// Inclusive random integer for chart demo shuffles.
function randomInt(min, max) {
	return Math.floor(min + (Math.random() * ((max - min) + 1)));
}
// Random number series for chart demos.
function randomValues(count, min, max) {
	const out = [];
	for (let index = 0; index < count; index += 1) {
		out.push(randomInt(min, max));
	}
	return out;
}
// Random scatter points for chart demos.
function randomPoints(count, xMax, yMax) {
	const out = [];
	for (let index = 0; index < count; index += 1) {
		out.push({
			x: randomInt(1, xMax),
			y: randomInt(1, yMax),
		});
	}
	return out;
}
function galleryShots() {
	return [
		{
			id: 'cyan',
			src: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='400'%3E%3Crect width='100%25' height='100%25' fill='%2306b6d4'/%3E%3Ctext x='50%25' y='54%25' fill='white' font-size='42' text-anchor='middle' font-family='sans-serif'%3ECyan%3C/text%3E%3C/svg%3E`,
			alt: 'Cyan field',
			label: 'Cyan',
		},
		{
			id: 'indigo',
			src: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='400'%3E%3Crect width='100%25' height='100%25' fill='%236366f1'/%3E%3Ctext x='50%25' y='54%25' fill='white' font-size='42' text-anchor='middle' font-family='sans-serif'%3EIndigo%3C/text%3E%3C/svg%3E`,
			alt: 'Indigo field',
			label: 'Indigo',
		},
		{
			id: 'emerald',
			src: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='400'%3E%3Crect width='100%25' height='100%25' fill='%2310b981'/%3E%3Ctext x='50%25' y='54%25' fill='white' font-size='42' text-anchor='middle' font-family='sans-serif'%3EEmerald%3C/text%3E%3C/svg%3E`,
			alt: 'Emerald field',
			label: 'Emerald',
		},
		{
			id: 'amber',
			src: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='400'%3E%3Crect width='100%25' height='100%25' fill='%23f59e0b'/%3E%3Ctext x='50%25' y='54%25' fill='white' font-size='42' text-anchor='middle' font-family='sans-serif'%3EAmber%3C/text%3E%3C/svg%3E`,
			alt: 'Amber field',
			label: 'Amber',
		},
		{
			id: 'rose',
			src: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='400'%3E%3Crect width='100%25' height='100%25' fill='%23f43f5e'/%3E%3Ctext x='50%25' y='54%25' fill='white' font-size='42' text-anchor='middle' font-family='sans-serif'%3ERose%3C/text%3E%3C/svg%3E`,
			alt: 'Rose field',
			label: 'Rose',
		},
	];
}
const TRACKER_OVERFLOW_TONES = [
	'success',
	'success',
	'warning',
	'success',
	'danger',
	'success',
	'info',
];
function cloneCommandItems(items) {
	const out = [];
	const itemCount = items.length;
	for (let index = 0; index < itemCount; index += 1) {
		out.push({
			...items[index],
		});
	}
	return out;
}
const COMMAND_DEMO_ITEMS = [
	{
		label: 'Copy address',
		value: 'copy',
		kbd: 'mod+c',
		group: 'Edit',
		icon: 'copy',
		keywords: ['clipboard'],
	},
	{
		label: 'Paste',
		value: 'paste',
		kbd: 'mod+v',
		group: 'Edit',
		icon: 'clipboard',
	},
	{
		separator: true,
		value: 'sep-1',
	},
	{
		label: 'Go to Explorer',
		value: 'explorer',
		kbd: 'g e',
		group: 'Navigate',
		icon: 'compass',
	},
	{
		label: 'Settings',
		value: 'settings',
		group: 'Navigate',
		icon: 'settings',
		disabled: true,
	},
];
function buildTrackerOverflowItems(count) {
	const items = [];
	const toneCount = TRACKER_OVERFLOW_TONES.length;
	for (let index = 0; index < count; index += 1) {
		items.push({
			id: `trk-ov-${index}`,
			tone: TRACKER_OVERFLOW_TONES[index % toneCount],
			label: `slot ${4800 + index}`,
			detail: `Segment ${index + 1} of ${count}.`,
		});
	}
	return items;
}
class PreviewView extends WebComponent {
	static id = 'preview-view';
	static url = import.meta.url;
	static styles = {
		preview: './preview.css',
	};
	static state = {
		emailValue: '',
		searchValue: '',
		amountValue: '',
		floatNameValue: '',
		compareValue: 50,
		fieldsetOpen: true,
		meterItems: [
			{
				id: 'apps',
				label: 'Apps',
				value: 16,
				icon: 'app-window',
				tone: 'accent',
			},
			{
				id: 'messages',
				label: 'Messages',
				value: 12,
				icon: 'mail',
				tone: 'info',
			},
			{
				id: 'media',
				label: 'Media',
				value: 24,
				icon: 'image',
				tone: 'success',
			},
			{
				id: 'system',
				label: 'System',
				value: 10,
				icon: 'cpu',
				tone: 'warning',
			},
			{
				id: 'other',
				label: 'Other',
				value: 8,
				icon: 'box',
				tone: 'danger',
			},
		],
		meterSelectReadout: '(click a segment)',
		clickCount: 0,
		spinDemo: false,
		pickedColor: '#3b82f6',
		pickedDate: '',
		pickedRange: '',
		tagValues: [
			'VIAT', 'UDSP', 'post-quantum',
		],
		tagReadout: 'VIAT, UDSP, post-quantum',
		sliderReadout: '40',
		sliderRangeReadout: '20 – 70',
		calendarEvents: [
			{
				date: '2026-06-05',
				label: 'DAO vote',
				tone: 'accent',
			},
			{
				date: '2026-06-05',
				label: 'Airdrop',
				tone: 'success',
			},
			{
				date: '2026-06-12',
				label: 'Net upgrade',
				tone: 'warning',
			},
			{
				date: '2026-06-18',
				label: 'Tx batch',
				tone: 'info',
			},
			{
				date: '2026-06-25',
				label: 'Snapshot',
				tone: 'danger',
			},
		],
		badgeCount: 1,
		confirmResult: '(awaiting action)',
		pinResult: '',
		selectValue: 'viat',
		statusValue: 'online',
		switchChecked: false,
		checkboxChecked: false,
		ternaryValue: null,
		triStateValue: null,
		textareaValue: '',
		togglePressed: false,
		comboboxValue: '',
		progressValue: 62,
		progressRingLive: 34,
		collapsibleOpen: false,
		comboboxItems: [
			{
				value: 'viat',
				label: 'Viat',
			},
			{
				value: 'eth',
				label: 'Ethereum',
			},
			{
				value: 'sol',
				label: 'Solana',
			},
			{
				value: 'btc',
				label: 'Bitcoin',
				disabled: true,
			},
		],
		comboboxLiveItems: [
			{
				value: 'viat',
				label: 'Viat',
			},
			{
				value: 'eth',
				label: 'Ethereum',
			},
			{
				value: 'sol',
				label: 'Solana',
			},
			{
				value: 'btc',
				label: 'Bitcoin',
				disabled: true,
			},
		],
		listboxValue: 'viat',
		listboxReadout: 'viat',
		listboxMultiValues: [
			'viat',
			'eth',
		],
		listboxMultiReadout: 'viat, eth',
		multiSelectReadout: 'viat, sol',
		cascadeReadout: '',
		fileUploadReadout: '(none)',
		listboxItems: [
			{
				id: 'viat',
				value: 'viat',
				label: 'Viat',
			},
			{
				id: 'eth',
				value: 'eth',
				label: 'Ethereum',
			},
			{
				id: 'sol',
				value: 'sol',
				label: 'Solana',
			},
			{
				id: 'btc',
				value: 'btc',
				label: 'Bitcoin',
				disabled: true,
			},
		],
		listboxMultiItems: [
			{
				id: 'viat',
				value: 'viat',
				label: 'Viat',
			},
			{
				id: 'eth',
				value: 'eth',
				label: 'Ethereum',
			},
			{
				id: 'sol',
				value: 'sol',
				label: 'Solana',
			},
			{
				id: 'btc',
				value: 'btc',
				label: 'Bitcoin',
				disabled: true,
			},
		],
		multiSelectItems: [
			{
				id: 'viat',
				value: 'viat',
				label: 'Viat',
			},
			{
				id: 'eth',
				value: 'eth',
				label: 'Ethereum',
			},
			{
				id: 'sol',
				value: 'sol',
				label: 'Solana',
			},
			{
				id: 'btc',
				value: 'btc',
				label: 'Bitcoin',
				disabled: true,
			},
		],
		cascadeItems: [
			{
				id: 'au',
				value: 'au',
				label: 'Australia',
				children: [
					{
						id: 'nsw',
						value: 'nsw',
						label: 'New South Wales',
						children: [
							{
								id: 'syd',
								value: 'syd',
								label: 'Sydney',
							},
							{
								id: 'new',
								value: 'new',
								label: 'Newcastle',
							},
						],
					},
					{
						id: 'vic',
						value: 'vic',
						label: 'Victoria',
						children: [
							{
								id: 'mel',
								value: 'mel',
								label: 'Melbourne',
							},
						],
					},
				],
			},
			{
				id: 'ca',
				value: 'ca',
				label: 'Canada',
				children: [
					{
						id: 'on',
						value: 'on',
						label: 'Ontario',
						children: [
							{
								id: 'tor',
								value: 'tor',
								label: 'Toronto',
							},
						],
					},
				],
			},
		],
		tableColumns: [
			{
				key: 'id',
				label: 'ID',
				align: 'start',
			},
			{
				key: 'label',
				label: 'Name',
			},
			{
				key: 'amount',
				label: 'Amount',
				align: 'end',
			},
		],
		tableRowReadout: '',
		tableItems: [
			{
				id: '1',
				label: 'Alpha',
				amount: '12.4',
			},
			{
				id: '2',
				label: 'Beta',
				amount: '8.1',
			},
			{
				id: '3',
				label: 'Gamma',
				amount: '44.0',
			},
		],
		/* Native radio-group demo — `value` drives initial checked; consumer clicks
		   update the native inputs directly (no state writeback needed in the demo). */
		radioPlanValue: 'pro',
		radioPlanItems: [
			{
				value: 'free',
				label: 'Free',
				description: 'For getting started',
			},
			{
				value: 'pro',
				label: 'Pro',
				description: 'Everything in Free, plus priority sync',
			},
			{
				value: 'ent',
				label: 'Enterprise',
				description: 'SSO, audit log, SLA',
				disabled: true,
			},
		],
		/* Child-matrix demos — distinct arrays so list() parents never share a ref. */
		radioOptionDemoItems: [
			{
				value: 'label-only',
				label: 'Label only',
			},
			{
				value: 'with-desc',
				label: 'With description',
				description: 'Child field: description',
			},
			{
				value: 'off',
				label: 'Disabled',
				disabled: true,
			},
		],
		/* Tahoe-style control center demo tiles/rows — stable refs (not render-local). */
		controlCenterTiles: [
			{
				id: 'wifi',
				label: 'Wi-Fi',
				icon: 'wifi',
				checked: true,
			},
			{
				id: 'bluetooth',
				label: 'Bluetooth',
				icon: 'bluetooth',
				checked: false,
			},
			{
				id: 'airplay',
				label: 'AirPlay',
				icon: 'airplay',
				checked: false,
			},
			{
				id: 'cast',
				label: 'Cast',
				icon: 'cast',
				checked: true,
			},
		],
		/* Standalone tile demos — stable bags so click-toggle is not clobbered by patch-pass literals. */
		ccTileWifi: {
			itemId: 'wifi',
			label: 'Wi-Fi',
			icon: 'wifi',
			checked: true,
			tone: 'neutral',
		},
		ccTileBt: {
			itemId: 'bt',
			label: 'Bluetooth',
			icon: 'bluetooth',
			checked: false,
			tone: 'neutral',
		},
		ccTileCast: {
			itemId: 'off',
			label: 'Cast',
			icon: 'cast',
			disabled: true,
		},
		controlCenterRows: [
			{
				id: 'radio',
				label: 'Focus',
				icon: 'radio',
				description: 'Silence alerts',
				checked: false,
			},
		],
		/* Inline toast / notification item demos — dismissible + restore. */
		toastItemDemos: [],
		notificationItemDemos: [],
		/* Demo state for the 2026-06-14 easy-component batch (#7/#8/#9/#35/#36/#40). */
		demoPage: 3,
		demoQty: 2,
		animValue: 9410,
		wizardStep: 1,
		/* Stable reference — an inline `.state.items=${[…]}` literal would mint a new
		   array every patch pass and trip the engine's "wasted set" guard. */
		breadcrumbItems: [
			{
				label: 'Explorer',
				href: '/explorer',
			},
			{
				label: 'Block 4821',
				href: '/explorer/4821',
			},
			{
				label: 'Tx 0x9f3a…c2',
			},
		],
		tabsHorizontal: [
			{
				id: 'overview',
				label: 'Overview',
			},
			{
				id: 'security',
				label: 'Security',
			},
			{
				id: 'advanced',
				label: 'Advanced',
			},
		],
		tabsVertical: [
			{
				id: 'profile',
				label: 'Profile',
			},
			{
				id: 'wallet',
				label: 'Wallet',
			},
			{
				id: 'theme',
				label: 'Theme',
			},
		],
		sparkValues: [
			4, 7, 5, 9, 8, 12, 10, 14, 11, 16, 13, 18,
		],
		typewriterPhrases: [
			'Fast finality.',
			'Verifiable state.',
			'Zero dependencies.',
		],
		/* Each poll mutates its own option objects (selected / votes / percentage),
		   so every demo instance needs a distinct array — never shared. */
		pollBaseOptions: [
			{
				id: 'wallet',
				label: 'Hardware wallet support',
				votes: 142,
			},
			{
				id: 'staking',
				label: 'One-click staking',
				votes: 98,
			},
			{
				id: 'bridge',
				label: 'Cross-chain bridge',
				votes: 167,
			},
		],
		pollChoiceOptions: [
			{
				id: 'speed',
				label: 'Faster finality',
				votes: 221,
			},
			{
				id: 'fees',
				label: 'Lower fees',
				votes: 188,
			},
			{
				id: 'privacy',
				label: 'Private transfers',
				votes: 96,
			},
		],
		pollFeatureOptions: [
			{
				id: 'studio',
				label: 'Theme studio',
				description: 'Author and share custom themes',
				votes: 64,
			},
			{
				id: 'multisig',
				label: 'Multisig vaults',
				description: 'M-of-N approval workflows',
				votes: 121,
			},
			{
				id: 'api',
				label: 'Public GraphQL API',
				description: 'Query chain state directly',
				votes: 88,
			},
		],
		pollWidgetOptions: [
			{
				id: 'mobile',
				label: 'Mobile app',
				votes: 154,
			},
			{
				id: 'desktop',
				label: 'Desktop app',
				votes: 132,
			},
			{
				id: 'cli',
				label: 'CLI tooling',
				votes: 77,
			},
		],
		/* Vote tallies mutate their own item objects (votes / voted), so each
		   instance gets a distinct array — never shared. */
		voteTallyItems: [
			{
				id: 'studio',
				label: 'Theme studio',
				votes: 128,
			},
			{
				id: 'multisig',
				label: 'Multisig vaults',
				votes: 96,
			},
			{
				id: 'mobile',
				label: 'Mobile app',
				votes: 174,
			},
			{
				id: 'api',
				label: 'Public API',
				votes: 88,
			},
		],
		featureVotingItems: [
			{
				id: 'ledger',
				label: 'Ledger support',
				description: 'Hardware-wallet signing',
				votes: 142,
			},
			{
				id: 'ens',
				label: 'Name service',
				description: 'Human-readable addresses',
				votes: 119,
			},
			{
				id: 'batch',
				label: 'Batch transfers',
				description: 'Many sends, one signature',
				votes: 76,
			},
		],
		/* Carousels deep-write `active` onto their own slide objects, so each
		   instance owns a distinct array. */
		featureCarouselSlides() {
			return [
				{
					id: 'speed',
					eyebrow: 'Performance',
					heading: 'Sub-second finality',
					description: 'Transactions settle before you blink.',
					tone: 'accent',
				},
				{
					id: 'verify',
					eyebrow: 'Trust',
					heading: 'Verifiable by anyone',
					description: 'Every state transition is provable.',
					tone: 'success',
				},
				{
					id: 'zero',
					eyebrow: 'Footprint',
					heading: 'Zero dependencies',
					description: 'Hand-rolled, audit-friendly, lean.',
					tone: 'info',
				},
			];
		},
		loadingCarouselSlides() {
			return [
				{
					id: 'tip1',
					eyebrow: 'Tip',
					heading: 'Hardware wallets',
					description: 'Connect a Ledger for cold-key signing.',
					tone: 'accent',
				},
				{
					id: 'tip2',
					eyebrow: 'Tip',
					heading: 'Batch your sends',
					description: 'Group transfers into one signature.',
					tone: 'warning',
				},
				{
					id: 'tip3',
					eyebrow: 'Tip',
					heading: 'Name service',
					description: 'Send to human-readable names.',
					tone: 'success',
				},
			];
		},
		baseCarouselSlides: [
			{
				id: 'b1',
				eyebrow: 'Base',
				heading: 'ui-carousel',
				description: 'The raw engine: slide track + arrows + dots, no autoplay.',
				tone: 'accent',
			},
			{
				id: 'b2',
				eyebrow: 'Base',
				heading: 'Manual control',
				description: 'Arrows and dots drive it; presets layer autoplay + modes on top.',
				tone: 'info',
			},
			{
				id: 'b3',
				eyebrow: 'Base',
				heading: 'One source of truth',
				description: 'feature- / loading-carousel are thin subclasses of this.',
				tone: 'success',
			},
		],
		hoverVideoSrc: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
		youtubeVideoId: 'aqz-KE-bpKQ',
		/* Local poster — no i.ytimg.com fetch until the user clicks play. */
		youtubePoster: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="%230a1128"/><text x="320" y="170" font-family="system-ui,sans-serif" font-size="22" fill="%23e8eef8" text-anchor="middle">YouTube facade</text><text x="320" y="206" font-family="system-ui,sans-serif" font-size="14" fill="%2394a3b8" text-anchor="middle">iframe off until click</text></svg>`,
		/* Polls / vote-tally / carousels mutate their item objects — distinct arrays. */
		choicePollDemoItems: [
			{
				id: 'finality',
				label: 'Faster finality',
				votes: 221,
			},
			{
				id: 'fees',
				label: 'Lower fees',
				votes: 188,
			},
			{
				id: 'privacy',
				label: 'Private transfers',
				votes: 96,
			},
		],
		featurePollDemoItems: [
			{
				id: 'studio',
				label: 'Theme studio',
				description: 'Author and share custom themes',
				votes: 64,
			},
			{
				id: 'multisig',
				label: 'Multisig vaults',
				description: 'M-of-N approval workflows',
				votes: 121,
			},
			{
				id: 'api',
				label: 'Public GraphQL API',
				description: 'Query chain state directly',
				votes: 88,
			},
		],
		pollWidgetDemoItems: [
			{
				id: 'mobile',
				label: 'Mobile app',
				votes: 154,
			},
			{
				id: 'desktop',
				label: 'Desktop app',
				votes: 132,
			},
			{
				id: 'cli',
				label: 'CLI tooling',
				votes: 77,
			},
		],
		featureVotingDemoItems: [
			{
				id: 'ledger',
				label: 'Ledger support',
				description: 'Hardware-wallet signing',
				votes: 142,
			},
			{
				id: 'ens',
				label: 'Name service',
				description: 'Human-readable addresses',
				votes: 119,
			},
			{
				id: 'batch',
				label: 'Batch transfers',
				description: 'Many sends, one signature',
				votes: 76,
			},
		],
		featureCarouselDemoItems: [
			{
				id: 'speed',
				eyebrow: 'Performance',
				heading: 'Sub-second finality',
				description: 'Transactions settle before you blink.',
				tone: 'accent',
			},
			{
				id: 'verify',
				eyebrow: 'Trust',
				heading: 'Verifiable by anyone',
				description: 'Every state transition is provable.',
				tone: 'success',
			},
			{
				id: 'zero',
				eyebrow: 'Footprint',
				heading: 'Zero dependencies',
				description: 'Hand-rolled, audit-friendly, lean.',
				tone: 'info',
			},
		],
		loadingCarouselDemoItems: [
			{
				id: 'tip1',
				eyebrow: 'Tip',
				heading: 'Hardware wallets',
				description: 'Connect a Ledger for cold-key signing.',
				tone: 'accent',
			},
			{
				id: 'tip2',
				eyebrow: 'Tip',
				heading: 'Batch your sends',
				description: 'Group transfers into one signature.',
				tone: 'warning',
			},
			{
				id: 'tip3',
				eyebrow: 'Tip',
				heading: 'Name service',
				description: 'Send to human-readable names.',
				tone: 'success',
			},
		],
		ringThresholds: [
			{
				at: 90,
				tone: 'danger',
			},
		],
		trackerOverflowItems: buildTrackerOverflowItems(28),
		trackerSegments: [
			{
				tone: 'success',
				label: 'block 4818 · ok',
				detail: 'Finalized in 0.9s · 64 attestations.',
			},
			{
				tone: 'success',
				label: 'block 4819 · ok',
				detail: 'Finalized in 1.0s · healthy quorum.',
			},
			{
				tone: 'success',
				label: 'block 4820 · ok',
				detail: 'Finalized in 0.8s.',
			},
			{
				tone: 'warning',
				label: 'block 4821 · slow finality',
				title: 'Slow finality',
				icon: 'triangle-alert',
				meta: 'slot 4821 · peer lag 400ms',
				detail: 'Peer lag ~400ms. Still within tolerance; watch next slots.',
				actions: [
					{
						id: 'inspect',
						label: 'Inspect',
					},
					{
						id: 'mute',
						label: 'Mute',
					},
				],
			},
			{
				tone: 'success',
				label: 'block 4822 · ok',
				detail: 'Recovered · finalized in 1.1s.',
			},
			{
				tone: 'success',
				label: 'block 4823 · ok',
				detail: 'Finalized in 0.95s.',
			},
			{
				tone: 'danger',
				label: 'block 4824 · missed',
				title: 'Missed slot',
				icon: 'circle-x',
				meta: 'proposer offline · skipped',
				detail: 'Proposer offline. Slot skipped; chain continued.',
				actions: [
					{
						id: 'retry',
						label: 'Retry',
						tone: 'danger',
					},
					{
						id: 'logs',
						label: 'Logs',
					},
				],
			},
			{
				tone: 'success',
				label: 'block 4825 · ok',
				detail: 'Back on schedule.',
			},
			{
				tone: 'success',
				label: 'block 4826 · ok',
				detail: 'Finalized in 1.0s.',
			},
			{
				tone: 'success',
				label: 'block 4827 · ok',
			},
		],
		nativeSelectItems: [
			{
				value: 'usd',
				label: 'USD',
			},
			{
				value: 'eur',
				label: 'EUR',
			},
			{
				value: 'viat',
				label: 'VIAT',
			},
		],
		nativeSelectValue: 'usd',
		questionnaireItems: [
			{
				value: 'pro',
				label: 'Pro',
				description: 'Everything in Free, plus agents',
			},
			{
				value: 'free',
				label: 'Free',
			},
			{
				value: 'ent',
				label: 'Enterprise',
			},
		],
		questionnaireMulti: [
			{
				value: 'wallet',
				label: 'Wallet',
			},
			{
				value: 'explorer',
				label: 'Explorer',
			},
			{
				value: 'chat',
				label: 'AI chat',
			},
		],
		questionnaireQuestions: [
			{
				id: 'net',
				label: 'Network',
				items: [
					{
						value: 'main',
						label: 'Mainnet',
					},
					{
						value: 'test',
						label: 'Testnet',
					},
				],
			},
			{
				id: 'role',
				label: 'Role',
				items: [
					{
						value: 'ops',
						label: 'Operator',
					},
					{
						value: 'dev',
						label: 'Developer',
					},
				],
			},
		],
		messageThread: [
			{
				id: 'm1',
				author: 'system',
				content: 'Session started.',
			},
			{
				id: 'm2',
				author: 'user',
				content: 'Ship the overlay value fix.',
			},
			{
				id: 'm3',
				author: 'assistant',
				content: 'Track height raised. Overlay sits in a contrast pill.',
			},
		],
		timelineEvents: [
			{
				time: '12:04:18',
				label: 'Block 4,182,907 sealed',
				description: '128 validators · 1.6s finality',
				tone: 'success',
				icon: 'check',
			},
			{
				time: '12:04:02',
				label: 'Tx 0x9f3a…c2 confirmed',
				description: '128.40 VIAT · 0xA1f2 → 0xB73d',
				tone: 'accent',
				icon: 'arrow-left-right',
			},
			{
				time: '12:03:47',
				label: 'Slow finality detected',
				description: 'Block 4821 took 1.8s (threshold 1.5s)',
				tone: 'warning',
				icon: 'triangle-alert',
			},
			{
				time: '12:03:11',
				label: 'Validator 0x77c1 missed slot',
				tone: 'danger',
				icon: 'x',
			},
			{
				time: '12:02:55',
				label: 'Snapshot committed',
				description: 'Post-quantum proof verified',
				tone: 'info',
				icon: 'shield',
			},
		],
		jsonSample: {
			network: 'viat-mainnet',
			block: {
				height: 4182907,
				sealed: true,
				finalityMs: 1600,
				parentHash: '0x9f3a7c2e1b4d8a6f0c5e2d1a9b8c7f6e5d4c3b2a1908f7e6d5c4b3a2910ffee01',
				transactions: [
					{
						hash: '0xA1f2c4',
						amount: 128.4,
						confirmed: true,
						memo: null,
						meta: {
							signer: '0xDEADBEEFcafe',
							'gas price': 21,
							tags: [
								'transfer',
								'priority',
							],
						},
					},
					{
						hash: '0xB73dc9',
						amount: 0,
						confirmed: false,
						memo: 'refund: duplicate submission flagged by the mempool guard heuristic v3',
						meta: {
							signer: '0xFEEDfaceBEAD',
							'gas price': 18,
							tags: [],
						},
					},
				],
			},
			validators: [
				'0x77c1',
				'0xA1f2',
				'0xB73d',
			],
			health: {
				score: 0.97,
				degraded: false,
				notes: null,
			},
		},
		barListItems: [
			{
				label: '0xA1f2…c4',
				value: 9410,
				href: '#/accounts/0xA1f2',
			},
			{
				label: '0xB73d…c9',
				value: 6120,
				href: '#/accounts/0xB73d',
			},
			{
				label: '0xC3e8…e1',
				value: 3050,
				href: '#/accounts/0xC3e8',
			},
			{
				label: '0xD9a0…7b',
				value: 1240,
			},
		],
		metricTrendTps: [
			6, 7, 6, 9, 8, 11, 10, 13, 12, 14,
		],
		metricTrendFinality: [
			24, 22, 23, 20, 19, 21, 18, 19, 17, 18,
		],
		detailPairs: [
			{
				label: 'Hash',
				value: '0x9f3a2b…c2',
				mono: true,
				copy: true,
			},
			{
				label: 'Block',
				value: '4,182,907',
				mono: true,
			},
			{
				label: 'From',
				value: '0xA1f2…c4',
				mono: true,
				copy: true,
			},
			{
				label: 'To',
				value: '0xB73d…c9',
				mono: true,
				copy: true,
			},
			{
				label: 'Amount',
				value: '128.40 VIAT',
				mono: true,
			},
			{
				label: 'Status',
				value: 'Confirmed',
			},
		],
		/* Example-code snippets rendered via <ui-code-block> beneath each newer demo
		   so the gallery doubles as living docs. These are plain strings (no outer
		   interpolation); `\${` keeps the binding sigils literal in the displayed code. */
		textareaExample: `
<ui-textarea
  .state.placeholder=\${'Write a note…'}
  .state.rows=\${4}
  .state.value=\${this.state.note}
  @textarea:input=\${this.handleNote}></ui-textarea>`,
		labelExample: `
<ui-label .state.text=\${'Email'} .state.required=\${true}
  .state.description=\${'We never share this.'}></ui-label>`,
		inputGroupExample: `
<ui-input-group>
  <span slot="leading">https://</span>
  <ui-input .state.placeholder=\${'example.com'}></ui-input>
  <span slot="trailing">.io</span>
</ui-input-group>`,
		comboboxExample: `
<ui-combobox
  .state.items=\${items}
  .state.placeholder=\${'Search chain…'}
  @combobox:change=\${this.handlePick}></ui-combobox>`,
		listboxExample: `
<ui-listbox .state.items=\${items} .state.value=\${'viat'}
  @listbox:change=\${this.onPick}></ui-listbox>
<ui-listbox .state.multiple=\${true} .state.filterable=\${true}
  .state.values=\${['viat','eth']} .state.items=\${items}></ui-listbox>`,
		multiSelectExample: `
<ui-multi-select .state.items=\${items} .state.values=\${['viat']}
  .state.filterable=\${true}
  @multi-select:change=\${this.onPick}></ui-multi-select>`,
		cascadeSelectExample: `
<ui-cascade-select .state.items=\${nested}
  @cascade-select:change=\${this.onPath}></ui-cascade-select>`,
		fileUploadExample: `
<ui-file-upload .state.multiple=\${true} .state.accept=\${'image/*'}
  @file-upload:select=\${this.onFiles}
  @file-upload:remove=\${this.onFiles}
  @file-upload:clear=\${this.onFiles}></ui-file-upload>`,
		toggleExample: `
<ui-toggle .state.label=\${'Bold'} .state.pressed=\${true}
  @toggle:change=\${this.handleToggle}></ui-toggle>`,
		progressExample: `
<ui-progress .state.value=\${62} .state.label=\${'Upload'}
  .state.valuePosition=\${'above'} .state.variant=\${'glow'}></ui-progress>
<ui-progress .state.valuePosition=\${'auto'} .state.size=\${'sm'} .state.value=\${40}></ui-progress>
<ui-progress .state.segmentShape=\${'circle'} .state.segments=\${12} .state.value=\${70}
  .state.trackFit=\${'content'}></ui-progress>
<ui-progress .state.segmentShape=\${'round'} .state.segments=\${16} .state.value=\${70}
  .state.trackFit=\${'fill'}></ui-progress>
<ui-progress .state.value=\${88} .state.size=\${'sm'} .state.tone=\${'danger'}
  .state.valuePosition=\${'center'}></ui-progress>`,
		collapsibleExample: `
<ui-collapsible .state.heading=\${'Details'} .state.open=\${false}>
  Expanded content here.
</ui-collapsible>`,
		hoverCardExample: `
<ui-hover-card>
  <ui-button slot="trigger" .state.label=\${'Hover me'}></ui-button>
  <p>Preview card body.</p>
</ui-hover-card>`,
		aspectRatioExample: `
<ui-aspect-ratio .state.ratio=\${'16/9'}>
  <img src="…" alt="">
</ui-aspect-ratio>`,
		scrollAreaExample: `
<ui-scroll-area .state.maxHeight=\${'10rem'}>
  …long content…
</ui-scroll-area>`,
		resizableExample: `
<ui-resizable .state.primarySize=\${0} .state.minPrimary=\${0} .state.maxPrimary=\${1}
  .state.minSecondary=\${0.2} .state.maxSecondary=\${1}>
  <div slot="start">A</div>
  <div slot="end">B</div>
</ui-resizable>`,
		tableExample: `
<ui-table
  .state.heading=\${'Balances'}
  .state.columns=\${columns}
  .state.items=\${rows}></ui-table>`,
		switchExample: `
<ui-switch
  .state.checked=\${this.state.darkMode}
  .state.label=\${'Dark mode'}
  @switch:change=\${this.handleToggle}>
</ui-switch>`,
		checkboxExample: `
<ui-checkbox
  .state.checked=\${this.state.accepted}
  .state.label=\${'Accept terms'}
  @checkbox:change=\${this.handleCheck}>
</ui-checkbox>
<ui-checkbox .state.checked=\${true} .state.checkedIcon=\${'star'} .state.label=\${'Star'}></ui-checkbox>
<ui-checkbox .state.checked=\${true} .state.label=\${'Heart'}>
  <ui-icon slot="checked" .state.name=\${'heart'} .state.size=\${'sm'}></ui-icon>
</ui-checkbox>`,
		ternaryStateExample: `
<ui-ternary-state
  .state.display=\${'icon-label'}
  .state.colorTarget=\${'icon'}
  .state.positiveLabel=\${'Pass'}
  .state.negativeLabel=\${'Fail'}
  .state.neutralLabel=\${'Flag'}
  .state.value=\${this.state.review}
  @ternary-state:change=\${this.handleReview}></ui-ternary-state>`,
		triStateCheckboxExample: `
<ui-tri-state-checkbox
  .state.label=\${'Review'}
  .state.value=\${this.state.flag}
  @tri-state-checkbox:change=\${this.handleFlag}></ui-tri-state-checkbox>`,
		accordionExample: `
<ui-accordion .state.summary=\${'What is UWC?'} .state.group=\${'faq'}>
  <p>Siblings sharing a group are a native one-open accordion.</p>
</ui-accordion>`,
		alertExample: `
<ui-alert .state.tone=\${'warning'} .state.heading=\${'Unsynced'} .state.dismissible=\${true}>
  Local state is ahead of the network.
</ui-alert>`,
		breadcrumbsExample: `
<ui-breadcrumbs .state.items=\${[
  { label: 'Explorer', href: '/explorer' },
  { label: 'Block 4821', href: '/explorer/4821' },
  { label: 'Tx 0x9f3a…c2' }
]}></ui-breadcrumbs>`,
		tooltipExample: `
<!-- Plain elements: declarative tooltip= behavior (no import, hover devices) -->
<ui-text tooltip="Even plain text accepts a tooltip">Hover me</ui-text>
<!-- Composed controls carry it via state/prop → the INNER control shows it
     (a bare tooltip= attaches to the host, which the inner button shadows) -->
<ui-button .state=\${{ label: 'Send', tooltip: 'Settles in ~2s' }}></ui-button>
<ui-icon-button .state=\${{ icon: 'info', tooltip: 'Details' }}></ui-icon-button>`,
		codeBlockExample: `
<ui-code-block
  .state.language=\${'js'}
  .state.code=\${mySourceString}>
</ui-code-block>`,
		sparklineExample: `
<ui-sparkline
  .state.values=\${[4, 7, 5, 9, 8, 12, 10, 14]}
  .state.variant=\${'area'}
  .state.tone=\${'success'}
  .state.showTips=\${true}>
</ui-sparkline>
<!-- hover a vertex — framework tooltip= via this.partial hitLayerRow -->`,
		lineChartSeries: [
			{
				label: 'TPS',
				values: [
					12, 18, 15, 22, 28, 24, 31, 29, 35, 40,
				],
			},
			{
				label: 'Finality (×10)',
				values: [
					8, 9, 7, 10, 11, 9, 12, 10, 11, 13,
				],
				color: 'var(--color-success, oklch(0.72 0.17 145))',
			},
		],
		lineChartCategories: [
			'M', 'T', 'W', 'T', 'F', 'S', 'S', 'M', 'T', 'W',
		],
		barChartItems: [
			{
				label: 'Mon',
				value: 42,
			},
			{
				label: 'Tue',
				value: 58,
			},
			{
				label: 'Wed',
				value: 35,
			},
			{
				label: 'Thu',
				value: 71,
			},
			{
				label: 'Fri',
				value: 64,
			},
			{
				label: 'Sat',
				value: 28,
			},
			{
				label: 'Sun',
				value: 22,
			},
		],
		pieChartItems: [
			{
				label: 'Validators',
				value: 42,
			},
			{
				label: 'Stakers',
				value: 28,
			},
			{
				label: 'Relays',
				value: 18,
			},
			{
				label: 'Other',
				value: 12,
			},
		],
		scatterPoints: [
			{
				x: 1,
				y: 3,
			},
			{
				x: 2,
				y: 5,
			},
			{
				x: 3,
				y: 4,
			},
			{
				x: 4,
				y: 8,
			},
			{
				x: 5,
				y: 7,
			},
			{
				x: 6,
				y: 11,
			},
			{
				x: 7,
				y: 9,
			},
			{
				x: 8,
				y: 13,
			},
			{
				x: 9,
				y: 12,
			},
			{
				x: 10,
				y: 15,
			},
		],
		radarCategories: [
			'CPU', 'RAM', 'Disk', 'Net', 'GPU', 'IOPS',
		],
		radarSeries: [
			{
				label: 'Node A',
				values: [
					80, 60, 45, 90, 70, 55,
				],
			},
			{
				label: 'Node B',
				values: [
					55, 85, 70, 40, 60, 75,
				],
				color: 'var(--color-warning, oklch(0.8 0.16 85))',
			},
		],
		gaugeCpu: 72,
		gaugeDisk: 91,
		gaugeMem: 38,
		gaugeThresholds: [
			{
				at: 80,
				tone: 'warning',
			},
			{
				at: 90,
				tone: 'danger',
			},
		],
		lineChartExample: `
// Framework tooltip= on points (this.partial hitLayerRow) + optional series path tip.
// tipMode: auto|points|series|both|none · pointMarker: hover|always|never
<ui-line-chart
  .state.series=\${this.state.lineChartSeries}
  .state.categories=\${this.state.lineChartCategories}
  .state.tipMode=\${'both'}
  .state.pointMarker=\${'hover'}
  .state.legendPosition=\${'right'}
  .state.xLabel=\${'Day'}
  .state.yLabel=\${'Throughput'}>
</ui-line-chart>`,
		barChartExample: `
<ui-bar-chart
  .state.items=\${this.state.barChartItems}
  .state.legendPosition=\${'bottom'}
  .state.xLabel=\${'Weekday'}
  .state.yLabel=\${'Count'}>
</ui-bar-chart>`,
		pieChartExample: `
// Default legend left; use legendPosition top|bottom|left|right.
<ui-pie-chart .state.items=\${this.state.pieChartItems}
  .state.variant=\${'donut'}
  .state.legendPosition=\${'right'}
  .state.legendOrientation=\${'vertical'}>
</ui-pie-chart>`,
		scatterChartExample: `
<ui-scatter-chart
  .state.points=\${this.state.scatterPoints}
  .state.xLabel=\${'X'}
  .state.yLabel=\${'Y'}
  .state.legendPosition=\${'bottom'}>
</ui-scatter-chart>`,
		radarChartExample: `
// Path hover → series tip; vertex hover → axis-specific tip (tipMode both).
<ui-radar-chart
  .state.categories=\${this.state.radarCategories}
  .state.series=\${this.state.radarSeries}
  .state.tipMode=\${'both'}
  .state.pointMarker=\${'hover'}
  .state.legendPosition=\${'bottom'}>
</ui-radar-chart>`,
		gaugeExample: `
// readoutPosition: overlay | below · showValue / showLabel toggles.
<ui-gauge .state.value=\${this.state.gaugeCpu} .state.label=\${'CPU'}
  .state.unit=\${'%'} .state.readoutPosition=\${'overlay'}
  .state.thresholds=\${this.state.gaugeThresholds}>
</ui-gauge>`,
		carryDownExample: `
// top owns ONE shared object, passes it down by reference
<demo-carry-leaf .state=\${this.state.shared}></demo-carry-leaf>
<demo-carry-mid .state=\${this.state.shared}></demo-carry-mid>

// ancestor write → every descendant updates
this.state.shared.label = 'Alpha';

// child primitive write mirrors UP to the source (and siblings)
this.state.label = next;`,
		svgBandsExample: `
<ui-svg-bands
  .state.shape=\${'battlement'}
  .state.segments=\${16}
  .state.tone=\${'accent'}>
</ui-svg-bands>`,
		typewriterExample: `
<ui-typewriter
  .state.phrases=\${['Fast finality.', 'Verifiable state.']}
  .state.loop=\${true}>
</ui-typewriter>`,
		pollExample: `
<ui-poll
  .state.question=\${'Which should we build first?'}
  .state.items=\${[
    { id: 'a', label: 'Wallet', votes: 142 },
    { id: 'b', label: 'Staking', votes: 98 },
  ]}>
</ui-poll>`,
		pollOptionExample: `
<ui-poll .state.locked=\${true} .state.items=\${[
  { id: 'a', label: 'Wallet', description: 'Child field', votes: 142, percentage: 59, selected: true, revealed: true },
  { id: 'b', label: 'Staking', votes: 98, percentage: 41, revealed: true },
]}></ui-poll>
<!-- child: id · label · description · votes · percentage · selected · revealed -->`,
		voteTallyExample: `
<ui-vote-tally
  .state.heading=\${'Most wanted'}
  .state.items=\${[
    { id: 'a', label: 'Dark mode', votes: 42 },
    { id: 'b', label: 'Mobile app', votes: 88 },
  ]}>
</ui-vote-tally>`,
		voteItemExample: `
<ui-vote-tally .state.items=\${[
  { id: 'a', label: 'Theme studio', description: 'Child field', votes: 128, voted: true },
  { id: 'b', label: 'Mobile app', votes: 88 },
]}></ui-vote-tally>
<!-- child: id · label · description · votes · voted -->`,
		carouselExample: `
<ui-feature-carousel
  .state.items=\${[
    { id: 'a', eyebrow: 'New', heading: 'Fast', description: '…' },
    { id: 'b', eyebrow: 'New', heading: 'Final', description: '…' },
  ]}>
</ui-feature-carousel>`,
		carouselSlideExample: `
<ui-carousel .state.items=\${[
  { id: 'a', eyebrow: 'New', heading: 'Fast', description: 'Body', tone: 'accent' },
  { id: 'b', heading: 'Label only', tone: 'success' },
]}></ui-carousel>
<!-- child: id · eyebrow · heading · description · image · tone · active (parent-stamped) -->`,
		videoPlayerExample: `
<ui-hover-video-player .state.src=\${'/clip.mp4'}></ui-hover-video-player>
<ui-youtube-video-player .state.videoId=\${'aqz-KE-bpKQ'}></ui-youtube-video-player>`,
		colorPickerExample: `
<ui-color-picker
  .state.color=\${'#6366f1'} .state.alpha=\${85} .state.format=\${'rgba'}
  @color-picker:change=\${this.handleColor}>
</ui-color-picker>`,
		tagInputExample: `
<ui-tag-input
  .state.values=\${['react', 'vue']} .state.placeholder=\${'Add framework…'}
  .state.max=\${8} @tag-input:change=\${e => save(e.detail.data.values)}>
</ui-tag-input>`,
		sliderExample: `
<ui-slider .state.value=\${40} @slider:change=\${e => save(e.detail.data.value)}></ui-slider>
<ui-slider .state.range=\${true} .state.low=\${20} .state.high=\${70} .state.marks=\${true}
  .state.showLabel=\${'always'}></ui-slider>
<ui-slider .state.orientation=\${'vertical'} .state.step=\${5} .state.valueSuffix=\${'%'}></ui-slider>`,
		calendarExample: `
<ui-calendar @calendar:change=\${this.handlePick}></ui-calendar>
<ui-range-calendar @calendar:range-change=\${this.handleRange}></ui-range-calendar>
<ui-event-calendar .state.items=\${events}></ui-event-calendar>
<ui-mini-calendar></ui-mini-calendar>`,
		miniCalendarExample: `
<ui-mini-calendar
  .state.viewYear=\${2026}
  .state.viewMonth=\${5}
  .state.weekStart=\${1}
  .state.value=\${'2026-06-10'}>
</ui-mini-calendar>
<!-- preset of ui-calendar: density compact -->`,
		rangeCalendarExample: `
<ui-range-calendar
  .state.viewYear=\${2026}
  .state.viewMonth=\${5}
  .state.rangeStart=\${'2026-06-08'}
  .state.rangeEnd=\${'2026-06-19'}
  @calendar:range-change=\${this.handleRange}>
</ui-range-calendar>
<!-- preset of ui-calendar: selectMode range -->`,
		eventCalendarExample: `
<ui-event-calendar
  .state.viewYear=\${2026}
  .state.viewMonth=\${5}
  .state.items=\${[{ date: '2026-06-05', label: 'DAO vote', tone: 'accent' }]}>
</ui-event-calendar>
<!-- preset of ui-calendar: showEvents true -->`,
		choicePollExample: `
<ui-choice-poll
  .state.question=\${'Pick one'}
  .state.items=\${[{ id: 'a', label: 'Faster finality', votes: 221 }]}>
</ui-choice-poll>
<!-- preset of ui-poll: instant true — locks on pick, no Vote button -->`,
		featurePollExample: `
<ui-feature-poll
  .state.question=\${'Next feature'}
  .state.items=\${[{ id: 'a', label: 'Theme studio', description: '…', votes: 64 }]}>
</ui-feature-poll>
<!-- preset of ui-poll: variant feature · buttonLabel Cast vote -->`,
		featureVotingExample: `
<ui-feature-voting
  .state.heading=\${'Roadmap'}
  .state.items=\${[{ id: 'a', label: 'Ledger', description: '…', votes: 142 }]}>
</ui-feature-voting>
<!-- preset of ui-vote-tally (not ui-poll): upvote + FLIP reorder -->`,
		pollWidgetExample: `
<ui-poll-widget
  .state.question=\${'Wanted surfaces'}
  .state.multiple=\${true}
  .state.items=\${[{ id: 'a', label: 'Mobile', votes: 154 }]}>
</ui-poll-widget>
<!-- preset of ui-poll: variant widget · buttonLabel Submit -->`,
		pulldownExample: `
this.emit('pulldown:toggle', { open: true });
<ui-pulldown .state.handlePosition=\${'bottom'} .state.dragToClose=\${true}>
  Sheet body
</ui-pulldown>
<!-- document-bus overlay — not safe always-open inline -->`,
		slideoutExample: `
<ui-slideout
  .state.side=\${'end'}
  .state.heading=\${'Inbox'}
  .state.showClose=\${true}
  .state.backdrop=\${true}
  .state.dragClose=\${true}>
  Panel body
</ui-slideout>
<!-- this.refs.pane.open() / close() / toggle() — uses ui-panel-header -->`,
		featureCarouselExample: `
<ui-feature-carousel .state.items=\${[
  { id: 'a', eyebrow: 'New', heading: 'Fast', description: '…', tone: 'accent' },
]}></ui-feature-carousel>
<!-- preset of ui-carousel: fade · dots · autoplay 3000 · advanceOnClick -->`,
		loadingCarouselExample: `
<ui-loading-carousel .state.items=\${[
  { id: 'a', eyebrow: 'Tip', heading: 'Wallets', description: '…', tone: 'accent' },
]}></ui-loading-carousel>
<!-- preset of ui-carousel: slide · progress · autoplay 4500 · arrows · loop -->`,
		youtubeExample: `
<ui-youtube-video-player
  .state.videoId=\${'aqz-KE-bpKQ'}
  .state.ageConfirm=\${true}
  .state.graphicConfirm=\${true}
  .state.videoTitle=\${'Big Buck Bunny'}
  .state.thumbnail=\${posterUrl}
  .state.playing=\${false}>
</ui-youtube-video-player>
<!-- facade poster until click — no iframe, no autoplay -->`,
		progressRingExample: `
<ui-progress-ring .state.value=\${72} .state.size=\${'lg'} .state.variant=\${'glow'}
  .state.animated=\${true} .state.thickness=\${10}
  .state.thresholds=\${[{ at: 90, tone: 'danger' }]}>
</ui-progress-ring>
<ui-progress-ring .state.min=\${0} .state.max=\${8} .state.value=\${5}
  .state.label=\${'peers'} .state.thickness=\${4}></ui-progress-ring>
<ui-progress-ring .state.indeterminate=\${true} .state.variant=\${'spin'}></ui-progress-ring>`,
		trackerExample: `
<ui-tracker
  .state.label=\${'Recent block finality'}
  .state.expandOnSelect=\${true}
  .state.openOnHover=\${true}
  .state.items=\${[
  { tone: 'success', label: 'ok', detail: 'Finalized in 1s' },
  { tone: 'warning', label: 'slow', detail: 'Peer lag 400ms' },
  { tone: 'danger', label: 'missed', detail: 'Slot skipped' },
]}
  @tracker:select=\${this.onSeg}></ui-tracker>
<!-- expandOnSelect default true: inline detail panel (no backdrop).
     openOnHover: while open, hover another segment to slide/morph detail.
     event.preventDefault() on tracker:select to hijack (modal/popover/etc).
     expandOnSelect:false → emit only. -->`,
		barListExample: `
<ui-bar-list .state.items=\${[
  { label: '0xA1…f2', value: 9410, href: '#/accounts/0xA1f2' },
  { label: '0xB7…c9', value: 6120 },
]} .state.tone=\${'accent'}></ui-bar-list>`,
		timelineExample: `
<ui-timeline .state.items=\${[
  { time: '12:04', label: 'Block sealed', tone: 'success', icon: 'check' },
  { time: '12:03', label: 'Slow finality', description: '1.8s', tone: 'warning' },
]} .state.orientation=\${'vertical'}></ui-timeline>`,
		jsonRowExample: `
<ui-json-inspector .data=\${payload}
  .state.expandDepth=\${1} .state.filter=\${'ok'} .state.copyPath=\${true}></ui-json-inspector>
<!-- child: keyLabel · isIndex · preview · type · depth · expandable · expanded · path · matched · copyPath -->`,
		jsonInspectorExample: `
<ui-json-inspector
  .data=\${blockPayload}
  .state.expandDepth=\${1}></ui-json-inspector>
<!-- .data is a plain accessor (identity-preserving), NOT .state.data -->
<!-- search filters to matches + ancestors · per-row copy-path · type tints -->`,
		heatmapMatrix: [
			[
				12, 4, 9, 22, 7,
			],
			[
				3, 18, 14, 0, 11,
			],
			[
				8, 25, 6, 17,
			],
			[
				1, 9, 13, 20, 28,
			],
		],
		heatmapMatrixRows: [
			'Validators',
			'Blocks',
			'Swaps',
			'Faucet',
		],
		heatmapMatrixCols: [
			'Mon',
			'Tue',
			'Wed',
			'Thu',
			'Fri',
		],
		heatmapCalendar: [
			{
				date: '2026-01-02',
				value: 4,
			},
			{
				date: '2026-01-07',
				value: 11,
			},
			{
				date: '2026-01-09',
				value: 2,
			},
			{
				date: '2026-01-15',
				value: 18,
			},
			{
				date: '2026-01-16',
				value: 6,
			},
			{
				date: '2026-01-23',
				value: 25,
			},
			{
				date: '2026-01-28',
				value: 9,
			},
			{
				date: '2026-02-03',
				value: 14,
			},
			{
				date: '2026-02-04',
				value: 5,
			},
			{
				date: '2026-02-11',
				value: 21,
			},
			{
				date: '2026-02-12',
				value: 8,
			},
			{
				date: '2026-02-19',
				value: 3,
			},
			{
				date: '2026-02-24',
				value: 16,
			},
			{
				date: '2026-02-25',
				value: 12,
			},
		],
		heatmapReadout: 'Click a cell · hover for tip',
		heatmapExample: `
<ui-heatmap .state.mode=\${'calendar'} .state.data=\${[
  { date: '2026-01-02', value: 4 }, { date: '2026-01-15', value: 18 },
]} .state.selectHighlight=\${true}
  @heatmap:select=\${this.handleHeatmapSelect}></ui-heatmap>
<ui-heatmap .state.data=\${[[12, 4, 9], [3, 18, 14]]}
  .state.rowLabels=\${['A', 'B']} .state.colLabels=\${['x', 'y', 'z']}></ui-heatmap>`,
		/* Google Maps + flight radar demos. Leave apiKey empty to exercise the
		   missing-key status UI; set state.mapsApiKey (or type into the field) to
		   load a live map. ui-map defaults to OpenStreetMap (no key). */
		mapsApiKey: '',
		mapDemoCenter: {
			lat: 37.7749,
			lng: -122.4194,
		},
		mapDemoZoom: 12,
		mapDemoItems: [
			{
				id: 'ferry',
				lat: 37.7955,
				lng: -122.3937,
				label: 'Ferry',
				description: 'Ferry Building',
			},
			{
				id: 'bridge',
				lat: 37.8199,
				lng: -122.4783,
				label: 'GGB',
				description: 'Golden Gate Bridge',
			},
			{
				id: 'park',
				lat: 37.7694,
				lng: -122.4862,
				label: 'Park',
				description: 'Golden Gate Park',
			},
			{
				id: 'mission',
				lat: 37.7599,
				lng: -122.4148,
				label: 'Mission',
				heading: 45,
				description: 'Mission District',
			},
		],
		mapDemoPolylines: [
			{
				id: 'bay-run',
				path: [
					{
						lat: 37.7955,
						lng: -122.3937,
					},
					{
						lat: 37.7879,
						lng: -122.4075,
					},
					{
						lat: 37.7694,
						lng: -122.4862,
					},
				],
				strokeColor: '#3b82f6',
				strokeWeight: 3,
			},
		],
		mapDemoActive: '',
		mapDemoReadout: '(click a marker)',
		mapDemoError: '',
		googleMapExample: `
<ui-map-google
  .state.apiKey=\${key}
  .state.center=\${{ lat: 37.77, lng: -122.42 }}
  .state.zoom=\${12}
  .state.fitItems=\${true}
  .state.items=\${[
    { id: 'ferry', lat: 37.7955, lng: -122.3937, label: 'Ferry' },
    { id: 'bridge', lat: 37.8199, lng: -122.4783, label: 'GGB' },
  ]}
  .state.polylines=\${[{ id: 'run', path: [/* lat/lng */] }]}
  @map-google:select=\${this.handleMapSelect}></ui-map-google>
// Two-way: el.state.activeIndex = 'ferry'  → pan + highlight`,
		uiMapDemoCenter: {
			lat: 51.47,
			lng: -0.46,
		},
		uiMapDemoZoom: 8,
		uiMapDemoItems: [
			{
				id: 'baw123',
				kind: 'flight',
				callsign: 'BAW123',
				label: 'BAW123',
				lat: 51.55,
				lng: -0.35,
				altitude: 9200,
				speed: 215,
				heading: 95,
				originCountry: 'United Kingdom',
				squawk: '6253',
			},
			{
				id: 'ezy882',
				kind: 'flight',
				callsign: 'EZY882',
				label: 'EZY882',
				lat: 51.38,
				lng: -0.55,
				altitude: 4100,
				speed: 160,
				heading: 270,
				originCountry: 'United Kingdom',
				squawk: '7041',
			},
			{
				id: 'crash1',
				kind: 'accident',
				label: 'M4 multi-vehicle',
				lat: 51.49,
				lng: -0.52,
				severity: 'high',
				vehicles: 4,
				injuries: 2,
				details: 'Westbound lanes blocked',
				status: 'active',
			},
			{
				id: 'crime1',
				kind: 'crime',
				label: 'Robbery report',
				lat: 51.51,
				lng: -0.3,
				offense: 'robbery',
				severity: 'medium',
				details: 'Retail theft in progress',
				status: 'responding',
			},
			{
				id: 'blast1',
				kind: 'explosion',
				label: 'Site blast',
				lat: 51.5,
				lng: -0.4,
				size: 'large',
				details: 'Controlled demolition near terminal',
				when: '2026-07-28T10:00:00Z',
			},
			{
				id: 'fire1',
				kind: 'fire',
				label: 'Warehouse fire',
				lat: 51.44,
				lng: -0.38,
				severity: 'high',
				units: 6,
				details: 'Smoke visible from A4',
				status: 'on scene',
			},
			{
				id: 'flood1',
				kind: 'flood',
				label: 'Underpass flood',
				lat: 51.46,
				lng: -0.48,
				severity: 'medium',
				details: 'Standing water · avoid',
			},
			{
				id: 'traffic1',
				kind: 'traffic',
				label: 'A30 queue',
				lat: 51.43,
				lng: -0.5,
				delay: '25 min',
				severity: 'medium',
				details: 'Congestion eastbound',
			},
			{
				id: 'meet1',
				kind: 'event',
				label: 'Gate meetup',
				lat: 51.47,
				lng: -0.46,
				details: 'Crew briefing',
				capacity: 40,
			},
			{
				id: 'lhr',
				kind: 'place',
				label: 'Heathrow',
				lat: 51.47,
				lng: -0.4543,
				details: 'LHR · main airport',
			},
		],
		uiMapDemoActive: '',
		uiMapDemoReadout: '(select an item)',
		// auto | openstreetmap | leaflet | openlayers | google
		uiMapDemoMapProvider: 'auto',
		uiMapExample: `
<ui-map
  .state.center=\${{ lat: 51.47, lng: -0.46 }}
  .state.mapProvider=\${'auto'}
  .state.listInView=\${true}
  .state.mapInView=\${true}
  .state.items=\${items}
  @map:select=\${this.handleItem}></ui-map>
// Outside click → map:  mapEl.goToItem(id)  ·  mapEl.goTo({ lat, lng })
// Template: .method.goToItem(\${id})
// listInView / mapInView default true (viewport-only list + markers)
// Kinds: flight, accident, crime, explosion, fire, flood, hazard, traffic,
//        medical, police, weather, sos, event, place, …
// Detail: kinds[k].fields | detailTag | auto key/value dump
// Hosts: ui-map-google · ui-map-leaflet · ui-map-openlayers · ui-map-openstreetmap · ui-map-opensky
// OpenSky: live ADS-B in view (map.opensky-network.org data via REST API)`,
		leafletExample: `
<ui-map-leaflet
  .state.center=\${{ lat: 37.77, lng: -122.42 }}
  .state.zoom=\${12}
  .state.fitItems=\${true}
  .state.items=\${[
    { id: 'ferry', lat: 37.7955, lng: -122.3937, label: 'Ferry' },
  ]}
  @map-leaflet:select=\${this.handlePick}></ui-map-leaflet>`,
		openlayersExample: `
<ui-map-openlayers
  .state.center=\${{ lat: 37.77, lng: -122.42 }}
  .state.zoom=\${12}
  .state.fitItems=\${true}
  .state.items=\${[
    { id: 'ferry', lat: 37.7955, lng: -122.3937, label: 'Ferry' },
  ]}
  @map-openlayers:select=\${this.handlePick}></ui-map-openlayers>`,
		openskyExample: `
<ui-map-opensky
  .state.center=\${{ lat: 51.47, lng: -0.46 }}
  .state.zoom=\${8}
  .state.pollMs=\${12000}
  .state.showTraffic=\${true}
  @map-opensky:select=\${this.handlePick}
  @map-opensky:traffic=\${this.handleTraffic}></ui-map-opensky>
// Live ADS-B from OpenSky REST API (bbox = current view)
// openInOpensky() → https://map.opensky-network.org/
// Rate-limited anonymous API — research/education use`,
		openskyDemoReadout: '(OpenSky live traffic in view)',
		openstreetmapExample: `
<ui-map-openstreetmap
  .state.center=\${{ lat: 51.505, lng: -0.09 }}
  .state.zoom=\${13}
  .state.layer=\${'standard'}
  .state.items=\${[{ id: 'a', lat: 51.5, lng: -0.09, label: 'Spot' }]}
  @map-openstreetmap:select=\${this.handlePick}></ui-map-openstreetmap>
// el.openInOsm() · await el.geocode('Berlin') · .state.layer=\${'humanitarian'|'cyclosm'|'topo'}`,
		leafletDemoReadout: '(click a marker)',
		openlayersDemoReadout: '(click a marker)',
		openstreetmapDemoReadout: '(click a marker · Open in OSM)',
		osmDemoLayer: 'standard',
		/* Dedicated Batch 4 hosts — distinct centers so pan idle cannot wasted-set
		   a shared object. Maps stay unmounted (no tiles) until a trigger. */
		showLeafletMap: false,
		showOpenLayersMap: false,
		showOsmMap: false,
		showGoogleMap: false,
		leafletLazyCenter: {
			lat: 37.7749,
			lng: -122.4194,
		},
		openlayersLazyCenter: {
			lat: 37.7749,
			lng: -122.4194,
		},
		osmLazyCenter: {
			lat: 51.505,
			lng: -0.09,
		},
		googleLazyCenter: {
			lat: 37.7749,
			lng: -122.4194,
		},
		leafletLazyItems: [
			{
				id: 'ferry',
				lat: 37.7955,
				lng: -122.3937,
				label: 'Ferry',
			},
			{
				id: 'bridge',
				lat: 37.8199,
				lng: -122.4783,
				label: 'GGB',
			},
		],
		openlayersLazyItems: [
			{
				id: 'ferry',
				lat: 37.7955,
				lng: -122.3937,
				label: 'Ferry',
			},
			{
				id: 'park',
				lat: 37.7694,
				lng: -122.4862,
				label: 'Park',
			},
		],
		osmLazyItems: [
			{
				id: 'bridge',
				lat: 51.5055,
				lng: -0.0754,
				label: 'Tower Bridge',
			},
			{
				id: 'eye',
				lat: 51.5033,
				lng: -0.1195,
				label: 'London Eye',
			},
		],
		googleLazyItems: [
			{
				id: 'ferry',
				lat: 37.7955,
				lng: -122.3937,
				label: 'Ferry',
			},
			{
				id: 'bridge',
				lat: 37.8199,
				lng: -122.4783,
				label: 'GGB',
			},
		],
		osmLazyLayer: 'standard',
		leafletLazyReadout: 'CDN Leaflet engine · OSM tiles · no key — mount to fetch',
		openlayersLazyReadout: 'CDN OpenLayers engine (not Leaflet) — mount to fetch',
		osmLazyReadout: 'Leaflet preset · layer + Nominatim + openInOsm() — mount to fetch',
		googleLazyReadout: 'Requires a Maps JS API key — paste above, then mount',
		navTriggerDemoItems: [
			{
				id: 'products',
				label: 'Products',
				links: [
					{
						id: 'wallet',
						label: 'Wallet',
						href: '#wallet',
					},
					{
						id: 'explorer',
						label: 'Explorer',
						href: '#explorer',
					},
				],
			},
			{
				id: 'apps',
				icon: 'layout-grid',
				tooltip: 'Apps',
				links: [
					{
						id: 'console',
						label: 'Console',
						href: '#console',
					},
				],
			},
			{
				id: 'docs',
				label: 'Docs',
				href: '#docs',
			},
			{
				id: 'off',
				label: 'Disabled',
				disabled: true,
			},
		],
		navPaneDemoItems: [
			{
				id: 'overview',
				label: 'Overview',
				links: [
					{
						id: 'intro',
						label: 'Intro',
						description: 'What the pane is',
						href: '#intro',
						icon: 'book-open',
					},
					{
						id: 'guide',
						label: 'Guide',
						description: 'How panes slide',
						href: '#guide',
						icon: 'layers',
					},
				],
			},
			{
				id: 'details',
				label: 'Details',
				links: [
					{
						id: 'fields',
						label: 'Fields',
						description: 'panelId · label · links · active',
						href: '#fields',
					},
				],
			},
		],
		navLinkDemoItems: [
			{
				id: 'links',
				label: 'Links',
				links: [
					{
						id: 'plain',
						label: 'Label only',
						href: '#plain',
					},
					{
						id: 'rich',
						label: 'With description',
						description: 'Child field: description',
						href: '#rich',
						icon: 'link',
					},
					{
						id: 'off',
						label: 'Disabled',
						href: '#off',
						disabled: true,
					},
				],
			},
		],
		mapLeafletExample: `
<ui-map-leaflet
  .state.center=\${{ lat: 37.77, lng: -122.42 }}
  .state.zoom=\${12}
  .state.items=\${[{ id: 'a', lat: 37.78, lng: -122.41, label: 'HQ' }]}
  @map-leaflet:select=\${this.handlePick}></ui-map-leaflet>
<!-- CDN Leaflet engine · default OSM tiles · no API key -->`,
		mapOpenLayersExample: `
<ui-map-openlayers
  .state.center=\${{ lat: 37.77, lng: -122.42 }}
  .state.zoom=\${12}
  .state.items=\${[{ id: 'a', lat: 37.78, lng: -122.41, label: 'HQ' }]}
  @map-openlayers:select=\${this.handlePick}></ui-map-openlayers>
<!-- CDN OpenLayers engine — not Leaflet -->`,
		mapOpenStreetMapExample: `
<ui-map-openstreetmap
  .state.layer=\${'standard'}
  .state.center=\${{ lat: 51.505, lng: -0.09 }}
  .state.zoom=\${13}
  .state.items=\${[{ id: 'a', lat: 51.5, lng: -0.09, label: 'Spot' }]}>
</ui-map-openstreetmap>
<!-- Leaflet preset: layer standard|humanitarian|cyclosm|topo · openInOsm() -->`,
		mapGoogleExample: `
<ui-map-google
  .state.apiKey=\${key}
  .state.center=\${{ lat: 37.77, lng: -122.42 }}
  .state.mapTypeId=\${'roadmap'}
  .state.items=\${[{ id: 'a', lat: 37.78, lng: -122.41, label: 'HQ' }]}>
</ui-map-google>
<!-- empty apiKey → status facade; no key is committed -->`,
		navLinkExample: `
<ui-nav-section .state.items=\${[{
  id: 'links', label: 'Links', links: [
    { id: 'a', label: 'With description', description: '…', icon: 'link', href: '#a' },
    { id: 'off', label: 'Disabled', disabled: true },
  ],
}]}></ui-nav-section>
<!-- child ui-nav-link: linkId · label · description · href · icon · disabled -->`,
		navPaneExample: `
<ui-nav-section .state.items=\${[{
  id: 'overview', label: 'Overview', links: [{ id: 'a', label: 'Intro', href: '#a' }],
}]}></ui-nav-section>
<!-- child ui-nav-pane: panelId · label · links · active + slideOffset (parent-stamped) -->`,
		navTriggerExample: `
<ui-nav-section .state.items=\${[
  { id: 'products', label: 'Products', links: [{ id: 'a', label: 'Wallet', href: '#a' }] },
  { id: 'docs', label: 'Docs', href: '#docs' },
  { id: 'apps', icon: 'layout-grid', tooltip: 'Apps', links: [] },
]}></ui-nav-section>
<!-- child ui-nav-trigger: itemId · label · href · icon · tooltip · disabled · chevron -->`,
		metricExample: `
<ui-metric
  .state.label=\${'TPS (peak)'} .state.value=\${'9,410'}
  .state.delta=\${12.4} .state.deltaTooltip=\${'vs. previous 24h'}
  .state.tooltip=\${'Peak transactions per second'}
  .state.values=\${[6, 7, 9, 11, 13, 14]}
  .state.tone=\${'accent'}>
</ui-metric>`,
		segmentStripExample: `
<ui-segment-strip .state.items=\${[
  { id: 'crews', icon: 'users', label: 'Local crews',
    description: 'Uniformed teams, marked trucks, accountable work.' },
  { id: 'tps', icon: 'activity', label: 'TPS', value: '9,410',
    hint: 'peak', tone: 'accent', description: '24h high watermark.' },
  { id: 'up', icon: 'shield-check', label: 'Uptime', value: '99.98%',
    tone: 'success', description: 'Rolling 30-day SLA.' },
]}></ui-segment-strip>`,
		segmentItemExample: `
<ui-segment-strip .state.interactive=\${true} .state.items=\${[
  { id: 'docs', icon: 'book', label: 'Docs', href: '#docs', hint: 'link', tone: 'accent' },
  { id: 'api', icon: 'terminal', label: 'API', value: 'v2', description: 'select', tone: 'info' },
  { id: 'hidden', label: 'Muted', muted: true },
]}></ui-segment-strip>
<!-- child: id · label · value · description · hint · icon · tone · href · interactive · muted -->`,
		segmentStripItems: [
			{
				id: 'crews',
				icon: 'users',
				label: 'Local crews',
				description: 'Uniformed teams, marked trucks, accountable work.',
				tone: 'success',
			},
			{
				id: 'tps',
				icon: 'activity',
				label: 'TPS',
				value: '9,410',
				hint: 'peak',
				tone: 'accent',
				description: '24h high watermark.',
			},
			{
				id: 'up',
				icon: 'shield-check',
				label: 'Uptime',
				value: '99.98%',
				tone: 'success',
				description: 'Rolling 30-day SLA.',
			},
		],
		segmentStripFacts: [
			{
				id: 'design',
				icon: 'shovel',
				label: 'Design → build',
				description: 'From walkways and sod to full outdoor transformations.',
				tone: 'info',
			},
			{
				id: 'consult',
				icon: 'badge-check',
				label: 'Free consults',
				description: 'Clear scopes, honest pricing, no oversell.',
				tone: 'accent',
			},
			{
				id: 'area',
				icon: 'map-pin',
				label: 'Service area',
				value: '3 counties',
				hint: 'NJ',
				description: 'Middlesex · Monmouth · Ocean.',
				tone: 'neutral',
			},
		],
		detailListExample: `
<ui-detail-list .state.columns=\${2} .state.items=\${[
  { label: 'Hash', value: '0x9f3a…c2', mono: true, copy: true },
  { label: 'Block', value: '4,182,907', mono: true },
  { label: 'Status', value: 'Confirmed' },
]}></ui-detail-list>`,
		kbdExample: `
<ui-kbd .state.values=\${['cmd', 'k']}></ui-kbd>
<ui-kbd .state.values=\${['ctrl', 'shift', 'p']}></ui-kbd>
<ui-kbd .state.values=\${['esc']}></ui-kbd>`,
		legendExample: `
<ui-legend .state.items=\${[
  { label: 'TPS',      color: 'var(--cyan)' },
  { label: 'Finality', color: 'var(--color-success)' },
  { label: 'Missed',   color: 'var(--color-danger)' },
]} .state.interactive=\${true}></ui-legend>`,
		kbdKeysCmdK: ['cmd', 'k'],
		kbdKeysCtrlShiftP: [
			'ctrl', 'shift', 'p',
		],
		kbdKeysAltEnter: ['alt', 'enter'],
		kbdKeysEsc: ['esc'],
		kbdKeysUpDown: ['up', 'down'],
		legendSeries: [
			{
				label: 'TPS',
				color: 'var(--cyan)',
			},
			{
				label: 'Finality',
				color: 'var(--color-success)',
			},
			{
				label: 'Missed',
				color: 'var(--color-danger)',
			},
		],
		buttonGroupExample: `
<ui-button-group>
  <ui-button .state=\${{ label: 'Day',   variant: 'outline' }}></ui-button>
  <ui-button .state=\${{ label: 'Week',  variant: 'outline' }}></ui-button>
  <ui-button .state=\${{ label: 'Month', variant: 'outline' }}></ui-button>
</ui-button-group>`,
		avatarExample: `
<ui-avatar .state.name=\${'Ada Lovelace'} .state.size=\${'lg'}
  .state.status=\${'online'} .state.badge=\${'admin'}></ui-avatar>
<ui-avatar .state.name=\${'0xA1f2…c4'} .state.shape=\${'square'}
  .state.status=\${'online'} .state.badge=\${'mod'}></ui-avatar>
<ui-avatar .state.initials=\${'VX'} .state.badge=\${'crown'}
  .state.badgeTone=\${'warning'}></ui-avatar>
<!-- badge: admin|mod|user preset, or a Lucide icon name + badgeTone.
     Status dot stays independent (online/away/busy/offline). -->`,
		toggleGroupExample: `
<ui-toggle-group .state.items=\${[
  { value: '1h', label: '1H' }, { value: '24h', label: '24H' }, { value: '7d', label: '7D' },
]} .state.value=\${'24h'}></ui-toggle-group>`,
		toggleOptionExample: `
<ui-toggle-group .state.value=\${'on'} .state.items=\${[
  { value: 'on', label: 'On' },
  { value: 'value-only' },
  { value: 'off', label: 'Off', disabled: true },
]}></ui-toggle-group>
<!-- child: value · label (falls back to value) · active (parent-stamped) · disabled -->`,
		stackExample: `
<ui-stack .state=\${{ orientation: 'horizontal', gap: 'sm' }}>
  <ui-button .state.label=\${'One'}></ui-button>
  <ui-button .state.label=\${'Two'}></ui-button>
</ui-stack>
<ui-stack .state=\${{ orientation: 'vertical', gap: 'md' }}>
  <ui-text .state.variant=\${'body'}>Stacked A</ui-text>
  <ui-text .state.variant=\${'body'}>Stacked B</ui-text>
</ui-stack>`,
		aiMessageExample: `
<ui-ai-message .state=\${{
  role: 'assistant',
  content: 'Settled in under 2s.',
}}></ui-ai-message>`,
		aiChromeExample: `
<ui-ai-suggestions .state.items=\${['Show balance', 'Recent txs']}></ui-ai-suggestions>
<ui-ai-typing .state.active=\${true}></ui-ai-typing>`,
		modalControlsExample: `
<ui-modal .state=\${{
  showClose: true,
  showMaximize: true,
  heading: 'Window',
}}>
  Body
</ui-modal>`,
		surfaceExample: `
<ui-surface .state=\${{ tone: 'panel', padding: 'lg', radius: 'lg', border: true }}>
  Panel surface
</ui-surface>`,
		dividerExample: `
<ui-divider></ui-divider>
<ui-divider .state.orientation=\${'vertical'}></ui-divider>
<ui-divider .state.label=\${'or'}></ui-divider>`,
		cardExample: `
<ui-card>
  <img slot="media" src="/media/hero.jpg" alt="" />
  <span slot="title">Title</span>
  Body copy
  <div slot="actions"><ui-button .state.label=\${'Open'}></ui-button></div>
</ui-card>`,
		panelExample: `
<ui-panel .state.heading=\${'Settings'}>
  Panel body
</ui-panel>`,
		panelHeaderExample: `
<ui-panel-header
  .state.heading=\${'Notifications'}
  .state.showClose=\${true}
  .state.closeLabel=\${'Dismiss'}
  @panel-header:close=\${this.handleClose}>
  <ui-icon slot="start" .state.name=\${'bell'} .state.size=\${'sm'}></ui-icon>
</ui-panel-header>`,
		tabsExample: `
<ui-tabs .state.items=\${[
  { id: 'a', label: 'Overview', active: true },
  { id: 'b', label: 'Activity' },
]} @tabs:change=\${this.onTab}></ui-tabs>`,
		tabButtonExample: `
<ui-tabs .state.items=\${[
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'wallet', label: 'Wallet', icon: 'wallet' },
  { id: 'label', label: 'Label only' },
]}></ui-tabs>
<!-- child: id · label · icon · active (parent-stamped) -->`,
		textExample: `
<ui-text .state.variant=\${'h3'} .state.tone=\${'accent'}>Heading</ui-text>
<ui-text .state.variant=\${'body'} .state.tone=\${'muted'}>Body copy</ui-text>`,
		iconExample: `
<ui-icon .state.name=\${'wallet'} .state.size=\${'md'}></ui-icon>`,
		iconButtonExample: `
<ui-icon-button .state=\${{ icon: 'settings', tooltip: 'Settings' }}
  @icon-button:click=\${this.openSettings}></ui-icon-button>`,
		buttonExample: `
<ui-button .state=\${{ label: 'Send', tone: 'primary' }}
  @button:click=\${this.handleSend}></ui-button>`,
		splitButtonExample: `
<ui-split-button .state=\${{
  label: 'Try for free',
  tone: 'primary',
  href: '/signup',
  items: [
    { label: 'API Console', value: 'console', href: '/console' },
    { label: 'Docs', value: 'docs', href: '/docs' },
  ],
}} @split-button:select=\${this.onAction}></ui-split-button>`,
		navSectionExample: `
<ui-nav-section .state.items=\${[
  { id: 'products', label: 'Products', links: [
    { id: 'chat', label: 'Chat', href: '/chat' },
  ]},
  { id: 'pricing', label: 'Pricing', href: '/pricing' },
]} @nav-section:select=\${this.onNav}></ui-nav-section>`,
		menuExample: `
<ui-menu .state.label=\${'Actions'} .state.items=\${[
  { label: 'Rename', value: 'rename' },
  { separator: true },
  { label: 'Delete', value: 'del', danger: true },
]} @menu:select=\${e => this.run(e.detail.data.value)}></ui-menu>`,
		menuItemExample: `
<ui-menu .state.label=\${'Item matrix'} .state.items=\${[
  { label: 'Rename', value: 'rename', kbd: '⌘R' },
  { label: 'Open docs', value: 'docs', href: '#docs' },
  { label: 'Pinned', value: 'pin', checked: true },
  { separator: true },
  { label: 'Archive', value: 'archive', disabled: true },
  { label: 'Delete', value: 'delete', danger: true, kbd: '⌫' },
]}></ui-menu>
<!-- child: label · value · kbd · href · checked · separator · disabled · danger -->`,
		contextMenuExample: `
<ui-context-menu .state.items=\${[
  { label: 'Open', value: 'open' },
  { label: 'Delete', value: 'del', danger: true },
]} @menu:select=\${this.onCtx}>
  <div class="card">Right-click me</div>
</ui-context-menu>`,
		menubarExample: `
<ui-menubar .state.menus=\${[
  { label: 'File', items: [{ label: 'New', value: 'new' }] },
  { label: 'Edit', items: [{ label: 'Undo', value: 'undo' }] },
]} @menu:select=\${this.onMenu}></ui-menubar>`,
		modalExample: `
<ui-modal #modal .state.showClose=\${true}>
  <ui-surface .state=\${{ tone: 'popup', padding: 'lg' }}>
    Confirm transfer
    <ui-stack .state=\${{ orientation: 'horizontal', gap: 'sm', justify: 'end' }}>
      <ui-button .state.label=\${'Cancel'} @button:click=\${() => this.refs.modal.close()}></ui-button>
      <ui-button .state=\${{ label: 'Confirm', tone: 'primary' }}></ui-button>
    </ui-stack>
  </ui-surface>
</ui-modal>
<!-- this.refs.modal.open() -->`,
		commandItems: COMMAND_DEMO_ITEMS,
		commandItemDemoItems: cloneCommandItems(COMMAND_DEMO_ITEMS),
		commandReadout: '',
		commandExample: `
<ui-command #palette .state.items=\${items} @command:select=\${this.onPick}>
</ui-command>
<!-- closed at rest — this.refs.palette.open() or hotkey mod+k -->`,
		fabExample: `
<ui-fab .state.icon=\${'plus'} .state.position=\${'static'}
  @fab:click=\${this.compose}></ui-fab>`,
		speedDialExample: `
<ui-speed-dial .state=\${{
  icon: 'plus',
  position: 'static',
  direction: 'up',
  items: [
    { icon: 'file', label: 'New file', value: 'file' },
    { icon: 'folder', label: 'Folder', value: 'folder' },
  ],
}} @speed-dial:action=\${this.onDial}></ui-speed-dial>`,
		speedDialActionExample: `
<ui-speed-dial .state.direction=\${'up'} .state.position=\${'static'}
  .state.open=\${true}
  .state.items=\${[
    { icon: 'file', label: 'File', value: 'file', tone: 'neutral' },
    { icon: 'folder', label: 'Folder', value: 'folder', tone: 'primary' },
    { icon: 'star', label: 'Star', value: 'star', tone: 'success' },
    { icon: 'trash-2', label: 'Delete', value: 'delete', tone: 'danger' },
  ]}></ui-speed-dial>
<!-- child: icon · label · value · tone
     parent: direction is the request; resolvedDirection drives data-direction -->`,
		inputExample: `
<ui-input .state=\${{
  placeholder: 'you@example.com',
  type: 'email',
  placeholderCase: 'upper',
  autocomplete: 'email',
  inputmode: 'email',
  maxlength: 64,
}} $value="email"></ui-input>
<!-- placeholderCase: upper | first | lower | none · date/time pickers inherit color-scheme -->`,
		fieldExample: `
<ui-field .state.label=\${'Name'} .state.hint=\${'As shown on your wallet'}>
  <ui-input $value="name"></ui-input>
</ui-field>
<ui-field .state.label=\${'Username'} .state.floatLabel=\${true}>
  <ui-input $value="username"></ui-input>
</ui-field>`,
		meterGroupExample: `
<ui-meter-group .state.items=\${[
  { id: 'apps', label: 'Apps', value: 16, icon: 'app-window', tone: 'accent' },
  { id: 'media', label: 'Media', value: 24, icon: 'image', tone: 'success' },
  { id: 'system', label: 'System', value: 10, icon: 'cpu', tone: 'warning' },
]} .state.showIcon=\${true} @meter-group:select=\${this.onMeter}></ui-meter-group>`,
		compareExample: `
<ui-compare .state.beforeSrc=\${before} .state.afterSrc=\${after}
  .state.value=\${50} @compare:change=\${this.onCompare}></ui-compare>`,
		fieldsetExample: `
<ui-fieldset .state.heading=\${'Invoice #1024'} .state.toggleable=\${true}
  .state.open=\${this.state.open} .state.icon=\${'minus'}
  .state.iconCollapsed=\${'plus'} @fieldset:toggle=\${this.onFieldset}>
  <p>Collapsible body.</p>
</ui-fieldset>`,
		selectExample: `
<ui-select .state=\${{
  value: 'usd',
  options: [
    { value: 'usd', label: 'USD' },
    { value: 'eur', label: 'EUR' },
  ],
}} @select:change=\${this.onCurrency}></ui-select>`,
		badgeExample: `
<ui-badge .state=\${{ label: '3', tone: 'danger' }}></ui-badge>`,
		chipExample: `
<ui-chip .state.label=\${'Filter on'} .state.interactive=\${true} .state.selected=\${true}></ui-chip>
<ui-chip .state.label=\${'Both'} .state.interactive=\${true} .state.selected=\${true}
  .state.removable=\${true}></ui-chip>`,
		spinnerExample: `
<ui-spinner .state.size=\${'md'}></ui-spinner>`,
		skeletonExample: `
<ui-skeleton .state=\${{ width: '12rem', height: '1rem' }}></ui-skeleton>`,
		emptyStateExample: `
<ui-empty-state .state=\${{
  heading: 'No transactions yet',
  description: 'Send or receive to see activity here.',
  icon: 'inbox',
}}></ui-empty-state>`,
		statusIndicatorExample: `
<ui-status-indicator .state.status=\${'online'}></ui-status-indicator>`,
		paginationExample: `
<ui-pagination .state=\${{ page: 1, pageCount: 12 }}
  @pagination:change=\${this.onPage}></ui-pagination>`,
		closeButtonExample: `
<ui-close-button @close-button:click=\${this.dismiss}></ui-close-button>`,
		toTopExample: `
<ui-go-to .state.direction=\${'top'} .state.position=\${'static'}></ui-go-to>
<ui-to-top></ui-to-top> <!-- alias of ui-go-to direction=top -->
<ui-to-bottom .state.position=\${'static'}></ui-to-bottom>
<ui-to-adaptive .state.position=\${'static'}></ui-to-adaptive>
<ui-to-left .state.position=\${'static'}></ui-to-left>
<ui-to-right .state.position=\${'static'}></ui-to-right>`,
		stepperExample: `
<ui-stepper .state=\${{
  activeIndex: 1,
  items: [
    { label: 'Account' },
    { label: 'Verify' },
    { label: 'Done' },
  ],
}}></ui-stepper>`,
		radioGroupExample: `
<ui-radio-group .state=\${{
  name: 'plan',
  value: 'pro',
  items: [
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro' },
  ],
}} @radio-group:change=\${this.onPlan}></ui-radio-group>`,
		radioOptionExample: `
<ui-radio-group .state.legend=\${'Child fields'} .state.value=\${'a'}
  .state.items=\${[
    { value: 'a', label: 'Label only' },
    { value: 'b', label: 'Described', description: 'Child field: description' },
    { value: 'c', label: 'Disabled', disabled: true },
  ]}></ui-radio-group>
<!-- child: value · label · description · disabled -->`,
		pinInputExample: `
<ui-pin-input .state.length=\${6} @pin-input:complete=\${this.onPin}></ui-pin-input>`,
		numberStepperExample: `
<ui-number-stepper .state=\${{ value: 1, min: 0, max: 99 }}
  @number-stepper:change=\${this.onQty}></ui-number-stepper>`,
		toolbarExample: `
<ui-toolbar .state.items=\${[
  { icon: 'bold', id: 'bold' },
  { icon: 'italic', id: 'italic' },
]} @icon-button:click=\${this.onTool}></ui-toolbar>`,
		barExample: `
<ui-bar>
  <span slot="start">Left</span>
  <span slot="center">Center</span>
  <span slot="end">Right</span>
</ui-bar>`,
		floatingPanelExample: `
<ui-floating-panel .state.label=\${'Filters ▾'} .state.heading=\${'Filter'}>
  Filter body
</ui-floating-panel>`,
		popoverExample: `
<ui-popover .state.label=\${'Account ▾'} .state.heading=\${'Signed in'}
  .state.description=\${'Manage wallet'} .state.side=\${'bottom'} .state.align=\${'center'}
  .state.showArrow=\${true} .state.offset=\${8}>
  Menu body
</ui-popover>
<!-- openOnHover · openDelay · closeDelay · side top|bottom|left|right · align start|center|end -->`,
		expandableCardExample: `
<ui-expandable-card .state.heading=\${'Validator details'}>
  Expanded content
</ui-expandable-card>`,
		morphDrawerExample: `
<ui-morph-drawer .state.label=\${'Details'} .state.heading=\${'Node'}>
  Drawer body
</ui-morph-drawer>`,
		notificationExample: `
// Imperative host API (from any component):
this.notify({ title: 'Settled', body: 'Tx confirmed', tone: 'success' });`,
		toastExample: `
// Mount once (e.g. app shell / preview root):
// <ui-toast #toaster .state.limit=\${5}></ui-toast>
this.refs.toaster.show({
  title: 'Event created',
  description: 'Sunday, December 3 at 9:00 AM',
  itemType: 'success',
});
// itemType: default | success | info | warning | error | loading
// timeout: ms (0 sticky; loading defaults to 0)
// position: bottom-center | bottom-start | bottom-end | top-center | top-start | top-end
// limit: max visible stack (default 5)`,
		toastItemExample: `
<ui-toast-item .state=\${{
  title: 'Saved', description: 'Changes live.', itemType: 'success', timeout: 0,
}}></ui-toast-item>
<!-- itemType · title · description · actionLabel · timeout 0 · exiting — inline, no portal -->`,
		messageExample: `
<ui-message .state.author=\${'user'} .state.content=\${'Ship it.'}></ui-message>
<ui-message .state.author=\${'assistant'} .state.content=\${'Done.'} .state.time=\${Date.now()}></ui-message>
<ui-message-scroller .state.items=\${thread} .state.stick=\${true} .state.maxHeight=\${'12rem'}></ui-message-scroller>
<!-- author user|assistant|system · stick (scroller) · maxHeight -->`,
		comboboxOptionExample: `
<ui-combobox .state.open=\${true} .state.items=\${[
  { value: 'viat', label: 'Viat' },
  { value: 'btc', label: 'Bitcoin', disabled: true },
]}></ui-combobox>
<!-- child ui-combobox-option: value · label · disabled · active (parent-stamped) -->`,
		commandItemExample: `
<ui-command .state.open=\${true} .state.items=\${[
  { label: 'Copy', value: 'copy', kbd: 'mod+c', group: 'Edit', icon: 'copy' },
  { separator: true, value: 'sep' },
  { label: 'Settings', value: 'settings', disabled: true, group: 'Navigate', icon: 'settings' },
]}></ui-command>
<!-- child ui-command-item: label · value · kbd · group · icon · disabled · separator · active -->`,
		tableRowExample: `
<ui-table .state.density=\${'sm'} .state.columns=\${columns} .state.items=\${rows}
  @table:row-click=\${this.onRow}></ui-table>
<!-- child ui-table-row: index + column keys · table-row:click / table:row-click -->`,
		notificationItemExample: `
<ui-notification-item .state=\${{
  itemType: 'default', heading: 'Settled', message: 'Tx confirmed', timeout: 0,
}}></ui-notification-item>
<!-- itemType · heading · message · timeout · muted · seen — inline, no toast portal -->`,
		notificationCenterItemExample: `
<ui-notification-center-item .state=\${{
  itemType: 'default', heading: 'Unseen', message: 'New settlement', seen: false,
}}></ui-notification-center-item>
<!-- itemType · heading · message · muted · seen — inline, no center overlay -->`,
		dockExample: `
<ui-dock .state=\${{
  orientation: 'vertical',
  items: [
    { id: 'wallet', icon: 'wallet', label: 'Wallet' },
    { id: 'explore', icon: 'compass', label: 'Explore' },
  ],
  activeIndex: 'wallet',
}} @dock:select=\${this.onDock}></ui-dock>`,
		dockIconButtonExample: `
<ui-dock .state.orientation=\${'horizontal'} .state.activeIndex=\${'explore'}
  .state.items=\${[
    { id: 'wallet', icon: 'wallet', tooltip: 'Wallet', size: 'sm' },
    { id: 'explore', icon: 'compass', tooltip: 'Explore', size: 'md', tone: 'primary' },
    { id: 'users', icon: 'users', tooltip: 'Accounts', size: 'lg', circle: true },
    { id: 'off', icon: 'lock', tooltip: 'Disabled', disabled: true },
  ]}></ui-dock>
<!-- child (IconButtonBase + DockIconButton): icon · tooltip · size · tone · circle · disabled · emitName=dock:select -->`,
		appBarExample: `
<ui-app-bar>
  <span slot="brand">Viat</span>
  <ui-icon-button slot="end" .state.icon=\${'bell'}></ui-icon-button>
</ui-app-bar>`,
		statusBarExample: `
<ui-status-bar .state.items=\${[
  { label: 'Network', value: 'Mainnet' },
  { label: 'Peers', value: '42' },
]}></ui-status-bar>`,
		statusCellExample: `
<ui-status-bar .state.items=\${[
  { label: 'Network', value: 'MAINNET' },
  { label: 'Health', value: 'OK', valueClass: 'good' },
]}></ui-status-bar>
<!-- child: label · value · valueClass -->`,
		loadingBarExample: `
<ui-loading-bar .state=\${{ value: 0.42, indeterminate: false }}></ui-loading-bar>`,
		animatedNumberExample: `
<ui-animated-number .state=\${{ value: 1284.5, decimals: 1 }}></ui-animated-number>`,
		statTableExample: `
<ui-stat-table .state=\${{
  columns: [{ key: 'name', label: 'Name' }, { key: 'tps', label: 'TPS' }],
  items: [{ name: 'Alpha', tps: 120 }, { name: 'Beta', tps: 98 }],
}}></ui-stat-table>`,
		collectionExample: `
<ui-collection .state=\${{
  loader: this.loadPage,
  renderRow: this.row,
  keyFn: item => item.id,
  virtual: true,
  estimatedHeight: 40,
}}></ui-collection>`,
		imageListExample: `
<ui-image-list .state.items=\${[
  { src: '/a.jpg', alt: 'A' },
  { src: '/b.jpg', alt: 'B' },
]}></ui-image-list>`,
		imageCellExample: `
<ui-image-list .state.columns=\${3} .state.items=\${[
  { src: '/a.jpg', alt: 'Plain', title: 'Caption' },
  { src: '/b.jpg', alt: 'Link', href: '#docs' },
]}></ui-image-list>
<!-- child: src · alt · title · href -->`,
		treeExample: `
<ui-tree .state.items=\${nodes} .state.expandDepth=\${1}
  @tree:select=\${this.onPick}></ui-tree>`,
		treeNodeExample: `
<ui-tree .state.items=\${nodes} .state.expandDepth=\${1}></ui-tree>
<!-- child ui-tree-node: id · label · icon · depth · expandable · expanded · selected -->`,
		treeSelectExample: `
<ui-tree-select .state.items=\${nodes} .state.placeholder=\${'Pick a file'}
  @tree-select:change=\${this.onPick}></ui-tree-select>`,
		treeTableExample: `
<ui-tree-table .state.items=\${rows} .state.columns=\${[
  { key: 'label', label: 'Name' },
  { key: 'size', label: 'Size', align: 'end' },
]}></ui-tree-table>`,
		treeTableRowExample: `
<ui-tree-table .state.items=\${rows} .state.columns=\${cols}></ui-tree-table>
<!-- child ui-tree-table-row: id · label · depth · cells -->`,
		pickListExample: `
<ui-pick-list .state.items=\${avail} .state.target=\${chosen}
  .state.reorderTarget=\${true}
  @pick-list:change=\${this.onPick}
  @pick-list:reorder=\${this.onReorder}></ui-pick-list>`,
		pickItemExample: `
<ui-pick-list .state.items=\${avail} .state.target=\${chosen}></ui-pick-list>
<!-- child ui-pick-item: id · label · selected -->`,
		orderListExample: `
<ui-order-list .state.items=\${[{ id: 'a', label: 'Alpha' }]}
  @order-list:change=\${this.onOrder}></ui-order-list>`,
		orderItemExample: `
<ui-order-list .state.items=\${items} .state.heading=\${'Priority'}></ui-order-list>
<!-- child ui-order-item: id · label · drag handle + up/down -->`,
		orgChartExample: `
<ui-org-chart .state.items=\${[{ id: 'ceo', label: 'Ava', author: 'CEO', children: [] }]}
  @org-chart:select=\${this.onPick}></ui-org-chart>
<!-- aliases: name→label · title→author (string fields only) -->`,
		orgNodeExample: `
<ui-org-chart .state.items=\${org}></ui-org-chart>
<!-- child ui-org-node: id · label||name · author||title · icon · children · expanded -->`,
		imageExample: `
<ui-image .state.src=\${url} .state.alt=\${'Hero'} .state.radius=\${'lg'}
  .state.shadow=\${'md'} .state.preview=\${true}></ui-image>`,
		galleryExample: `
<ui-gallery .state.items=\${shots}
  .state.layout=\${'viewer'}
  .state.showThumbs=\${true}
  .state.showFlip=\${true}
  .state.showZoom=\${true}
  .state.showRotate=\${true}
  .state.showDownload=\${true}></ui-gallery>`,
		galleryThumbExample: `
<ui-gallery .state.items=\${shots} .state.layout=\${'grid'} .state.columns=\${3}></ui-gallery>
<!-- child ui-gallery-thumb: src · alt · label · active -->`,
		audioPlayerExample: `
<ui-audio-player .state.src=\${url} .state.heading=\${'Track'}
  .state.artist=\${'Artist'} .state.artwork=\${'cover'}></ui-audio-player>`,
		masonryExample: `
<ui-masonry .state=\${{ columns: 3, gap: 'md' }}>
  <img src="/a.jpg" alt="" />
  <img src="/b.jpg" alt="" />
</ui-masonry>`,
		themeSelectExample: `
<ui-theme-select></ui-theme-select>`,
		whiteboxModalExample: `
<ui-whitebox-modal #box>
  <img src="/hero.jpg" alt="Preview" />
</ui-whitebox-modal>
<!-- this.refs.box.open() -->`,
		loadingScreenExample: `
<ui-loading-screen .state=\${{ open: true, label: 'Syncing…' }}></ui-loading-screen>`,
		bootScreenExample: `
<ui-boot-screen .state=\${{ title: 'Viat', subtitle: 'Starting…' }}></ui-boot-screen>`,
		controlCenterTileExample: `
<ui-control-center-tile .state=\${{
  itemId: 'wifi', label: 'Wi-Fi', icon: 'wifi', checked: true,
}}></ui-control-center-tile>
<!-- itemId · label · icon · checked · disabled · tone — inline, no overlay -->`,
		controlCenterRowExample: `
<ui-control-center-row .state=\${{
  itemId: 'focus', label: 'Focus', icon: 'radio', description: 'Silence alerts',
}}></ui-control-center-row>
<!-- itemId · label · icon · description · checked · disabled — inline, no overlay -->`,
		controlCenterExample: `
<ui-control-center .state.open=\${true}></ui-control-center>`,
		sidebarExample: `
<ui-sidebar .state=\${{ mode: 'flyout', side: 'right' }}>
  <nav>Sidebar links</nav>
</ui-sidebar>`,
		confirmExample: `
const ok = await this.confirm('Delete this wallet?');
if (ok) this.destroyWallet();`,
		bgBtnDay: {
			label: 'Day',
			variant: 'outline',
		},
		bgBtnWeek: {
			label: 'Week',
			variant: 'outline',
		},
		bgBtnMonth: {
			label: 'Month',
			variant: 'outline',
		},
		toggleRangeItems: [
			{
				value: '1h',
				label: '1H',
			},
			{
				value: '24h',
				label: '24H',
			},
			{
				value: '7d',
				label: '7D',
			},
			{
				value: '30d',
				label: '30D',
			},
		],
		toggleViewItems: [
			{
				value: 'list',
				label: 'List',
			},
			{
				value: 'grid',
				label: 'Grid',
			},
			{
				value: 'graph',
				label: 'Graph',
			},
		],
		toggleViewActive: ['grid'],
		toggleOptionDemoItems: [
			{
				value: 'on',
				label: 'On',
			},
			{
				value: 'value-only',
			},
			{
				value: 'off',
				label: 'Off',
				disabled: true,
			},
		],
		segmentItemDemoItems: [
			{
				id: 'icon-label',
				icon: 'wallet',
				label: 'Label + icon',
				tone: 'accent',
			},
			{
				id: 'valued',
				icon: 'activity',
				label: 'TPS',
				value: '9,410',
				hint: 'peak',
				description: '24h high',
				tone: 'success',
			},
			{
				id: 'warn',
				icon: 'triangle-alert',
				label: 'Alerts',
				value: '3',
				hint: 'open',
				tone: 'warning',
			},
			{
				id: 'danger',
				icon: 'shield-alert',
				label: 'Incidents',
				value: '1',
				tone: 'danger',
			},
			{
				id: 'info',
				icon: 'info',
				label: 'Info',
				tone: 'info',
			},
			{
				id: 'neutral',
				icon: 'circle',
				label: 'Neutral',
				tone: 'neutral',
			},
		],
		segmentItemLinkItems: [
			{
				id: 'docs',
				icon: 'book',
				label: 'Docs',
				href: '#docs',
				hint: 'link',
				tone: 'accent',
			},
			{
				id: 'api',
				icon: 'terminal',
				label: 'API',
				value: 'v2',
				description: 'Interactive select',
				tone: 'info',
			},
			{
				id: 'hidden',
				icon: 'eye-off',
				label: 'Muted',
				muted: true,
			},
		],
		tabButtonDemoItems: [
			{
				id: 'home',
				label: 'Home',
				icon: 'home',
			},
			{
				id: 'wallet',
				label: 'Wallet',
				icon: 'wallet',
			},
			{
				id: 'label',
				label: 'Label only',
			},
		],
		menuItemDemoItems: [
			{
				label: 'Rename',
				value: 'rename',
				kbd: '⌘R',
			},
			{
				label: 'Open docs',
				value: 'docs',
				href: '#docs',
			},
			{
				label: 'Pinned',
				value: 'pin',
				checked: true,
			},
			{
				separator: true,
			},
			{
				label: 'Archive',
				value: 'archive',
				disabled: true,
			},
			{
				label: 'Delete',
				value: 'delete',
				danger: true,
				kbd: '⌫',
			},
		],
		dockIconDemoItems: [
			{
				id: 'wallet',
				icon: 'wallet',
				tooltip: 'Wallet sm',
				size: 'sm',
			},
			{
				id: 'explore',
				icon: 'compass',
				tooltip: 'Explore md',
				size: 'md',
				tone: 'primary',
			},
			{
				id: 'users',
				icon: 'users',
				tooltip: 'Accounts lg',
				size: 'lg',
				circle: true,
			},
			{
				id: 'off',
				icon: 'lock',
				tooltip: 'Disabled',
				disabled: true,
			},
		],
		dockIconDemoActive: 'explore',
		speedDialActionUp: [
			{
				icon: 'file',
				label: 'File',
				value: 'file-up',
				tone: 'neutral',
			},
			{
				icon: 'folder',
				label: 'Folder',
				value: 'folder-up',
				tone: 'primary',
			},
			{
				icon: 'star',
				label: 'Star',
				value: 'star-up',
				tone: 'success',
			},
			{
				icon: 'trash-2',
				label: 'Delete',
				value: 'delete-up',
				tone: 'danger',
			},
		],
		speedDialActionDown: [
			{
				icon: 'file',
				label: 'File',
				value: 'file-down',
				tone: 'neutral',
			},
			{
				icon: 'folder',
				label: 'Folder',
				value: 'folder-down',
				tone: 'primary',
			},
			{
				icon: 'star',
				label: 'Star',
				value: 'star-down',
				tone: 'success',
			},
		],
		speedDialActionLeft: [
			{
				icon: 'file',
				label: 'File',
				value: 'file-left',
				tone: 'neutral',
			},
			{
				icon: 'folder',
				label: 'Folder',
				value: 'folder-left',
				tone: 'primary',
			},
			{
				icon: 'star',
				label: 'Star',
				value: 'star-left',
				tone: 'success',
			},
		],
		speedDialActionRight: [
			{
				icon: 'file',
				label: 'File',
				value: 'file-right',
				tone: 'neutral',
			},
			{
				icon: 'folder',
				label: 'Folder',
				value: 'folder-right',
				tone: 'primary',
			},
			{
				icon: 'star',
				label: 'Star',
				value: 'star-right',
				tone: 'success',
			},
		],
		/* Gallery nav.
		   `filterCategory` — click only: which demos/sections are visible (`all` = everything).
		   `activeCategory` — rail highlight from click + scroll-spy (never filters alone).
		   `navQuery` — live name filter. Category ids match demo `data-cat` / `.cat-section`.
		   `active` on each row is deep-written for the rail.
		   Nav shell is <ui-sidebar> (left); open state is attrs.open on that CE.
		   Default OFF `all`: All mounts ~3.3k CEs / ~174k px scrollHeight and
		   All→category can be a ~1s longtask (hide 13 fat sections). Start on
		   one section so first paint + mobile scroll stay viable. */
		filterCategory: 'layout',
		activeCategory: 'layout',
		navQuery: '',
		categories: [
			{
				id: 'all',
				label: 'All',
				icon: 'layout-grid',
				active: false,
			},
			{
				id: 'layout',
				label: 'Layout',
				icon: 'layout-dashboard',
				active: true,
			},
			{
				id: 'typography',
				label: 'Typography',
				icon: 'type',
				active: false,
			},
			{
				id: 'forms',
				label: 'Forms',
				icon: 'text-cursor-input',
				active: false,
			},
			{
				id: 'actions',
				label: 'Actions',
				icon: 'square-mouse-pointer',
				active: false,
			},
			{
				id: 'feedback',
				label: 'Feedback',
				icon: 'activity',
				active: false,
			},
			{
				id: 'data',
				label: 'Data',
				icon: 'table',
				active: false,
			},
			{
				id: 'charts',
				label: 'Charts',
				icon: 'chart-line',
				active: false,
			},
			{
				id: 'maps',
				label: 'Maps',
				icon: 'map',
				active: false,
			},
			{
				id: 'media',
				label: 'Media',
				icon: 'clapperboard',
				active: false,
			},
			{
				id: 'ai',
				label: 'AI',
				icon: 'sparkles',
				active: false,
			},
			{
				id: 'overlays',
				label: 'Overlays',
				icon: 'layers',
				active: false,
			},
			{
				id: 'shell',
				label: 'Shell',
				icon: 'panels-top-left',
				active: false,
			},
			{
				id: 'concepts',
				label: 'State Flow',
				icon: 'git-branch',
				active: false,
			},
			{
				id: 'patterns',
				label: 'Patterns',
				icon: 'waypoints',
				active: false,
			},
		],
		aiAssistantContent: '## Swap quote\n\nHere is the **route** for your swap:\n\n- via UDSP relay\n- est. fee `0.002 VIAT`\n\n```js\nconst quote = await viat.swap({ from: "VIAT", to: "UDSP" });\nconsole.log(quote.rate);\n```\n\nProceed when ready.',
		aiReasoningText: 'User wants a swap quote.\n1. Check liquidity on the UDSP relay.\n2. Compute fee = base + slippage.\n3. Return a concise route summary.',
		aiPlanSteps: [
			{
				label: 'Fetch balance',
				status: 'done',
			},
			{
				label: 'Compute swap route',
				status: 'active',
				detail: 'estimating via UDSP relay',
			},
			{
				label: 'Submit transaction',
				status: 'pending',
			},
		],
		aiToolArgs: {
			account: 'main',
			include: ['pending'],
		},
		aiToolResult: {
			amount: '250,000',
			symbol: 'VIAT',
		},
		aiSources: [
			{
				title: 'Viat whitepaper — settlement',
				url: 'https://viat.example/whitepaper',
				snippet: 'Post-quantum settlement with native DNS.',
			},
			{
				title: 'UDSP transport spec',
				url: 'https://viat.example/udsp',
			},
		],
		aiInquireOptions: [
			'Mainnet',
			{
				label: 'Testnet',
				value: 'test',
			},
		],
		aiSuggestionItems: [
			{
				label: 'Swap quote VIAT → UDSP',
				value: 'Get me a swap quote for VIAT → UDSP',
				icon: 'arrow-left-right',
			},
			{
				label: 'Explain UDSP',
				value: 'Explain UDSP in one paragraph',
				icon: 'book-open',
			},
			{
				label: 'Wallet balance',
				value: 'What is my main wallet balance?',
				icon: 'wallet',
			},
		],
		aiModelItems: [
			{
				value: 'local-model',
				label: 'Local model',
			},
			{
				value: 'grok-4',
				label: 'Grok 4',
			},
		],
		aiExportItems: [
			{
				role: 'user',
				author: 'user',
				content: 'Get me a swap quote for VIAT → UDSP',
			},
			{
				role: 'assistant',
				author: 'assistant',
				content: 'Here is a sample route via UDSP relay.',
			},
		],
		aiSearchQuery: '',
		/* Batch 5 fixtures — no endpoint, no live stream. Distinct arrays where
		   the child mutates (inquire / approval / feedback). */
		aiChatDemoItems: [
			{
				id: 'u1',
				role: 'user',
				author: 'user',
				content: 'What is UDSP?',
			},
			{
				id: 'a1',
				role: 'assistant',
				author: 'assistant',
				content: 'UDSP is the transport. Settlement stays on VIAT.',
				reasoning: 'One-line definition; no tool call.',
				streaming: false,
			},
		],
		aiChatDemoSuggestions: [
			{
				label: 'Explain UDSP',
				value: 'Explain UDSP',
				icon: 'book-open',
			},
			{
				label: 'Wallet balance',
				value: 'What is my balance?',
				icon: 'wallet',
			},
		],
		aiChatDemoModels: [
			{
				value: 'local-model',
				label: 'Local model',
			},
			{
				value: 'fixture-7b',
				label: 'Fixture 7B',
			},
		],
		aiInquireChoiceItems: [
			'Mainnet',
			{
				label: 'Testnet',
				value: 'test',
			},
		],
		aiApprovalPendingArgs: {
			to: 'bob.viat',
			amount: '100',
			symbol: 'VIAT',
		},
		aiToolRunningArgs: {
			account: 'main',
		},
		aiToolDoneArgs: {
			account: 'main',
		},
		aiToolDoneResult: {
			amount: '250,000',
			symbol: 'VIAT',
		},
		aiToolErrorArgs: {
			hash: '0xdead',
		},
		aiToolErrorResult: {
			error: 'not found',
		},
		aiPlanDemoItems: [
			{
				id: 's1',
				label: 'Fetch balance',
				status: 'done',
			},
			{
				id: 's2',
				label: 'Compute route',
				status: 'active',
				detail: 'via UDSP relay',
			},
			{
				id: 's3',
				label: 'Sign payload',
				status: 'pending',
			},
			{
				id: 's4',
				label: 'Broadcast',
				status: 'error',
				detail: 'fixture failure',
			},
		],
		aiSourcesDemoItems: [
			{
				id: 'wp',
				title: 'Viat whitepaper',
				url: 'https://viat.example/whitepaper',
				snippet: 'Post-quantum settlement.',
			},
			{
				id: 'udsp',
				title: 'UDSP spec',
				url: 'https://viat.example/udsp',
			},
		],
		aiSuggestionDemoItems: [
			{
				label: 'Swap quote',
				value: 'Get a swap quote',
				icon: 'arrow-left-right',
			},
			{
				label: 'Plain chip',
				value: 'plain',
			},
		],
		aiModelDemoItems: [
			{
				value: 'local-model',
				label: 'Local model',
			},
			{
				value: 'fixture-7b',
				label: 'Fixture 7B',
				disabled: true,
			},
		],
		aiExportCopyItems: [
			{
				role: 'user',
				author: 'user',
				content: 'What is UDSP?',
			},
			{
				role: 'assistant',
				author: 'assistant',
				content: 'Transport layer. Settlement on VIAT.',
			},
		],
		aiExportJsonItems: [
			{
				role: 'user',
				author: 'user',
				content: 'What is UDSP?',
			},
			{
				role: 'assistant',
				author: 'assistant',
				content: 'Transport layer. Settlement on VIAT.',
			},
		],
		aiExportDownloadItems: [
			{
				role: 'user',
				author: 'user',
				content: 'What is UDSP?',
			},
			{
				role: 'assistant',
				author: 'assistant',
				content: 'Transport layer. Settlement on VIAT.',
			},
		],
		aiActionsDemoItems: [
			{
				id: 'copy',
				icon: 'copy',
				label: 'Copy',
			},
			{
				id: 'regenerate',
				icon: 'refresh-cw',
				label: 'Regenerate',
			},
		],
		aiChatExample: `
<ui-ai-chat
  .state.manual=\${true}
  .state.endpoint=\${''}
  .state.items=\${fixtureTurns}
  .state.modelItems=\${[{ value: 'local-model', label: 'Local' }]}
  .state.waiting=\${true}
  .state.newMessageCount=\${3}>
</ui-ai-chat>
<!-- manual + empty endpoint: no transport, no /models probe -->`,
		aiTypingExample: `
<ui-ai-typing .state.active=\${true} .state.label=\${'Thinking…'} .state.author=\${'AI'}></ui-ai-typing>
<!-- forced active — hidden when active is false -->`,
		aiNewMessagesExample: `
<ui-ai-new-messages .state.count=\${3} .state.label=\${'{n} new'}></ui-ai-new-messages>
<!-- forced count — hidden when count is 0 -->`,
		aiScrollBottomExample: `
<ui-ai-scroll-bottom .state.position=\${'static'} .state.label=\${'Jump to latest'}></ui-ai-scroll-bottom>
<!-- static forces the control visible (sticky needs a scrolled log) -->`,
		aiErrorExample: `
<ui-ai-error .state.message=\${'Rate limit'} .state.kind=\${'rate-limit'}></ui-ai-error>
<ui-ai-error .state.message=\${'Offline'} .state.kind=\${'offline'} .state.retryable=\${false}></ui-ai-error>
<!-- kinds: error | rate-limit | quota | offline -->`,
		aiExportExample: `
<ui-ai-export .state.items=\${turns} .state.mode=\${'copy'} .state.format=\${'markdown'}></ui-ai-export>
<!-- copy | download · markdown | json — client-only, no network -->`,
		aiSuggestionsExample: `
<ui-ai-suggestions .state.items=\${[{ label: 'Swap', value: 'swap', icon: 'arrow-left-right' }]}></ui-ai-suggestions>`,
		aiModelSelectExample: `
<ui-ai-model-select .state.value=\${'local-model'} .state.items=\${[{ value: 'local-model', label: 'Local' }]}></ui-ai-model-select>
<!-- no /models fetch — parent supplies items -->`,
		aiUsageExample: `
<ui-ai-usage .state.promptTokens=\${420} .state.completionTokens=\${880} .state.totalTokens=\${1300} .state.cost=\${0.0042}></ui-ai-usage>`,
		aiMessageActionsExample: `
<ui-ai-message-actions .state.messageId=\${'m1'}></ui-ai-message-actions>
<!-- emits ai-message-actions:action { action, messageId } -->`,
		aiApprovalExample: `
<ui-ai-approval .state.name=\${'sendFunds'} .state.summary=\${'Send 100 VIAT'} .state.args=\${{ to: 'bob.viat' }}></ui-ai-approval>`,
		aiFeedbackExample: `
<ui-ai-feedback .state.messageId=\${'m1'}></ui-ai-feedback>
<ui-ai-feedback .state.messageId=\${'m2'} .state.value=\${'up'}></ui-ai-feedback>`,
		aiIdentityExample: `
<ui-ai-identity .state.author=\${'assistant'}></ui-ai-identity>
<ui-ai-identity .state.author=\${'user'} .state.label=\${'You'}></ui-ai-identity>`,
		aiInquireExample: `
<ui-ai-inquire .state.question=\${'Which network?'} .state.mode=\${'choice'} .state.items=\${['Mainnet', 'Testnet']}></ui-ai-inquire>
<ui-ai-inquire .state.question=\${'Name?'} .state.mode=\${'text'}></ui-ai-inquire>`,
		aiPlanExample: `
<ui-ai-plan .state.items=\${[
  { label: 'Fetch', status: 'done' },
  { label: 'Route', status: 'active', detail: '…' },
  { label: 'Sign', status: 'pending' },
  { label: 'Send', status: 'error' },
]}></ui-ai-plan>`,
		aiReasoningExample: `
<ui-ai-reasoning .state.text=\${'…'} .state.expanded=\${true}></ui-ai-reasoning>
<ui-ai-reasoning .state.text=\${'…'} .state.streaming=\${true} .state.expanded=\${true}></ui-ai-reasoning>`,
		aiSearchExample: `
<ui-ai-search .state.query=\${'UDSP'} .state.placeholder=\${'Search conversation…'}></ui-ai-search>`,
		aiSettingsExample: `
<ui-ai-settings .state.expanded=\${true} .state.temperature=\${0.7} .state.maxTokens=\${2048}></ui-ai-settings>`,
		aiSourcesExample: `
<ui-ai-sources .state.items=\${[{ title: 'Spec', url: 'https://example.com', snippet: '…' }]}></ui-ai-sources>`,
		aiToolCallExample: `
<ui-ai-tool-call .state.name=\${'getBalance'} .state.status=\${'running'} .state.expanded=\${true}></ui-ai-tool-call>
<ui-ai-tool-call .state.name=\${'getBalance'} .state.status=\${'done'} .state.result=\${{ amount: '1' }} .state.expanded=\${true}></ui-ai-tool-call>`,
		selectOptions: [
			{
				value: 'viat',
				label: 'VIAT · settlement layer',
			},
			{
				value: 'udsp',
				label: 'UDSP · transport',
			},
			{
				value: 'uwc',
				label: 'UWC · components',
			},
			{
				value: 'legacy',
				label: 'Legacy (disabled)',
				disabled: true,
			},
		],
		statTableColumns: [
			{
				id: 'metric',
				label: 'METRIC',
				width: '1.4fr',
			},
			{
				id: 'value',
				label: 'VALUE',
				width: '1fr',
			},
			{
				id: 'delta',
				label: '24H',
				width: '0.8fr',
			},
		],
		statTableRows: [
			{
				metric: 'Block height',
				value: '4,182,907',
				delta: '+312',
			},
			{
				metric: 'Validators',
				value: '128',
				delta: '+2',
			},
			{
				metric: 'TPS (peak)',
				value: '9,410',
				delta: '+1.2K',
			},
			{
				metric: 'Finality',
				value: '1.8s',
				delta: '−0.1s',
			},
		],
		toolbarActions: [
			{
				icon: 'bold',
				tooltip: 'Bold',
			},
			{
				icon: 'italic',
				tooltip: 'Italic',
			},
			{
				icon: 'underline',
				tooltip: 'Underline',
			},
			{
				icon: 'list',
				tooltip: 'List',
			},
			{
				icon: 'code',
				tooltip: 'Code',
			},
		],
		dockItems: [
			{
				id: 'wallet',
				icon: 'wallet',
				tooltip: 'Wallet',
				animated: 'bob',
			},
			{
				id: 'explorer',
				icon: 'compass',
				tooltip: 'Explorer',
				animated: 'compass',
			},
			{
				id: 'accounts',
				icon: 'users',
				tooltip: 'Accounts',
				animated: 'hop',
			},
			{
				id: 'swap',
				icon: 'arrow-left-right',
				tooltip: 'Swap',
				animated: 'flip',
			},
		],
		dockActiveIndex: 'explorer',
		appBarActions: [
			{
				id: 'agent',
				icon: 'bot',
				tooltip: 'Local Agent',
			},
			{
				id: 'settings',
				icon: 'settings',
				tooltip: 'Settings',
			},
			{
				id: 'sidebar',
				icon: 'panel-left',
				tooltip: 'Sidebar',
			},
		],
		statusCells: [
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
		],
		statusCellDemoItems: [
			{
				label: 'Network',
				value: 'MAINNET',
			},
			{
				label: 'Health',
				value: 'OK',
				valueClass: 'good',
			},
			{
				label: 'Hidden',
				value: 'nope',
				hidden: true,
			},
		],
		pollOptionLiveItems: [
			{
				id: 'wallet',
				label: 'Wallet',
				description: 'Child field: description',
				votes: 142,
			},
			{
				id: 'staking',
				label: 'Staking',
				votes: 98,
			},
			{
				id: 'bridge',
				label: 'Bridge',
				votes: 64,
			},
		],
		pollOptionRevealedItems: [
			{
				id: 'wallet',
				label: 'Wallet',
				description: 'Selected + revealed',
				votes: 143,
				percentage: 47,
				selected: true,
				revealed: true,
			},
			{
				id: 'staking',
				label: 'Staking',
				votes: 98,
				percentage: 32,
				revealed: true,
			},
			{
				id: 'bridge',
				label: 'Bridge',
				votes: 64,
				percentage: 21,
				revealed: true,
			},
		],
		voteItemDemoItems: [
			{
				id: 'studio',
				label: 'Theme studio',
				description: 'Child field: description',
				votes: 128,
				voted: true,
			},
			{
				id: 'mobile',
				label: 'Mobile app',
				votes: 88,
			},
			{
				id: 'api',
				label: 'Public API',
				votes: 42,
				voted: false,
			},
		],
		jsonRowDemoData: {
			ok: true,
			count: 2,
			empty: null,
			tags: [
				'a',
				'b',
			],
			finality: {
				ms: 1600,
			},
		},
		imageCellDemoItems: [
			{
				id: 'cap',
				src: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='100%25' height='100%25' fill='%2306b6d4'/%3E%3C/svg%3E`,
				alt: 'Cyan',
				title: 'With caption',
			},
			{
				id: 'plain',
				src: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='100%25' height='100%25' fill='%236366f1'/%3E%3C/svg%3E`,
				alt: 'Indigo',
			},
			{
				id: 'link',
				src: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='100%25' height='100%25' fill='%2310b981'/%3E%3C/svg%3E`,
				alt: 'Green',
				title: 'Link cell',
				href: '#docs',
			},
		],
		carouselSlideDemoItems: [
			{
				id: 'accent',
				eyebrow: 'New',
				heading: 'Accent',
				description: 'eyebrow + heading + description',
				tone: 'accent',
			},
			{
				id: 'success',
				heading: 'Success',
				tone: 'success',
			},
			{
				id: 'warning',
				eyebrow: 'Slow',
				heading: 'Warning',
				description: 'No image — media placeholder',
				tone: 'warning',
			},
			{
				id: 'danger',
				heading: 'Danger',
				tone: 'danger',
			},
			{
				id: 'info',
				heading: 'Info',
				description: 'info tone',
				tone: 'info',
			},
		],
		treeDemoItems: [
			{
				id: 'core',
				label: 'Core',
				icon: 'folder',
				children: [
					{
						id: 'base',
						label: 'base.js',
						icon: 'file',
					},
					{
						id: 'state',
						label: 'state.js',
						icon: 'file',
					},
				],
			},
			{
				id: 'global',
				label: 'Global',
				icon: 'folder',
				children: [
					{
						id: 'forms',
						label: 'Forms',
						icon: 'folder',
						children: [
							{
								id: 'input',
								label: 'Input',
								icon: 'file',
							},
							{
								id: 'select',
								label: 'Select',
								icon: 'file',
							},
						],
					},
					{
						id: 'media',
						label: 'Media',
						icon: 'file',
					},
				],
			},
		],
		treeReadout: '',
		treeSelectValue: '',
		treeTableColumns: [
			{
				key: 'label',
				label: 'Name',
			},
			{
				key: 'size',
				label: 'Size',
				align: 'end',
			},
			{
				key: 'kind',
				label: 'Kind',
			},
		],
		treeTableItems: [
			{
				id: 'src',
				label: 'src',
				icon: 'folder',
				size: '—',
				kind: 'dir',
				children: [
					{
						id: 'app',
						label: 'app.js',
						icon: 'file',
						size: '12kb',
						kind: 'js',
					},
					{
						id: 'css',
						label: 'app.css',
						icon: 'file',
						size: '8kb',
						kind: 'css',
					},
				],
			},
			{
				id: 'docs',
				label: 'docs',
				icon: 'folder',
				size: '—',
				kind: 'dir',
				children: [
					{
						id: 'readme',
						label: 'README.md',
						icon: 'file',
						size: '4kb',
						kind: 'md',
					},
				],
			},
		],
		pickSourceItems: [
			{
				id: 'eth',
				label: 'Ethereum',
			},
			{
				id: 'sol',
				label: 'Solana',
			},
			{
				id: 'btc',
				label: 'Bitcoin',
			},
		],
		pickTargetItems: [
			{
				id: 'viat',
				label: 'Viat',
			},
		],
		orderDemoItems: [
			{
				id: 'ship',
				label: 'Ship tree family',
			},
			{
				id: 'preview',
				label: 'Wire preview demos',
			},
			{
				id: 'importmap',
				label: 'Regenerate importmap',
			},
			{
				id: 'lint',
				label: 'Eslint autofix',
			},
		],
		orgDemoItems: [
			{
				id: 'ceo',
				label: 'Ava Chen',
				author: 'CEO',
				icon: 'user',
				children: [
					{
						id: 'eng',
						label: 'Marcus Cole',
						author: 'VP Engineering',
						icon: 'user',
						children: [
							{
								id: 'fe',
								label: 'Rin Park',
								author: 'Frontend',
								icon: 'user',
							},
							{
								id: 'be',
								label: 'Jules Adeyemi',
								author: 'Protocol',
								icon: 'user',
							},
						],
					},
					{
						id: 'ops',
						label: 'Samir Shah',
						author: 'VP Operations',
						icon: 'user',
						children: [
							{
								id: 'cs',
								label: 'Noor Ali',
								author: 'Support',
								icon: 'user',
							},
							{
								id: 'design',
								name: 'Ivy Ng',
								title: 'Design',
								icon: 'user',
							},
						],
					},
				],
			},
		],
		galleryDemoItems: galleryShots(),
		galleryDemoBasic: galleryShots(),
		galleryDemoThumbs: galleryShots(),
		galleryDemoTools: galleryShots(),
		galleryDemoOverlayOff: galleryShots(),
		galleryDemoOverlayOn: galleryShots(),
		imageDemoSrc: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360'%3E%3Crect width='100%25' height='100%25' fill='%230A1128'/%3E%3Ctext x='50%25' y='54%25' fill='%2300F0FF' font-size='40' text-anchor='middle' font-family='monospace'%3EVIAT%3C/text%3E%3C/svg%3E`,
		audioDemoSrc: new URL('../components/global/audio-player/sample.wav', import.meta.url).href,
		audioDemoArt: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Crect width='100%25' height='100%25' fill='%23111827'/%3E%3Ccircle cx='120' cy='120' r='70' fill='%2306b6d4'/%3E%3C/svg%3E`,
	};
	static async create(state, config, mountTarget = document.body) {
		const view = new this(await state, config);
		await WebComponent.preRender(view, mountTarget);
		return view;
	}
	/* Stable display+data contract for the <ui-collection> demo (mirrors the
	   explorer's instance-field pattern; the loader arrow preserves `this`). */
	/* Stable static demo data for the easy-component batch — instance fields give
	   one stable reference per instance (same discipline as listConfig below). The
	   gallery images are inline data-URI SVGs so the demo needs no network. */
	splitButtonItems = [
		{
			label: 'API Console',
			value: 'console',
			href: '#console',
		},
		{
			label: 'Documentation',
			value: 'docs',
			href: '#docs',
		},
		{
			label: 'CLI',
			value: 'cli',
			href: '#cli',
		},
	];
	menuItems = [
		{
			label: 'Rename',
			value: 'rename',
			kbd: '⌘R',
		},
		{
			label: 'Duplicate',
			value: 'duplicate',
		},
		{
			label: 'Pin to top',
			value: 'pin',
			checked: true,
		},
		{
			separator: true,
		},
		{
			label: 'Archive',
			value: 'archive',
			disabled: true,
		},
		{
			label: 'Delete',
			value: 'delete',
			danger: true,
			kbd: '⌫',
		},
	];
	navSectionItems = [
		{
			id: 'products',
			label: 'Products',
			links: [
				{
					id: 'chat',
					label: 'Chat',
					description: 'Frontier reasoning with real-time knowledge.',
					href: '#chat',
					icon: 'message-circle',
				},
				{
					id: 'build',
					label: 'Build',
					description: 'Plan, edit, and ship code with AI.',
					href: '#build',
					icon: 'terminal',
				},
				{
					id: 'imagine',
					label: 'Imagine',
					description: 'Generate images and video from text.',
					href: '#imagine',
					icon: 'sparkles',
				},
			],
		},
		{
			id: 'solutions',
			label: 'Solutions',
			links: [
				{
					id: 'business',
					label: 'Business',
					href: '#business',
				},
				{
					id: 'government',
					label: 'Government',
					href: '#government',
				},
				{
					id: 'security',
					label: 'Security',
					href: '#security',
				},
			],
		},
		{
			id: 'media',
			label: 'Media',
			panel: true,
		},
		{
			id: 'apps',
			icon: 'layout-grid',
			tooltip: 'Apps',
			links: [
				{
					id: 'console',
					label: 'Console',
					href: '#console',
					icon: 'layout-dashboard',
				},
				{
					id: 'docs',
					label: 'Docs',
					href: '#docs',
					icon: 'book-open',
				},
			],
		},
		{
			id: 'pricing',
			label: 'Pricing',
			href: '#pricing',
		},
	];
	navMediaTabs = [
		{
			id: 'clip',
			label: 'Clip',
		},
		{
			id: 'about',
			label: 'About',
		},
	];
	menubarMenus = [
		{
			label: 'File',
			items: [
				{
					label: 'New',
					value: 'file:new',
					kbd: '⌘N',
				},
				{
					label: 'Open…',
					value: 'file:open',
					kbd: '⌘O',
				},
				{
					separator: true,
				},
				{
					label: 'Save',
					value: 'file:save',
					kbd: '⌘S',
				},
				{
					label: 'Quit',
					value: 'file:quit',
					danger: true,
					kbd: '⌘Q',
				},
			],
		},
		{
			label: 'Edit',
			items: [
				{
					label: 'Undo',
					value: 'edit:undo',
					kbd: '⌘Z',
				},
				{
					label: 'Redo',
					value: 'edit:redo',
					kbd: '⇧⌘Z',
				},
				{
					separator: true,
				},
				{
					label: 'Cut',
					value: 'edit:cut',
				},
				{
					label: 'Copy',
					value: 'edit:copy',
				},
				{
					label: 'Paste',
					value: 'edit:paste',
					disabled: true,
				},
			],
		},
		{
			label: 'View',
			items: [
				{
					label: 'Show grid',
					value: 'view:grid',
					checked: true,
				},
				{
					label: 'Show rulers',
					value: 'view:rulers',
				},
				{
					label: 'Full screen',
					value: 'view:full',
					kbd: '⌃⌘F',
				},
			],
		},
	];
	wizardSteps = [
		{
			label: 'Account',
		},
		{
			label: 'Profile',
			description: 'Name & avatar',
		},
		{
			label: 'Review',
			optional: true,
		},
	];
	speedDialActions = [
		{
			icon: 'wallet',
			label: 'Wallet',
			value: 'wallet',
		},
		{
			icon: 'compass',
			label: 'Explorer',
			value: 'explorer',
		},
		{
			icon: 'users',
			label: 'Accounts',
			value: 'accounts',
		},
	];
	galleryItems = [
		'06b6d4', '6366f1', '10b981', 'f59e0b', 'f43f5e', '8b5cf6',
	].map((color, index) => {
		return {
			src: `data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='400'%20height='300'%3E%3Crect%20width='100%25'%20height='100%25'%20fill='%23${color}'/%3E%3C/svg%3E`,
			alt: `Swatch ${index + 1}`,
			title: `Swatch ${index + 1}`,
		};
	});
	listConfig = {
		loader: (options) => {
			return this.loadPagedDemo(options);
		},
		renderRow: this.pagedRow,
		renderHead: this.pagedHead,
		keyFn: (row) => {
			return row.id;
		},
		itemNoun: 'rows',
		emptyMessage: 'No rows.',
		loadingMessage: 'Loading rows…',
		pagingStyle: 'loadmore',
		/* Virtual is the ui-collection default; bound table so the demo scrolls
		   inside a short box instead of growing the whole preview stage. */
		virtual: true,
		estimatedHeight: 36,
		overscan: 4,
		tableMaxHeight: '14rem',
	};
	/* Skip scroll-spy while a rail click is animating to a section. */
	railScrollLock = false;
	categorySpy = null;
	/* IntersectionObserver has no thisArg — tier-3 forwarder, created once. */
	categorySpyTick = (entries) => {
		this.onCategoryIntersect(entries);
	};
	listConfigSelectable = {
		loader: (options) => {
			return this.loadSelectableDemo(options);
		},
		// No renderRow → default ui-collection-item
		selectable: true,
		checkboxPosition: 'start',
		keyFn: (row) => {
			return row.id;
		},
		itemNoun: 'items',
		emptyMessage: 'No items.',
		loadingMessage: 'Loading…',
		pagingStyle: 'loadmore',
		virtual: true,
		estimatedHeight: 48,
		tableMaxHeight: '12rem',
		showBar: false,
	};
	loadSelectableDemo() {
		const items = [];
		for (let index = 1; index <= 12; index++) {
			items.push({
				id: `s${index}`,
				label: `Selectable item ${index}`,
				description: index % 3 === 0 ? 'Has a secondary description' : '',
				checked: index === 2,
				disabled: index === 5,
			});
		}
		return Promise.resolve({
			items,
			nextCursor: null,
			hasMore: false,
			totalCount: items.length,
		});
	}
	pagedRowStyles = PAGED_ROW_STYLES;
	bumpClick() {
		this.state.clickCount = this.state.clickCount + 1;
	}
	bumpBadge() {
		this.state.badgeCount = this.state.badgeCount + 1;
	}
	toggleSpin() {
		this.state.spinDemo = !this.state.spinDemo;
	}
	handleColorChange(domEvent) {
		this.state.pickedColor = domEvent.detail?.data?.value ?? this.state.pickedColor;
	}
	handleTagsChange(domEvent) {
		// ui-tag-input is uncontrolled — `.tags` is the seed, the component owns the
		// live list. Just reflect the reported values; no writeback to tagValues.
		const tags = domEvent.detail?.data?.values ?? [];
		this.state.tagReadout = tags.length ? tags.join(', ') : '(empty)';
	}
	handleSliderChange(domEvent) {
		this.state.sliderReadout = String(domEvent.detail?.data?.value ?? '');
	}
	handleRangeSlider(domEvent) {
		const data = domEvent.detail?.data ?? {};
		this.state.sliderRangeReadout = `${data.low} – ${data.high}`;
	}
	handleDatePick(domEvent) {
		this.state.pickedDate = domEvent.detail?.data?.value ?? '';
	}
	handleRangePick(domEvent) {
		const range = domEvent.detail?.data;
		this.state.pickedRange = range ? `${range.from || '…'} → ${range.to || '…'}` : '';
	}
	syncEmail(domEvent) {
		this.state.emailValue = domEvent.detail.data.value;
	}
	syncSearch(domEvent) {
		this.state.searchValue = domEvent.detail.data.value;
	}
	syncAmount(domEvent) {
		this.state.amountValue = domEvent.detail.data.value;
	}
	syncFloatName(domEvent) {
		this.state.floatNameValue = domEvent.detail.data.value;
	}
	shuffleMeter() {
		const items = this.state.meterItems;
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			items[index].value = randomInt(6, 28);
		}
	}
	handleMeterSelect(domEvent) {
		const item = domEvent.detail?.data?.item;
		this.state.meterSelectReadout = item?.label || '(none)';
	}
	handleCompareInput(domEvent) {
		this.state.compareValue = domEvent.detail?.data?.value ?? 50;
	}
	handleFieldsetToggle(domEvent) {
		this.state.fieldsetOpen = Boolean(domEvent.detail?.data?.open);
	}
	openFieldsetDemo() {
		this.state.fieldsetOpen = true;
	}
	closeFieldsetDemo() {
		this.state.fieldsetOpen = false;
	}
	fieldsetOpenLabel() {
		return this.state.fieldsetOpen ? 'true' : 'false';
	}
	clearComboboxItems() {
		this.state.comboboxLiveItems = [];
	}
	restoreComboboxItems() {
		this.state.comboboxLiveItems = this.state.comboboxItems.slice();
	}
	openModal() {
		this.refs.modal.open();
	}
	openCommandDemo() {
		this.refs.command_palette?.open();
	}
	handleTableRowClick(domEvent) {
		const detail = domEvent.detail || {};
		const item = detail.item;
		const index = detail.index;
		const label = item?.label || item?.id || '—';
		this.state.tableRowReadout = `#${index} ${label}`;
	}
	handleCommandSelect(domEvent) {
		this.state.commandReadout = domEvent.detail?.data?.item?.label ?? '';
	}
	commandReadoutText() {
		return this.state.commandReadout || '—';
	}
	closeModal() {
		this.refs.modal.close();
	}
	openControlsModal() {
		this.refs.controls_modal.open();
	}
	openMacModal() {
		this.refs.mac_modal.open();
	}
	openMaximizedStartModal() {
		// Demonstrates the afterAction continuation hook — fires once when
		// the modal closes, regardless of path (button, Escape, backdrop).
		this.refs.after_action_modal.assignState({
			afterAction: ({ returnValue }) => {
				this.state.confirmResult = `modal closed with returnValue=${returnValue || '(empty)'}`;
			},
		});
		this.refs.after_action_modal.open();
	}
	notifyDefault() {
		this.refs.notify.show({
			heading: 'Heads up',
			message: 'A default notification just landed.',
		});
	}
	notifyError() {
		this.refs.notify.show({
			heading: 'Transfer failed',
			message: 'The node rejected the transaction.',
			itemType: 'error',
		});
	}
	notifyOpenCenter() {
		this.refs.notify?.openCenter();
	}
	notifyAutoRemove() {
		this.refs.notify.show({
			heading: 'Auto-remove',
			message: 'This toast auto-removes (not just hides).',
			autoRemove: true,
			timeout: 2400,
		});
	}
	toastDefault() {
		this.refs.toaster?.show({
			title: 'Event created',
			description: 'Sunday, December 3 at 9:00 AM',
		});
	}
	toastSuccess() {
		this.refs.toaster?.show({
			title: 'Saved',
			description: 'Your changes are live.',
			itemType: 'success',
		});
	}
	toastError() {
		this.refs.toaster?.show({
			title: 'Something went wrong',
			description: 'Could not reach the network.',
			itemType: 'error',
		});
	}
	toastAction() {
		this.refs.toaster?.show({
			title: 'File deleted',
			description: 'report.pdf removed from vault.',
			itemType: 'info',
			actionLabel: 'Undo',
			timeout: 8000,
		});
	}
	toastPromiseDemo() {
		const task = new Promise((accept, reject) => {
			const ok = Math.random() > 0.35;
			globalThis.setTimeout(() => {
				if (ok) {
					accept('synced');
					return;
				}
				reject(new Error('timeout'));
			}, 1800);
		});
		this.refs.toaster?.promise(task, {
			loading: 'Syncing…',
			success: (data) => {
				return `Sync ${data}`;
			},
			error: (error) => {
				return error.message || 'Sync failed';
			},
		}).catch(() => {
			/* error toast already shown */
		});
	}
	toastStackDemo() {
		const toaster = this.refs.toaster;
		if (!toaster) {
			return;
		}
		toaster.show({
			title: 'First',
			description: 'Stacked toast 1 of 3',
			itemType: 'info',
		});
		toaster.show({
			title: 'Second',
			description: 'Stacked toast 2 of 3',
			itemType: 'success',
		});
		toaster.show({
			title: 'Third',
			description: 'Stacked toast 3 of 3 — × sits top-end',
			itemType: 'warning',
		});
	}
	toastPosStart() {
		this.refs.toaster?.show({
			title: 'Bottom start',
			description: 'Anchored to the start edge.',
			itemType: 'info',
			position: 'bottom-start',
		});
	}
	toastPosCenter() {
		this.refs.toaster?.show({
			title: 'Bottom center',
			description: 'Default  stack.',
			itemType: 'success',
			position: 'bottom-center',
		});
	}
	toastPosEnd() {
		this.refs.toaster?.show({
			title: 'Bottom end',
			description: 'Anchored to the end edge.',
			itemType: 'warning',
			position: 'bottom-end',
		});
	}
	toastPosTopStart() {
		this.refs.toaster?.show({
			title: 'Top start',
			description: 'Anchored to the top-start corner.',
			itemType: 'info',
			position: 'top-start',
		});
	}
	toastPosTopCenter() {
		this.refs.toaster?.show({
			title: 'Top center',
			description: 'Top stack.',
			itemType: 'success',
			position: 'top-center',
		});
	}
	toastPosTopEnd() {
		this.refs.toaster?.show({
			title: 'Top end',
			description: 'Anchored to the top-end corner.',
			itemType: 'warning',
			position: 'top-end',
		});
	}
	toastLoading() {
		this.refs.toaster?.show({
			title: 'Syncing chain…',
			description: 'Loading toast stays until dismiss (timeout 0).',
			itemType: 'loading',
		});
	}
	toastSticky() {
		this.refs.toaster?.show({
			title: 'Sticky',
			description: 'timeout: 0 — dismiss with ×.',
			itemType: 'info',
			timeout: 0,
		});
	}
	toastWarning() {
		this.refs.toaster?.show({
			title: 'Degraded',
			description: 'Peer lag above threshold.',
			itemType: 'warning',
		});
	}
	toastLimitFlood() {
		const toaster = this.refs.toaster;
		if (!toaster) {
			return;
		}
		// Host limit is 3 in the flood demo toaster (#toaster_limit).
		const flood = this.refs.toaster_limit || toaster;
		for (let index = 1; index <= 6; index += 1) {
			flood.show({
				title: `Flood ${index}`,
				description: `limit drops older toasts (pushed ${index}/6)`,
				itemType: index % 2 === 0 ? 'info' : 'default',
				timeout: 6000,
			});
		}
	}
	openAlertDialog() {
		this.refs.alert_delete?.open();
	}
	openAlertDialogBackdrop() {
		this.refs.alert_backdrop?.open();
	}
	handleAlertDialogBackdropAction() {
		this.refs.toaster?.show({
			title: 'Confirmed',
			description: 'Backdrop-dismiss dialog action.',
			itemType: 'success',
		});
	}
	handleAlertDialogAction() {
		this.refs.toaster?.show({
			title: 'Confirmed',
			itemType: 'success',
		});
	}
	openControlCenter() {
		this.refs.control_center?.open();
	}
	toastItemDemoKey(item) {
		return item.toastId ?? item.id;
	}
	notificationItemDemoKey(item) {
		return item.itemId ?? item.id;
	}
	buildToastItemDemos() {
		const stamp = Date.now();
		return [
			{
				id: `t-default-${stamp}`,
				toastId: `t-default-${stamp}`,
				title: 'Default',
				description: 'Plain toast row.',
				itemType: 'default',
				timeout: 0,
			},
			{
				id: `t-success-${stamp}`,
				toastId: `t-success-${stamp}`,
				title: 'Saved',
				description: 'Your changes are live.',
				itemType: 'success',
				timeout: 0,
			},
			{
				id: `t-info-${stamp}`,
				toastId: `t-info-${stamp}`,
				title: 'Info',
				description: 'Peer joined the mesh.',
				itemType: 'info',
				timeout: 0,
			},
			{
				id: `t-warn-${stamp}`,
				toastId: `t-warn-${stamp}`,
				title: 'Warning',
				description: 'Peer lag above threshold.',
				itemType: 'warning',
				timeout: 0,
			},
			{
				id: `t-err-${stamp}`,
				toastId: `t-err-${stamp}`,
				title: 'Error',
				description: 'Could not reach the network.',
				itemType: 'error',
				timeout: 0,
			},
			{
				id: `t-load-${stamp}`,
				toastId: `t-load-${stamp}`,
				title: 'Syncing…',
				description: 'Loading stays until dismiss.',
				itemType: 'loading',
				timeout: 0,
			},
			{
				id: `t-action-${stamp}`,
				toastId: `t-action-${stamp}`,
				title: 'File deleted',
				description: 'report.pdf removed.',
				itemType: 'info',
				actionLabel: 'Undo',
				timeout: 0,
			},
		];
	}
	buildNotificationItemDemos() {
		const stamp = Date.now();
		return [
			{
				id: `n-default-${stamp}`,
				itemId: `n-default-${stamp}`,
				itemType: 'default',
				heading: 'Settled',
				message: 'Tx confirmed',
				timeout: 0,
				seen: false,
			},
			{
				id: `n-err-${stamp}`,
				itemId: `n-err-${stamp}`,
				itemType: 'error',
				heading: 'Rejected',
				message: 'Nonce too low',
				timeout: 0,
				seen: true,
			},
			{
				id: `n-copy-${stamp}`,
				itemId: `n-copy-${stamp}`,
				itemType: 'copy',
				heading: 'Copied',
				message: 'Address on clipboard',
				timeout: 0,
				seen: true,
			},
		];
	}
	restoreToastItemDemos() {
		this.state.toastItemDemos = this.buildToastItemDemos();
	}
	restoreNotificationItemDemos() {
		this.state.notificationItemDemos = this.buildNotificationItemDemos();
	}
	handleToastItemDemoDismiss(domEvent) {
		const toastId = domEvent.detail?.data?.id;
		if (toastId == null) {
			return;
		}
		this.state.toastItemDemos = this.state.toastItemDemos.filter((item) => {
			return item.toastId !== toastId && item.id !== toastId;
		});
	}
	handleNotificationItemDemoDismiss(domEvent) {
		const itemId = domEvent.detail?.data?.id;
		if (itemId == null) {
			return;
		}
		this.state.notificationItemDemos = this.state.notificationItemDemos.filter((item) => {
			return item.itemId !== itemId && item.id !== itemId;
		});
	}
	showLoadingScreen() {
		const loadingScreen = this.refs.loading;
		loadingScreen.open({
			heading: 'Syncing chain',
			message: 'Verifying post-quantum proofs…',
		});
		this.setTimeout(() => {
			loadingScreen.close();
		}, 2000);
	}
	showBootScreen() {
		const bootScreen = new BootScreen();
		document.body.appendChild(bootScreen);
		this.setTimeout(() => {
			bootScreen.dismiss();
		}, 2200);
	}
	async doDestructiveAction() {
		const accepted = await this.confirm('Delete this wallet? This action cannot be undone.');
		const timestamp = new Date().toLocaleTimeString();
		this.state.confirmResult = accepted ? `confirmed at ${timestamp}` : `cancelled at ${timestamp}`;
	}
	/**
	 * Rail click (delegated from `.rail-nav`) — set filter + rail highlight, scroll.
	 * Closes overlay nav (full/coverup) after pick; flyout stays open.
	 */
	setCategory(domEvent) {
		const path = domEvent.composedPath();
		let categoryId = '';
		const pathCount = path.length;
		for (let index = 0; index < pathCount; index++) {
			const node = path[index];
			if (node?.dataset?.id && node.classList?.contains('rail-cat')) {
				categoryId = node.dataset.id;
				break;
			}
		}
		if (!categoryId) {
			return;
		}
		this.setFilterCategory(categoryId);
		this.highlightCategory(categoryId);
		const sidebar = this.refs.nav_sidebar;
		if (sidebar && sidebar.mode !== 'flyout') {
			sidebar.close();
		}
		this.railScrollLock = true;
		this.setTimeout(this.scrollToFilterCategory, 0);
		this.setTimeout(this.clearRailScrollLock, 400);
	}
	/** Top-bar menu → ui-sidebar.toggle(). */
	toggleNav() {
		this.refs.nav_sidebar?.toggle();
	}
	/** Click-only: which .cat-section blocks are visible (`all` = every section). */
	setFilterCategory(categoryId) {
		if (this.state.filterCategory !== categoryId) {
			this.state.filterCategory = categoryId;
		}
	}
	scrollToFilterCategory(component) {
		const owner = component || this;
		const stage = owner.refs.stage;
		if (!stage) {
			return;
		}
		/*
		 * Instant jump only — never scrollTop=0 THEN smooth scrollIntoView.
		 * That forced sync layout right after [hidden] flips, then ~400ms of
		 * scroll-anchoring vs content-visibility size learning (the freeze).
		 * After a category filter the visible section is already at the top of
		 * the stage flow; "all" also resets to top. One assignment, no smooth.
		 */
		stage.scrollTop = 0;
	}
	clearRailScrollLock(component) {
		const owner = component || this;
		owner.railScrollLock = false;
	}
	/** Rail highlight only — never changes filterCategory (scroll-spy safe). */
	highlightCategory(categoryId) {
		if (this.state.activeCategory !== categoryId) {
			this.state.activeCategory = categoryId;
		}
		// Flip only the previous + next active flags (not the whole list).
		const categoryItems = this.state.categories;
		const categoryCount = categoryItems.length;
		let previous = null;
		let next = null;
		for (let index = 0; index < categoryCount; index++) {
			const item = categoryItems[index];
			if (item.active === true && item.id !== categoryId) {
				previous = item;
			}
			if (item.id === categoryId) {
				next = item;
			}
		}
		if (previous && previous.active !== false) {
			previous.active = false;
		}
		if (next && next.active !== true) {
			next.active = true;
		}
	}
	railCatKey(category) {
		return category.id;
	}
	/** Light rail row — plain values only; click is delegated on `.rail-nav`. */
	railCat(category) {
		return html`
			<button type="button" class="rail-cat" data-id=${category.id} ?data-on=${category.active}>
				<ui-icon class="rail-cat-icon" .state.name=${category.icon} .state.size=${'sm'}></ui-icon>
				<span class="rail-cat-label">${category.label}</span>
			</button>
		`;
	}
	/**
	 * Category block visibility — the ONLY place category filter is applied.
	 * Demos inside a visible section stay unhidden (search may still hide a demo).
	 * Scroll-spy highlight never hides sections.
	 */
	catSectionHidden(categoryId) {
		const filter = this.state.filterCategory;
		return filter !== 'all' && filter !== categoryId;
	}
	handleHeatmapSelect(domEvent) {
		const data = domEvent.detail?.data;
		if (!data) {
			return;
		}
		const value = data.value == null ? 'empty' : data.value;
		if (data.dateKey != null) {
			const at = new Date(data.dateKey);
			const stamp = Number.isFinite(at.getTime()) ? at.toISOString().slice(0, 10) : String(data.dateKey);
			this.state.heatmapReadout = `${stamp} · ${value}`;
			return;
		}
		this.state.heatmapReadout = `r${data.row} · c${data.col} · ${value}`;
	}
	onConnect() {
		// Live Google Maps reboot whenever the preview key field changes.
		this.observe('mapsApiKey', this.scheduleMapsKeyApply);
		// Live progress demos — only when feedback is in the filter set.
		this.addInterval(this.tickProgressDemos, 1600);
		// Seed dismissible inline toast / notification demos once.
		if (!this.state.toastItemDemos.length) {
			this.restoreToastItemDemos();
		}
		if (!this.state.notificationItemDemos.length) {
			this.restoreNotificationItemDemos();
		}
		this.on('keydown', this.handleNavKeydown);
		// Sync desktop/mobile sidebar mode once layout is live.
		this.delegate('viewport:resize', this.syncNavSidebarMode);
	}
	/** Escape closes overlay nav (coverup/full). */
	handleNavKeydown(domEvent) {
		if (domEvent.key !== 'Escape') {
			return;
		}
		const sidebar = this.refs.nav_sidebar;
		if (!sidebar?.attrs?.open || sidebar.mode === 'flyout') {
			return;
		}
		domEvent.stopPropagation();
		sidebar.close();
	}
	/* addInterval invokes as callback(component) — no this bind. */
	tickProgressDemos(component) {
		const host = component || this;
		/*
		 * Only when feedback is the active filter. Firing on `all` (the default)
		 * re-runs the whole preview render() every 1.6s because progressValue is
		 * a bare ${this.state.x} renderDep in the monolith template.
		 */
		if (host.state.filterCategory !== 'feedback') {
			return;
		}
		const nextBar = host.state.progressValue + 11;
		host.state.progressValue = nextBar > 100 ? 8 : nextBar;
		const nextRing = host.state.progressRingLive + 13;
		host.state.progressRingLive = nextRing > 100 ? 6 : nextRing;
	}
	onRender() {
		const stage = this.refs.stage;
		if (stage) {
			setScrollLockTarget(stage);
			this.ensureCategorySpy(stage);
			this.ensureViewPaint(stage);
		}
		// Arm sidebar once (mode sync is resize-only — not every patch).
		this.ensureNavSidebar();
	}
	onDisconnect() {
		this.teardownCategorySpy();
		this.teardownViewPaint();
		this.teardownNavSidebar();
	}
	/**
	 * Wire ui-sidebar once: MutationObserver for open attr + initial mode.
	 * Mode re-sync only on viewport:resize (not every render — that fought toggle).
	 */
	ensureNavSidebar() {
		const sidebar = this.refs.nav_sidebar;
		if (!sidebar || this.navSidebarArmed) {
			return;
		}
		this.navSidebarArmed = true;
		if (!this.syncNavOpenAttrTick) {
			this.syncNavOpenAttrTick = () => {
				this.syncNavOpenAttr();
			};
		}
		this.navOpenObserver = new MutationObserver(this.syncNavOpenAttrTick);
		this.navOpenObserver.observe(sidebar, {
			attributes: true,
			attributeFilter: ['open'],
		});
		this.syncNavSidebarMode();
		this.syncNavOpenAttr();
	}
	teardownNavSidebar() {
		if (this.navOpenObserver) {
			this.navOpenObserver.disconnect();
			this.navOpenObserver = null;
		}
		this.navSidebarArmed = false;
	}
	/** Reflect sidebar open onto host for stage inset CSS. */
	syncNavOpenAttr() {
		const open = this.refs.nav_sidebar?.hasAttribute('open') === true;
		this.toggleAttribute('data-nav-open', open);
	}
	/**
	 * Desktop (≥48rem): force flyout + open (docs chrome).
	 * Mobile: full overlay, start closed.
	 */
	syncNavSidebarMode() {
		const sidebar = this.refs.nav_sidebar;
		if (!sidebar) {
			return;
		}
		const wide = (globalThis.innerWidth || 0) >= 768;
		sidebar.state.responsive = false;
		sidebar.state.hotkey = '';
		sidebar.state.side = 'left';
		sidebar.state.closeButton = true;
		sidebar.state.backdrop = true;
		if (wide) {
			if (sidebar.state.mode !== 'flyout') {
				sidebar.state.mode = 'flyout';
			}
			if (!sidebar.attrs.open) {
				sidebar.openSidebar();
			}
		} else {
			if (sidebar.state.mode !== 'full') {
				sidebar.state.mode = 'full';
			}
			// First mobile arm: start closed (full is overlay).
			if (!this.navMobileSeeded) {
				this.navMobileSeeded = true;
				sidebar.close();
			}
		}
		this.syncNavOpenAttr();
	}
	/**
	 * Paint-mode for map hosts only (demos use CSS content-visibility:auto).
	 */
	ensureViewPaint(stage) {
		if (this.viewPaintArmed) {
			return;
		}
		this.viewPaintArmed = true;
		const mapHosts = stage.querySelectorAll('.demo-map-stage, [data-view-lazy]');
		const hostCount = mapHosts.length;
		const disposers = [];
		for (let index = 0; index < hostCount; index += 1) {
			disposers.push(observeInView(mapHosts[index], {
				root: stage,
				mode: 'lazy',
				once: true,
				rootMargin: '120px 0px',
				blockSize: 'auto 18rem',
			}));
		}
		this.viewPaintDisposers = disposers;
	}
	teardownViewPaint() {
		const disposers = this.viewPaintDisposers;
		if (!disposers) {
			return;
		}
		const count = disposers.length;
		for (let index = 0; index < count; index += 1) {
			disposers[index]();
		}
		this.viewPaintDisposers = null;
		this.viewPaintArmed = false;
	}
	ensureCategorySpy(stage) {
		if (this.categorySpy || typeof IntersectionObserver !== 'function') {
			return;
		}
		this.categorySpy = new IntersectionObserver(this.categorySpyTick, {
			root: stage,
			rootMargin: '-10% 0px -70% 0px',
			threshold: [
				0,
				0.1,
				0.25,
			],
		});
		const cats = this.state.categories;
		const catCount = cats.length;
		for (let index = 0; index < catCount; index++) {
			const categoryId = cats[index].id;
			if (categoryId === 'all') {
				continue;
			}
			const section = this.refs[`cat_${categoryId}`];
			if (section) {
				this.categorySpy.observe(section);
			}
		}
	}
	teardownCategorySpy() {
		if (this.categorySpy) {
			this.categorySpy.disconnect();
			this.categorySpy = null;
		}
	}
	onCategoryIntersect(entries) {
		if (this.railScrollLock) {
			return;
		}
		// Prefer the topmost intersecting section in the stage.
		let best = null;
		let bestTop = Infinity;
		const entryCount = entries.length;
		for (let index = 0; index < entryCount; index++) {
			const entry = entries[index];
			if (!entry.isIntersecting) {
				continue;
			}
			const entryTop = entry.boundingClientRect.top;
			if (entryTop < bestTop) {
				bestTop = entryTop;
				best = entry.target;
			}
		}
		if (!best) {
			return;
		}
		const categoryId = best.dataset.catSection;
		if (!categoryId || categoryId === this.state.activeCategory) {
			return;
		}
		// Filtered to one category: keep rail pinned to the filter choice.
		if (this.state.filterCategory !== 'all' && categoryId !== this.state.filterCategory) {
			return;
		}
		this.highlightCategory(categoryId);
	}
	/**
	 * Visibility predicate for a demo card — true = hidden.
	 * Category filtering is OWNED by the parent `.cat-section` (catSectionHidden).
	 * Demos only apply the search box here so a section unhide never leaves cards
	 * stuck with a stale category `hidden` while the section title still paints.
	 * @param {string} category - The card's category id (kept for call-site clarity).
	 * @param {string} searchName - The card's searchable label.
	 * @returns {boolean} Whether the card should be hidden.
	 */
	demoHidden(_category, searchName) {
		const query = this.state.navQuery.trim().toLowerCase();
		if (query === '') {
			return false;
		}
		return !searchName.toLowerCase().includes(query);
	}
	syncSelect(domEvent) {
		this.state.selectValue = domEvent.detail?.data?.value ?? domEvent.target.value;
	}
	handleTreeSelect(domEvent) {
		this.state.treeReadout = String(domEvent.detail?.data?.value ?? '');
	}
	handleTreeSelectChange(domEvent) {
		this.state.treeSelectValue = String(domEvent.detail?.data?.value ?? '');
	}
	syncSwitch(domEvent) {
		this.state.switchChecked = domEvent.detail?.checked ?? domEvent.target.checked;
	}
	syncCheckbox(domEvent) {
		this.state.checkboxChecked = Boolean(domEvent.detail?.data?.checked ?? domEvent.target.checked);
	}
	syncTernary(domEvent) {
		this.state.ternaryValue = Object.hasOwn(domEvent.detail?.data ?? {}, 'value') ? domEvent.detail.data.value : null;
	}
	syncTriState(domEvent) {
		this.state.triStateValue = Object.hasOwn(domEvent.detail?.data ?? {}, 'value') ? domEvent.detail.data.value : null;
	}
	ternaryReadout() {
		const current = this.state.ternaryValue;
		if (current === null || current === undefined) {
			return 'null';
		}
		return String(current);
	}
	triStateReadout() {
		const current = this.state.triStateValue;
		if (current === null || current === undefined) {
			return 'null';
		}
		return String(current);
	}
	syncTextarea(domEvent) {
		this.state.textareaValue = domEvent.detail?.data?.value ?? domEvent.target?.value ?? '';
	}
	syncToggle(domEvent) {
		this.state.togglePressed = Boolean(domEvent.detail?.data?.pressed);
	}
	syncCombobox(domEvent) {
		this.state.comboboxValue = domEvent.detail?.data?.value ?? '';
	}
	syncListbox(domEvent) {
		const nextValue = domEvent.detail?.data?.value ?? '';
		this.state.listboxValue = nextValue;
		this.state.listboxReadout = String(nextValue);
	}
	syncListboxMulti(domEvent) {
		const values = domEvent.detail?.data?.values;
		const next = Array.isArray(values) ? values.slice() : [];
		this.state.listboxMultiValues = next;
		this.state.listboxMultiReadout = next.join(', ');
	}
	syncMultiSelect(domEvent) {
		const values = domEvent.detail?.data?.values;
		this.state.multiSelectReadout = Array.isArray(values) ? values.join(', ') : '';
	}
	syncCascade(domEvent) {
		const data = domEvent.detail?.data;
		const path = data?.path;
		this.state.cascadeReadout = Array.isArray(path) && path.length ? path.join(' / ') : String(data?.value ?? '');
	}
	syncFileUpload(domEvent) {
		const files = domEvent.detail?.data?.files;
		if (!Array.isArray(files) || !files.length) {
			this.state.fileUploadReadout = '(none)';
			return;
		}
		const names = [];
		const fileCount = files.length;
		for (let index = 0; index < fileCount; index += 1) {
			names.push(files[index]?.name || '');
		}
		this.state.fileUploadReadout = names.join(', ');
	}
	syncCollapsible(domEvent) {
		this.state.collapsibleOpen = Boolean(domEvent.detail?.data?.open);
	}
	handleDemoPage(domEvent) {
		this.state.demoPage = domEvent.detail?.data?.page ?? this.state.demoPage;
	}
	handleDemoQty(domEvent) {
		this.state.demoQty = domEvent.detail?.data?.value ?? this.state.demoQty;
	}
	rollAnim() {
		this.state.animValue = Math.round(2000 + (Math.random() * 9000));
	}
	// Reassign chart state arrays — mimics a live feed pushing new samples.
	rollLineChart() {
		this.state.lineChartSeries = [
			{
				label: 'TPS',
				values: randomValues(10, 5, 55),
			},
			{
				label: 'Finality (×10)',
				values: randomValues(10, 4, 22),
				color: 'var(--color-success, oklch(0.72 0.17 145))',
			},
		];
	}
	rollBarChart() {
		const days = [
			'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
		];
		const next = [];
		const dayCount = days.length;
		for (let index = 0; index < dayCount; index += 1) {
			next.push({
				label: days[index],
				value: randomInt(8, 90),
			});
		}
		this.state.barChartItems = next;
	}
	rollPieChart() {
		const labels = [
			'Validators', 'Stakers', 'Relays', 'Other',
		];
		const next = [];
		const labelCount = labels.length;
		for (let index = 0; index < labelCount; index += 1) {
			next.push({
				label: labels[index],
				value: randomInt(6, 55),
			});
		}
		this.state.pieChartItems = next;
	}
	rollScatterChart() {
		this.state.scatterPoints = randomPoints(randomInt(8, 16), 12, 20);
	}
	rollRadarChart() {
		this.state.radarSeries = [
			{
				label: 'Node A',
				values: randomValues(6, 20, 100),
			},
			{
				label: 'Node B',
				values: randomValues(6, 20, 100),
				color: 'var(--color-warning, oklch(0.8 0.16 85))',
			},
		];
	}
	rollGauges() {
		this.assignState({
			gaugeCpu: randomInt(5, 100),
			gaugeDisk: randomInt(5, 100),
			gaugeMem: randomInt(5, 100),
		});
	}
	handleWizardStep(domEvent) {
		this.state.wizardStep = domEvent.detail?.data?.index ?? this.state.wizardStep;
	}
	wizardNext() {
		this.state.wizardStep = Math.min(this.state.wizardStep + 1, this.wizardSteps.length - 1);
	}
	handleSpeedDialAction(domEvent) {
		this.state.confirmResult = `speed-dial → ${domEvent.detail?.data?.value}`;
	}
	handleMapDemoSelect(domEvent) {
		const data = domEvent.detail?.data;
		const id = data?.id || '';
		const label = data?.item?.label || id || '—';
		this.state.mapDemoActive = id;
		this.state.mapDemoReadout = id ? `selected ${label} (${id})` : '(click a marker)';
	}
	handleMapDemoError(domEvent) {
		const message = domEvent.detail?.data?.message || 'Map failed to load';
		this.state.mapDemoError = message;
	}
	handleMapDemoReady() {
		this.state.mapDemoError = '';
		this.state.mapDemoReadout = 'map ready';
	}
	/**
	 * Live-push the Maps API key into every Google Maps host on the page.
	 * Debounced from the key field so paste/typing reboots maps without a button.
	 */
	applyMapsApiKey() {
		const nextKey = String(this.state.mapsApiKey || '').trim();
		if (nextKey !== this.state.mapsApiKey) {
			this.state.mapsApiKey = nextKey;
		}
		const hosts = [];
		const mapHost = this.refs.gmap_demo;
		if (mapHost) {
			hosts.push(mapHost);
		}
		const lazyGoogle = this.refs.gmap_lazy;
		if (lazyGoogle) {
			hosts.push(lazyGoogle);
		}
		const uiMapHost = this.refs.ui_map_demo;
		if (uiMapHost) {
			hosts.push(uiMapHost);
			let nested = null;
			if (typeof uiMapHost.getMapHost === 'function') {
				nested = uiMapHost.getMapHost();
			} else if (typeof uiMapHost.getComponent === 'function') {
				nested = uiMapHost.getComponent('ui-map-google');
			}
			if (nested && nested.localName === 'ui-map-google') {
				hosts.push(nested);
			}
		}
		const hostCount = hosts.length;
		for (let index = 0; index < hostCount; index += 1) {
			const host = hosts[index];
			host.state.apiKey = nextKey;
			if (typeof host.bootMap === 'function') {
				host.bootMap();
			}
		}
		if (!nextKey) {
			this.state.mapDemoError = '';
			this.state.mapDemoReadout = '(paste a Maps API key — loads live)';
		}
	}
	handleMapsKeyInput(domEvent) {
		// Prefer the live DOM value so we do not race $value two-way writes.
		const raw = domEvent?.target?.value;
		if (typeof raw === 'string' && raw !== this.state.mapsApiKey) {
			this.state.mapsApiKey = raw;
		}
		this.scheduleMapsKeyApply();
	}
	scheduleMapsKeyApply() {
		// Debounce live reload: wait until typing/paste settles, then boot maps.
		if (!this.mapsKeyTimer) {
			this.mapsKeyTimer = this.createTimeout(this.flushMapsApiKey, 400);
		}
		this.mapsKeyTimer.run();
	}
	flushMapsApiKey(component) {
		component.applyMapsApiKey();
	}
	handleMapsKeyKeydown(domEvent) {
		if (domEvent?.key === 'Enter') {
			domEvent.preventDefault?.();
			this.mapsKeyTimer?.clear();
			this.applyMapsApiKey();
		}
	}
	/** Full status string — never inline `map=${…}` in a template (parsed as an attr). */
	uiMapDemoStatus() {
		const readout = this.state.uiMapDemoReadout || '(select an item)';
		const provider = this.state.uiMapDemoMapProvider || 'auto';
		return `${readout} · map=${provider}`;
	}
	/** Keep demo seed center/zoom in sync so provider rebinds do not yank the map. */
	handleUiMapDemoView(domEvent) {
		const data = domEvent?.detail?.data;
		const center = data?.center;
		const zoom = data?.zoom;
		if (center && typeof center.lat === 'number' && typeof center.lng === 'number') {
			const prev = this.state.uiMapDemoCenter;
			// Reuse the existing ref when coords match — a new equal object rebounds
			// into ui-map as a wasted set on every pan/idle.
			if (!prev || prev.lat !== center.lat || prev.lng !== center.lng) {
				this.state.uiMapDemoCenter = {
					lat: center.lat,
					lng: center.lng,
				};
			}
		}
		if (typeof zoom === 'number' && Number.isFinite(zoom) && zoom !== this.state.uiMapDemoZoom) {
			this.state.uiMapDemoZoom = zoom;
		}
	}
	handleUiMapDemoSelect(domEvent) {
		const data = domEvent.detail?.data;
		const id = data?.id || '';
		const label = data?.item?.label || id || '—';
		const kind = data?.kind || data?.item?.kind || '';
		this.state.uiMapDemoActive = id;
		this.state.uiMapDemoReadout = id ? `${kind || 'item'} ${label}` : '(select an item)';
	}
	setUiMapDemoMapProvider(domEvent) {
		const provider = domEvent?.currentTarget?.dataset?.provider ||
			domEvent?.detail?.data?.value ||
			'';
		if (!provider) {
			return;
		}
		// Snapshot camera from the live board before swapping provider binding.
		const board = this.refs.ui_map_demo;
		if (board && typeof board.captureCameraFromHost === 'function') {
			board.captureCameraFromHost();
			const cam = board.lastCamera;
			if (cam?.center) {
				const prev = this.state.uiMapDemoCenter;
				if (!prev || prev.lat !== cam.center.lat || prev.lng !== cam.center.lng) {
					this.state.uiMapDemoCenter = {
						lat: cam.center.lat,
						lng: cam.center.lng,
					};
				}
			}
			if (typeof cam?.zoom === 'number' && Number.isFinite(cam.zoom) && cam.zoom !== this.state.uiMapDemoZoom) {
				this.state.uiMapDemoZoom = cam.zoom;
			}
		}
		this.state.uiMapDemoMapProvider = provider;
		this.state.uiMapDemoReadout = `map provider → ${provider}`;
		if (provider === 'google' || provider === 'auto') {
			this.scheduleMapsKeyApply();
		}
	}
	handleOpenskyDemoSelect(domEvent) {
		const data = domEvent.detail?.data;
		const id = data?.id || '';
		const label = data?.item?.label || data?.item?.callsign || id || '—';
		this.state.openskyDemoReadout = id ? `selected ${label}` : '(OpenSky live traffic in view)';
	}
	handleOpenskyDemoTraffic(domEvent) {
		const count = domEvent?.detail?.data?.count ?? 0;
		this.state.openskyDemoReadout = `OpenSky · ${count} aircraft in view`;
	}
	handleOpenskyDemoError(domEvent) {
		const message = domEvent?.detail?.data?.message || 'OpenSky error';
		this.state.openskyDemoReadout = message;
	}
	refreshOpenskyDemo() {
		const host = this.refs.opensky_demo;
		if (host && typeof host.refreshTraffic === 'function') {
			host.refreshTraffic();
			this.state.openskyDemoReadout = 'refreshing OpenSky…';
		}
	}
	openOpenskyDemoInBrowser() {
		const host = this.refs.opensky_demo;
		if (host && typeof host.openInOpensky === 'function') {
			host.openInOpensky();
			return;
		}
		globalThis.open('https://map.opensky-network.org/', '_blank', 'noopener,noreferrer');
	}
	handleLeafletDemoSelect(domEvent) {
		const data = domEvent.detail?.data;
		const id = data?.id || '';
		const label = data?.item?.label || id || '—';
		this.state.mapDemoActive = id;
		this.state.leafletDemoReadout = id ? `selected ${label}` : '(click a marker)';
	}
	handleOpenLayersDemoSelect(domEvent) {
		const data = domEvent.detail?.data;
		const id = data?.id || '';
		const label = data?.item?.label || id || '—';
		this.state.mapDemoActive = id;
		this.state.openlayersDemoReadout = id ? `selected ${label}` : '(click a marker)';
	}
	handleOpenStreetMapDemoSelect(domEvent) {
		const data = domEvent.detail?.data;
		const id = data?.id || '';
		const label = data?.item?.label || id || '—';
		this.state.mapDemoActive = id;
		this.state.openstreetmapDemoReadout = id ? `selected ${label}` : '(click a marker · Open in OSM)';
	}
	openOsmDemoInBrowser() {
		const host = this.refs.osm_demo;
		if (host && typeof host.openInOsm === 'function') {
			host.openInOsm();
			this.state.openstreetmapDemoReadout = 'opened on openstreetmap.org';
		}
	}
	setOsmDemoLayer(domEvent) {
		const layerName = domEvent?.currentTarget?.dataset?.layer ||
			domEvent?.detail?.data?.value ||
			'';
		if (!layerName) {
			return;
		}
		this.state.osmDemoLayer = layerName;
		const host = this.refs.osm_demo;
		if (host) {
			host.state.layer = layerName;
		}
	}
	mountLeafletMap() {
		this.state.showLeafletMap = true;
		this.state.leafletLazyReadout = 'mounted — OSM tiles via Leaflet';
	}
	mountOpenLayersMap() {
		this.state.showOpenLayersMap = true;
		this.state.openlayersLazyReadout = 'mounted — OSM tiles via OpenLayers';
	}
	mountOsmMap() {
		this.state.showOsmMap = true;
		this.state.osmLazyReadout = `mounted — layer=${this.state.osmLazyLayer}`;
	}
	mountGoogleMap() {
		this.state.showGoogleMap = true;
		if (this.state.mapsApiKey) {
			this.state.googleLazyReadout = 'mounted — booting Maps JS';
			return;
		}
		this.state.googleLazyReadout = 'mounted — missing-key facade (no network)';
	}
	leafletMapDemo() {
		return this.htmlElement`
			<div class="demo-map-stage">
				<ui-map-leaflet
					.state.center=${this.state.leafletLazyCenter}
					.state.zoom=${12}
					.state.items=${this.state.leafletLazyItems}
					.state.fitItems=${true}
					.state.emptyLabel=${'Leaflet · San Francisco'}
					@map-leaflet:select=${this.handleLeafletLazySelect}></ui-map-leaflet>
			</div>`;
	}
	openLayersMapDemo() {
		return this.htmlElement`
			<div class="demo-map-stage">
				<ui-map-openlayers
					.state.center=${this.state.openlayersLazyCenter}
					.state.zoom=${12}
					.state.items=${this.state.openlayersLazyItems}
					.state.fitItems=${true}
					.state.emptyLabel=${'OpenLayers · San Francisco'}
					@map-openlayers:select=${this.handleOpenLayersLazySelect}></ui-map-openlayers>
			</div>`;
	}
	osmMapDemo() {
		return this.htmlElement`
			<div class="demo-map-stage">
				<ui-map-openstreetmap
					#osm_lazy
					.state.center=${this.state.osmLazyCenter}
					.state.zoom=${13}
					.state.layer=${this.state.osmLazyLayer}
					.state.items=${this.state.osmLazyItems}
					.state.fitItems=${true}
					.state.emptyLabel=${'OpenStreetMap · London'}
					@map-openstreetmap:select=${this.handleOsmLazySelect}></ui-map-openstreetmap>
			</div>`;
	}
	googleMapDemo() {
		return this.htmlElement`
			<div class="demo-map-stage">
				<ui-map-google
					#gmap_lazy
					.state.apiKey=${this.state.mapsApiKey}
					.state.center=${this.state.googleLazyCenter}
					.state.zoom=${12}
					.state.mapTypeId=${'roadmap'}
					.state.items=${this.state.googleLazyItems}
					.state.fitItems=${true}
					.state.emptyLabel=${'Google Maps · needs apiKey'}
					@map-google:select=${this.handleGoogleLazySelect}
					@map-google:error=${this.handleGoogleLazyError}
					@map-google:ready=${this.handleGoogleLazyReady}></ui-map-google>
			</div>`;
	}
	handleLeafletLazySelect(domEvent) {
		const label = domEvent.detail?.data?.item?.label || domEvent.detail?.data?.id || '—';
		this.state.leafletLazyReadout = `selected ${label}`;
	}
	handleOpenLayersLazySelect(domEvent) {
		const label = domEvent.detail?.data?.item?.label || domEvent.detail?.data?.id || '—';
		this.state.openlayersLazyReadout = `selected ${label}`;
	}
	handleOsmLazySelect(domEvent) {
		const label = domEvent.detail?.data?.item?.label || domEvent.detail?.data?.id || '—';
		this.state.osmLazyReadout = `selected ${label} · layer=${this.state.osmLazyLayer}`;
	}
	handleGoogleLazySelect(domEvent) {
		const label = domEvent.detail?.data?.item?.label || domEvent.detail?.data?.id || '—';
		this.state.googleLazyReadout = `selected ${label}`;
	}
	handleGoogleLazyError(domEvent) {
		this.state.googleLazyReadout = domEvent.detail?.data?.message || 'Map failed';
	}
	handleGoogleLazyReady() {
		this.state.googleLazyReadout = 'map ready';
	}
	setOsmLazyLayer(domEvent) {
		const layerName = domEvent?.currentTarget?.dataset?.layer ||
			domEvent?.detail?.data?.value ||
			'';
		if (!layerName) {
			return;
		}
		this.state.osmLazyLayer = layerName;
		const host = this.refs.osm_lazy;
		if (host) {
			host.state.layer = layerName;
		}
		this.state.osmLazyReadout = `layer=${layerName}`;
	}
	openOsmLazyInBrowser() {
		const host = this.refs.osm_lazy;
		if (host && typeof host.openInOsm === 'function') {
			host.openInOsm();
			this.state.osmLazyReadout = 'opened on openstreetmap.org';
		}
	}
	handleFabClick() {
		this.state.confirmResult = 'fab clicked';
	}
	handleMenuSelect(domEvent) {
		this.state.confirmResult = `menu → ${domEvent.detail?.data?.value}`;
	}
	handlePinInput(domEvent) {
		this.state.pinResult = `typing: ${domEvent.detail?.data?.value}`;
	}
	handlePinComplete(domEvent) {
		this.state.pinResult = `complete → ${domEvent.detail?.data?.value}`;
	}
	openPulldownDemo() {
		// ui-pulldown opens off the `pulldown:toggle` document-bus event.
		this.emit('pulldown:toggle', {
			open: true,
		});
	}
	closePulldownDemo() {
		this.emit('pulldown:toggle', {
			open: false,
		});
	}
	openSlideoutEnd() {
		this.refs.slideout_end?.open();
	}
	openSlideoutStart() {
		this.refs.slideout_start?.open();
	}
	// The three public methods a consumer wires their own buttons to. toggle()
	// flips, so one button can both open AND close; open()/close() are direct.
	openSidebarDemo() {
		this.refs.sidebar_demo?.openSidebar();
	}
	closeSidebarDemo() {
		this.refs.sidebar_demo?.close();
	}
	toggleSidebarDemo() {
		this.refs.sidebar_demo?.toggle();
	}
	cycleStatus() {
		const order = [
			'online', 'connecting', 'offline',
		];
		const next = order[(order.indexOf(this.state.statusValue) + 1) % order.length];
		this.state.statusValue = next;
	}
	openWhitebox() {
		this.refs.whitebox?.open();
	}
	loadPagedDemo(options) {
		// Synthetic loader (8 pages × 12 rows = 96) — enough rows that the
		// bounded virtual table only mounts a window inside the 14rem demo box.
		const page = options.reset ? 1 : (options.cursor ?? 1);
		const totalPages = 8;
		const pageSize = 12;
		const start = (page - 1) * pageSize;
		const rows = new Array(pageSize);
		for (let offset = 0; offset < pageSize; offset++) {
			const rowIndex = start + offset + 1;
			rows[offset] = {
				id: rowIndex,
				hash: `0x${rowIndex.toString(16).padStart(6, '0')}`,
				amount: (rowIndex * 3.14).toFixed(2),
			};
		}
		return Promise.resolve({
			items: rows,
			nextCursor: page < totalPages ? page + 1 : null,
			hasMore: page < totalPages,
			totalCount: totalPages * pageSize,
		});
	}
	pagedRow(row) {
		return html`
			<div class="demo-paged-row">
				<span class="demo-mono demo-paged-id">#${row.id}</span>
				<span class="demo-mono">${row.hash}</span>
				<span class="demo-mono demo-paged-amount">${row.amount} VIAT</span>
			</div>
		`;
	}
	pagedHead() {
		// ui-collection mounts renderHead via list('_head') — return html`` (not a
		// raw string; not a content-spot LightTemplate dump).
		return html`
			<div class="demo-paged-row demo-paged-head">
				<span class="demo-mono">#</span>
				<span class="demo-mono">HASH</span>
				<span class="demo-mono demo-paged-amount">AMOUNT</span>
			</div>
		`;
	}
	render() {
		this.html`
			<div class="gallery">
				<header class="top-bar">
					<ui-icon-button class="top-bar-menu"
						.state.icon=${'menu'}
						.state.tooltip=${'Navigation'}
						.state.size=${'md'}
						.state.tone=${'neutral'}
						@icon-button:click=${this.toggleNav}></ui-icon-button>
					<span class="top-bar-title">UWC</span>
					<span class="top-bar-end" aria-hidden="true"></span>
				</header>
				<div class="gallery-body">
					<ui-sidebar #nav_sidebar class="preview-nav"
						.state.side=${'left'}
						.state.responsive=${false}
						.state.mode=${'flyout'}
						.state.hotkey=${''}
						.state.closeButton=${true}
						.state.backdrop=${true}
						.state.swipe=${true}>
						<div class="rail">
							<div class="rail-brand">
								<span class="rail-glyph"></span>
								<span class="rail-brand-text">UWC<small>component index</small></span>
							</div>
							<label class="rail-search">
								<ui-icon class="rail-search-icon" .state=${{
									name: 'search',
									size: 'sm',
									tone: 'muted',
								}}></ui-icon>
								<input class="rail-search-input" type="search" placeholder="filter…" $value="navQuery">
							</label>
							<nav class="rail-nav" @click=${this.setCategory}>
								${this.list('categories', this.railCat, this.railCatKey)}
							</nav>
							<div class="rail-foot">
								<ui-text .state.variant=${'overline'} .state.tone=${'muted'}>theme</ui-text>
								<ui-theme-select></ui-theme-select>
							</div>
						</div>
					</ui-sidebar>
					<main class="stage" #stage>
						<header class="stage-head">
							<ui-text .state.variant=${'display'} .state.tone=${'accent'}>Component Index</ui-text>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>tier-0 atoms · viat / universal-web-components · this gallery is built from the components it shows</ui-text>
						</header>

				<section class="cat-section" data-cat-section="layout" #cat_layout ?hidden=${() => {
					return this.catSectionHidden('layout');
				}}>
					<header class="cat-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>Layout</ui-text>
					</header>

<section class="demo" data-cat="layout" ?hidden=${() => {
	return this.demoHidden('layout', 'UISurface surface tones');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UISurface</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>tones · padding · radius · elevation · interactive</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="grid">
							<ui-surface .state=${{
								tone: 'panel',
								padding: 'md',
								radius: 'md',
							}}><ui-text .state.variant=${'caption'} .state.tone=${'muted'}>panel</ui-text></ui-surface>
							<ui-surface .state=${{
								tone: 'subtle',
								padding: 'md',
								radius: 'md',
							}}><ui-text .state.variant=${'caption'} .state.tone=${'muted'}>subtle</ui-text></ui-surface>
							<ui-surface .state=${{
								tone: 'popup',
								padding: 'md',
								radius: 'md',
							}}><ui-text .state.variant=${'caption'} .state.tone=${'muted'}>popup</ui-text></ui-surface>
							<ui-surface .state=${{
								tone: 'success',
								padding: 'md',
								radius: 'md',
							}}><ui-text .state.variant=${'caption'} .state.tone=${'muted'}>success</ui-text></ui-surface>
							<ui-surface .state=${{
								tone: 'danger',
								padding: 'md',
								radius: 'md',
							}}><ui-text .state.variant=${'caption'} .state.tone=${'muted'}>danger</ui-text></ui-surface>
							<ui-surface .state=${{
								tone: 'accent',
								padding: 'md',
								radius: 'md',
								elevation: '2',
							}}><ui-text .state.variant=${'caption'} .state.tone=${'muted'}>accent · elev 2</ui-text></ui-surface>
							<ui-surface .state=${{
								tone: 'panel',
								padding: 'md',
								radius: 'md',
								elevation: '3',
								border: true,
							}}><ui-text .state.variant=${'caption'} .state.tone=${'muted'}>panel · elev 3 · border</ui-text></ui-surface>
							<ui-surface .state=${{
								tone: 'panel',
								padding: 'md',
								radius: 'md',
								interactive: true,
								border: true,
							}}><ui-text .state.variant=${'caption'} .state.tone=${'muted'}>interactive · hover</ui-text></ui-surface>
						</div>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.surfaceExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="layout" ?hidden=${() => {
	return this.demoHidden('layout', 'UIStack stack layout flex');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIStack</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>flex layout · horizontal / vertical · gap · align · justify</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="cluster">
							<ui-surface .state=${{
								tone: 'subtle',
								padding: 'md',
								radius: 'md',
							}}>
								<ui-stack .state=${{
									orientation: 'horizontal',
									gap: 'sm',
								}}>
									<ui-surface .state=${{
										tone: 'accent',
										padding: 'sm',
										radius: 'sm',
									}}><ui-text .state.variant=${'caption'}>A</ui-text></ui-surface>
									<ui-surface .state=${{
										tone: 'accent',
										padding: 'sm',
										radius: 'sm',
									}}><ui-text .state.variant=${'caption'}>B</ui-text></ui-surface>
									<ui-surface .state=${{
										tone: 'accent',
										padding: 'sm',
										radius: 'sm',
									}}><ui-text .state.variant=${'caption'}>C</ui-text></ui-surface>
								</ui-stack>
							</ui-surface>
							<ui-surface .state=${{
								tone: 'subtle',
								padding: 'md',
								radius: 'md',
							}}>
								<ui-stack .state=${{
									orientation: 'vertical',
									gap: 'md',
								}}>
									<ui-surface .state=${{
										tone: 'accent',
										padding: 'sm',
										radius: 'sm',
									}}><ui-text .state.variant=${'caption'}>A</ui-text></ui-surface>
									<ui-surface .state=${{
										tone: 'accent',
										padding: 'sm',
										radius: 'sm',
									}}><ui-text .state.variant=${'caption'}>B</ui-text></ui-surface>
									<ui-surface .state=${{
										tone: 'accent',
										padding: 'sm',
										radius: 'sm',
									}}><ui-text .state.variant=${'caption'}>C</ui-text></ui-surface>
								</ui-stack>
							</ui-surface>
							<ui-surface .state=${{
								tone: 'subtle',
								padding: 'md',
								radius: 'md',
							}}>
								<ui-stack .state=${{
									orientation: 'horizontal',
									gap: 'lg',
									justify: 'between',
								}}>
									<ui-surface .state=${{
										tone: 'accent',
										padding: 'sm',
										radius: 'sm',
									}}><ui-text .state.variant=${'caption'}>A</ui-text></ui-surface>
									<ui-surface .state=${{
										tone: 'accent',
										padding: 'sm',
										radius: 'sm',
									}}><ui-text .state.variant=${'caption'}>B</ui-text></ui-surface>
									<ui-surface .state=${{
										tone: 'accent',
										padding: 'sm',
										radius: 'sm',
									}}><ui-text .state.variant=${'caption'}>C</ui-text></ui-surface>
								</ui-stack>
							</ui-surface>
						</div>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.stackExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="layout" ?hidden=${() => {
	return this.demoHidden('layout', 'UIDivider divider separator rule');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIDivider</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>horizontal · vertical · labeled · dashed · inset</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-text .state.variant=${'body'}>Section above the rule</ui-text>
							<ui-divider></ui-divider>
							<ui-text .state.variant=${'body'}>Section below the rule</ui-text>
							<ui-divider .state.label=${'OR'}></ui-divider>
							<ui-divider .state.variant=${'dashed'}></ui-divider>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'md',
								align: 'center',
							}}>
								<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Left</ui-text>
								<ui-divider .state.orientation=${'vertical'}></ui-divider>
								<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Middle</ui-text>
								<ui-divider .state.orientation=${'vertical'}></ui-divider>
								<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Right</ui-text>
							</ui-stack>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.dividerExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="layout" ?hidden=${() => {
	return this.demoHidden('layout', 'UISeparator separator alias divider decorative');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UISeparator</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}> Separator · alias of ui-divider · decorative</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-text .state.variant=${'body'}>Above</ui-text>
							<ui-separator .state.decorative=${true}></ui-separator>
							<ui-text .state.variant=${'body'}>Below · decorative (aria-hidden)</ui-text>
							<ui-separator .state.label=${'or'}></ui-separator>
						</ui-stack>
					</ui-surface>
				</section>

<section class="demo" data-cat="layout" ?hidden=${() => {
	return this.demoHidden('layout', 'scroll-fade fade edges overflow mask');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>scroll-fade</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>uwc.util · fade start/end of a scroll box · class or data-scroll-fade</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="scroll-fade" style="max-block-size: 7rem; overflow: auto; padding-inline: 0.25rem;">
							<ui-stack .state=${{
								orientation: 'vertical',
								gap: 'sm',
							}}>
								<ui-text .state.variant=${'body'}>Edge fade — scroll this column. The first and last lines dissolve into the surface.</ui-text>
								<ui-text .state.variant=${'body'}>Block 4182907 sealed · 128 validators</ui-text>
								<ui-text .state.variant=${'body'}>Tx 0x9f3a confirmed · 128.40 VIAT</ui-text>
								<ui-text .state.variant=${'body'}>Slow finality on slot 4821</ui-text>
								<ui-text .state.variant=${'body'}>Snapshot committed to disk</ui-text>
								<ui-text .state.variant=${'body'}>Peer 0x77c1 rejoined quorum</ui-text>
							</ui-stack>
						</div>
					</ui-surface>
				</section>

<section class="demo" data-cat="layout" ?hidden=${() => {
	return this.demoHidden('layout', 'UICard card media structured header actions');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UICard</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>media · header · body · actions · auto-collapsing regions</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'md',
							wrap: true,
							align: 'start',
						}}>
							<ui-card style="max-inline-size: 260px" .state.heading=${'Atlas Rig'} .state.subheading=${'Sector 7 · online'} .state.interactive=${true}>
								<div slot="media" style="block-size: 120px; background: linear-gradient(135deg, var(--cyan), var(--color-info));"></div>
								<ui-text .state.variant=${'body'} .state.tone=${'muted'}>Composited surface with a media banner, title row, body and an actions footer.</ui-text>
								<div slot="actions">
									<ui-button .state=${{
										label: 'Open',
										tone: 'primary',
										size: 'sm',
									}}></ui-button>
									<ui-button .state=${{
										label: 'Details',
										variant: 'ghost',
										size: 'sm',
									}}></ui-button>
								</div>
							</ui-card>
							<ui-card style="max-inline-size: 260px" .state.heading=${'No-media card'} .state.subheading=${'Header + body only'}>
								<ui-text .state.variant=${'body'} .state.tone=${'muted'}>With no media or actions slotted, those regions collapse — no empty chrome.</ui-text>
							</ui-card>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.cardExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="layout" ?hidden=${() => {
	return this.demoHidden('layout', 'UIMasonry masonry grid gallery columns multicol');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIMasonry</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>native multicolumn · balanced columns · column-major fill</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-masonry .state.columns=${3} .state.gap=${'0.75rem'}>
							<ui-surface .state=${{
								tone: 'subtle',
								padding: 'md',
								radius: 'md',
							}}><ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Short tile</ui-text></ui-surface>
							<ui-surface .state=${{
								tone: 'accent',
								padding: 'md',
								radius: 'md',
							}}><ui-text .state.variant=${'caption'}>A taller tile with two lines of copy so the masonry packing is visible across columns.</ui-text></ui-surface>
							<ui-surface .state=${{
								tone: 'subtle',
								padding: 'md',
								radius: 'md',
							}}><ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Tile</ui-text></ui-surface>
							<ui-surface .state=${{
								tone: 'success',
								padding: 'md',
								radius: 'md',
							}}><ui-text .state.variant=${'caption'}>Medium tile with a single sentence of filler.</ui-text></ui-surface>
							<ui-surface .state=${{
								tone: 'subtle',
								padding: 'md',
								radius: 'md',
							}}><ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Short</ui-text></ui-surface>
							<ui-surface .state=${{
								tone: 'warning',
								padding: 'md',
								radius: 'md',
							}}><ui-text .state.variant=${'caption'}>Another tile, slightly longer than its neighbour to vary the column heights.</ui-text></ui-surface>
						</ui-masonry>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.masonryExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="layout" ?hidden=${() => {
	return this.demoHidden('layout', 'UIPanel panel chrome');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIPanel</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>id · title · status dot chrome</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'md',
							wrap: true,
						}}>
							<ui-panel .state=${{
								panelId: 'WALLET',
								heading: 'ADDRESS',
							}}></ui-panel>
							<ui-panel .state=${{
								panelId: 'NET',
								heading: 'STATUS',
								showDot: false,
							}}></ui-panel>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.panelExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="layout" ?hidden=${() => {
	return this.demoHidden('layout', 'UIPanelHeader panel header heading close slots');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIPanelHeader</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>heading · showClose · closeLabel · start/end slots · used by slideout + notification</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'lg',
						}}>
							<ui-surface .state=${{
								tone: 'subtle',
								padding: 'none',
								radius: 'md',
								border: true,
							}}>
								<ui-panel-header .state.heading=${'Heading only'}></ui-panel-header>
							</ui-surface>
							<ui-surface .state=${{
								tone: 'subtle',
								padding: 'none',
								radius: 'md',
								border: true,
							}}>
								<ui-panel-header
									.state.heading=${'Notifications'}
									.state.showClose=${true}
									.state.closeLabel=${'Dismiss'}></ui-panel-header>
							</ui-surface>
							<ui-surface .state=${{
								tone: 'subtle',
								padding: 'none',
								radius: 'md',
								border: true,
							}}>
								<ui-panel-header .state.heading=${'Inbox'} .state.showClose=${true}>
									<ui-icon slot="start" .state.name=${'bell'} .state.size=${'sm'}></ui-icon>
									<ui-text slot="end" .state.variant=${'caption'} .state.tone=${'muted'}>3</ui-text>
								</ui-panel-header>
							</ui-surface>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.panelHeaderExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="layout" ?hidden=${() => {
	return this.demoHidden('layout', 'UITabs tabs navigation');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UITabs</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>animated tab strip · cross-fade or direction-aware slide swap · vertical & horizontal</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'lg',
						}}>
							<ui-tabs .state.transition=${'slide'} .state.items=${this.state.tabsHorizontal}>
									<ui-surface slot="overview" .state=${{
										tone: 'subtle',
										padding: 'md',
										radius: 'md',
									}}>
										<ui-text .state.variant=${'body'}>Slide mode · direction-aware. Click across tabs — content slides in from the side you travelled (left/right) with a motion blur. Axis follows orientation; force x / y / diagonal via slideAxis.</ui-text>
									</ui-surface>
									<ui-surface slot="security" .state=${{
										tone: 'subtle',
										padding: 'md',
										radius: 'md',
									}}>
										<ui-text .state.variant=${'body'}>Security panel · arrives from the right when you advance, the left when you go back.</ui-text>
									</ui-surface>
									<ui-surface slot="advanced" .state=${{
										tone: 'subtle',
										padding: 'md',
										radius: 'md',
									}}>
										<ui-text .state.variant=${'body'}>Advanced panel · the indicator bubble still slides underneath.</ui-text>
									</ui-surface>
								</ui-tabs>
								<ui-tabs .state.items=${this.state.tabsHorizontal}>
								<ui-surface slot="overview" .state=${{
									tone: 'subtle',
									padding: 'md',
									radius: 'md',
								}}>
									<ui-text .state.variant=${'body'}>Horizontal tabs · overview panel.</ui-text>
								</ui-surface>
								<ui-surface slot="security" .state=${{
									tone: 'subtle',
									padding: 'md',
									radius: 'md',
								}}>
									<ui-text .state.variant=${'body'}>Security panel content.</ui-text>
								</ui-surface>
								<ui-surface slot="advanced" .state=${{
									tone: 'subtle',
									padding: 'md',
									radius: 'md',
								}}>
									<ui-text .state.variant=${'body'}>Advanced panel content.</ui-text>
								</ui-surface>
							</ui-tabs>
							<ui-tabs .state.orientation=${'vertical'} .state.items=${this.state.tabsVertical}>
								<ui-surface slot="profile" .state=${{
									tone: 'subtle',
									padding: 'md',
									radius: 'md',
								}}>
									<ui-text .state.variant=${'body'}>Vertical tabs · profile panel.</ui-text>
								</ui-surface>
								<ui-surface slot="wallet" .state=${{
									tone: 'subtle',
									padding: 'md',
									radius: 'md',
								}}>
									<ui-text .state.variant=${'body'}>Wallet panel.</ui-text>
								</ui-surface>
								<ui-surface slot="theme" .state=${{
									tone: 'subtle',
									padding: 'md',
									radius: 'md',
								}}>
									<ui-text .state.variant=${'body'}>Theme panel.</ui-text>
								</ui-surface>
							</ui-tabs>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.tabsExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="layout" ?hidden=${() => {
	return this.demoHidden('layout', 'UIBar bar regions start center end');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIBar</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>three-region layout primitive · start / center / end slots</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-bar class="demo-bar">
							<ui-text slot="start" .state.variant=${'mono'} .state.tone=${'accent'}>⩝ START</ui-text>
							<ui-text slot="center" .state.variant=${'caption'} .state.tone=${'muted'}>center region</ui-text>
							<ui-badge slot="end" .state=${{
								label: 'END',
								tone: 'accent',
							}}></ui-badge>
						</ui-bar>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.barExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="layout" ?hidden=${() => {
	return this.demoHidden('layout', 'UIAccordion accordion collapsible details');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAccordion</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>native details · shared group = one-open · first row forced open (state.open=true) · animated open height</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'sm',
						}}>
							<ui-accordion .state.summary=${'What is UWC?'} .state.group=${'faq'} .state.open=${true}>
								<ui-text .state.tone=${'muted'}>A zero-dependency, compiler-free custom-element framework — Lit-style templates, surgical patch passes, no build step.</ui-text>
							</ui-accordion>
							<ui-accordion .state.summary=${'Why native details?'} .state.group=${'faq'}>
								<ui-text .state.tone=${'muted'}>Siblings sharing a group are a browser-native exclusive accordion. Opening this one closes the others — zero JS.</ui-text>
							</ui-accordion>
							<ui-accordion .state.summary=${'Disabled row'} .state.group=${'faq'} .state.disabled=${true}>
								<ui-text .state.tone=${'muted'}>Unreachable while disabled.</ui-text>
							</ui-accordion>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.accordionExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="layout" ?hidden=${() => {
	return this.demoHidden('layout', 'UICollapsible collapsible disclosure expand');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UICollapsible</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>heading · open · disabled · collapsible:toggle</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Live · collapsible:toggle</span>
								<ui-collapsible
									.state.heading=${'Network details'}
									.state.open=${this.state.collapsibleOpen}
									@collapsible:toggle=${this.syncCollapsible}>
									<p>Peers · latency · last sync timestamp. open = ${this.state.collapsibleOpen}</p>
								</ui-collapsible>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Disabled</span>
								<ui-collapsible .state.heading=${'Locked'} .state.disabled=${true}>
									<p>Cannot expand.</p>
								</ui-collapsible>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.collapsibleExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="layout" ?hidden=${() => {
	return this.demoHidden('layout', 'UIAspectRatio aspect ratio 16/9 media box');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAspectRatio</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>ratio string or number · slotted media</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">16 / 9</span>
								<ui-aspect-ratio .state.ratio=${'16/9'}>
									<div style="background:color-mix(in oklch, var(--cyan) 35%, transparent);display:grid;place-items:center;height:100%;color:var(--text-main)">16:9</div>
								</ui-aspect-ratio>
							</div>
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">1 / 1</span>
								<ui-aspect-ratio .state.ratio=${'1/1'}>
									<div style="background:color-mix(in oklch, var(--text-muted) 25%, transparent);display:grid;place-items:center;height:100%">1:1</div>
								</ui-aspect-ratio>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.aspectRatioExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="layout" ?hidden=${() => {
	return this.demoHidden('layout', 'UIScrollArea scroll area overflow themed');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIScrollArea</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>maxHeight · vertical / horizontal / both · thin scrollbar</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Vertical · 8rem</span>
								<ui-scroll-area .state.maxHeight=${'8rem'}>
									<div style="padding:0.5rem;line-height:1.6">
										<p>Line 1 — scroll inside this box.</p>
										<p>Line 2</p><p>Line 3</p><p>Line 4</p><p>Line 5</p>
										<p>Line 6</p><p>Line 7</p><p>Line 8</p><p>Line 9</p><p>Line 10</p>
									</div>
								</ui-scroll-area>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.scrollAreaExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="layout" ?hidden=${() => {
	return this.demoHidden('layout', 'UIResizable resizable split panes drag handle collapse minPrimary');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIResizable</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>two panes · drag handle · minPrimary=0 collapse · per-section min/max · handle stays grabable</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Horizontal</span>
								<div class="demo-resizable-frame" style="block-size:10rem">
									<ui-resizable .state.primarySize=${0.35} .state.orientation=${'horizontal'}>
										<div slot="start" class="demo-resizable-pane demo-resizable-pane-accent">Start</div>
										<div slot="end" class="demo-resizable-pane">End — drag the handle</div>
									</ui-resizable>
								</div>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Vertical</span>
								<div class="demo-resizable-frame" style="block-size:12rem">
									<ui-resizable .state.primarySize=${0.4} .state.orientation=${'vertical'}>
										<div slot="start" class="demo-resizable-pane demo-resizable-pane-muted">Top</div>
										<div slot="end" class="demo-resizable-pane">Bottom</div>
									</ui-resizable>
								</div>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Collapsed start · minPrimary=0 · handle still grabable</span>
								<div class="demo-resizable-frame" style="block-size:10rem">
									<ui-resizable .state.primarySize=${0} .state.minPrimary=${0} .state.maxPrimary=${1}
										.state.minSecondary=${0.2} .state.maxSecondary=${1} .state.orientation=${'horizontal'}>
										<div slot="start" class="demo-resizable-pane demo-resizable-pane-accent">Start</div>
										<div slot="end" class="demo-resizable-pane">End — drag the handle off the edge</div>
									</ui-resizable>
								</div>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.resizableExample}></ui-code-block>
					</ui-surface>
				</section>
				</section>

				<section class="cat-section" data-cat-section="typography" #cat_typography ?hidden=${() => {
					return this.catSectionHidden('typography');
				}}>
					<header class="cat-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>Typography</ui-text>
					</header>

<section class="demo" data-cat="typography" ?hidden=${() => {
	return this.demoHidden('typography', 'UIText text typography heading');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIText</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>variants · tones</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'sm',
						}}>
							<ui-text .state.variant=${'display'}>Display heading</ui-text>
							<ui-text .state.variant=${'h1'}>Heading 1</ui-text>
							<ui-text .state.variant=${'h2'}>Heading 2</ui-text>
							<ui-text .state.variant=${'h3'} .state.tone=${'accent'}>Heading 3 · accent</ui-text>
							<ui-text .state.variant=${'body'}>Body copy stays readable at the comfortable default size.</ui-text>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Caption · muted tone for secondary info</ui-text>
							<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>overline · uppercase tracker</ui-text>
							<ui-text .state.variant=${'mono'}>monospace_for_addresses_and_codes</ui-text>
							<ui-text .state.variant=${'body'} .state.tone=${'success'}>success</ui-text>
							<ui-text .state.variant=${'body'} .state.tone=${'warning'}>warning</ui-text>
							<ui-text .state.variant=${'body'} .state.tone=${'danger'}>danger</ui-text>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.textExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="typography" ?hidden=${() => {
	return this.demoHidden('typography', 'UIIcon icon');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIIcon</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>sizes · tones · spin</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'lg',
							align: 'center',
							wrap: true,
						}}>
							<ui-icon .state=${{
								name: 'star',
								size: 'xs',
								tone: 'accent',
							}}></ui-icon>
							<ui-icon .state=${{
								name: 'star',
								size: 'sm',
								tone: 'accent',
							}}></ui-icon>
							<ui-icon .state=${{
								name: 'star',
								size: 'md',
								tone: 'accent',
							}}></ui-icon>
							<ui-icon .state=${{
								name: 'star',
								size: 'lg',
								tone: 'accent',
							}}></ui-icon>
							<ui-icon .state=${{
								name: 'star',
								size: 'xl',
								tone: 'accent',
							}}></ui-icon>
							<ui-icon .state=${{
								name: 'circle-check',
								size: 'lg',
								tone: 'success',
							}}></ui-icon>
							<ui-icon .state=${{
								name: 'triangle-alert',
								size: 'lg',
								tone: 'warning',
							}}></ui-icon>
							<ui-icon .state=${{
								name: 'circle-x',
								size: 'lg',
								tone: 'danger',
							}}></ui-icon>
							<ui-icon .state=${{
								name: 'loader-circle',
								size: 'lg',
								spin: this.state.spinDemo,
							}}></ui-icon>
							<ui-button .state=${{
								label: this.state.spinDemo ? 'Stop' : 'Spin',
								tone: 'primary',
								variant: 'outline',
								size: 'sm',
							}} @button:click=${this.toggleSpin}></ui-button>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.iconExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="typography" ?hidden=${() => {
	return this.demoHidden('typography', 'UITypewriter typewriter char stream typing animation cursor');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UITypewriter</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>char-stream · looping phrases · blinking caret · reduced-motion safe</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'lg',
						}}>
							<ui-text .state.variant=${'h3'} .state.tone=${'default'}>
								<ui-typewriter .state.phrases=${this.state.typewriterPhrases} .state.loop=${true}></ui-typewriter>
							</ui-text>
							<ui-text .state.variant=${'body'} .state.tone=${'muted'}>
								<ui-typewriter .state.text=${'A one-shot line that types once and rests.'} .state.speed=${40}></ui-typewriter>
							</ui-text>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.typewriterExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="typography" ?hidden=${() => {
	return this.demoHidden('typography', 'UIIconButton icon button');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIIconButton</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>icon-only button · tooltip · sizes · active state · tap snap</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'md',
							align: 'center',
							wrap: true,
						}}>
							<ui-icon-button .state=${{
								icon: 'sun',
								tooltip: 'Light',
								size: 'sm',
							}}></ui-icon-button>
							<ui-icon-button .state=${{
								icon: 'moon',
								tooltip: 'Dark',
								size: 'md',
							}}></ui-icon-button>
							<ui-icon-button .state=${{
								icon: 'bell',
								tooltip: 'Alerts',
								size: 'lg',
							}}></ui-icon-button>
							<ui-icon-button .state=${{
								icon: 'star',
								tooltip: 'Active',
								size: 'md',
								active: true,
							}}></ui-icon-button>
							<ui-icon-button .state=${{
								icon: 'settings',
								tooltip: 'Spin on hover',
								size: 'md',
								animated: 'compass',
							}}></ui-icon-button>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.iconButtonExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="typography" ?hidden=${() => {
	return this.demoHidden('typography', 'UIKbd keyboard shortcut keycap hint hotkey');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIKbd</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>keyboard-shortcut hint · modifier glyphs · keycaps · help/menu hints</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							align: 'center',
							wrap: true,
						}}>
							<ui-kbd .state.values=${this.state.kbdKeysCmdK}></ui-kbd>
							<ui-kbd .state.values=${this.state.kbdKeysCtrlShiftP}></ui-kbd>
							<ui-kbd .state.values=${this.state.kbdKeysAltEnter}></ui-kbd>
							<ui-kbd .state.values=${this.state.kbdKeysEsc}></ui-kbd>
							<ui-kbd .state.values=${this.state.kbdKeysUpDown}></ui-kbd>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.kbdExample}></ui-code-block>
					</ui-surface>
				</section>
				</section>

				<section class="cat-section" data-cat-section="forms" #cat_forms ?hidden=${() => {
					return this.catSectionHidden('forms');
				}}>
					<header class="cat-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>Forms</ui-text>
					</header>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UIRadioGroup radio group options native single select');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIRadioGroup</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>native radios · descriptions · disabled option · arrow-key roving</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'lg',
							wrap: true,
						}}>
							<ui-radio-group
								.state.legend=${'Plan'}
								.state.value=${this.state.radioPlanValue}
								.state.items=${this.state.radioPlanItems}></ui-radio-group>
							<ui-radio-group
								.state.legend=${'Range'}
								.state.orientation=${'horizontal'}
								.state.value=${'24h'}
								.state.items=${this.state.toggleRangeItems}></ui-radio-group>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.radioGroupExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UIRadioOption radio option child label description disabled');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIRadioOption</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>ui-radio-option · child of ui-radio-group · value · label · description · disabled</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							wrap: true,
						}}>
							<ui-radio-group
								.state.legend=${'Child fields'}
								.state.value=${'with-desc'}
								.state.items=${this.state.radioOptionDemoItems}></ui-radio-group>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.radioOptionExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UIPinInput pin OTP one-time code passcode unlock');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIPinInput</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>segmented OTP · auto-advance · backspace/arrow/paste · numeric filter · masked</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'lg',
							wrap: true,
						}}>
							<div class="demo-opts">
								<div class="demo-opt demo-opt-wide">
									<span class="demo-opt-label">6-digit numeric</span>
									<ui-pin-input .state.length=${6} .state.type=${'numeric'} @pin-input:complete=${this.handlePinComplete} @pin-input:input=${this.handlePinInput}></ui-pin-input>
								</div>
								<div class="demo-opt demo-opt-wide">
									<span class="demo-opt-label">4-digit masked</span>
									<ui-pin-input .state.length=${4} .state.type=${'numeric'} .state.masked=${true} @pin-input:complete=${this.handlePinComplete}></ui-pin-input>
								</div>
							</div>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>${this.state.pinResult || 'enter a code'}</ui-text>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.pinInputExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UINumberStepper number stepper quantity amount input');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UINumberStepper</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>± input · min/max · precision · suffix (NOT the wizard stepper)</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'lg',
							align: 'center',
							wrap: true,
						}}>
							<ui-number-stepper .state.value=${this.state.demoQty} .state.min=${0} .state.max=${10} @number-stepper:change=${this.handleDemoQty}></ui-number-stepper>
							<ui-number-stepper .state.value=${1.5} .state.step=${0.5} .state.precision=${1} .state.suffix=${'×'}></ui-number-stepper>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Qty: ${this.state.demoQty}</ui-text>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.numberStepperExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UIInput input form field');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIInput</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>sizes · tones · disabled · readonly · native types · picker chrome · placeholderCase · autocomplete · inputmode · maxlength · pattern</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<div class="demo-opts">
								<div class="demo-opt demo-opt-wide">
									<span class="demo-opt-label">Size sm · email</span>
									<ui-input
										.state.value=${this.state.emailValue}
										.state.type=${'email'}
										.state.placeholder=${'you@example.com'}
										.state.size=${'sm'}
										@input:input=${this.syncEmail}></ui-input>
								</div>
								<div class="demo-opt demo-opt-wide">
									<span class="demo-opt-label">Size md (default)</span>
									<ui-input
										.state.value=${this.state.emailValue}
										.state.type=${'email'}
										.state.placeholder=${'you@example.com'}
										.state.size=${'md'}
										@input:input=${this.syncEmail}></ui-input>
								</div>
								<div class="demo-opt demo-opt-wide">
									<span class="demo-opt-label">Size lg</span>
									<ui-input
										.state.value=${this.state.emailValue}
										.state.type=${'email'}
										.state.placeholder=${'you@example.com'}
										.state.size=${'lg'}
										@input:input=${this.syncEmail}></ui-input>
								</div>
								<div class="demo-opt demo-opt-wide">
									<span class="demo-opt-label">Disabled</span>
									<ui-input .state=${{
										placeholder: 'disabled',
										disabled: true,
									}}></ui-input>
								</div>
								<div class="demo-opt demo-opt-wide">
									<span class="demo-opt-label">Readonly</span>
									<ui-input .state=${{
										value: 'cannot edit',
										readonly: true,
									}}></ui-input>
								</div>
								<div class="demo-opt demo-opt-wide">
									<span class="demo-opt-label">Invalid / error tone</span>
									<ui-input .state=${{
										placeholder: 'invalid',
										invalid: true,
									}}></ui-input>
								</div>
							</div>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Native types</ui-text>
							<div class="demo-opts">
								<div class="demo-opt">
									<span class="demo-opt-label">text</span>
									<ui-input .state.type=${'text'} .state.placeholder=${'plain text'}></ui-input>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">email</span>
									<ui-input .state.type=${'email'} .state.placeholder=${'you@example.com'}></ui-input>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">password</span>
									<ui-input .state.type=${'password'} .state.placeholder=${'••••••••'}></ui-input>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">number</span>
									<ui-input .state.type=${'number'} .state.min=${'0'} .state.max=${'100'} .state.step=${'1'} .state.placeholder=${'0'}></ui-input>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">search</span>
									<ui-input .state.type=${'search'} .state.placeholder=${'Search…'}></ui-input>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">tel</span>
									<ui-input .state.type=${'tel'} .state.placeholder=${'+1 555 0100'}></ui-input>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">url</span>
									<ui-input .state.type=${'url'} .state.placeholder=${'https://'}></ui-input>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">file</span>
									<ui-input .state.type=${'file'} .state.accept=${'image/*'}></ui-input>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">date</span>
									<ui-input .state.type=${'date'}></ui-input>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">time</span>
									<ui-input .state.type=${'time'}></ui-input>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">datetime-local</span>
									<ui-input .state.type=${'datetime-local'}></ui-input>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">month</span>
									<ui-input .state.type=${'month'}></ui-input>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">week</span>
									<ui-input .state.type=${'week'}></ui-input>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">color</span>
									<ui-input .state.type=${'color'} .state.value=${this.state.pickedColor}></ui-input>
								</div>
							</div>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>placeholderCase — data-placeholder-case on the input</ui-text>
							<div class="demo-opts">
								<div class="demo-opt demo-opt-wide">
									<span class="demo-opt-label">upper (default)</span>
									<ui-input .state.placeholder=${'search tokens'} .state.placeholderCase=${'upper'}></ui-input>
								</div>
								<div class="demo-opt demo-opt-wide">
									<span class="demo-opt-label">first</span>
									<ui-input .state.placeholder=${'search tokens'} .state.placeholderCase=${'first'}></ui-input>
								</div>
								<div class="demo-opt demo-opt-wide">
									<span class="demo-opt-label">lower</span>
									<ui-input .state.placeholder=${'SEARCH TOKENS'} .state.placeholderCase=${'lower'}></ui-input>
								</div>
								<div class="demo-opt demo-opt-wide">
									<span class="demo-opt-label">none</span>
									<ui-input .state.placeholder=${'Search Tokens'} .state.placeholderCase=${'none'}></ui-input>
								</div>
							</div>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Constraints · a11y attrs</ui-text>
							<div class="demo-opts">
								<div class="demo-opt demo-opt-wide">
									<span class="demo-opt-label">autocomplete email · inputmode email</span>
									<ui-input
										.state.type=${'email'}
										.state.placeholder=${'you@example.com'}
										.state.autocomplete=${'email'}
										.state.inputmode=${'email'}></ui-input>
								</div>
								<div class="demo-opt demo-opt-wide">
									<span class="demo-opt-label">maxlength 8 · minlength 3</span>
									<ui-input
										.state.type=${'text'}
										.state.placeholder=${'3–8 chars'}
										.state.minlength=${3}
										.state.maxlength=${8}></ui-input>
								</div>
								<div class="demo-opt demo-opt-wide">
									<span class="demo-opt-label">pattern [A-Z]{3} · inputmode text</span>
									<ui-input
										.state.type=${'text'}
										.state.placeholder=${'ABC'}
										.state.pattern=${'[A-Z]{3}'}
										.state.inputmode=${'text'}
										.state.autocomplete=${'off'}></ui-input>
								</div>
								<div class="demo-opt demo-opt-wide">
									<span class="demo-opt-label">tel · inputmode tel · autocomplete tel</span>
									<ui-input
										.state.type=${'tel'}
										.state.placeholder=${'+1 555 0100'}
										.state.inputmode=${'tel'}
										.state.autocomplete=${'tel'}></ui-input>
								</div>
								<div class="demo-opt demo-opt-wide">
									<span class="demo-opt-label">number · inputmode decimal · min/max/step</span>
									<ui-input
										.state.type=${'number'}
										.state.placeholder=${'0.00'}
										.state.inputmode=${'decimal'}
										.state.min=${'0'}
										.state.max=${'999'}
										.state.step=${'0.01'}></ui-input>
								</div>
							</div>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>live email value: <ui-text .state.variant=${'mono'}>${this.state.emailValue || '(empty)'}</ui-text></ui-text>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.inputExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UIField field label form floatLabel');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIField</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>labelled wrapper · help · error · required · floatLabel</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'lg',
						}}>
							<ui-field .state=${{
								label: 'Email address',
								hint: 'We\'ll never share your email.',
								required: true,
							}}>
								<ui-input
									.state.value=${this.state.emailValue}
									.state.type=${'email'}
									.state.placeholder=${'you@example.com'}
									@input:input=${this.syncEmail}></ui-input>
							</ui-field>
							<ui-field .state=${{
								label: 'Search',
								error: 'No results found',
							}}>
								<ui-input
									.state.value=${this.state.searchValue}
									.state.type=${'search'}
									.state.placeholder=${'try anything'}
									.state.tone=${'error'}
									@input:input=${this.syncSearch}></ui-input>
							</ui-field>
							<ui-field .state=${{
								label: 'Amount',
								hint: 'inline layout',
								inline: true,
							}}>
								<ui-input
									.state.value=${this.state.amountValue}
									.state.type=${'number'}
									.state.placeholder=${'0.00'}
									@input:input=${this.syncAmount}></ui-input>
							</ui-field>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>floatLabel — label overlays the control, rises on focus or value</ui-text>
							<ui-field .state=${{
								label: 'Username',
								floatLabel: true,
								hint: 'focus or type to float',
							}}>
								<ui-input
									.state.value=${this.state.floatNameValue}
									.state.placeholder=${'ignored while floating'}
									@input:input=${this.syncFloatName}></ui-input>
							</ui-field>
							<ui-field .state=${{
								label: 'Email',
								floatLabel: true,
								required: true,
							}}>
								<ui-input
									.state.value=${this.state.emailValue}
									.state.type=${'email'}
									@input:input=${this.syncEmail}></ui-input>
							</ui-field>
							<ui-field .state=${{
								label: 'Search',
								floatLabel: true,
								error: 'No results found',
							}}>
								<ui-input
									.state.value=${this.state.searchValue}
									.state.type=${'search'}
									.state.invalid=${true}
									@input:input=${this.syncSearch}></ui-input>
							</ui-field>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.fieldExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UIFieldset fieldset legend toggleable group');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIFieldset</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>legend · toggleable · controlled open · icon / iconCollapsed · fieldset:toggle</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'lg',
						}}>
							<ui-fieldset .state.heading=${'Shipping address'}>
								<ui-text .state.variant=${'body'} .state.tone=${'muted'}>Always-visible body. Name, phone, and street stay grouped.</ui-text>
							</ui-fieldset>
							<div class="demo-opts">
								<ui-button .state=${{
									label: 'Open',
									size: 'sm',
									tone: this.state.fieldsetOpen ? 'primary' : 'neutral',
								}} @button:click=${this.openFieldsetDemo}></ui-button>
								<ui-button .state=${{
									label: 'Close',
									size: 'sm',
									tone: this.state.fieldsetOpen ? 'neutral' : 'primary',
								}} @button:click=${this.closeFieldsetDemo}></ui-button>
							</div>
							<ui-fieldset
								.state.heading=${'Invoice #1024'}
								.state.toggleable=${true}
								.state.open=${this.state.fieldsetOpen}
								@fieldset:toggle=${this.handleFieldsetToggle}>
								<ui-stack .state=${{
									orientation: 'vertical',
									gap: 'sm',
								}}>
									<ui-text .state.variant=${'body'}>Design service — $120.00</ui-text>
									<ui-text .state.variant=${'body'}>Hosting — $30.00</ui-text>
									<ui-text .state.variant=${'body'} .state.tone=${'muted'}>Total $150.00 · open=${this.fieldsetOpenLabel}</ui-text>
								</ui-stack>
							</ui-fieldset>
							<ui-fieldset
								.state.heading=${'Invoice #2048'}
								.state.toggleable=${true}
								.state.icon=${'minus'}
								.state.iconCollapsed=${'plus'}>
								<ui-text .state.variant=${'body'} .state.tone=${'muted'}>Plus when collapsed, minus when open — no rotate.</ui-text>
							</ui-fieldset>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.fieldsetExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UIPoll poll vote choice feature widget results percentage bars');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIPoll</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>select → lock → spring-grown % bars · base / choice (instant) / feature / widget (multi)</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							wrap: true,
							align: 'start',
						}}>
							<ui-poll .state.question=${'Which should we build first?'} .state.items=${this.state.pollBaseOptions}></ui-poll>
							<ui-choice-poll .state.question=${'Pick your top priority (instant)'} .state.items=${this.state.pollChoiceOptions}></ui-choice-poll>
							<ui-feature-poll .state.question=${'Vote on the next feature'} .state.items=${this.state.pollFeatureOptions}></ui-feature-poll>
							<ui-poll-widget .state.question=${'Select all you want (multi)'} .state.items=${this.state.pollWidgetOptions} .state.multiple=${true}></ui-poll-widget>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.pollExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UIPollOption poll option child label description votes percentage selected revealed');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIPollOption</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>ui-poll-option · child of ui-poll · id · label · description · votes · percentage · selected · revealed</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							wrap: true,
							align: 'start',
						}}>
							<ui-poll
								.state.question=${'Unlocked — pick then vote'}
								.state.items=${this.state.pollOptionLiveItems}></ui-poll>
							<ui-poll
								.state.question=${'Locked — selected + revealed bars'}
								.state.locked=${true}
								.state.showResults=${true}
								.state.items=${this.state.pollOptionRevealedItems}></ui-poll>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.pollOptionExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UIColorPicker color picker hue saturation lightness hex swatch presets');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIColorPicker</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>HSL square (drag) · hue + alpha dials · format DROPDOWN (HEX / RGB / RGBA / HSL / HSLA) · default .color / .alpha / .format props · preset grid · emits color-picker:change</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							align: 'center',
							wrap: true,
						}}>
							<ui-color-picker .state.color=${'#6366f1'} .state.alpha=${85} .state.format=${'rgba'} @color-picker:change=${this.handleColorChange}></ui-color-picker>
							<ui-text .state.variant=${'body'} .state.tone=${'muted'}>Selected: ${this.state.pickedColor}</ui-text>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.colorPickerExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UITagInput tag chip token input filter label removable paste');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UITagInput</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>token field of removable ui-chips · Enter / comma commits · Backspace removes last · paste splits · max · emits tag-input:change</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-tag-input .state.values=${this.state.tagValues} .state.placeholder=${'Add a tag…'} .state.max=${8} @tag-input:change=${this.handleTagsChange}></ui-tag-input>
							<ui-text .state.variant=${'body'} .state.tone=${'muted'}>Tags: ${this.state.tagReadout}</ui-text>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.tagInputExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UISlider range dual thumb marks ticks vertical value label step keyboard');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UISlider</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>single + dual-thumb range · drag / click / keyboard · marks · value bubble · vertical · controlled primitives · emits slider:input + slider:change</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'xl',
						}}>
							<ui-stack .state=${{
								orientation: 'vertical',
								gap: 'sm',
							}}>
								<ui-slider .state.value=${40} @slider:change=${this.handleSliderChange}></ui-slider>
								<ui-text .state.variant=${'body'} .state.tone=${'muted'}>Value: ${this.state.sliderReadout}</ui-text>
							</ui-stack>
							<ui-stack .state=${{
								orientation: 'vertical',
								gap: 'sm',
							}}>
								<ui-slider .state.range=${true} .state.low=${20} .state.high=${70} .state.marks=${true} .state.step=${10} .state.showLabel=${'always'} @slider:change=${this.handleRangeSlider}></ui-slider>
								<ui-text .state.variant=${'body'} .state.tone=${'muted'}>Range: ${this.state.sliderRangeReadout}</ui-text>
							</ui-stack>
							<ui-slider .state.orientation=${'vertical'} .state.value=${60} .state.step=${5} .state.valueSuffix=${'%'} .state.showLabel=${'always'}></ui-slider>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.sliderExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UICalendar calendar date picker range event month mini schedule day grid');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UICalendar</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>one engine · single-date · range · event/month chips · compact mini — all share grid + nav</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'lg',
						}}>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'xl',
								wrap: true,
								align: 'start',
							}}>
								<ui-stack .state=${{
									orientation: 'vertical',
									gap: 'sm',
								}}>
									<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Single · ${this.state.pickedDate || '(pick a day)'}</ui-text>
									<ui-calendar @calendar:change=${this.handleDatePick}></ui-calendar>
								</ui-stack>
								<ui-stack .state=${{
									orientation: 'vertical',
									gap: 'sm',
								}}>
									<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Range · ${this.state.pickedRange || '(pick start → end)'}</ui-text>
									<ui-range-calendar @calendar:range-change=${this.handleRangePick}></ui-range-calendar>
								</ui-stack>
								<ui-stack .state=${{
									orientation: 'vertical',
									gap: 'sm',
								}}>
									<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Mini</ui-text>
									<ui-mini-calendar></ui-mini-calendar>
								</ui-stack>
							</ui-stack>
							<ui-event-calendar .state.viewYear=${2026} .state.viewMonth=${5} .state.items=${this.state.calendarEvents}></ui-event-calendar>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.calendarExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UIThemeSelect theme select popover');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIThemeSelect</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>popover theme switcher</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-theme-select></ui-theme-select>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.themeSelectExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UISelect select dropdown picker');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UISelect</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>styled native picker · options · disabled option · change event</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'lg',
							align: 'center',
							wrap: true,
						}}>
							<ui-select .state=${{
								value: this.state.selectValue,
								items: this.state.selectOptions,
							}} @select:change=${this.syncSelect}></ui-select>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>selected: <ui-text .state.variant=${'mono'}>${this.state.selectValue}</ui-text></ui-text>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.selectExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UITreeSelect tree select form hierarchical picker');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UITreeSelect</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>form select over tree · overlay + filter · tree-select:change</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'lg',
							align: 'center',
							wrap: true,
						}}>
							<ui-tree-select
								style="max-inline-size: 22rem; inline-size: min(22rem, 100%)"
								.state.items=${this.state.treeDemoItems}
								.state.placeholder=${'Pick a file'}
								@tree-select:change=${this.handleTreeSelectChange}></ui-tree-select>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>selected: ${this.state.treeSelectValue || '—'}</ui-text>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.treeSelectExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UIToolbar toolbar actions');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIToolbar</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>ui-bar + icon-button action row · tooltips</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-toolbar .state=${{
							items: this.state.toolbarActions,
						}}></ui-toolbar>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.toolbarExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UIToggleOption toggle option child label value active disabled');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIToggleOption</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>ui-toggle-option · child of ui-toggle-group · value · label (falls back to value) · active (parent-stamped) · disabled</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							align: 'center',
							wrap: true,
						}}>
							<ui-toggle-group
								.state.items=${this.state.toggleOptionDemoItems}
								.state.value=${'on'}></ui-toggle-group>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.toggleOptionExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UISegmentItem segment item child icon label value hint description tone href interactive muted');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UISegmentItem</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>ui-segment-item · child of ui-segment-strip · icon · label · value · hint · description · tone · href · interactive · muted (filtered out)</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'lg',
						}}>
							<ui-segment-strip .state.items=${this.state.segmentItemDemoItems}></ui-segment-strip>
							<ui-segment-strip
								.state.interactive=${true}
								.state.size=${'sm'}
								.state.items=${this.state.segmentItemLinkItems}></ui-segment-strip>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.segmentItemExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UICheckbox checkbox indeterminate checked label sizes disabled icon checkedIcon indicator slot');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UICheckbox</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>solid check · custom icon/checkedIcon/indeterminateIcon · indicator slots · description · invalid · disabled · indeterminate · sm/md/lg</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							align: 'center',
							wrap: true,
						}}>
							<div class="demo-opts">
								<div class="demo-opt">
									<span class="demo-opt-label">Live · checkbox:change</span>
									<ui-checkbox
										.state.checked=${this.state.checkboxChecked}
										.state.label=${'Accept terms'}
										@checkbox:change=${this.syncCheckbox}></ui-checkbox>
									<ui-text .state.variant=${'mono'} .state.tone=${'muted'}>checked = ${this.state.checkboxChecked}</ui-text>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">Checked</span>
									<ui-checkbox .state.checked=${true} .state.label=${'Checked'}></ui-checkbox>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">Indeterminate</span>
									<ui-checkbox .state.indeterminate=${true} .state.label=${'Partial'}></ui-checkbox>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">Disabled</span>
									<ui-checkbox .state.disabled=${true} .state.label=${'Disabled'}></ui-checkbox>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">Size sm</span>
									<ui-checkbox .state.size=${'sm'} .state.label=${'Small'}></ui-checkbox>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">Size md</span>
									<ui-checkbox .state.size=${'md'} .state.label=${'Medium'}></ui-checkbox>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">Size lg</span>
									<ui-checkbox .state.size=${'lg'} .state.label=${'Large'}></ui-checkbox>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">No label</span>
									<ui-checkbox .state.checked=${true}></ui-checkbox>
								</div>
								<div class="demo-opt demo-opt-wide">
									<span class="demo-opt-label">Description</span>
									<ui-checkbox
										.state.label=${'Marketing emails'}
										.state.description=${'Get product updates and tips.'}></ui-checkbox>
								</div>
								<div class="demo-opt demo-opt-wide">
									<span class="demo-opt-label">Invalid</span>
									<ui-checkbox
										.state.invalid=${true}
										.state.label=${'Accept terms'}
										.state.description=${'Required — fix to continue.'}></ui-checkbox>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">checkedIcon</span>
									<ui-checkbox .state.checked=${true} .state.checkedIcon=${'star'} .state.label=${'Star'}></ui-checkbox>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">indeterminateIcon</span>
									<ui-checkbox .state.indeterminate=${true} .state.indeterminateIcon=${'minus'} .state.label=${'Minus'}></ui-checkbox>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">slot=checked</span>
									<ui-checkbox .state.checked=${true} .state.label=${'Heart'}>
										<ui-icon slot="checked" .state.name=${'heart'} .state.size=${'sm'}></ui-icon>
									</ui-checkbox>
								</div>
							</div>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.checkboxExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UITernaryState ternary state pass fail flag positive negative neutral segmented');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UITernaryState</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Pass / Fail / Flag · display label / icon / icon-label · colorTarget fill / icon · ternary-state:change</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Live · ternary-state:change</span>
								<ui-ternary-state
									.state.positiveLabel=${'Pass'}
									.state.negativeLabel=${'Fail'}
									.state.neutralLabel=${'Flag'}
									.state.value=${this.state.ternaryValue}
									@ternary-state:change=${this.syncTernary}></ui-ternary-state>
								<ui-text .state.variant=${'mono'} .state.tone=${'muted'}>value = ${this.ternaryReadout}</ui-text>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Custom colors</span>
								<ui-ternary-state
									.state.positiveLabel=${'Pass'}
									.state.negativeLabel=${'Fail'}
									.state.neutralLabel=${'Flag'}
									.state.positiveColor=${'oklch(0.72 0.19 155)'}
									.state.negativeColor=${'oklch(0.62 0.22 25)'}
									.state.neutralColor=${'oklch(0.8 0.16 95)'}
									.state.value=${'neutral'}></ui-ternary-state>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Disabled</span>
								<ui-ternary-state
									.state.positiveLabel=${'Pass'}
									.state.negativeLabel=${'Fail'}
									.state.neutralLabel=${'Flag'}
									.state.disabled=${true}
									.state.value=${'positive'}></ui-ternary-state>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">display=icon · colorTarget=fill</span>
								<ui-ternary-state
									.state.display=${'icon'}
									.state.positiveIcon=${'check'}
									.state.negativeIcon=${'x'}
									.state.neutralIcon=${'minus'}
									.state.value=${'positive'}></ui-ternary-state>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">display=icon-label · colorTarget=fill</span>
								<ui-ternary-state
									.state.display=${'icon-label'}
									.state.positiveLabel=${'Pass'}
									.state.negativeLabel=${'Fail'}
									.state.neutralLabel=${'Flag'}
									.state.positiveIcon=${'check'}
									.state.negativeIcon=${'x'}
									.state.neutralIcon=${'minus'}
									.state.value=${'negative'}></ui-ternary-state>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">display=icon-label · colorTarget=icon</span>
								<ui-ternary-state
									.state.display=${'icon-label'}
									.state.colorTarget=${'icon'}
									.state.positiveLabel=${'Pass'}
									.state.negativeLabel=${'Fail'}
									.state.neutralLabel=${'Flag'}
									.state.positiveIcon=${'check'}
									.state.negativeIcon=${'x'}
									.state.neutralIcon=${'minus'}
									.state.value=${'neutral'}></ui-ternary-state>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.ternaryStateExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UITriStateCheckbox tri-state checkbox null false true cycle icon slot');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UITriStateCheckbox</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>cycle null → false (X) → true (check) · swappable icons / slots · tri-state-checkbox:change</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt">
								<span class="demo-opt-label">Live · tri-state-checkbox:change</span>
								<ui-tri-state-checkbox
									.state.label=${'Review'}
									.state.value=${this.state.triStateValue}
									@tri-state-checkbox:change=${this.syncTriState}></ui-tri-state-checkbox>
								<ui-text .state.variant=${'mono'} .state.tone=${'muted'}>value = ${this.triStateReadout}</ui-text>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">false (X)</span>
								<ui-tri-state-checkbox .state.value=${false} .state.label=${'Rejected'}></ui-tri-state-checkbox>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">true (check)</span>
								<ui-tri-state-checkbox .state.value=${true} .state.label=${'Accepted'}></ui-tri-state-checkbox>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Custom icons</span>
								<ui-tri-state-checkbox
									.state.value=${true}
									.state.trueIcon=${'heart'}
									.state.falseIcon=${'ban'}
									.state.unsetIcon=${'circle'}
									.state.label=${'Heart / ban'}></ui-tri-state-checkbox>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">slot=true</span>
								<ui-tri-state-checkbox .state.value=${true} .state.label=${'Slotted'}>
									<ui-icon slot="true" .state.name=${'star'} .state.size=${'sm'}></ui-icon>
								</ui-tri-state-checkbox>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.triStateCheckboxExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UISwitch switch toggle checked');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UISwitch</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>checked · label · sizes · disabled · @switch:change reactive binding</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							align: 'center',
							wrap: true,
						}}>
							<div class="demo-opts">
								<div class="demo-opt">
									<span class="demo-opt-label">Live · switch:change</span>
									<ui-switch
										.state.checked=${this.state.switchChecked}
										.state.label=${'Dark mode'}
										@switch:change=${this.syncSwitch}></ui-switch>
									<ui-text .state.variant=${'mono'} .state.tone=${'muted'}>checked = ${this.state.switchChecked}</ui-text>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">Size sm</span>
									<ui-switch .state.size=${'sm'} .state.label=${'Small'}></ui-switch>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">On by default</span>
									<ui-switch .state.checked=${true} .state.label=${'Enabled'}></ui-switch>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">Disabled</span>
									<ui-switch .state.disabled=${true} .state.label=${'Disabled'}></ui-switch>
								</div>
							</div>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.switchExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UITextarea textarea multiline note invalid autoResize');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UITextarea</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>multiline · sizes · invalid · disabled · autoResize</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Live · textarea:input</span>
								<ui-textarea
									.state.placeholder=${'Write a note…'}
									.state.rows=${3}
									.state.value=${this.state.textareaValue}
									@textarea:input=${this.syncTextarea}></ui-textarea>
								<ui-text .state.variant=${'mono'} .state.tone=${'muted'}>${this.state.textareaValue || '(empty)'}</ui-text>
							</div>
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Invalid</span>
								<ui-textarea .state.invalid=${true} .state.placeholder=${'Needs a value'} .state.rows=${2}></ui-textarea>
							</div>
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Disabled</span>
								<ui-textarea .state.disabled=${true} .state.value=${'Cannot edit'} .state.rows=${2}></ui-textarea>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.textareaExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UILabel label required description forId');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UILabel</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>text · required · description · disabled</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Required + description</span>
								<ui-label .state.text=${'Email'} .state.required=${true} .state.description=${'We never share this.'}></ui-label>
							</div>
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Plain</span>
								<ui-label .state.text=${'Display name'}></ui-label>
							</div>
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Disabled</span>
								<ui-label .state.text=${'Locked field'} .state.disabled=${true}></ui-label>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.labelExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UIInputGroup input group leading trailing addon');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIInputGroup</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>leading / trailing addons · sizes · error tone</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Leading + trailing (3 parts)</span>
								<ui-input-group>
									<span slot="leading">https://</span>
									<ui-input .state.placeholder=${'example.com'}></ui-input>
									<span slot="trailing">.io</span>
								</ui-input-group>
							</div>
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Leading only (2 parts — no trailing gap)</span>
								<ui-input-group>
									<span slot="leading">@</span>
									<ui-input .state.placeholder=${'handle'}></ui-input>
								</ui-input-group>
							</div>
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Trailing only</span>
								<ui-input-group>
									<ui-input .state.placeholder=${'amount'}></ui-input>
									<span slot="trailing">VIAT</span>
								</ui-input-group>
							</div>
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Error tone</span>
								<ui-input-group .state.tone=${'error'}>
									<span slot="leading">@</span>
									<ui-input .state.placeholder=${'handle'} .state.invalid=${true}></ui-input>
								</ui-input-group>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.inputGroupExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UINativeSelect native select items value size');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UINativeSelect</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>alias of ui-select · native &lt;select&gt; · value · items · disabled · size sm/md/lg</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt">
								<span class="demo-opt-label">Size sm</span>
								<ui-native-select
									.state.items=${this.state.nativeSelectItems}
									.state.value=${this.state.nativeSelectValue}
									.state.size=${'sm'}></ui-native-select>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Size md (default)</span>
								<ui-native-select
									.state.items=${this.state.nativeSelectItems}
									.state.value=${this.state.nativeSelectValue}
									.state.size=${'md'}></ui-native-select>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Size lg</span>
								<ui-native-select
									.state.items=${this.state.nativeSelectItems}
									.state.value=${this.state.nativeSelectValue}
									.state.size=${'lg'}></ui-native-select>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Disabled</span>
								<ui-native-select
									.state.items=${this.state.nativeSelectItems}
									.state.value=${'usd'}
									.state.disabled=${true}></ui-native-select>
							</div>
						</div>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UIQuestionnaire questionnaire single multi step');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIQuestionnaire</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>single (radio) · multi (checkbox) · step (stepper)</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Single</span>
								<ui-questionnaire
									.state.variant=${'single'}
									.state.heading=${'Pick a plan'}
									.state.items=${this.state.questionnaireItems}></ui-questionnaire>
							</div>
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Multi</span>
								<ui-questionnaire
									.state.variant=${'multi'}
									.state.heading=${'Which surfaces?'}
									.state.items=${this.state.questionnaireMulti}></ui-questionnaire>
							</div>
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Step</span>
								<ui-questionnaire
									.state.variant=${'step'}
									.state.questions=${this.state.questionnaireQuestions}></ui-questionnaire>
							</div>
						</div>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UICombobox combobox search select filter');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UICombobox</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>searchable single-select · filter miss stays open · items=[] closes · emptyMessage</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Search chains</span>
								<ui-combobox
									.state.items=${this.state.comboboxItems}
									.state.placeholder=${'Search chain…'}
									.state.value=${this.state.comboboxValue}
									@combobox:change=${this.syncCombobox}></ui-combobox>
								<ui-text .state.variant=${'mono'} .state.tone=${'muted'}>value = ${this.state.comboboxValue || '(none)'}</ui-text>
							</div>
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Empty message (type "zzz")</span>
								<ui-combobox
									.state.items=${this.state.comboboxItems}
									.state.placeholder=${'No match demo…'}
									.state.emptyMessage=${'No chains match.'}
									.state.open=${true}
									.state.query=${'zzz'}></ui-combobox>
							</div>
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Clear items (dropdown closes)</span>
								<ui-combobox
									.state.items=${this.state.comboboxLiveItems}
									.state.placeholder=${'Clear then restore…'}></ui-combobox>
								<ui-button .state=${{
									label: 'Clear items',
									size: 'sm',
								}} @button:click=${this.clearComboboxItems}></ui-button>
								<ui-button .state=${{
									label: 'Restore',
									size: 'sm',
								}} @button:click=${this.restoreComboboxItems}></ui-button>
							</div>
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Disabled</span>
								<ui-combobox .state.disabled=${true} .state.placeholder=${'Unavailable'} .state.items=${this.state.comboboxItems}></ui-combobox>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.comboboxExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UIComboboxOption combobox option child value label disabled active');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIComboboxOption</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>child of ui-combobox · value · label · disabled · active (parent-stamped) · forced open so rows stay visible</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Open list · disabled Bitcoin</span>
								<ui-combobox
									.state.items=${this.state.comboboxItems}
									.state.placeholder=${'Pick chain…'}
									.state.open=${true}
									.state.value=${'viat'}></ui-combobox>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.comboboxOptionExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UIListbox listbox list selection single multi filter');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIListbox</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>inline list · single (click again to unselect) · multi · filter · visual selected</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Single</span>
								<ui-listbox
									.state.items=${this.state.listboxItems}
									.state.value=${this.state.listboxValue}
									@listbox:change=${this.syncListbox}></ui-listbox>
								<ui-text .state.variant=${'mono'} .state.tone=${'muted'}>value = ${this.state.listboxReadout}</ui-text>
							</div>
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Multi + filter</span>
								<ui-listbox
									.state.items=${this.state.listboxMultiItems}
									.state.multiple=${true}
									.state.filterable=${true}
									.state.values=${this.state.listboxMultiValues}
									@listbox:change=${this.syncListboxMulti}></ui-listbox>
								<ui-text .state.variant=${'mono'} .state.tone=${'muted'}>values = ${this.state.listboxMultiReadout}</ui-text>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.listboxExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UIMultiSelect multi-select chips filter overlay');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIMultiSelect</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>chip trigger · overlay list · optional filter · chip remove</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Filterable</span>
								<ui-multi-select
									.state.items=${this.state.multiSelectItems}
									.state.values=${['viat', 'sol']}
									.state.filterable=${true}
									.state.placeholder=${'Pick chains…'}
									@multi-select:change=${this.syncMultiSelect}></ui-multi-select>
								<ui-text .state.variant=${'mono'} .state.tone=${'muted'}>values = ${this.state.multiSelectReadout}</ui-text>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.multiSelectExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UICascadeSelect cascade-select nested path children');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UICascadeSelect</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>nested options · path columns · leaf commits value</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Region → city</span>
								<ui-cascade-select
									.state.items=${this.state.cascadeItems}
									.state.placeholder=${'Choose location…'}
									@cascade-select:change=${this.syncCascade}></ui-cascade-select>
								<ui-text .state.variant=${'mono'} .state.tone=${'muted'}>path = ${this.state.cascadeReadout || '(none)'}</ui-text>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.cascadeSelectExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UIFileUpload file-upload drag drop choose accept multiple');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIFileUpload</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>drag/drop + click · accept/multiple · remove · clear</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">Images · multiple</span>
								<ui-file-upload
									.state.multiple=${true}
									.state.accept=${'image/*'}
									@file-upload:select=${this.syncFileUpload}
									@file-upload:remove=${this.syncFileUpload}
									@file-upload:clear=${this.syncFileUpload}></ui-file-upload>
								<ui-text .state.variant=${'mono'} .state.tone=${'muted'}>files = ${this.state.fileUploadReadout}</ui-text>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.fileUploadExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="forms" ?hidden=${() => {
	return this.demoHidden('forms', 'UIToggle toggle pressed button ghost solid outline');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIToggle</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>pressed button · outline / ghost / solid · sizes · not a switch</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt">
								<span class="demo-opt-label">Live · toggle:change</span>
								<ui-toggle .state.label=${'Bold'} .state.pressed=${this.state.togglePressed} @toggle:change=${this.syncToggle}></ui-toggle>
								<ui-text .state.variant=${'mono'} .state.tone=${'muted'}>pressed = ${this.state.togglePressed}</ui-text>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Outline</span>
								<ui-toggle .state.variant=${'outline'} .state.label=${'Italic'} .state.icon=${'italic'}></ui-toggle>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Ghost</span>
								<ui-toggle .state.variant=${'ghost'} .state.label=${'Ghost'}></ui-toggle>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Solid pressed</span>
								<ui-toggle .state.variant=${'solid'} .state.pressed=${true} .state.label=${'Solid'}></ui-toggle>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Disabled</span>
								<ui-toggle .state.disabled=${true} .state.label=${'Off'}></ui-toggle>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.toggleExample}></ui-code-block>
					</ui-surface>
				</section>
				</section>

				<section class="cat-section" data-cat-section="actions" #cat_actions ?hidden=${() => {
					return this.catSectionHidden('actions');
				}}>
					<header class="cat-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>Actions</ui-text>
					</header>

<section class="demo" data-cat="actions" ?hidden=${() => {
	return this.demoHidden('actions', 'UIFab fab floating action button');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIFab</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>circular · extended pill · tones (shown inline via position=static)</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'lg',
							align: 'center',
							wrap: true,
						}}>
							<div class="demo-opts">
								<div class="demo-opt">
									<span class="demo-opt-label">Circular</span>
									<ui-fab .state.icon=${'plus'} .state.label=${'Add'} .state.position=${'static'} @fab:click=${this.handleFabClick}></ui-fab>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">Extended · success</span>
									<ui-fab .state.icon=${'star'} .state.label=${'Favourite'} .state.extended=${true} .state.tone=${'success'} .state.position=${'static'}></ui-fab>
								</div>
								<div class="demo-opt">
									<span class="demo-opt-label">Danger · md</span>
									<ui-fab .state.icon=${'settings'} .state.tone=${'danger'} .state.size=${'md'} .state.position=${'static'}></ui-fab>
								</div>
							</div>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.fabExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="actions" ?hidden=${() => {
	return this.demoHidden('actions', 'UIGoTo UIToTop UIToBottom UIToAdaptive UIToLeft UIToRight go-to scroll top bottom left right adaptive');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIGoTo</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>scroll to top · bottom · start/left · end/right · adaptive morphs one arrow-up via rotate · aliases ui-to-top / ui-to-bottom / ui-to-adaptive / ui-to-left / ui-to-right · static demos inline</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt">
								<span class="demo-opt-label">Top (alias ui-to-top)</span>
								<ui-to-top .state.position=${'static'}></ui-to-top>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Bottom</span>
								<ui-to-bottom .state.position=${'static'}></ui-to-bottom>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Left</span>
								<ui-to-left .state.position=${'static'}></ui-to-left>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Right</span>
								<ui-to-right .state.position=${'static'}></ui-to-right>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Adaptive</span>
								<ui-to-adaptive .state.position=${'static'}></ui-to-adaptive>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">ui-go-to · end</span>
								<ui-go-to .state.position=${'static'} .state.direction=${'end'} .state.tone=${'success'}></ui-go-to>
							</div>
						</div>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Live fixed controls follow scroll threshold; adaptive flips direction near edges. Static rows above always show.</ui-text>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.toTopExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="actions" ?hidden=${() => {
	return this.demoHidden('actions', 'UISpeedDial speed dial fab actions menu fan out');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UISpeedDial</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>fan-out actions · click (up) & hover (right) · staggered reveal</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							align: 'end',
							justify: 'around',
							wrap: true,
						}}>
							<ui-speed-dial .state.icon=${'plus'} .state.position=${'static'} .state.direction=${'up'} .state.items=${this.speedDialActions} @speed-dial:action=${this.handleSpeedDialAction}></ui-speed-dial>
							<ui-speed-dial .state.icon=${'share-2'} .state.tone=${'accent'} .state.trigger=${'hover'} .state.position=${'static'} .state.direction=${'down'} .state.items=${this.speedDialActions} @speed-dial:action=${this.handleSpeedDialAction}></ui-speed-dial>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.speedDialExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="actions" ?hidden=${() => {
	return this.demoHidden('actions', 'UISpeedDialAction speed dial action child icon label value tone direction');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UISpeedDialAction</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>ui-speed-dial-action · child of ui-speed-dial · icon · label · value · tone · parent direction (request) vs resolvedDirection (data-direction) · up/down/left/right · forced open (state.open=true) so the child actions are visible</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-dial-stage">
							<ui-speed-dial
								.state.icon=${'plus'}
								.state.position=${'static'}
								.state.direction=${'up'}
								.state.open=${true}
								.state.items=${this.state.speedDialActionUp}
								@speed-dial:action=${this.handleSpeedDialAction}></ui-speed-dial>
							<ui-speed-dial
								.state.icon=${'plus'}
								.state.position=${'static'}
								.state.direction=${'down'}
								.state.open=${true}
								.state.items=${this.state.speedDialActionDown}
								@speed-dial:action=${this.handleSpeedDialAction}></ui-speed-dial>
							<ui-speed-dial
								.state.icon=${'plus'}
								.state.position=${'static'}
								.state.direction=${'left'}
								.state.open=${true}
								.state.items=${this.state.speedDialActionLeft}
								@speed-dial:action=${this.handleSpeedDialAction}></ui-speed-dial>
							<ui-speed-dial
								.state.icon=${'plus'}
								.state.position=${'static'}
								.state.direction=${'right'}
								.state.open=${true}
								.state.items=${this.state.speedDialActionRight}
								@speed-dial:action=${this.handleSpeedDialAction}></ui-speed-dial>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.speedDialActionExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="actions" ?hidden=${() => {
	return this.demoHidden('actions', 'UIPagination pagination pages numbered navigation');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIPagination</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>numbered · ellipsis · first/prev/next/last</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-pagination .state.page=${this.state.demoPage} .state.count=${42} @pagination:change=${this.handleDemoPage}></ui-pagination>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Page ${this.state.demoPage} of 42</ui-text>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.paginationExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="actions" ?hidden=${() => {
	return this.demoHidden('actions', 'UIButton button action');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIButton</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>tones × variants × sizes · tap snap built in</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'sm',
								wrap: true,
								align: 'center',
							}}>
								<ui-button .state=${{
									label: 'Solid neutral',
								}}></ui-button>
								<ui-button .state=${{
									label: 'Solid primary',
									tone: 'primary',
								}}></ui-button>
								<ui-button .state=${{
									label: 'Solid success',
									tone: 'success',
								}}></ui-button>
								<ui-button .state=${{
									label: 'Solid danger',
									tone: 'danger',
								}}></ui-button>
								<ui-button .state=${{
									label: 'Solid warning',
									tone: 'warning',
								}}></ui-button>
							</ui-stack>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'sm',
								wrap: true,
								align: 'center',
							}}>
								<ui-button .state=${{
									label: 'Outline neutral',
									variant: 'outline',
								}}></ui-button>
								<ui-button .state=${{
									label: 'Outline primary',
									variant: 'outline',
									tone: 'primary',
								}}></ui-button>
								<ui-button .state=${{
									label: 'Outline danger',
									variant: 'outline',
									tone: 'danger',
								}}></ui-button>
							</ui-stack>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'sm',
								wrap: true,
								align: 'center',
							}}>
								<ui-button .state=${{
									label: 'Ghost',
									variant: 'ghost',
								}}></ui-button>
								<ui-button .state=${{
									label: 'Ghost primary',
									variant: 'ghost',
									tone: 'primary',
								}}></ui-button>
								<ui-button .state=${{
									label: 'Link',
									variant: 'link',
									tone: 'primary',
								}}></ui-button>
							</ui-stack>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'sm',
								wrap: true,
								align: 'center',
							}}>
								<ui-button .state=${{
									label: 'XS',
									size: 'xs',
									tone: 'primary',
								}}></ui-button>
								<ui-button .state=${{
									label: 'SM',
									size: 'sm',
									tone: 'primary',
								}}></ui-button>
								<ui-button .state=${{
									label: 'MD',
									size: 'md',
									tone: 'primary',
								}}></ui-button>
								<ui-button .state=${{
									label: 'LG',
									size: 'lg',
									tone: 'primary',
								}}></ui-button>
							</ui-stack>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'sm',
								wrap: true,
								align: 'center',
							}}>
								<ui-button .state=${{
									label: 'Disabled',
									disabled: true,
								}}></ui-button>
								<ui-button .state=${{
									label: 'Loading',
									loading: true,
									tone: 'primary',
								}}></ui-button>
								<ui-button .state=${{
									label: 'With leading',
									tone: 'primary',
									leadicon: 'arrow-left',
								}}></ui-button>
								<ui-button .state=${{
									label: 'With trailing',
									tone: 'primary',
									trailicon: 'arrow-right',
								}}></ui-button>
							</ui-stack>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'sm',
								align: 'center',
							}}>
								<ui-button .state=${{
									label: 'Click me',
									tone: 'primary',
								}} @button:click=${this.bumpClick}></ui-button>
								<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>clicks: ${this.state.clickCount}</ui-text>
							</ui-stack>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.buttonExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="actions" ?hidden=${() => {
	return this.demoHidden('actions', 'UISplitButton split button dropdown chevron try for free api console');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UISplitButton</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>x.ai unified pill · hover or caret opens menu · chevron spins · primary link when href set</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'lg',
							align: 'center',
							wrap: true,
						}}>
							<ui-split-button .state.label=${'Try for free'} .state.tone=${'primary'} .state.items=${this.splitButtonItems}></ui-split-button>
							<ui-split-button .state.label=${'Export'} .state.tone=${'neutral'} .state.variant=${'outline'} .state.items=${this.menuItems}></ui-split-button>
							<ui-split-button .state.label=${'Deploy'} .state.tone=${'success'} .state.size=${'sm'} .state.items=${this.splitButtonItems}></ui-split-button>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.splitButtonExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="actions" ?hidden=${() => {
	return this.demoHidden('actions', 'UICloseButton close button');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UICloseButton</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>rotate-on-hover × · same animation used by the built-in modal close</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'md',
							align: 'center',
						}}>
							<ui-close-button></ui-close-button>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>hover → rotate(90deg); active → rotate(180deg)</ui-text>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.closeButtonExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="actions" ?hidden=${() => {
	return this.demoHidden('actions', 'UIButtonGroup segmented attached button cluster toolbar');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIButtonGroup</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>attached button cluster · squared inner corners · horizontal / vertical · toolbar clusters</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							align: 'center',
							wrap: true,
						}}>
							<ui-button-group>
								<ui-button .state=${this.state.bgBtnDay}></ui-button>
								<ui-button .state=${this.state.bgBtnWeek}></ui-button>
								<ui-button .state=${this.state.bgBtnMonth}></ui-button>
							</ui-button-group>
							<ui-button-group .state.orientation=${'vertical'}>
								<ui-button .state=${this.state.bgBtnDay}></ui-button>
								<ui-button .state=${this.state.bgBtnWeek}></ui-button>
								<ui-button .state=${this.state.bgBtnMonth}></ui-button>
							</ui-button-group>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.buttonGroupExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="actions" ?hidden=${() => {
	return this.demoHidden('actions', 'UIToggleGroup segmented control single multi range toggle');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIToggleGroup</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>segmented control · single (range) or multi-select · emits toggle-group:change</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							align: 'center',
							wrap: true,
						}}>
							<ui-toggle-group .state.items=${this.state.toggleRangeItems} .state.value=${'24h'}></ui-toggle-group>
							<ui-toggle-group .state.items=${this.state.toggleViewItems} .state.multiple=${true} .state.values=${this.state.toggleViewActive} .state.size=${'sm'}></ui-toggle-group>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.toggleGroupExample}></ui-code-block>
					</ui-surface>
				</section>
				</section>

				<section class="cat-section" data-cat-section="feedback" #cat_feedback ?hidden=${() => {
					return this.catSectionHidden('feedback');
				}}>
					<header class="cat-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>Feedback</ui-text>
					</header>

<section class="demo" data-cat="feedback" ?hidden=${() => {
	return this.demoHidden('feedback', 'UIStepper stepper wizard progress steps');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIStepper</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>wizard progress · done/active/upcoming · linear (click back only)</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'lg',
						}}>
							<ui-stepper .state.activeIndex=${this.state.wizardStep} .state.items=${this.wizardSteps} @stepper:change=${this.handleWizardStep}></ui-stepper>
							<ui-button .state=${{
								label: 'Next step',
								tone: 'primary',
								size: 'sm',
							}} @button:click=${this.wizardNext}></ui-button>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.stepperExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="feedback" ?hidden=${() => {
	return this.demoHidden('feedback', 'UIBadge badge');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIBadge</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>existing · entrance pop + value-change pulse</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'md',
							wrap: true,
							align: 'center',
						}}>
							<ui-badge .state=${{
								label: 'neutral',
							}}></ui-badge>
							<ui-badge .state=${{
								label: 'success',
								tone: 'success',
							}}></ui-badge>
							<ui-badge .state=${{
								label: 'warning',
								tone: 'warning',
							}}></ui-badge>
							<ui-badge .state=${{
								label: 'danger',
								tone: 'danger',
							}}></ui-badge>
							<ui-badge .state=${{
								label: 'info',
								tone: 'info',
							}}></ui-badge>
							<ui-badge .state=${{
								label: 'accent',
								tone: 'accent',
							}}></ui-badge>
							<ui-badge .state=${{
								label: 'small',
								tone: 'success',
								size: 'sm',
							}}></ui-badge>
							<ui-badge .state=${{
								label: 'large',
								tone: 'accent',
								size: 'lg',
							}}></ui-badge>
							<ui-badge .state=${{
								label: 'with dot',
								tone: 'success',
								dot: true,
							}}></ui-badge>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'sm',
								align: 'center',
							}}>
								<ui-badge .state=${{
									label: String(this.state.badgeCount),
									tone: 'accent',
								}}></ui-badge>
								<ui-button .state=${{
									label: 'Bump (test pulse)',
									size: 'sm',
									variant: 'outline',
								}} @button:click=${this.bumpBadge}></ui-button>
							</ui-stack>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.badgeExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="feedback" ?hidden=${() => {
	return this.demoHidden('feedback', 'UISpinner spinner loading');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UISpinner</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>sizes · variants · label</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'lg',
							align: 'center',
							wrap: true,
						}}>
							<ui-spinner .state=${{
								size: 'sm',
							}}></ui-spinner>
							<ui-spinner .state=${{
								size: 'md',
							}}></ui-spinner>
							<ui-spinner .state=${{
								size: 'lg',
							}}></ui-spinner>
							<ui-spinner .state=${{
								size: 'xl',
							}}></ui-spinner>
							<ui-spinner .state=${{
								size: 'md',
								variant: 'bars',
							}}></ui-spinner>
							<ui-spinner .state=${{
								size: 'md',
								label: 'Loading…',
							}}></ui-spinner>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.spinnerExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="feedback" ?hidden=${() => {
	return this.demoHidden('feedback', 'UISkeleton skeleton placeholder');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UISkeleton</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>text · multi-line · circle · rect</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'lg',
							align: 'center',
							wrap: true,
						}}>
							<ui-skeleton .state=${{
								variant: 'circle',
								width: '48px',
								height: '48px',
							}}></ui-skeleton>
							<ui-skeleton .state=${{
								variant: 'rect',
								width: '120px',
								height: '64px',
								radius: '8px',
							}}></ui-skeleton>
							<ui-skeleton .state=${{
								variant: 'text',
								lines: 4,
								width: '240px',
							}}></ui-skeleton>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.skeletonExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="feedback" ?hidden=${() => {
	return this.demoHidden('feedback', 'UIMessage message bubble user assistant system scroller');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIMessage · UIMessageScroller</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>generic bubble · author user|assistant|system · time · tone · stick / maxHeight scroller (ui-ai-message stays the AI-rich renderer)</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Standalone bubbles</span>
								<ui-stack .state=${{
									orientation: 'vertical',
									gap: 'sm',
								}}>
									<ui-message .state.author=${'system'} .state.content=${'Session started.'}></ui-message>
									<ui-message .state.author=${'user'} .state.content=${'Ship the overlay value fix.'} .state.time=${Date.now()}></ui-message>
									<ui-message .state.author=${'assistant'} .state.content=${'Track height raised. Overlay sits in a contrast pill.'} .state.time=${Date.now()}></ui-message>
								</ui-stack>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Scroller · stick true (default)</span>
								<ui-message-scroller
									.state.items=${this.state.messageThread}
									.state.stick=${true}
									.state.maxHeight=${'12rem'}></ui-message-scroller>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Scroller · stick false</span>
								<ui-message-scroller
									.state.items=${this.state.messageThread}
									.state.stick=${false}
									.state.maxHeight=${'8rem'}></ui-message-scroller>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.messageExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="feedback" ?hidden=${() => {
	return this.demoHidden('feedback', 'UILoadingBar loading bar progress');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UILoadingBar</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>determinate · value label · indeterminate</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-loading-bar .state=${{
								value: 35,
							}}></ui-loading-bar>
							<ui-loading-bar .state=${{
								value: 72,
								showValue: true,
							}}></ui-loading-bar>
							<ui-loading-bar .state=${{
								indeterminate: true,
								label: 'Working',
							}}></ui-loading-bar>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.loadingBarExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="feedback" ?hidden=${() => {
	return this.demoHidden('feedback', 'UIEmptyState empty placeholder');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIEmptyState</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>title · hint · icon · action</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'lg',
							wrap: true,
						}}>
							<ui-surface .state=${{
								tone: 'subtle',
								padding: 'md',
								radius: 'md',
							}}>
								<ui-empty-state .state=${{
									heading: 'No transactions yet',
								}}></ui-empty-state>
							</ui-surface>
							<ui-surface .state=${{
								tone: 'subtle',
								padding: 'md',
								radius: 'md',
							}}>
								<ui-empty-state .state=${{
									icon: '⊘',
									heading: 'Wallet is empty',
									hint: 'Fund your wallet to get started.',
									actionLabel: 'Open faucet',
								}}></ui-empty-state>
							</ui-surface>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.emptyStateExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="feedback" ?hidden=${() => {
	return this.demoHidden('feedback', 'UIStatusIndicator status online offline');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIStatusIndicator</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>online · connecting · offline · reactive .status= binding</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'lg',
							align: 'center',
							wrap: true,
						}}>
							<ui-status-indicator .state.status=${'online'}></ui-status-indicator>
							<ui-status-indicator .state.status=${'connecting'}></ui-status-indicator>
							<ui-status-indicator .state.status=${'offline'}></ui-status-indicator>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'sm',
								align: 'center',
							}}>
								<ui-status-indicator .state.status=${this.state.statusValue}></ui-status-indicator>
								<ui-button .state=${{
									label: 'Cycle',
									size: 'sm',
									variant: 'outline',
								}} @button:click=${this.cycleStatus}></ui-button>
							</ui-stack>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.statusIndicatorExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="feedback" ?hidden=${() => {
	return this.demoHidden('feedback', 'UIAlert alert callout tone dismissible');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAlert</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>tone (info · success · warning · danger) · title · dismissible · slot body</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-alert .state.tone=${'info'} .state.heading=${'Heads up'}>The next block settles in roughly two seconds.</ui-alert>
							<ui-alert .state.tone=${'success'} .state.heading=${'Confirmed'}>Transaction included at block 4,182,907.</ui-alert>
							<ui-alert .state.tone=${'warning'} .state.heading=${'Unsynced'} .state.dismissible=${true}>Local state is ahead of the network.</ui-alert>
							<ui-alert .state.tone=${'danger'} .state.heading=${'Signature rejected'} .state.dismissible=${true}>The keypair did not match the sender address.</ui-alert>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.alertExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="feedback" ?hidden=${() => {
	return this.demoHidden('feedback', 'tooltip behavior hover hint');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>tooltip behavior</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>declarative tooltip= attribute · no import · hover-capable devices only</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'lg',
							align: 'center',
							wrap: true,
						}}>
							<ui-button .state=${{
								label: 'Send',
								tone: 'primary',
								tooltip: 'Settles in ~2s',
							}}></ui-button>
							<ui-icon-button .state=${{
								icon: 'info',
								tooltip: 'Transaction details',
							}}></ui-icon-button>
							<ui-text tooltip="Even plain text accepts a tooltip">Hover this label</ui-text>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.tooltipExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="feedback" ?hidden=${() => {
	return this.demoHidden('feedback', 'UIProgressRing radial gauge progress dial spin glow live animate');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIProgressRing</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>live value animate · sizes · thickness · min/max · variants solid/dashed/dots/glow/spin/pulse · indeterminate · thresholds</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt">
								<span class="demo-opt-label">Live · glow · animated</span>
								<ui-progress-ring .state.value=${this.state.progressRingLive} .state.size=${'lg'} .state.tone=${'accent'} .state.variant=${'glow'} .state.animated=${true}></ui-progress-ring>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Solid · success · md</span>
								<ui-progress-ring .state.value=${72} .state.size=${'md'} .state.tone=${'success'} .state.variant=${'solid'}></ui-progress-ring>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Dashed · info</span>
								<ui-progress-ring .state.value=${55} .state.size=${'md'} .state.tone=${'info'} .state.variant=${'dashed'}></ui-progress-ring>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Dots · warning</span>
								<ui-progress-ring .state.value=${40} .state.size=${'md'} .state.tone=${'warning'} .state.variant=${'dots'}></ui-progress-ring>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Pulse · danger</span>
								<ui-progress-ring .state.value=${88} .state.size=${'md'} .state.tone=${'danger'} .state.variant=${'pulse'}></ui-progress-ring>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Indeterminate · spin</span>
								<ui-progress-ring .state.indeterminate=${true} .state.variant=${'spin'} .state.tone=${'accent'} .state.size=${'md'} .state.showValue=${false}></ui-progress-ring>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Thresholds · lg</span>
								<ui-progress-ring .state.value=${94} .state.size=${'lg'} .state.thresholds=${this.state.ringThresholds}></ui-progress-ring>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Size sm</span>
								<ui-progress-ring .state.value=${38} .state.size=${'sm'} .state.tone=${'accent'}></ui-progress-ring>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Thickness 4 · thin</span>
								<ui-progress-ring .state.value=${60} .state.size=${'md'} .state.thickness=${4} .state.tone=${'info'}></ui-progress-ring>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Thickness 14 · thick</span>
								<ui-progress-ring .state.value=${60} .state.size=${'lg'} .state.thickness=${14} .state.tone=${'accent'} .state.variant=${'glow'}></ui-progress-ring>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">min/max 0–8 · peers</span>
								<ui-progress-ring .state.min=${0} .state.max=${8} .state.value=${5} .state.label=${'peers'} .state.size=${'md'} .state.tone=${'success'}></ui-progress-ring>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.progressRingExample}></ui-code-block>
					</ui-surface>
				</section>


<section class="demo" data-cat="feedback" ?hidden=${() => {
	return this.demoHidden('feedback', 'UIProgress linear progress bar indeterminate segments striped glow liquid');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIProgress</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>showValue · valuePosition auto/center/start/end/above · thin auto lifts % above the bar · segments · tooltip · indeterminate</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Label + value above (live)</span>
								<ui-progress .state.value=${this.state.progressValue} .state.label=${'Upload progress'} .state.showValue=${true} .state.valuePosition=${'above'} .state.tone=${'accent'} .state.variant=${'glow'} .state.animated=${true}></ui-progress>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">valuePosition end · inside bar</span>
								<ui-progress .state.value=${this.state.progressValue} .state.showValue=${true} .state.valuePosition=${'end'} .state.tone=${'success'} .state.variant=${'solid'}></ui-progress>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">valuePosition start · inside bar</span>
								<ui-progress .state.value=${this.state.progressValue} .state.showValue=${true} .state.valuePosition=${'start'} .state.tone=${'info'}></ui-progress>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">valuePosition center</span>
								<ui-progress .state.value=${this.state.progressValue} .state.showValue=${true} .state.valuePosition=${'center'} .state.size=${'lg'} .state.tone=${'accent'}></ui-progress>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">valuePosition auto · thin sm (lifts above)</span>
								<ui-progress .state.value=${this.state.progressValue} .state.showValue=${true} .state.valuePosition=${'auto'} .state.size=${'sm'} .state.tone=${'warning'}></ui-progress>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Striped · indeterminate</span>
								<ui-progress .state.indeterminate=${true} .state.variant=${'striped'} .state.tone=${'accent'}></ui-progress>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Liquid · lg</span>
								<ui-progress .state.value=${72} .state.variant=${'liquid'} .state.size=${'lg'} .state.tone=${'info'} .state.showValue=${true}></ui-progress>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Pulse · danger · sm · overlay (type tracks bar height)</span>
								<ui-progress .state.value=${88} .state.variant=${'pulse'} .state.tone=${'danger'} .state.size=${'sm'} .state.showValue=${true} .state.valuePosition=${'center'}></ui-progress>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Segments · circle · hug content (trackFit content)</span>
								<div style="max-inline-size: 14rem">
									<ui-progress .state.value=${this.state.progressValue} .state.segmentShape=${'circle'} .state.segments=${10} .state.tone=${'accent'} .state.variant=${'glow'} .state.trackFit=${'content'}></ui-progress>
								</div>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Segments · round · hug content</span>
								<div style="max-inline-size: 12rem">
									<ui-progress .state.value=${65} .state.segmentShape=${'round'} .state.segments=${8} .state.tone=${'success'} .state.trackFit=${'content'}></ui-progress>
								</div>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Segments · full width (trackFit fill)</span>
								<ui-progress .state.value=${70} .state.segmentShape=${'round'} .state.segments=${16} .state.tone=${'info'} .state.trackFit=${'fill'} .state.showValue=${true} .state.valuePosition=${'end'}></ui-progress>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Segments · square · content</span>
								<div style="max-inline-size: 11rem">
									<ui-progress .state.value=${50} .state.segmentShape=${'square'} .state.segments=${10} .state.tone=${'warning'} .state.trackFit=${'content'}></ui-progress>
								</div>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Segments · triangle · content</span>
								<div style="max-inline-size: 12rem">
									<ui-progress .state.value=${80} .state.segmentShape=${'triangle'} .state.segments=${9} .state.tone=${'info'} .state.trackFit=${'content'}></ui-progress>
								</div>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Segments · indeterminate wave · fill</span>
								<ui-progress .state.indeterminate=${true} .state.segmentShape=${'circle'} .state.segments=${14} .state.tone=${'accent'} .state.trackFit=${'fill'}></ui-progress>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Overlay value · tall track + tooltip</span>
								<ui-progress .state.value=${56} .state.showValue=${true} .state.valuePosition=${'center'} .state.size=${'lg'} .state.tone=${'primary'} .state.tooltip=${'56% complete'}></ui-progress>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Overlay · sm (type adapts to track height)</span>
								<ui-progress .state.value=${38} .state.showValue=${true} .state.valuePosition=${'auto'} .state.size=${'sm'} .state.tone=${'danger'} .state.tooltip=${'38%'}></ui-progress>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">min 10 · max 50 · value 30 (custom range)</span>
								<ui-progress .state.min=${10} .state.max=${50} .state.value=${30} .state.label=${'Custom range'} .state.showValue=${true} .state.valuePosition=${'above'} .state.tone=${'info'}></ui-progress>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.progressExample}></ui-code-block>
					</ui-surface>
				</section>
				</section>

				<section class="cat-section" data-cat-section="data" #cat_data ?hidden=${() => {
					return this.catSectionHidden('data');
				}}>
					<header class="cat-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>Data</ui-text>
					</header>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIChip chip tag token filter removable selectable');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIChip</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>tones · removable ✕ independent of selected · selected+interactive SVG check · sizes</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'sm',
								wrap: true,
								align: 'center',
							}}>
								<ui-chip .state.label=${'Neutral'}></ui-chip>
								<ui-chip .state.label=${'Success'} .state.tone=${'success'}></ui-chip>
								<ui-chip .state.label=${'Warning'} .state.tone=${'warning'}></ui-chip>
								<ui-chip .state.label=${'Danger'} .state.tone=${'danger'}></ui-chip>
								<ui-chip .state.label=${'Info'} .state.tone=${'info'}></ui-chip>
								<ui-chip .state.label=${'Accent'} .state.tone=${'accent'}></ui-chip>
							</ui-stack>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'sm',
								wrap: true,
								align: 'center',
							}}>
								<ui-chip .state.label=${'React'} .state.value=${'react'} .state.removable=${true}></ui-chip>
								<ui-chip .state.label=${'Vue'} .state.value=${'vue'} .state.tone=${'success'} .state.removable=${true}></ui-chip>
								<ui-chip .state.label=${'Svelte'} .state.value=${'svelte'} .state.tone=${'warning'} .state.removable=${true}></ui-chip>
							</ui-stack>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'sm',
								wrap: true,
								align: 'center',
							}}>
								<ui-chip .state.label=${'Filter on'} .state.interactive=${true} .state.selected=${true} .state.tone=${'accent'}></ui-chip>
								<ui-chip .state.label=${'Filter off'} .state.interactive=${true} .state.tone=${'accent'}></ui-chip>
								<ui-chip .state.label=${'Selected + close'} .state.interactive=${true} .state.selected=${true} .state.removable=${true} .state.tone=${'info'}></ui-chip>
								<ui-chip .state.label=${'Small'} .state.size=${'sm'}></ui-chip>
								<ui-chip .state.label=${'Large'} .state.size=${'lg'}></ui-chip>
								<ui-chip .state.label=${'Disabled'} .state.disabled=${true} .state.removable=${true}></ui-chip>
							</ui-stack>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.chipExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIAnimatedNumber animated number count up roll kpi');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAnimatedNumber</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>rAF count-up · grouping · decimals · prefix/suffix</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							align: 'center',
							wrap: true,
						}}>
							<ui-text .state.variant=${'display'} .state.tone=${'accent'}><ui-animated-number .state.value=${this.state.animValue} .state.group=${true}></ui-animated-number></ui-text>
							<ui-animated-number .state.value=${1.84} .state.decimals=${2} .state.suffix=${'s'}></ui-animated-number>
							<ui-animated-number .state.value=${128.4} .state.pre=${'$'} .state.decimals=${2}></ui-animated-number>
							<ui-button .state=${{
								label: 'Roll',
								variant: 'outline',
								tone: 'primary',
								size: 'sm',
							}} @button:click=${this.rollAnim}></ui-button>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.animatedNumberExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIStatTable stat table data grid');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIStatTable</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>columns · rows · grid-template widths · title + hint</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stat-table .state=${{
							heading: 'NETWORK',
							hint: 'live · 24h delta',
							columns: this.state.statTableColumns,
							items: this.state.statTableRows,
						}}></ui-stat-table>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.statTableExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UICollection collection paged list load more');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UICollection</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>virtual list by default · 14rem scroll box · load-more (8×12 synthetic rows) · head row</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-collection
							class="demo-paged"
							.state=${this.listConfig}
							.importStyles=${this.pagedRowStyles}
						></ui-collection>
					
						<ui-code-block .state.language=${'js'} .state.code=${this.state.collectionExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UICollection selectable checkbox collection-item');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UICollection · selectable</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>default ui-collection-item · checkbox start · row highlight when checked · no custom renderRow</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-collection
							class="demo-paged"
							.state=${this.listConfigSelectable}
						></ui-collection>
					</ui-surface>
				</section>


<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UITable table columns rows data grid');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UITable</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>columns · items · heading · density sm/md/lg · emptyMessage · table:row-click</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Default density (md)</span>
								<ui-table
									.state.heading=${'Balances'}
									.state.columns=${this.state.tableColumns}
									.state.items=${this.state.tableItems}
									@table:row-click=${this.handleTableRowClick}></ui-table>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Density sm</span>
								<ui-table
									.state.heading=${'Compact'}
									.state.density=${'sm'}
									.state.columns=${this.state.tableColumns}
									.state.items=${this.state.tableItems}></ui-table>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Density lg</span>
								<ui-table
									.state.heading=${'Comfortable'}
									.state.density=${'lg'}
									.state.columns=${this.state.tableColumns}
									.state.items=${this.state.tableItems}></ui-table>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Empty</span>
								<ui-table
									.state.heading=${'Empty set'}
									.state.columns=${this.state.tableColumns}
									.state.items=${[]}
									.state.emptyMessage=${'No rows yet.'}></ui-table>
							</div>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>row click: ${this.state.tableRowReadout || '—'}</ui-text>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.tableExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UITableRow table row child index columns click density');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UITableRow</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>child of ui-table · index + column keys · table-row:click bubbles as table:row-click · click a row</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-table
							.state.heading=${'Row child matrix'}
							.state.density=${'sm'}
							.state.columns=${this.state.tableColumns}
							.state.items=${this.state.tableItems}
							@table:row-click=${this.handleTableRowClick}></ui-table>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>last: ${this.state.tableRowReadout || '—'}</ui-text>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.tableRowExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UICodeBlock code block syntax copy');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UICodeBlock</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>language label · dedented · XSS-safe text render · one-click copy</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-code-block .state.language=${'js'} .state.code=${this.state.codeBlockExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIMetric KPI metric card stat delta sparkline tooltip');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIMetric</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>KPI card · contained value (ellipsis + clamp) · card tooltip · deltaTooltip · sparkline</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="grid">
							<ui-metric .state.label=${'TPS (peak)'} .state.value=${'9,410'} .state.delta=${12.4} .state.tooltip=${'Peak transactions per second'} .state.deltaTooltip=${'vs. previous 24h'} .state.values=${this.state.metricTrendTps} .state.tone=${'accent'}></ui-metric>
							<ui-metric .state.label=${'Finality'} .state.value=${'1.8s'} .state.delta=${-8.2} .state.invertDelta=${true} .state.tooltip=${'Time to finality'} .state.deltaTooltip=${'vs. previous 24h · down is good'} .state.values=${this.state.metricTrendFinality} .state.tone=${'success'}></ui-metric>
							<ui-metric .state.label=${'Validators'} .state.value=${'128'} .state.delta=${1.6} .state.hint=${'24h'} .state.tooltip=${'Active validator set'} .state.deltaTooltip=${'vs. previous 24h'} .state.values=${this.state.sparkValues} .state.tone=${'info'}></ui-metric>
						</div>
						<div class="demo-metric-tight">
							<ui-metric .state.label=${'Supply (tight)'} .state.value=${'1,234,567,890.123456'} .state.delta=${3.2} .state.tooltip=${'Must stay inside this 8.5rem box'} .state.tone=${'warning'}></ui-metric>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.metricExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UISegmentStrip segment strip pill shell facts KPI trust bar');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UISegmentStrip</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>rounded pill shell · equal segments · icon · label · value · description · hint</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'lg',
						}}>
							<ui-segment-strip .state.items=${this.state.segmentStripItems}></ui-segment-strip>
							<ui-segment-strip .state.items=${this.state.segmentStripFacts} .state.size=${'sm'}></ui-segment-strip>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.segmentStripExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIVoteTally vote tally upvote leaderboard feature voting count-up flip reorder');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIVoteTally</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>upvote toggle · count-up roll · FLIP reorder on re-rank · base / feature-voting</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							wrap: true,
							align: 'start',
						}}>
							<ui-vote-tally .state.heading=${'Most wanted'} .state.items=${this.state.voteTallyItems}></ui-vote-tally>
							<ui-feature-voting .state.heading=${'Feature requests'} .state.items=${this.state.featureVotingItems}></ui-feature-voting>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.voteTallyExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIVoteItem vote item child label description votes voted');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIVoteItem</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>ui-vote-item · child of ui-vote-tally · id · label · description · votes · voted</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-vote-tally
							.state.heading=${'Child fields'}
							.state.items=${this.state.voteItemDemoItems}></ui-vote-tally>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.voteItemExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UITracker status squares uptime health bars expand click select');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UITracker</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>click a segment · hover lift + border · min-width scroll · 28-seg overflow demo · cancelable tracker:select</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-tracker
							.state.items=${this.state.trackerSegments}
							.state.label=${'Recent block finality'}
							.state.expandOnSelect=${true}
							.state.openOnHover=${true}></ui-tracker>
						<div class="demo-tracker-wide">
							<span class="demo-opt-label">28 segments · desktop scroll</span>
							<ui-tracker
								.state.items=${this.state.trackerOverflowItems}
								.state.label=${'Many slots'}
								.state.expandOnSelect=${true}
								.state.openOnHover=${true}></ui-tracker>
						</div>
						<div class="demo-tracker-narrow">
							<span class="demo-opt-label">Same 28 · narrow container</span>
							<ui-tracker
								.state.items=${this.state.trackerOverflowItems}
								.state.label=${'Many slots narrow'}
								.state.expandOnSelect=${true}
								.state.openOnHover=${true}></ui-tracker>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.trackerExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UITimeline timeline event stream history audit log activity vertical horizontal');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UITimeline</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>event stream · time/label/description · tone dots + icons · connector rail · vertical (default) or horizontal · density</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							wrap: true,
						}}>
							<ui-timeline .state.items=${this.state.timelineEvents} .state.orientation=${'vertical'}></ui-timeline>
							<ui-timeline .state.items=${this.state.timelineEvents} .state.orientation=${'horizontal'} .state.density=${'compact'}></ui-timeline>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.timelineExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIJsonInspector json entity inspector tree collapsible payload type tint copy path search filter depth tx block agent tool io');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIJsonInspector</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>collapsible tree for any value / JSON string · type-tinted · per-row copy-path · live search (matches + ancestors, force-expanded) · starting depth · cycle-safe</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-json-inspector #json_demo .data=${this.state.jsonSample} .state.expandDepth=${1}></ui-json-inspector>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.jsonInspectorExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIJsonRow json row child key preview type depth expandable matched copy path');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIJsonRow</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>ui-json-row · child of ui-json-inspector · keyLabel · isIndex · preview · type · depth · expandable · expanded · path · matched · copyPath</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-json-inspector
							.data=${this.state.jsonRowDemoData}
							.state.expandDepth=${2}
							.state.copyPath=${true}></ui-json-inspector>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.jsonRowExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UITree tree hierarchical expand collapse select nested items');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UITree</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>nested {id,label,children,icon} · expand/collapse · tree:select · filter · keyboard</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>selected: ${this.state.treeReadout || '—'}</ui-text>
							<ui-tree
								.state.items=${this.state.treeDemoItems}
								.state.expandDepth=${1}
								.state.showFilter=${true}
								@tree:select=${this.handleTreeSelect}></ui-tree>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.treeExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UITreeNode tree node child id label icon depth expandable selected');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UITreeNode</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>ui-tree-node · child of ui-tree · id · label · icon · depth · expandable · expanded · selected</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-tree .state.items=${this.state.treeDemoItems} .state.expandDepth=${2}></ui-tree>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.treeNodeExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UITreeTable tree table columns hierarchical rows');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UITreeTable</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>tree + columns · tree-table:select · flatten visible rows</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-tree-table
							.state.items=${this.state.treeTableItems}
							.state.columns=${this.state.treeTableColumns}
							.state.expandDepth=${1}></ui-tree-table>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.treeTableExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UITreeTableRow tree table row child cells depth');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UITreeTableRow</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>ui-tree-table-row · child of ui-tree-table · id · label · depth · cells</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-tree-table
							.state.items=${this.state.treeTableItems}
							.state.columns=${this.state.treeTableColumns}
							.state.expandDepth=${2}></ui-tree-table>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.treeTableRowExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIPickList pick list dual transfer source target');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIPickList</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>source ↔ target · add/remove selected or all · target reorder (up/down/top/bottom) · pick-list:change</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-pick-list
							.state.items=${this.state.pickSourceItems}
							.state.target=${this.state.pickTargetItems}></ui-pick-list>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.pickListExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIPickItem pick item child selected label');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIPickItem</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>ui-pick-item · child of ui-pick-list · id · label · selected</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-pick-list
							.state.items=${this.state.pickSourceItems}
							.state.target=${this.state.pickTargetItems}></ui-pick-list>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.pickItemExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIOrderList order list reorder drag up down');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIOrderList</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>reorderable · drag handle · up/down · order-list:change</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-order-list
							.state.items=${this.state.orderDemoItems}
							.state.heading=${'Priority'}></ui-order-list>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.orderListExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIOrderItem order item child drag handle');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIOrderItem</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>ui-order-item · child of ui-order-list · id · label · drag handle + up/down</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-order-list .state.items=${this.state.orderDemoItems}></ui-order-list>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.orderItemExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIOrgChart org chart hierarchy cards organization');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIOrgChart</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>hierarchy cards · label || name · author || title · org-chart:select · collapse reports</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-org-chart .state.items=${this.state.orgDemoItems}></ui-org-chart>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.orgChartExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIOrgNode org node child author children expanded');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIOrgNode</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>ui-org-node · child of ui-org-chart · id · label · author · icon · children · expanded</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-org-chart .state.items=${this.state.orgDemoItems}></ui-org-chart>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.orgNodeExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIHeatmap heatmap calendar matrix value color scale tooltip legend activity density tx per day github contributions');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIHeatmap</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>matrix or GitHub-style calendar · hover tip · click highlight · heatmap:select / heatmap:hover · UTC date math</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'xl',
						}}>
							<ui-text .state.variant=${'caption'} .state.tone=${'accent'}>${this.state.heatmapReadout}</ui-text>
							<ui-heatmap #heatmap_cal .state.mode=${'calendar'} .state.data=${this.state.heatmapCalendar} .state.selectHighlight=${true} @heatmap:select=${this.handleHeatmapSelect}></ui-heatmap>
							<ui-heatmap #heatmap_mat .state.data=${this.state.heatmapMatrix} .state.rowLabels=${this.state.heatmapMatrixRows} .state.colLabels=${this.state.heatmapMatrixCols} .state.showValues=${true} .state.selectHighlight=${true} @heatmap:select=${this.handleHeatmapSelect}></ui-heatmap>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.heatmapExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIBarList ranked horizontal bars top accounts');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIBarList</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>ranked bars · proportional scale · linkable rows · value labels</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-bar-list .state.items=${this.state.barListItems} .state.tone=${'accent'}></ui-bar-list>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.barListExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIMeterGroup meter group stacked bar legend icon');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIMeterGroup</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>stacked proportional bar · hover/click active · intro + live value anim · icon vs color-dot legend</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'lg',
						}}>
							<ui-meter-group
								.state.label=${'Disk usage'}
								.state.items=${this.state.meterItems}
								@meter-group:select=${this.handleMeterSelect}></ui-meter-group>
							<ui-meter-group
								.state.label=${'With icons'}
								.state.items=${this.state.meterItems}
								.state.showIcon=${true}></ui-meter-group>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'sm',
								align: 'center',
								wrap: true,
							}}>
								<ui-button .state.label=${'Shuffle values'} @button:click=${this.shuffleMeter}></ui-button>
								<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>active: ${this.state.meterSelectReadout}</ui-text>
							</ui-stack>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.meterGroupExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIDetailList key value description grid copy');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIDetailList</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>key/value grid · multi-column · click-to-copy values · entity attributes</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-detail-list .state.columns=${2} .state.items=${this.state.detailPairs}></ui-detail-list>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.detailListExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UILegend chart legend series swatch interactive toggle');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UILegend</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>chart legend · caller-supplied colours · click to toggle a series · emits legend:change</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-legend .state.items=${this.state.legendSeries} .state.interactive=${true}></ui-legend>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.legendExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIAvatar avatar initials identicon hue status dot role badge admin mod user');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAvatar</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>initials fallback · status dot (presence) · role badge (admin/mod/user or free icon + tone) · sizes</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'lg',
							align: 'center',
							wrap: true,
						}}>
							<ui-avatar .state.name=${'Ada Lovelace'} .state.size=${'lg'} .state.status=${'online'} .state.badge=${'admin'}></ui-avatar>
							<ui-avatar .state.name=${'Grace Hopper'} .state.size=${'md'} .state.status=${'away'} .state.badge=${'mod'}></ui-avatar>
							<ui-avatar .state.name=${'0xA1f2…c4'} .state.shape=${'square'} .state.size=${'md'} .state.status=${'busy'} .state.badge=${'user'}></ui-avatar>
							<ui-avatar .state.name=${'Validator 07'} .state.size=${'sm'} .state.badge=${'crown'} .state.badgeTone=${'warning'}></ui-avatar>
							<ui-avatar .state.initials=${'VX'} .state.size=${'sm'} .state.status=${'offline'}></ui-avatar>
							<ui-avatar .state.name=${'Network Ops'} .state.size=${'xs'}></ui-avatar>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.avatarExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIMiniCalendar mini calendar compact density preset picker');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIMiniCalendar</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>preset of ui-calendar · density compact · round cells · tight type · weekStart Monday · single-date value</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-mini-calendar
							.state.viewYear=${2026}
							.state.viewMonth=${5}
							.state.weekStart=${1}
							.state.value=${'2026-06-10'}></ui-mini-calendar>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.miniCalendarExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIRangeCalendar range calendar selectMode start end span preset');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIRangeCalendar</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>preset of ui-calendar · selectMode range · start + end + filled span · calendar:range-change</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-range-calendar
							.state.viewYear=${2026}
							.state.viewMonth=${5}
							.state.rangeStart=${'2026-06-08'}
							.state.rangeEnd=${'2026-06-19'}></ui-range-calendar>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.rangeCalendarExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIEventCalendar event calendar showEvents chips month preset');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIEventCalendar</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>preset of ui-calendar · showEvents true · taller cells · up to 3 tone chips per day</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-event-calendar
							.state.viewYear=${2026}
							.state.viewMonth=${5}
							.state.value=${'2026-06-12'}
							.state.items=${this.state.calendarEvents}></ui-event-calendar>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.eventCalendarExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIChoicePoll choice poll instant lock preset');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIChoicePoll</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>preset of ui-poll · instant true · pick locks immediately · no Vote button · results reveal on select</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-choice-poll
							.state.question=${'Pick your top priority — locks on click'}
							.state.items=${this.state.choicePollDemoItems}></ui-choice-poll>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.choicePollExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIFeaturePoll feature poll variant descriptions Cast vote preset');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIFeaturePoll</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>preset of ui-poll · variant feature · roomier rows + descriptions · Cast vote button · single-select then lock</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-feature-poll
							.state.question=${'Vote on the next feature'}
							.state.items=${this.state.featurePollDemoItems}></ui-feature-poll>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.featurePollExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIFeatureVoting feature voting upvote tally FLIP reorder preset');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIFeatureVoting</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>preset of ui-vote-tally — not a poll · variant feature · independent upvotes · count-up · FLIP reorder · descriptions</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-feature-voting
							.state.heading=${'Roadmap votes'}
							.state.items=${this.state.featureVotingDemoItems}></ui-feature-voting>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.featureVotingExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="data" ?hidden=${() => {
	return this.demoHidden('data', 'UIPollWidget poll widget compact Submit multiple preset');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIPollWidget</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>preset of ui-poll · variant widget · compact card · Submit button · this demo sets multiple (checkbox) vs feature-poll's single + Cast vote</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-poll-widget
							.state.question=${'Select every surface you want'}
							.state.multiple=${true}
							.state.items=${this.state.pollWidgetDemoItems}></ui-poll-widget>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.pollWidgetExample}></ui-code-block>
					</ui-surface>
				</section>
				</section>

				<section class="cat-section" data-cat-section="charts" #cat_charts ?hidden=${() => {
					return this.catSectionHidden('charts');
				}}>
					<header class="cat-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>Charts</ui-text>
					</header>

<section class="demo" data-cat="charts" ?hidden=${() => {
	return this.demoHidden('charts', 'UISparkline sparkline trend chart line area tooltip tip points');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UISparkline</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>hand-rolled SVG · line / area · hover a vertex for the value (framework tooltip=)</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							align: 'center',
							wrap: true,
						}}>
							<ui-sparkline .state.values=${this.state.sparkValues} .state.variant=${'line'} .state.tone=${'accent'}></ui-sparkline>
							<ui-sparkline .state.values=${this.state.sparkValues} .state.variant=${'area'} .state.tone=${'success'}></ui-sparkline>
							<ui-sparkline .state.values=${this.state.metricTrendFinality} .state.variant=${'area'} .state.tone=${'danger'}></ui-sparkline>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.sparklineExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="charts" ?hidden=${() => {
	return this.demoHidden('charts', 'UILineChart line chart multi series area axes grid legend trend live update');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UILineChart</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>live · legend placement · x/y labels · auto-compact layout</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-button .state=${{
								label: 'Send new data',
								variant: 'outline',
								tone: 'primary',
								size: 'sm',
							}} @button:click=${this.rollLineChart}></ui-button>
							<ui-line-chart .state.series=${this.state.lineChartSeries} .state.categories=${this.state.lineChartCategories} .state.variant=${'line'}
								.state.legendPosition=${'right'} .state.xLabel=${'Day'} .state.yLabel=${'TPS'} .state.label=${'Network load'}></ui-line-chart>
							<ui-line-chart .state.series=${this.state.lineChartSeries} .state.categories=${this.state.lineChartCategories} .state.variant=${'area'}
								.state.legendPosition=${'bottom'} .state.xLabel=${'Day'} .state.yLabel=${'TPS'}></ui-line-chart>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.lineChartExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="charts" ?hidden=${() => {
	return this.demoHidden('charts', 'UIBarChart bar chart column vertical horizontal stacked categorical live update');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIBarChart</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>live · axis titles · legend placement · compact fold</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-button .state=${{
								label: 'Send new data',
								variant: 'outline',
								tone: 'primary',
								size: 'sm',
							}} @button:click=${this.rollBarChart}></ui-button>
							<ui-bar-chart .state.items=${this.state.barChartItems}
								.state.xLabel=${'Weekday'} .state.yLabel=${'Volume'} .state.legendPosition=${'bottom'}></ui-bar-chart>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.barChartExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="charts" ?hidden=${() => {
	return this.demoHidden('charts', 'UIPieChart pie donut share distribution live update');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIPieChart</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>pie / donut · live state · legend tooltips · pie-chart:select</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-button .state=${{
								label: 'Send new data',
								variant: 'outline',
								tone: 'primary',
								size: 'sm',
							}} @button:click=${this.rollPieChart}></ui-button>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'xl',
								wrap: true,
							}}>
								<ui-pie-chart .state.items=${this.state.pieChartItems} .state.variant=${'donut'}></ui-pie-chart>
								<ui-pie-chart .state.items=${this.state.pieChartItems} .state.variant=${'pie'}></ui-pie-chart>
							</ui-stack>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.pieChartExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="charts" ?hidden=${() => {
	return this.demoHidden('charts', 'UIScatterChart scatter plot xy correlation points live update');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIScatterChart</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>X/Y scatter · live state · multi-series · scatter-chart:select</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-button .state=${{
								label: 'Send new data',
								variant: 'outline',
								tone: 'primary',
								size: 'sm',
							}} @button:click=${this.rollScatterChart}></ui-button>
							<ui-scatter-chart .state.points=${this.state.scatterPoints}></ui-scatter-chart>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.scatterChartExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="charts" ?hidden=${() => {
	return this.demoHidden('charts', 'UIRadarChart spider radar multi axis profile live update');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIRadarChart</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>spider / radar · live state · multi-series · category axes</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-button .state=${{
								label: 'Send new data',
								variant: 'outline',
								tone: 'primary',
								size: 'sm',
							}} @button:click=${this.rollRadarChart}></ui-button>
							<ui-radar-chart .state.categories=${this.state.radarCategories} .state.series=${this.state.radarSeries}></ui-radar-chart>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.radarChartExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="charts" ?hidden=${() => {
	return this.demoHidden('charts', 'UIGauge gauge dial semi circle meter thresholds live update');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIGauge</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>semi-circle dial · live value · thresholds recolor · distinct from progress-ring</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-button .state=${{
								label: 'Send new data',
								variant: 'outline',
								tone: 'primary',
								size: 'sm',
							}} @button:click=${this.rollGauges}></ui-button>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'xl',
								wrap: true,
								align: 'end',
							}}>
								<ui-gauge .state.value=${this.state.gaugeCpu} .state.label=${'CPU'} .state.unit=${'%'}></ui-gauge>
								<ui-gauge .state.value=${this.state.gaugeDisk} .state.label=${'Disk'} .state.unit=${'%'} .state.thresholds=${this.state.gaugeThresholds}></ui-gauge>
								<ui-gauge .state.value=${this.state.gaugeMem} .state.label=${'Mem'} .state.unit=${'%'} .state.tone=${'success'}></ui-gauge>
							</ui-stack>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.gaugeExample}></ui-code-block>
					</ui-surface>
				</section>
				</section>

				<section class="cat-section" data-cat-section="maps" #cat_maps ?hidden=${() => {
					return this.catSectionHidden('maps');
				}}>
					<header class="cat-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>Maps</ui-text>
					</header>

<section class="demo" data-cat="maps" ?hidden=${() => {
	return this.demoHidden('maps', 'UIGoogleMap google map maps markers polylines routes clustering geocode pan fly geospatial');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIGoogleMap</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Maps JS API host · markers (items) · polylines/polygons/circles/routes · layers · fit/pan/fly · two-way activeIndex · grid clustering · enable Maps JavaScript API + allow this origin in key restrictions</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'md',
								align: 'end',
								wrap: true,
							}}>
								<label class="field" style="flex: 1; min-inline-size: 16rem;">
									<span class="field-label">Google Maps API key (live)</span>
									<input
										class="rail-search-input"
										type="password"
										autocomplete="off"
										spellcheck="false"
										placeholder="Paste AIza… — map reloads live"
										$value="mapsApiKey"
										@input=${this.handleMapsKeyInput}
										@change=${this.applyMapsApiKey}
										@keydown=${this.handleMapsKeyKeydown}>
								</label>
								<ui-button .state.label=${'Reload map'} .state.variant=${'solid'} .state.tone=${'primary'} @button:click=${this.applyMapsApiKey}></ui-button>
								<ui-text .state.variant=${'mono'} .state.tone=${'muted'}>${this.state.mapDemoReadout}</ui-text>
							</ui-stack>
							<ui-text .state.variant=${'caption'} .state.tone=${'danger'} ?hidden=${!this.state.mapDemoError}>${this.state.mapDemoError}</ui-text>
							<div style="inline-size: 100%; block-size: 22rem;">
								<ui-map-google
									#gmap_demo
									.state.apiKey=${this.state.mapsApiKey}
									.state.center=${this.state.mapDemoCenter}
									.state.zoom=${this.state.mapDemoZoom}
									.state.items=${this.state.mapDemoItems}
									.state.polylines=${this.state.mapDemoPolylines}
									.state.activeIndex=${this.state.mapDemoActive}
									.state.fitItems=${true}
									.state.emptyLabel=${'San Francisco map'}
									@map-google:select=${this.handleMapDemoSelect}
									@map-google:error=${this.handleMapDemoError}
									@map-google:ready=${this.handleMapDemoReady}></ui-map-google>
							</div>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.googleMapExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="maps" ?hidden=${() => {
	return this.demoHidden('maps', 'UILeaflet leaflet openstreetmap osm tiles markers polylines map');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UILeaflet</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Leaflet CDN · OSM tiles (no API key) · markers/polylines/polygons/circles · two-way activeIndex · custom tileUrl</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-text .state.variant=${'mono'} .state.tone=${'muted'}>${this.state.leafletDemoReadout}</ui-text>
							<div style="inline-size: 100%; block-size: 22rem;">
								<ui-map-leaflet
									.state.center=${this.state.mapDemoCenter}
									.state.zoom=${this.state.mapDemoZoom}
									.state.items=${this.state.mapDemoItems}
									.state.polylines=${this.state.mapDemoPolylines}
									.state.activeIndex=${this.state.mapDemoActive}
									.state.fitItems=${true}
									.state.emptyLabel=${'Leaflet · San Francisco'}
									@map-leaflet:select=${this.handleLeafletDemoSelect}></ui-map-leaflet>
							</div>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.leafletExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="maps" ?hidden=${() => {
	return this.demoHidden('maps', 'UIOpenLayers openlayers ol openstreetmap osm tiles markers vector map');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIOpenLayers</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>OpenLayers CDN · OSM tiles (no API key) · vector markers/lines/polygons/circles · two-way activeIndex · custom tileUrl</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-text .state.variant=${'mono'} .state.tone=${'muted'}>${this.state.openlayersDemoReadout}</ui-text>
							<div style="inline-size: 100%; block-size: 22rem;">
								<ui-map-openlayers
									.state.center=${this.state.mapDemoCenter}
									.state.zoom=${this.state.mapDemoZoom}
									.state.items=${this.state.mapDemoItems}
									.state.polylines=${this.state.mapDemoPolylines}
									.state.activeIndex=${this.state.mapDemoActive}
									.state.fitItems=${true}
									.state.emptyLabel=${'OpenLayers · San Francisco'}
									@map-openlayers:select=${this.handleOpenLayersDemoSelect}></ui-map-openlayers>
							</div>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.openlayersExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="maps" ?hidden=${() => {
	return this.demoHidden('maps', 'UIOpenStreetMap openstreetmap osm open street map nominatim tiles humanitarian cyclosm topo');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIOpenStreetMap</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>openstreetmap.org · OSM tile presets (standard / HOT / CyclOSM / topo) · Nominatim geocode · openInOsm() · no API key</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'sm',
								wrap: true,
								align: 'center',
							}}>
								<ui-button .state.label=${'Standard'} .state.variant=${'outline'} .state.size=${'sm'} data-layer="standard" @button:click=${this.setOsmDemoLayer}></ui-button>
								<ui-button .state.label=${'Humanitarian'} .state.variant=${'outline'} .state.size=${'sm'} data-layer="humanitarian" @button:click=${this.setOsmDemoLayer}></ui-button>
								<ui-button .state.label=${'CyclOSM'} .state.variant=${'outline'} .state.size=${'sm'} data-layer="cyclosm" @button:click=${this.setOsmDemoLayer}></ui-button>
								<ui-button .state.label=${'Topo'} .state.variant=${'outline'} .state.size=${'sm'} data-layer="topo" @button:click=${this.setOsmDemoLayer}></ui-button>
								<ui-button .state.label=${'Open in OSM'} .state.variant=${'solid'} .state.tone=${'primary'} .state.size=${'sm'} @button:click=${this.openOsmDemoInBrowser}></ui-button>
								<ui-text .state.variant=${'mono'} .state.tone=${'muted'}>${this.state.openstreetmapDemoReadout} · layer=${this.state.osmDemoLayer}</ui-text>
							</ui-stack>
							<div style="inline-size: 100%; block-size: 22rem;">
								<ui-map-openstreetmap
									#osm_demo
									.state.center=${this.state.mapDemoCenter}
									.state.zoom=${this.state.mapDemoZoom}
									.state.layer=${this.state.osmDemoLayer}
									.state.items=${this.state.mapDemoItems}
									.state.polylines=${this.state.mapDemoPolylines}
									.state.activeIndex=${this.state.mapDemoActive}
									.state.fitItems=${true}
									.state.emptyLabel=${'OpenStreetMap · San Francisco'}
									@map-openstreetmap:select=${this.handleOpenStreetMapDemoSelect}></ui-map-openstreetmap>
							</div>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.openstreetmapExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="maps" ?hidden=${() => {
	return this.demoHidden('maps', 'UIMapOpensky opensky network ADS-B flight traffic live aircraft map.opensky-network.org');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIMapOpensky</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>OpenSky Network live ADS-B · viewport poll · plane markers · openInOpensky() · also a ui-map provider</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'sm',
								wrap: true,
								align: 'center',
							}}>
								<ui-button .state.label=${'Refresh traffic'} .state.variant=${'outline'} .state.size=${'sm'} @button:click=${this.refreshOpenskyDemo}></ui-button>
								<ui-button .state.label=${'Open OpenSky map'} .state.variant=${'solid'} .state.tone=${'primary'} .state.size=${'sm'} @button:click=${this.openOpenskyDemoInBrowser}></ui-button>
								<ui-text .state.variant=${'mono'} .state.tone=${'muted'}>${this.state.openskyDemoReadout}</ui-text>
							</ui-stack>
							<div style="inline-size: 100%; block-size: 22rem;">
								<ui-map-opensky
									#opensky_demo
									.state.center=${this.state.uiMapDemoCenter}
									.state.zoom=${8}
									.state.pollMs=${12000}
									.state.showTraffic=${true}
									.state.emptyLabel=${'OpenSky Network · live traffic'}
									@map-opensky:select=${this.handleOpenskyDemoSelect}
									@map-opensky:traffic=${this.handleOpenskyDemoTraffic}
									@map-opensky:error=${this.handleOpenskyDemoError}></ui-map-opensky>
							</div>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.openskyExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="maps" ?hidden=${() => {
	return this.demoHidden('maps', 'UIMap general item event map flight explosion place multi-provider openstreetmap leaflet openlayers opensky google');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIMap</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>item/event map · viewport list (default) · goToItem from outside · kinds (flight, fire, crime, accident, …) · multi-provider</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'sm',
								wrap: true,
								align: 'center',
							}}>
								<ui-button .state.label=${'Auto'} .state.variant=${'outline'} .state.size=${'sm'} data-provider="auto" @button:click=${this.setUiMapDemoMapProvider}></ui-button>
								<ui-button .state.label=${'OSM'} .state.variant=${'outline'} .state.size=${'sm'} data-provider="openstreetmap" @button:click=${this.setUiMapDemoMapProvider}></ui-button>
								<ui-button .state.label=${'Leaflet'} .state.variant=${'outline'} .state.size=${'sm'} data-provider="leaflet" @button:click=${this.setUiMapDemoMapProvider}></ui-button>
								<ui-button .state.label=${'OpenLayers'} .state.variant=${'outline'} .state.size=${'sm'} data-provider="openlayers" @button:click=${this.setUiMapDemoMapProvider}></ui-button>
								<ui-button .state.label=${'OpenSky'} .state.variant=${'outline'} .state.size=${'sm'} data-provider="opensky" @button:click=${this.setUiMapDemoMapProvider}></ui-button>
								<ui-button .state.label=${'Google'} .state.variant=${'outline'} .state.size=${'sm'} data-provider="google" @button:click=${this.setUiMapDemoMapProvider}></ui-button>
								<ui-text .state.variant=${'mono'} .state.tone=${'muted'}>${this.uiMapDemoStatus}</ui-text>
							</ui-stack>
							<div style="inline-size: 100%; block-size: 28rem;">
								<ui-map
									#ui_map_demo
									.state.mapProvider=${this.state.uiMapDemoMapProvider}
									.state.apiKey=${this.state.mapsApiKey}
									.state.center=${this.state.uiMapDemoCenter}
									.state.zoom=${this.state.uiMapDemoZoom}
									.state.items=${this.state.uiMapDemoItems}
									.state.activeIndex=${this.state.uiMapDemoActive}
									.state.heading=${'LHR area · mixed items'}
									.state.listHeading=${'Items'}
									@map:select=${this.handleUiMapDemoSelect}
									@map:view=${this.handleUiMapDemoView}></ui-map>
							</div>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.uiMapExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="maps" ?hidden=${() => {
	return this.demoHidden('maps', 'UIMapLeaflet leaflet engine OSM tiles CDN no key provider');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIMapLeaflet</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>provider host under ui-map · CDN Leaflet engine · default OSM tiles · no API key · lazy-mount (no tiles until Load)</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'sm',
								align: 'center',
								wrap: true,
							}}>
								<ui-button .state=${{
									label: 'Load Leaflet map',
									tone: 'primary',
									size: 'sm',
								}} @button:click=${this.mountLeafletMap}></ui-button>
								<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>${this.state.leafletLazyReadout}</ui-text>
							</ui-stack>
							${() => {
								return this.state.showLeafletMap ? this.leafletMapDemo() : '';
							}}
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.mapLeafletExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="maps" ?hidden=${() => {
	return this.demoHidden('maps', 'UIMapOpenLayers openlayers engine OSM tiles CDN vector provider');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIMapOpenLayers</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>provider host under ui-map · CDN OpenLayers engine (not Leaflet) · OSM tiles · no API key · lazy-mount</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'sm',
								align: 'center',
								wrap: true,
							}}>
								<ui-button .state=${{
									label: 'Load OpenLayers map',
									tone: 'primary',
									size: 'sm',
								}} @button:click=${this.mountOpenLayersMap}></ui-button>
								<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>${this.state.openlayersLazyReadout}</ui-text>
							</ui-stack>
							${() => {
								return this.state.showOpenLayersMap ? this.openLayersMapDemo() : '';
							}}
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.mapOpenLayersExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="maps" ?hidden=${() => {
	return this.demoHidden('maps', 'UIMapOpenStreetMap openstreetmap layer humanitarian cyclosm topo nominatim preset');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIMapOpenStreetMap</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Leaflet preset · layer standard | humanitarian | cyclosm | topo · Nominatim · openInOsm() · lazy-mount</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'sm',
								align: 'center',
								wrap: true,
							}}>
								<ui-button .state=${{
									label: 'Load OSM map',
									tone: 'primary',
									size: 'sm',
								}} @button:click=${this.mountOsmMap}></ui-button>
								<ui-button .state=${{
									label: 'Standard',
									variant: 'outline',
									size: 'sm',
								}} data-layer="standard" @button:click=${this.setOsmLazyLayer}></ui-button>
								<ui-button .state=${{
									label: 'Humanitarian',
									variant: 'outline',
									size: 'sm',
								}} data-layer="humanitarian" @button:click=${this.setOsmLazyLayer}></ui-button>
								<ui-button .state=${{
									label: 'CyclOSM',
									variant: 'outline',
									size: 'sm',
								}} data-layer="cyclosm" @button:click=${this.setOsmLazyLayer}></ui-button>
								<ui-button .state=${{
									label: 'Topo',
									variant: 'outline',
									size: 'sm',
								}} data-layer="topo" @button:click=${this.setOsmLazyLayer}></ui-button>
								<ui-button .state=${{
									label: 'Open in OSM',
									variant: 'outline',
									size: 'sm',
								}} @button:click=${this.openOsmLazyInBrowser}></ui-button>
								<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>${this.state.osmLazyReadout}</ui-text>
							</ui-stack>
							${() => {
								return this.state.showOsmMap ? this.osmMapDemo() : '';
							}}
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.mapOpenStreetMapExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="maps" ?hidden=${() => {
	return this.demoHidden('maps', 'UIMapGoogle google maps apiKey mapTypeId facade provider');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIMapGoogle</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>provider host under ui-map · requires Maps JS apiKey (none committed) · empty key = status facade · no script until a key is pasted · mapTypeId roadmap</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'sm',
								align: 'end',
								wrap: true,
							}}>
								<label class="field" style="flex: 1; min-inline-size: 16rem;">
									<span class="field-label">Google Maps API key (same field as UIGoogleMap)</span>
									<input
										class="rail-search-input"
										type="password"
										autocomplete="off"
										spellcheck="false"
										placeholder="Paste AIza… — never committed"
										$value="mapsApiKey"
										@input=${this.handleMapsKeyInput}
										@change=${this.applyMapsApiKey}
										@keydown=${this.handleMapsKeyKeydown}>
								</label>
								<ui-button .state=${{
									label: 'Mount Google map',
									tone: 'primary',
									size: 'sm',
								}} @button:click=${this.mountGoogleMap}></ui-button>
								<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>${this.state.googleLazyReadout}</ui-text>
							</ui-stack>
							${() => {
								return this.state.showGoogleMap ? this.googleMapDemo() : '';
							}}
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.mapGoogleExample}></ui-code-block>
					</ui-surface>
				</section>
				</section>

				<section class="cat-section" data-cat-section="media" #cat_media ?hidden=${() => {
					return this.catSectionHidden('media');
				}}>
					<header class="cat-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>Media</ui-text>
					</header>

<section class="demo" data-cat="media" ?hidden=${() => {
	return this.demoHidden('media', 'UICompare compare before after slider image');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UICompare</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>before/after slider · drag or keys · optional slideOnHover</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-compare
								.state.beforeSrc=${this.galleryItems[0].src}
								.state.afterSrc=${this.galleryItems[1].src}
								.state.beforeAlt=${'Before'}
								.state.afterAlt=${'After'}
								.state.value=${this.state.compareValue}
								@compare:input=${this.handleCompareInput}
								@compare:change=${this.handleCompareInput}></ui-compare>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>position ${this.state.compareValue}%</ui-text>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.compareExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="media" ?hidden=${() => {
	return this.demoHidden('media', 'UIImageList image list gallery grid masonry photos');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIImageList</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>responsive grid · captions · click-to-select</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-image-list .state.columns=${3} .state.gap=${'0.5rem'} .state.items=${this.galleryItems}></ui-image-list>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.imageListExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="media" ?hidden=${() => {
	return this.demoHidden('media', 'UIImageCell image cell child src alt title href');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIImageCell</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>ui-image-cell · child of ui-image-list · src · alt · title · href</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-image-list
							.state.columns=${3}
							.state.gap=${'0.5rem'}
							.state.items=${this.state.imageCellDemoItems}></ui-image-list>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.imageCellExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="media" ?hidden=${() => {
	return this.demoHidden('media', 'UIImage image rounded shadow lightbox preview');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIImage</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>radius · shadow · optional click → lightbox</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt demo-opt-wide">
								<span class="demo-opt-label">preview + lg radius + md shadow</span>
								<ui-image
									.state.src=${this.state.imageDemoSrc}
									.state.alt=${'VIAT'}
									.state.caption=${'Click to open lightbox'}
									.state.radius=${'lg'}
									.state.shadow=${'md'}
									.state.preview=${true}
									style="max-inline-size: 22rem"></ui-image>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.imageExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="media" ?hidden=${() => {
	return this.demoHidden('media', 'UIGallery gallery multi image lightbox fullscreen thumbs toolbar flip zoom rotate download');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIGallery</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>viewer · thumbs below · CSS flip/zoom/rotate · download · overlay reuses the same tool toggles</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">basic · no thumbs · no tools</span>
								<ui-gallery
									.state.items=${this.state.galleryDemoBasic}
									.state.layout=${'viewer'}
									.state.showThumbs=${false}
									.state.showFlip=${false}
									.state.showZoom=${false}
									.state.showRotate=${false}
									.state.showDownload=${false}></ui-gallery>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">thumbs below</span>
								<ui-gallery
									.state.items=${this.state.galleryDemoThumbs}
									.state.layout=${'viewer'}
									.state.showThumbs=${true}
									.state.showFlip=${false}
									.state.showZoom=${false}
									.state.showRotate=${false}
									.state.showDownload=${false}></ui-gallery>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">toolbar + thumbs · click image for overlay (same tools)</span>
								<ui-gallery
									.state.items=${this.state.galleryDemoTools}
									.state.layout=${'viewer'}
									.state.showThumbs=${true}
									.state.showFlip=${true}
									.state.showZoom=${true}
									.state.showRotate=${true}
									.state.showDownload=${true}></ui-gallery>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">overlay · tools off</span>
								<ui-gallery
									.state.items=${this.state.galleryDemoOverlayOff}
									.state.layout=${'grid'}
									.state.columns=${5}
									.state.showFlip=${false}
									.state.showZoom=${false}
									.state.showRotate=${false}
									.state.showDownload=${false}></ui-gallery>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">overlay · tools on</span>
								<ui-gallery
									.state.items=${this.state.galleryDemoOverlayOn}
									.state.layout=${'grid'}
									.state.columns=${5}
									.state.showFlip=${true}
									.state.showZoom=${true}
									.state.showRotate=${true}
									.state.showDownload=${true}></ui-gallery>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.galleryExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="media" ?hidden=${() => {
	return this.demoHidden('media', 'UIGalleryThumb gallery thumb child src alt label');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIGalleryThumb</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>ui-gallery-thumb · child of ui-gallery · src · alt · label · active</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-gallery .state.items=${this.state.galleryDemoItems} .state.layout=${'grid'} .state.columns=${5}></ui-gallery>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.galleryThumbExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="media" ?hidden=${() => {
	return this.demoHidden('media', 'UIAudioPlayer audio player artwork play pause seek music');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAudioPlayer</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>artwork cover/disc/banner/hidden · play/pause/seek · skip ±10s</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">cover</span>
								<ui-audio-player
									.state.src=${this.state.audioDemoSrc}
									.state.heading=${'440 Hz tone'}
									.state.artist=${'Local sample'}
									.state.artworkSrc=${this.state.audioDemoArt}
									.state.artwork=${'cover'}></ui-audio-player>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">disc</span>
								<ui-audio-player
									.state.src=${this.state.audioDemoSrc}
									.state.heading=${'440 Hz tone'}
									.state.artist=${'Local sample'}
									.state.artworkSrc=${this.state.audioDemoArt}
									.state.artwork=${'disc'}></ui-audio-player>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.audioPlayerExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="media" ?hidden=${() => {
	return this.demoHidden('media', 'UIWhiteboxModal whitebox lightbox image');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIWhiteboxModal</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>media lightbox · image / video · caption · maximize</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-button .state=${{
							label: 'Open lightbox',
							tone: 'primary',
							leadicon: 'image',
						}} @button:click=${this.openWhitebox}></ui-button>
						<ui-whitebox-modal #whitebox .state=${{
							src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="%230A1128"/><text x="320" y="190" font-family="monospace" font-size="40" fill="%2300F0FF" text-anchor="middle">⩝ VIAT</text></svg>',
							alt: 'VIAT placeholder',
							caption: 'A synthetic SVG frame — swap src for any image or video URL.',
						}}></ui-whitebox-modal>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.whiteboxModalExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="media" ?hidden=${() => {
	return this.demoHidden('media', 'UIHoverVideoPlayer UIYoutubeVideoPlayer video player hover play youtube lite facade iframe');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>Video players</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>hover-to-play (muted, resets on leave) · YouTube lite facade (iframe loads only on click)</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							wrap: true,
							align: 'start',
						}}>
							<ui-hover-video-player .state.src=${this.state.hoverVideoSrc} style="max-inline-size: 28rem; inline-size: 100%"></ui-hover-video-player>
							<ui-youtube-video-player .state.videoId=${this.state.youtubeVideoId} .state.videoTitle=${'Big Buck Bunny'} style="max-inline-size: 28rem; inline-size: 100%"></ui-youtube-video-player>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.videoPlayerExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="media" ?hidden=${() => {
	return this.demoHidden('media', 'UICarousel carousel feature loading slider track autoplay fade slide dots progress');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UICarousel</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>feature (fade + dots + click-advance) · loading (slide + progress bars + arrows) · autoplay pauses on hover</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							wrap: true,
							align: 'start',
						}}>
							<ui-carousel .state.items=${this.state.baseCarouselSlides} .state.arrows=${true} style="max-inline-size: 30rem; inline-size: 100%"></ui-carousel>
							<ui-feature-carousel .state.items=${this.state.featureCarouselSlides()} style="max-inline-size: 30rem; inline-size: 100%"></ui-feature-carousel>
							<ui-loading-carousel .state.items=${this.state.loadingCarouselSlides()} style="max-inline-size: 30rem; inline-size: 100%"></ui-loading-carousel>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.carouselExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="media" ?hidden=${() => {
	return this.demoHidden('media', 'UICarouselSlide carousel slide child eyebrow heading description image tone active');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UICarouselSlide</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>ui-carousel-slide · child of ui-carousel · id · eyebrow · heading · description · image · tone · active (parent-stamped)</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-carousel
							.state.items=${this.state.carouselSlideDemoItems}
							.state.arrows=${true}
							style="max-inline-size: 30rem; inline-size: 100%"></ui-carousel>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.carouselSlideExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="media" ?hidden=${() => {
	return this.demoHidden('media', 'UIFeatureCarousel feature carousel fade dots autoplay advanceOnClick preset');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIFeatureCarousel</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>preset of ui-carousel · fade · dots · autoplay 3000 · advanceOnClick</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-feature-carousel
							.state.items=${this.state.featureCarouselDemoItems}
							style="max-inline-size: 30rem; inline-size: 100%"></ui-feature-carousel>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.featureCarouselExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="media" ?hidden=${() => {
	return this.demoHidden('media', 'UILoadingCarousel loading carousel progress tips autoplay arrows loop preset');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UILoadingCarousel</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>preset of ui-carousel · slide · progress-bar indicators · autoplay 4500 · arrows · loop</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-loading-carousel
							.state.items=${this.state.loadingCarouselDemoItems}
							style="max-inline-size: 30rem; inline-size: 100%"></ui-loading-carousel>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.loadingCarouselExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="media" ?hidden=${() => {
	return this.demoHidden('media', 'UIYoutubeVideoPlayer youtube lite facade poster thumbnail playing iframe age graphic confirm');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIYoutubeVideoPlayer</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>lite facade · age confirm (blur) · graphic content confirm · local poster · no iframe until play · videoId · videoTitle</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Facade (no gate)</span>
								<ui-youtube-video-player
									.state.videoId=${this.state.youtubeVideoId}
									.state.videoTitle=${'Big Buck Bunny'}
									.state.thumbnail=${this.state.youtubePoster}
									.state.playing=${false}
									style="max-inline-size: 28rem; inline-size: 100%"></ui-youtube-video-player>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Age confirmation (blur + 18+)</span>
								<ui-youtube-video-player
									.state.videoId=${this.state.youtubeVideoId}
									.state.videoTitle=${'Age-gated sample'}
									.state.thumbnail=${this.state.youtubePoster}
									.state.ageConfirm=${true}
									.state.minAge=${18}
									style="max-inline-size: 28rem; inline-size: 100%"></ui-youtube-video-player>
							</div>
							<div class="demo-opt demo-opt-block">
								<span class="demo-opt-label">Graphic content confirmation</span>
								<ui-youtube-video-player
									.state.videoId=${this.state.youtubeVideoId}
									.state.videoTitle=${'Graphic-warning sample'}
									.state.thumbnail=${this.state.youtubePoster}
									.state.graphicConfirm=${true}
									style="max-inline-size: 28rem; inline-size: 100%"></ui-youtube-video-player>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.youtubeExample}></ui-code-block>
					</ui-surface>
				</section>
				</section>

				<section class="cat-section" data-cat-section="ai" #cat_ai ?hidden=${() => {
					return this.catSectionHidden('ai');
				}}>
					<header class="cat-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>AI</ui-text>
					</header>

<section class="demo" data-cat="ai" ?hidden=${() => {
	return this.demoHidden('ai', 'UIAiMessage ai chat message reasoning plan tool call sources approval inquire markdown code stream');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAiMessage · AI blocks</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>markdown + fenced code · streaming/settled · reasoning · plan · tool-call · sources · approval · inquire · reasoning + tool-call forced expanded</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-ai-message .state.author=${'user'} .state.content=${'Get me a swap quote for VIAT → UDSP'}></ui-ai-message>
							<ui-ai-message .state.author=${'assistant'} .state.content=${this.state.aiAssistantContent}></ui-ai-message>
							<ui-ai-reasoning .state.text=${this.state.aiReasoningText} .state.expanded=${true}></ui-ai-reasoning>
							<ui-ai-plan .state.items=${this.state.aiPlanSteps}></ui-ai-plan>
							<ui-ai-tool-call .state.name=${'getWalletAmount'} .state.args=${this.state.aiToolArgs} .state.result=${this.state.aiToolResult} .state.status=${'done'} .state.expanded=${true}></ui-ai-tool-call>
							<ui-ai-sources .state.items=${this.state.aiSources}></ui-ai-sources>
							<ui-ai-approval .state.name=${'sendFunds'} .state.summary=${'Send 100 VIAT to bob.viat'} .state.args=${this.state.aiToolArgs}></ui-ai-approval>
							<ui-ai-inquire .state.question=${'Which network should I use?'} .state.mode=${'choice'} .state.items=${this.state.aiInquireOptions}></ui-ai-inquire>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.aiMessageExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="ai" ?hidden=${() => {
	return this.demoHidden('ai', 'UIAi chrome shells suggestions typing feedback export identity error scroll model settings usage actions search');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>AI chrome shells</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>suggestions · typing (forced active) · feedback · export · identity · error · scroll-bottom · new-messages · model-select · settings (forced expanded) · usage · message-actions · search</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'lg',
						}}>
							<ui-ai-identity .state.author=${'assistant'}></ui-ai-identity>
							<ui-ai-identity .state.author=${'user'} .state.label=${'You'}></ui-ai-identity>
							<ui-ai-suggestions .state.items=${this.state.aiSuggestionItems}></ui-ai-suggestions>
							<ui-ai-typing .state.active=${true}></ui-ai-typing>
							<ui-stack .state=${{
								orientation: 'horizontal',
								gap: 'md',
								wrap: true,
								align: 'center',
							}}>
								<ui-ai-feedback .state.messageId=${'m1'}></ui-ai-feedback>
								<ui-ai-message-actions .state.messageId=${'m1'}></ui-ai-message-actions>
								<ui-ai-export .state.items=${this.state.aiExportItems} .state.mode=${'copy'} .state.label=${'Copy thread'}></ui-ai-export>
								<ui-ai-scroll-bottom .state.position=${'static'}></ui-ai-scroll-bottom>
								<ui-ai-new-messages .state.count=${3}></ui-ai-new-messages>
							</ui-stack>
							<ui-ai-usage .state.promptTokens=${420} .state.completionTokens=${880} .state.totalTokens=${1300} .state.cost=${0.0042}></ui-ai-usage>
							<ui-ai-model-select .state.value=${'local-model'} .state.items=${this.state.aiModelItems}></ui-ai-model-select>
							<ui-ai-search .state.query=${this.state.aiSearchQuery}></ui-ai-search>
							<ui-ai-settings .state.expanded=${true}></ui-ai-settings>
							<ui-ai-error .state.message=${'Rate limit exceeded — retry in 20s'} .state.kind=${'rate-limit'}></ui-ai-error>
							<ui-ai-error .state.message=${'Bridge unreachable'} .state.kind=${'offline'}></ui-ai-error>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.aiChromeExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="ai" ?hidden=${() => {
	return this.demoHidden('ai', 'UIAiChat chat shell manual fixture streaming suggestions usage');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAiChat</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>shell · manual true · empty endpoint (no /models, no stream) · fixture turns · forced waiting + newMessageCount + usage + model picker + error</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-ai-stage">
							<ui-ai-chat
								.state.manual=${true}
								.state.endpoint=${''}
								.state.heading=${'Fixture chat'}
								.state.status=${'online'}
								.state.items=${this.state.aiChatDemoItems}
								.state.suggestions=${this.state.aiChatDemoSuggestions}
								.state.modelItems=${this.state.aiChatDemoModels}
								.state.model=${'local-model'}
								.state.waiting=${true}
								.state.newMessageCount=${3}
								.state.error=${'Fixture error — no live stream'}
								.state.errorKind=${'offline'}
								.state.promptTokens=${420}
								.state.completionTokens=${880}
								.state.totalTokens=${1300}
								.state.usageCost=${0.0042}></ui-ai-chat>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.aiChatExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="ai" ?hidden=${() => {
	return this.demoHidden('ai', 'UIAiTyping typing thinking indicator waiting forced');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAiTyping</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>chat internal · shown while waiting for first token · forced active · label · author · hidden when active is false</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-ai-typing .state.active=${true} .state.label=${'Thinking…'} .state.author=${'AI'}></ui-ai-typing>
							<ui-ai-typing .state.active=${true} .state.label=${'Waiting on first token'} .state.author=${'Agent'}></ui-ai-typing>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.aiTypingExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="ai" ?hidden=${() => {
	return this.demoHidden('ai', 'UIAiNewMessages new messages pill count chip forced');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAiNewMessages</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>chat internal · sticky N-new chip · forced count 3 · label template {n} · hidden when count is 0</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-ai-new-messages .state.count=${3} .state.label=${'{n} new'} .state.active=${true}></ui-ai-new-messages>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.aiNewMessagesExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="ai" ?hidden=${() => {
	return this.demoHidden('ai', 'UIAiScrollBottom scroll latest jump sticky static forced');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAiScrollBottom</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>chat internal · jump to latest · position static (forced visible) · sticky needs a scrolled log · label · tone · size</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'lg',
							align: 'center',
						}}>
							<ui-ai-scroll-bottom .state.position=${'static'} .state.label=${'Jump to latest'} .state.tone=${'primary'} .state.size=${'sm'}></ui-ai-scroll-bottom>
							<ui-ai-scroll-bottom .state.position=${'static'} .state.label=${'Disabled'} .state.disabled=${true}></ui-ai-scroll-bottom>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.aiScrollBottomExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="ai" ?hidden=${() => {
	return this.demoHidden('ai', 'UIAiError error banner kind rate-limit quota offline retry dismiss');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAiError</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>chat internal · kind error | rate-limit | quota | offline · retryable · dismissible · empty message hides</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-ai-error .state.message=${'Stream failed'} .state.kind=${'error'}></ui-ai-error>
							<ui-ai-error .state.message=${'Rate limit — retry in 20s'} .state.kind=${'rate-limit'}></ui-ai-error>
							<ui-ai-error .state.message=${'Quota exceeded'} .state.kind=${'quota'}></ui-ai-error>
							<ui-ai-error .state.message=${'Bridge unreachable'} .state.kind=${'offline'} .state.retryable=${false}></ui-ai-error>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.aiErrorExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="ai" ?hidden=${() => {
	return this.demoHidden('ai', 'UIAiExport export copy download markdown json transcript');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAiExport</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>chat chrome · client-only copy | download · format markdown | json · empty items disables</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'md',
							wrap: true,
						}}>
							<ui-ai-export .state.items=${this.state.aiExportCopyItems} .state.mode=${'copy'} .state.format=${'markdown'} .state.label=${'Copy markdown'}></ui-ai-export>
							<ui-ai-export .state.items=${this.state.aiExportJsonItems} .state.mode=${'copy'} .state.format=${'json'} .state.label=${'Copy JSON'}></ui-ai-export>
							<ui-ai-export .state.items=${this.state.aiExportDownloadItems} .state.mode=${'download'} .state.format=${'markdown'} .state.filename=${'fixture-chat'} .state.label=${'Download'}></ui-ai-export>
							<ui-ai-export .state.items=${[]} .state.label=${'Empty · disabled'}></ui-ai-export>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.aiExportExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="ai" ?hidden=${() => {
	return this.demoHidden('ai', 'UIAiSuggestions suggestions chips empty starter heading disabled');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAiSuggestions</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>empty-state chips · heading · icon · label/value · disabled</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'lg',
						}}>
							<ui-ai-suggestions .state.heading=${'Try asking'} .state.items=${this.state.aiSuggestionDemoItems}></ui-ai-suggestions>
							<ui-ai-suggestions .state.heading=${'Disabled'} .state.items=${this.state.aiSuggestionDemoItems} .state.disabled=${true}></ui-ai-suggestions>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.aiSuggestionsExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="ai" ?hidden=${() => {
	return this.demoHidden('ai', 'UIAiModelSelect model picker select items disabled');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAiModelSelect</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>header picker · parent supplies items (no /models fetch) · value · label · disabled option · disabled control</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							wrap: true,
							align: 'end',
						}}>
							<ui-ai-model-select .state.label=${'Model'} .state.value=${'local-model'} .state.items=${this.state.aiModelDemoItems}></ui-ai-model-select>
							<ui-ai-model-select .state.label=${'Disabled'} .state.value=${'local-model'} .state.items=${this.state.aiModelDemoItems} .state.disabled=${true}></ui-ai-model-select>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.aiModelSelectExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="ai" ?hidden=${() => {
	return this.demoHidden('ai', 'UIAiUsage usage tokens cost meter prompt completion');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAiUsage</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>chat chrome · prompt / completion / total · optional cost · 0 hides a field</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-ai-usage .state.promptTokens=${420} .state.completionTokens=${880} .state.totalTokens=${1300} .state.cost=${0.0042} .state.currency=${'USD'}></ui-ai-usage>
							<ui-ai-usage .state.label=${'Turn'} .state.promptTokens=${12} .state.completionTokens=${0}></ui-ai-usage>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.aiUsageExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="ai" ?hidden=${() => {
	return this.demoHidden('ai', 'UIAiMessageActions message actions copy regenerate edit delete toolbar');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAiMessageActions</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>per-message toolbar · default copy/regenerate/edit/delete · custom actions · disabled · emits action + messageId</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-ai-message-actions .state.messageId=${'m1'}></ui-ai-message-actions>
							<ui-ai-message-actions .state.messageId=${'m2'} .state.actions=${this.state.aiActionsDemoItems}></ui-ai-message-actions>
							<ui-ai-message-actions .state.messageId=${'m3'} .state.disabled=${true}></ui-ai-message-actions>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.aiMessageActionsExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="ai" ?hidden=${() => {
	return this.demoHidden('ai', 'UIAiApproval approval gate tool approve reject decided');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAiApproval</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>HITL gate · name · summary · args (json-inspector) · pending vs decided approved</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							wrap: true,
							align: 'start',
						}}>
							<ui-ai-approval
								.state.name=${'sendFunds'}
								.state.callId=${'c1'}
								.state.summary=${'Send 100 VIAT to bob.viat'}
								.state.args=${this.state.aiApprovalPendingArgs}></ui-ai-approval>
							<ui-ai-approval
								.state.name=${'sendFunds'}
								.state.callId=${'c2'}
								.state.summary=${'Already decided'}
								.state.decided=${'approved'}></ui-ai-approval>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.aiApprovalExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="ai" ?hidden=${() => {
	return this.demoHidden('ai', 'UIAiFeedback feedback thumbs up down rate lock');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAiFeedback</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>thumbs up | down · first pick locks · forced value up · disabled</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							align: 'center',
						}}>
							<ui-ai-feedback .state.messageId=${'m-open'}></ui-ai-feedback>
							<ui-ai-feedback .state.messageId=${'m-up'} .state.value=${'up'}></ui-ai-feedback>
							<ui-ai-feedback .state.messageId=${'m-off'} .state.disabled=${true}></ui-ai-feedback>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.aiFeedbackExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="ai" ?hidden=${() => {
	return this.demoHidden('ai', 'UIAiIdentity identity avatar author user assistant system label size');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAiIdentity</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>author chip · user / assistant / system · custom label · size sm | md</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							wrap: true,
							align: 'center',
						}}>
							<ui-ai-identity .state.author=${'assistant'}></ui-ai-identity>
							<ui-ai-identity .state.author=${'user'}></ui-ai-identity>
							<ui-ai-identity .state.author=${'system'}></ui-ai-identity>
							<ui-ai-identity .state.author=${'user'} .state.label=${'Ada'} .state.size=${'md'}></ui-ai-identity>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.aiIdentityExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="ai" ?hidden=${() => {
	return this.demoHidden('ai', 'UIAiInquire inquire choice text question answered');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAiInquire</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>agent asks the user · mode choice | text · items · answered lock</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'lg',
						}}>
							<ui-ai-inquire
								.state.question=${'Which network should I use?'}
								.state.mode=${'choice'}
								.state.items=${this.state.aiInquireChoiceItems}></ui-ai-inquire>
							<ui-ai-inquire
								.state.question=${'What should we call this wallet?'}
								.state.mode=${'text'}
								.state.placeholder=${'Type a name…'}></ui-ai-inquire>
							<ui-ai-inquire
								.state.question=${'Already answered'}
								.state.mode=${'choice'}
								.state.answered=${'Mainnet'}></ui-ai-inquire>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.aiInquireExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="ai" ?hidden=${() => {
	return this.demoHidden('ai', 'UIAiPlan plan steps done active pending error');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAiPlan</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>ordered steps · status done | active | pending | error · detail · label</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-ai-plan .state.label=${'Plan'} .state.items=${this.state.aiPlanDemoItems}></ui-ai-plan>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.aiPlanExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="ai" ?hidden=${() => {
	return this.demoHidden('ai', 'UIAiReasoning reasoning thinking disclosure expanded streaming');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAiReasoning</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>also composed by ui-ai-message · expanded · collapsed · streaming (forced Thinking…) · label</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-ai-reasoning .state.text=${this.state.aiReasoningText} .state.expanded=${true}></ui-ai-reasoning>
							<ui-ai-reasoning .state.text=${this.state.aiReasoningText} .state.expanded=${false}></ui-ai-reasoning>
							<ui-ai-reasoning .state.text=${this.state.aiReasoningText} .state.streaming=${true} .state.expanded=${true}></ui-ai-reasoning>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.aiReasoningExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="ai" ?hidden=${() => {
	return this.demoHidden('ai', 'UIAiSearch search conversation query filter');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAiSearch</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>in-thread filter field · query · placeholder · clear · disabled · parent owns filtering</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-ai-search .state.query=${'UDSP'} .state.placeholder=${'Search conversation…'}></ui-ai-search>
							<ui-ai-search .state.query=${''} .state.disabled=${true} .state.placeholder=${'Disabled'}></ui-ai-search>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.aiSearchExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="ai" ?hidden=${() => {
	return this.demoHidden('ai', 'UIAiSettings settings temperature tokens system prompt expanded');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAiSettings</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>generation knobs · forced expanded · temperature · maxTokens · systemPrompt · disabled</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							wrap: true,
							align: 'start',
						}}>
							<ui-ai-settings
								.state.expanded=${true}
								.state.temperature=${0.7}
								.state.maxTokens=${2048}
								.state.systemPrompt=${'Be concise.'}></ui-ai-settings>
							<ui-ai-settings
								.state.expanded=${true}
								.state.heading=${'Locked'}
								.state.disabled=${true}
								.state.temperature=${0.2}
								.state.maxTokens=${512}></ui-ai-settings>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.aiSettingsExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="ai" ?hidden=${() => {
	return this.demoHidden('ai', 'UIAiSources sources citations url snippet');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAiSources</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>citation list · title · url · snippet · host badge</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-ai-sources .state.label=${'Sources'} .state.items=${this.state.aiSourcesDemoItems}></ui-ai-sources>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.aiSourcesExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="ai" ?hidden=${() => {
	return this.demoHidden('ai', 'UIAiToolCall tool call running done error args result');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAiToolCall</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>status running | done | error · args/result via json-inspector · forced expanded · fixture data, no live tool</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-ai-tool-call
								.state.name=${'getWalletAmount'}
								.state.callId=${'t1'}
								.state.status=${'running'}
								.state.args=${this.state.aiToolRunningArgs}
								.state.expanded=${true}></ui-ai-tool-call>
							<ui-ai-tool-call
								.state.name=${'getWalletAmount'}
								.state.callId=${'t2'}
								.state.status=${'done'}
								.state.args=${this.state.aiToolDoneArgs}
								.state.result=${this.state.aiToolDoneResult}
								.state.expanded=${true}></ui-ai-tool-call>
							<ui-ai-tool-call
								.state.name=${'getTx'}
								.state.callId=${'t3'}
								.state.status=${'error'}
								.state.args=${this.state.aiToolErrorArgs}
								.state.result=${this.state.aiToolErrorResult}
								.state.expanded=${true}></ui-ai-tool-call>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.aiToolCallExample}></ui-code-block>
					</ui-surface>
				</section>
				</section>

				<section class="cat-section" data-cat-section="overlays" #cat_overlays ?hidden=${() => {
					return this.catSectionHidden('overlays');
				}}>
					<header class="cat-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>Overlays</ui-text>
					</header>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'UIMenu menu dropdown context popover');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIMenu</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>native top-layer popover · flip/shift placement · keyboard roving · kbd hints · danger</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'lg',
							align: 'center',
							wrap: true,
						}}>
							<ui-menu .state.label=${'Actions ▾'} .state.items=${this.menuItems} @menu:select=${this.handleMenuSelect}></ui-menu>
							<ui-menu .state.label=${'Align end ▾'} .state.align=${'end'} .state.items=${this.menuItems} @menu:select=${this.handleMenuSelect}></ui-menu>
							<div style="transform: translateZ(0); overflow: hidden; padding: 0.75rem; border: 1px dashed var(--surface-border, rgba(255, 255, 255, 0.2)); border-radius: 0.5rem;">
								<ui-menu .state.label=${'Inside transform ▾'} .state.items=${this.menuItems} @menu:select=${this.handleMenuSelect}></ui-menu>
							</div>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>last menu sits in a clipped+transformed box — it still escapes (top layer)</ui-text>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.menuExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'UIMenuItem menu item child label value kbd disabled separator href checked danger');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIMenuItem</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>child of ui-menu · label · value · kbd · href · checked · separator · disabled · danger</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'lg',
							align: 'center',
							wrap: true,
						}}>
							<ui-menu
								.state.label=${'Item matrix ▾'}
								.state.items=${this.state.menuItemDemoItems}
								@menu:select=${this.handleMenuSelect}></ui-menu>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>open the menu — rows are ui-menu-item</ui-text>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.menuItemExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'UIContextMenu context-menu right-click');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIContextMenu</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>right-click / long-press · opens at cursor · persistent (click-out / Esc) by default · opt into closeOnLeave to dismiss on pointer-leave</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'lg',
							align: 'center',
							wrap: true,
						}}>
							<ui-context-menu .state.items=${this.menuItems} @menu:select=${this.handleMenuSelect}>
								<div style="display: grid; place-items: center; inline-size: 16rem; block-size: 7rem; border: 1px dashed var(--surface-border, rgba(255, 255, 255, 0.25)); border-radius: 0.5rem; color: var(--text-muted, rgba(255, 255, 255, 0.6));">Right-click — persistent (click out / Esc)</div>
							</ui-context-menu>
							<ui-context-menu .state.items=${this.menuItems} .state.closeOnLeave=${true} @menu:select=${this.handleMenuSelect}>
								<div style="display: grid; place-items: center; inline-size: 16rem; block-size: 7rem; border: 1px dashed var(--surface-border, rgba(255, 255, 255, 0.25)); border-radius: 0.5rem; color: var(--text-muted, rgba(255, 255, 255, 0.6));">Right-click — closes on leave</div>
							</ui-context-menu>
							<div style="transform: translateZ(0); overflow: hidden; padding: 0.75rem; border: 1px dashed var(--surface-border, rgba(255, 255, 255, 0.2)); border-radius: 0.5rem;">
								<ui-context-menu .state.items=${this.menuItems} .state.closeOnLeave=${true} @menu:select=${this.handleMenuSelect}>
									<div style="display: grid; place-items: center; inline-size: 11rem; block-size: 5rem; color: var(--text-muted, rgba(255, 255, 255, 0.6));">Right-click (clipped box · closes on leave)</div>
								</ui-context-menu>
							</div>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.contextMenuExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'UIMenubar menubar app menu File Edit View');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIMenubar</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>horizontal app menu · one shared panel · arrow-key roving · hover-switch when open</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-menubar .state.menus=${this.menubarMenus} @menu:select=${this.handleMenuSelect}></ui-menubar>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.menubarExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'UINavSection nav section mega menu dropdown chevron top bar');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UINavSection</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>x.ai-style strip · text / icon triggers · animated chevron · shared shell slides between panes · slots for tabs & video</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-nav-section .state.items=${this.navSectionItems}>
							<div slot="media" style="display:flex;flex-direction:column;gap:0.75rem;min-inline-size:18rem;padding:0.25rem;">
								<ui-tabs .state.items=${this.navMediaTabs} .state.activeIndex=${'clip'} .state.transition=${'slide'}>
									<div slot="clip" style="display:grid;gap:0.5rem;">
										<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Hover the clip to play</ui-text>
										<ui-hover-video-player .state.src=${'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'} .state.poster=${''} .state.hoverScale=${1.05}></ui-hover-video-player>
									</div>
									<div slot="about" style="padding:0.5rem 0.25rem;">
										<ui-text .state.variant=${'body'} .state.tone=${'muted'}>Rich dropdown views: tabs, video, or any slotted content.</ui-text>
									</div>
								</ui-tabs>
							</div>
						</ui-nav-section>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.navSectionExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'UIModal modal dialog');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIModal</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>native dialog · backdrop dismiss</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-button .state=${{
							label: 'Open modal',
							tone: 'primary',
						}} @button:click=${this.openModal}></ui-button>
						<ui-modal #modal>
							<ui-surface .state=${{
								tone: 'popup',
								padding: 'lg',
								radius: 'lg',
							}}>
								<ui-stack .state=${{
									orientation: 'vertical',
									gap: 'md',
								}}>
									<ui-text .state.variant=${'h3'} .state.tone=${'accent'}>Confirm transfer</ui-text>
									<ui-text .state.variant=${'body'} .state.tone=${'muted'}>This sends 12.4 VIAT to the selected address. This action cannot be undone.</ui-text>
									<ui-stack .state=${{
										orientation: 'horizontal',
										gap: 'sm',
										justify: 'end',
									}}>
										<ui-button .state=${{
											label: 'Cancel',
											variant: 'ghost',
										}} @button:click=${this.closeModal}></ui-button>
										<ui-button .state=${{
											label: 'Confirm',
											tone: 'primary',
										}} @button:click=${this.closeModal}></ui-button>
									</ui-stack>
								</ui-stack>
							</ui-surface>
						</ui-modal>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.modalExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'UICommand command palette cmdk overlay search');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UICommand</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>⌘K / Ctrl+K command palette · closed at rest · trigger or hotkey · Escape · groups · kbd · disabled</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'sm',
							wrap: true,
							align: 'center',
						}}>
							<ui-button .state=${{
								label: 'Open command palette',
								tone: 'primary',
							}} @button:click=${this.openCommandDemo}></ui-button>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>last pick: ${this.commandReadoutText}</ui-text>
						</ui-stack>
						<ui-command
							#command_palette
							.state.items=${this.state.commandItems}
							@command:select=${this.handleCommandSelect}></ui-command>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.commandExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'UICommandItem command item child label value kbd group icon disabled separator');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UICommandItem</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>child of ui-command · label · value · kbd · group · icon · disabled · separator · active · forced open so rows stay visible</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-command
							.state.open=${true}
							.state.items=${this.state.commandItemDemoItems}
							.state.hotkey=${''}
							@command:select=${this.handleCommandSelect}></ui-command>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>last pick: ${this.commandReadoutText}</ui-text>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.commandItemExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'UIFloatingPanel floating panel morph expand outward cult-ui surface');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIFloatingPanel</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>cult-ui morph · grows out of its trigger · spring open + staggered content · esc / click-away to close</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-floating-panel .state.label=${'Filters ▾'} .state.heading=${'Filter results'} .state.footer=${true}>
							<ui-stack .state=${{
								orientation: 'vertical',
								gap: 'sm',
							}}>
								<ui-text .state.variant=${'body'} .state.tone=${'muted'}>Refine the result set — the panel grows out of its trigger, and the header, body, and footer rise in on a stagger.</ui-text>
								<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>· Only my accounts</ui-text>
								<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>· Hide zero-value rows</ui-text>
								<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>· Include pending transfers</ui-text>
							</ui-stack>
							<div slot="footer">
								<ui-button .state=${{
									label: 'Apply',
									tone: 'primary',
								}}></ui-button>
							</div>
						</ui-floating-panel>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.floatingPanelExample}></ui-code-block>
					</ui-surface>
				</section>


<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'UIHoverCard hover card preview focus');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIHoverCard</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>hover/focus preview · openDelay · closeDelay · side</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt">
								<span class="demo-opt-label">Side bottom</span>
								<ui-hover-card .state.side=${'bottom'}>
									<ui-button slot="trigger" .state.label=${'Hover me'} .state.variant=${'outline'}></ui-button>
									<p><strong>Viat node</strong></p>
									<p style="color:var(--text-muted);margin:0.35rem 0 0">Latency 12ms · 3 peers</p>
								</ui-hover-card>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Side end</span>
								<ui-hover-card .state.side=${'end'} .state.openDelay=${100}>
									<ui-button slot="trigger" .state.label=${'Side end'} .state.variant=${'ghost'}></ui-button>
									<p>Appears to the end edge.</p>
								</ui-hover-card>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.hoverCardExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'UIPopover popover morph side align arrow hover form');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIPopover</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}> options · side · align · offset · arrow · heading+description · openOnHover · morph · no scrim</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts">
							<div class="demo-opt">
								<span class="demo-opt-label">Basic · heading + description</span>
								<ui-popover .state.label=${'Account ▾'} .state.heading=${'Signed in as'} .state.description=${'Primary wallet session'} .state.showArrow=${true} .state.align=${'center'}>
									<ui-stack .state=${{
										orientation: 'vertical',
										gap: 'sm',
									}}>
										<ui-text .state.variant=${'body'}>0xA1B2…9F3A</ui-text>
										<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Switch wallet · Settings · Sign out</ui-text>
									</ui-stack>
								</ui-popover>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Align start</span>
								<ui-popover .state.label=${'Start'} .state.heading=${'Align start'} .state.side=${'bottom'} .state.align=${'start'} .state.showArrow=${true}>
									<ui-text .state.variant=${'caption'}>Panel flushes to the start edge of the trigger.</ui-text>
								</ui-popover>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Align center</span>
								<ui-popover .state.label=${'Center'} .state.heading=${'Align center'} .state.side=${'bottom'} .state.align=${'center'} .state.showArrow=${true}>
									<ui-text .state.variant=${'caption'}>Centered under the trigger (default).</ui-text>
								</ui-popover>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Align end</span>
								<ui-popover .state.label=${'End'} .state.heading=${'Align end'} .state.side=${'bottom'} .state.align=${'end'} .state.showArrow=${true}>
									<ui-text .state.variant=${'caption'}>Panel flushes to the end edge.</ui-text>
								</ui-popover>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Side top</span>
								<ui-popover .state.label=${'Top'} .state.heading=${'Side top'} .state.side=${'top'} .state.align=${'center'} .state.showArrow=${true}>
									<ui-text .state.variant=${'caption'}>Opens above the trigger (flips if clipped).</ui-text>
								</ui-popover>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">Side end (right)</span>
								<ui-popover .state.label=${'Right'} .state.heading=${'Side right'} .state.side=${'right'} .state.align=${'start'} .state.showArrow=${true}>
									<ui-text .state.variant=${'caption'}>Anchored to the right edge.</ui-text>
								</ui-popover>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">openOnHover</span>
								<ui-popover .state.label=${'Hover me'} .state.heading=${'Hover open'} .state.description=${'openDelay 150 · closeDelay 100'} .state.openOnHover=${true} .state.openDelay=${150} .state.closeDelay=${100} .state.showArrow=${true}>
									<ui-text .state.variant=${'caption'}>Opens on pointer enter — no click required.</ui-text>
								</ui-popover>
							</div>
							<div class="demo-opt">
								<span class="demo-opt-label">With form fields</span>
								<ui-popover .state.label=${'Dimensions'} .state.heading=${'Dimensions'} .state.description=${'Set the dimensions for the layer.'} .state.side=${'bottom'} .state.align=${'center'} .state.showArrow=${true} .state.offset=${10}>
									<ui-stack .state=${{
										orientation: 'vertical',
										gap: 'sm',
									}}>
										<ui-field .state.label=${'Width'}>
											<ui-input .state.value=${'100%'} .state.size=${'sm'}></ui-input>
										</ui-field>
										<ui-field .state.label=${'Max width'}>
											<ui-input .state.value=${'300px'} .state.size=${'sm'}></ui-input>
										</ui-field>
									</ui-stack>
								</ui-popover>
							</div>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.popoverExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'UIAlertDialog alert dialog confirm modal action cancel');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAlertDialog</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>confirm pattern on ui-modal · action / cancel · tone · closeOnBackdrop · not a second dialog engine</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'sm',
							wrap: true,
						}}>
							<ui-button .state.label=${'Delete wallet…'} .state.tone=${'danger'} @button:click=${this.openAlertDialog}></ui-button>
							<ui-button .state.label=${'Backdrop dismiss…'} .state.tone=${'neutral'} @button:click=${this.openAlertDialogBackdrop}></ui-button>
						</ui-stack>
						<ui-alert-dialog
							#alert_delete
							.state.heading=${'Delete wallet?'}
							.state.description=${'This cannot be undone. The key is wiped from this device.'}
							.state.actionLabel=${'Delete'}
							.state.cancelLabel=${'Keep'}
							.state.tone=${'danger'}
							.state.closeOnBackdrop=${false}
							@alert-dialog:action=${this.handleAlertDialogAction}></ui-alert-dialog>
						<ui-alert-dialog
							#alert_backdrop
							.state.heading=${'Discard draft?'}
							.state.description=${'Click the backdrop or cancel to leave. Action confirms discard.'}
							.state.actionLabel=${'Discard'}
							.state.cancelLabel=${'Keep editing'}
							.state.tone=${'warning'}
							.state.closeOnBackdrop=${true}
							@alert-dialog:action=${this.handleAlertDialogBackdropAction}></ui-alert-dialog>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'UIExpandableCard expandable card morph in place validator');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIExpandableCard</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>expands in place · morphs out of its own card · click to expand, esc / click-away to close</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-expandable-card .state.heading=${'Validator node #7'} .state.summary=${'3 peers · 12ms latency · synced'}>
							<ui-stack .state=${{
								orientation: 'vertical',
								gap: 'md',
							}}>
								<ui-text .state.variant=${'body'} .state.tone=${'muted'}>Full node detail morphs out of the card. Uptime 99.98%, last block 4,821,330, region eu-west.</ui-text>
								<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Peers: 3 · Inbound 1.2MB/s · Outbound 0.8MB/s</ui-text>
							</ui-stack>
						</ui-expandable-card>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.expandableCardExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'UIMorphDrawer drawer morph edge node details');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIMorphDrawer</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>right-edge drawer · flies out of its trigger + grows · esc / click-away to close</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-morph-drawer .state.label=${'Details ▸'} .state.heading=${'Node details'}>
							<ui-stack .state=${{
								orientation: 'vertical',
								gap: 'md',
							}}>
								<ui-text .state.variant=${'body'} .state.tone=${'muted'}>A full-height drawer that morphs out of the trigger button rather than a plain slide.</ui-text>
								<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Address · Public key · Trapdoor hash · Saved at</ui-text>
							</ui-stack>
						</ui-morph-drawer>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.morphDrawerExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'UIModal controls maximize minimize');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIModal · built-in controls</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>opt-in close / maximize / minimize buttons · controlsSide · afterAction</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'sm',
							wrap: true,
						}}>
							<ui-button .state=${{
								label: 'Windows-style (right)',
								tone: 'primary',
							}} @button:click=${this.openControlsModal}></ui-button>
							<ui-button .state=${{
								label: 'macOS-style (left)',
								tone: 'primary',
								variant: 'outline',
							}} @button:click=${this.openMacModal}></ui-button>
							<ui-button .state=${{
								label: 'With afterAction callback',
								variant: 'ghost',
							}} @button:click=${this.openMaximizedStartModal}></ui-button>
						</ui-stack>
						<ui-modal #controls_modal .state=${{
							showClose: true,
							showMaximize: true,
						}}>
							<ui-surface .state=${{
								tone: 'popup',
								padding: 'lg',
								radius: 'lg',
							}}>
								<ui-stack .state=${{
									orientation: 'vertical',
									gap: 'md',
								}}>
									<ui-text .state.variant=${'h3'} .state.tone=${'accent'}>Built-in controls · right</ui-text>
									<ui-text .state.variant=${'body'} .state.tone=${'muted'}>Minimize collapses the body to a 240×46 strip; maximize fills the viewport; close dismisses. State resets to default on close.</ui-text>
								</ui-stack>
							</ui-surface>
						</ui-modal>
						<ui-modal #mac_modal .state=${{
							showClose: true,
							showMaximize: true,
							controlsSide: 'left',
						}}>
							<ui-surface .state=${{
								tone: 'popup',
								padding: 'lg',
								radius: 'lg',
							}}>
								<ui-stack .state=${{
									orientation: 'vertical',
									gap: 'md',
								}}>
									<ui-text .state.variant=${'h3'} .state.tone=${'accent'}>macOS-style</ui-text>
									<ui-text .state.variant=${'body'} .state.tone=${'muted'}>Same buttons, anchored left with close-first ordering done via CSS order (DOM stays unchanged).</ui-text>
								</ui-stack>
							</ui-surface>
						</ui-modal>
						<ui-modal #after_action_modal .state=${{
							showClose: true,
							showMaximize: true,
						}}>
							<ui-surface .state=${{
								tone: 'popup',
								padding: 'lg',
								radius: 'lg',
							}}>
								<ui-stack .state=${{
									orientation: 'vertical',
									gap: 'md',
								}}>
									<ui-text .state.variant=${'h3'} .state.tone=${'accent'}>afterAction</ui-text>
									<ui-text .state.variant=${'body'} .state.tone=${'muted'}>When you close this modal the registered callback fires with the close returnValue. Watch the confirm-behavior section below.</ui-text>
								</ui-stack>
							</ui-surface>
						</ui-modal>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.modalControlsExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'confirm dialog promise');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>this.confirm()</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>imperative this.confirm(message) · ui-modal backed · returns Promise&lt;boolean&gt;</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'sm',
							wrap: true,
							align: 'center',
						}}>
							<ui-button .state=${{
								label: 'Delete wallet',
								tone: 'danger',
							}} @click=${this.doDestructiveAction}></ui-button>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>last result: ${this.state.confirmResult}</ui-text>
						</ui-stack>
					
						<ui-code-block .state.language=${'js'} .state.code=${this.state.confirmExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'UINotification notification toast');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UINotification</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>toasts · hide≠remove · center pane · position</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'sm',
							wrap: true,
							align: 'center',
						}}>
							<ui-button .state=${{
								label: 'Push notification',
								tone: 'primary',
							}} @button:click=${this.notifyDefault}></ui-button>
							<ui-button .state=${{
								label: 'Push error',
								tone: 'danger',
							}} @button:click=${this.notifyError}></ui-button>
							<ui-button .state=${{
								label: 'Auto-remove',
								tone: 'neutral',
							}} @button:click=${this.notifyAutoRemove}></ui-button>
							<ui-button .state=${{
								label: 'Open center',
								tone: 'neutral',
							}} @button:click=${this.notifyOpenCenter}></ui-button>
						</ui-stack>
						<ui-notification #notify .state.position=${'top-end'} .state.clickAction=${'hide'}></ui-notification>
					
						<ui-code-block .state.language=${'js'} .state.code=${this.state.notificationExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'UIToast toast  bottom overlay success error action promise');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIToast</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}> toast · all 6 positions · types · action · promise · loading · sticky · limit flood · ephemeral (not notification center)</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'sm',
							wrap: true,
							align: 'center',
						}}>
							<ui-button .state=${{
								label: 'Default',
								tone: 'primary',
							}} @button:click=${this.toastDefault}></ui-button>
							<ui-button .state=${{
								label: 'Success',
								tone: 'success',
							}} @button:click=${this.toastSuccess}></ui-button>
							<ui-button .state=${{
								label: 'Error',
								tone: 'danger',
							}} @button:click=${this.toastError}></ui-button>
							<ui-button .state=${{
								label: 'Warning',
								tone: 'warning',
							}} @button:click=${this.toastWarning}></ui-button>
							<ui-button .state=${{
								label: 'Loading',
								tone: 'neutral',
							}} @button:click=${this.toastLoading}></ui-button>
							<ui-button .state=${{
								label: 'Sticky',
								tone: 'neutral',
							}} @button:click=${this.toastSticky}></ui-button>
							<ui-button .state=${{
								label: 'With action',
								tone: 'neutral',
							}} @button:click=${this.toastAction}></ui-button>
							<ui-button .state=${{
								label: 'Promise',
								tone: 'neutral',
							}} @button:click=${this.toastPromiseDemo}></ui-button>
							<ui-button .state=${{
								label: 'Stack 3',
								tone: 'neutral',
							}} @button:click=${this.toastStackDemo}></ui-button>
							<ui-button .state=${{
								label: 'Flood limit 3',
								tone: 'neutral',
							}} @button:click=${this.toastLimitFlood}></ui-button>
							<ui-button .state=${{
								label: 'Bottom start',
								tone: 'neutral',
							}} @button:click=${this.toastPosStart}></ui-button>
							<ui-button .state=${{
								label: 'Bottom center',
								tone: 'neutral',
							}} @button:click=${this.toastPosCenter}></ui-button>
							<ui-button .state=${{
								label: 'Bottom end',
								tone: 'neutral',
							}} @button:click=${this.toastPosEnd}></ui-button>
							<ui-button .state=${{
								label: 'Top start',
								tone: 'neutral',
							}} @button:click=${this.toastPosTopStart}></ui-button>
							<ui-button .state=${{
								label: 'Top center',
								tone: 'neutral',
							}} @button:click=${this.toastPosTopCenter}></ui-button>
							<ui-button .state=${{
								label: 'Top end',
								tone: 'neutral',
							}} @button:click=${this.toastPosTopEnd}></ui-button>
						</ui-stack>
						<ui-toast #toaster .state.position=${'bottom-center'}></ui-toast>
						<ui-toast #toaster_limit .state.position=${'top-end'} .state.limit=${3}></ui-toast>
						<ui-code-block .state.language=${'js'} .state.code=${this.state.toastExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'UIToastItem toast item child title description itemType actionLabel timeout');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIToastItem</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>inline toast row (no portal) · itemType default|success|info|warning|error|loading · title · description · actionLabel · timeout 0 · restore after dismiss</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts" style="margin-block-end: 0.75rem">
							<ui-button .state.label=${'Restore toast items'} .state.variant=${'outline'} .state.size=${'sm'} @button:click=${this.restoreToastItemDemos}></ui-button>
						</div>
						<div class="demo-toast-stack" @toast-item:dismiss=${this.handleToastItemDemoDismiss}>
							${this.list('toastItemDemos', UIToastItem, this.toastItemDemoKey)}
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.toastItemExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'NotificationItem notification item toast child heading message itemType timeout muted seen');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>NotificationItem</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>inline toast row (no portal) · itemType default | error | copy · heading · message · timeout 0 · seen · restore after dismiss</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-opts" style="margin-block-end: 0.75rem">
							<ui-button .state.label=${'Restore notification items'} .state.variant=${'outline'} .state.size=${'sm'} @button:click=${this.restoreNotificationItemDemos}></ui-button>
						</div>
						<div class="demo-toast-stack" @notification:hide=${this.handleNotificationItemDemoDismiss} @notification:remove=${this.handleNotificationItemDemoDismiss} @notification:activate=${this.handleNotificationItemDemoDismiss}>
							${this.list('notificationItemDemos', NotificationItem, this.notificationItemDemoKey)}
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.notificationItemExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'NotificationCenterItem notification center item child heading message seen muted itemType');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>NotificationCenterItem</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>inline center list (no overlay) · type start accent like toast · unseen · seen · muted · itemType default | error | copy</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-nc-list">
							<ui-notification-center-item .state=${{
								itemType: 'default',
								heading: 'Unseen',
								message: 'New settlement',
								seen: false,
							}}></ui-notification-center-item>
							<ui-notification-center-item .state=${{
								itemType: 'error',
								heading: 'Error',
								message: 'Type accent on the card edge — same as toast',
								seen: false,
							}}></ui-notification-center-item>
							<ui-notification-center-item .state=${{
								itemType: 'error',
								heading: 'Seen error',
								message: 'Read state only dims title weight, keeps type accent',
								seen: true,
							}}></ui-notification-center-item>
							<ui-notification-center-item .state=${{
								itemType: 'copy',
								heading: 'Muted',
								message: 'Hidden from toast stack, still in center',
								muted: true,
								seen: true,
							}}></ui-notification-center-item>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.notificationCenterItemExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'UIControlCenter control center tahoe');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIControlCenter</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Tahoe-style quick toggles · Wi-Fi · Bluetooth</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-button .state=${{
							label: 'Open Control Center',
							tone: 'primary',
						}} @button:click=${this.openControlCenter}></ui-button>
						<ui-control-center
							#control_center
							.state.tiles=${this.state.controlCenterTiles}
							.state.items=${this.state.controlCenterRows}></ui-control-center>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.controlCenterExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'ControlCenterTile control center tile child label icon checked disabled tone');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>ControlCenterTile</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>inline tile grid (no overlay) · checked · unchecked · disabled · stable state bags (no timer reset) · itemId · label · icon · tone</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-cc-tiles">
							<ui-control-center-tile .state=${this.state.ccTileWifi}></ui-control-center-tile>
							<ui-control-center-tile .state=${this.state.ccTileBt}></ui-control-center-tile>
							<ui-control-center-tile .state=${this.state.ccTileCast}></ui-control-center-tile>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.controlCenterTileExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'ControlCenterRow control center row child label icon description checked disabled');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>ControlCenterRow</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>inline row list (no overlay) · description · checked · disabled · itemId · label · icon</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="demo-cc-rows">
							<ui-control-center-row .state=${{
								itemId: 'focus',
								label: 'Focus',
								icon: 'radio',
								description: 'Silence alerts',
								checked: false,
							}}></ui-control-center-row>
							<ui-control-center-row .state=${{
								itemId: 'lock',
								label: 'Lockdown',
								icon: 'lock',
								description: 'Disabled row',
								disabled: true,
							}}></ui-control-center-row>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.controlCenterRowExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'UILoadingScreen loading overlay');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UILoadingScreen</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>blocking overlay · auto-closes after 2s</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-button .state=${{
							label: 'Show loading screen',
							tone: 'primary',
						}} @button:click=${this.showLoadingScreen}></ui-button>
						<ui-loading-screen #loading></ui-loading-screen>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.loadingScreenExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'BootScreen boot splash');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>BootScreen</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>full-screen splash · auto-dismisses after 2s</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-button .state=${{
							label: 'Show boot screen',
							tone: 'primary',
						}} @button:click=${this.showBootScreen}></ui-button>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.bootScreenExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'UIPullDown pulldown sheet overlay handle dragToClose');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIPullDown</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>full-viewport top sheet — not safe always-open · trigger emits pulldown:toggle · handlePosition bottom · dragToClose · dismiss from Close or drag the handle up</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'md',
						}}>
							<ui-button .state=${{
								label: 'Open pulldown',
								tone: 'primary',
							}} @button:click=${this.openPulldownDemo}></ui-button>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Document-bus overlay. All ui-pulldown instances listen to pulldown:toggle. handlePosition: bottom | top | none.</ui-text>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.pulldownExample}></ui-code-block>
					</ui-surface>
					<ui-pulldown #pulldown_overlay .state.handlePosition=${'bottom'} .state.dragToClose=${true}>
						<div class="demo-pulldown-panel">
							<ui-text .state.variant=${'body'}>UIPullDown overlay — drag the bottom handle up, or Close.</ui-text>
							<ui-button .state=${{
								label: 'Close',
								size: 'sm',
								variant: 'ghost',
							}} @button:click=${this.closePulldownDemo}></ui-button>
						</div>
					</ui-pulldown>
				</section>

<section class="demo" data-cat="overlays" ?hidden=${() => {
	return this.demoHidden('overlays', 'UISlideout slideout drawer panel-header side backdrop dragClose');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UISlideout</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>edge drawer behind a trigger · side end | start · heading via ui-panel-header · showClose · backdrop · dragClose · open() / close() / toggle()</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'sm',
							wrap: true,
						}}>
							<ui-button .state=${{
								label: 'Open end',
								tone: 'primary',
								size: 'sm',
							}} @button:click=${this.openSlideoutEnd}></ui-button>
							<ui-button .state=${{
								label: 'Open start',
								variant: 'outline',
								size: 'sm',
							}} @button:click=${this.openSlideoutStart}></ui-button>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.slideoutExample}></ui-code-block>
					</ui-surface>
					<ui-slideout
						#slideout_end
						.state.side=${'end'}
						.state.heading=${'Inbox'}
						.state.showClose=${true}
						.state.closeLabel=${'Close'}
						.state.backdrop=${true}
						.state.dragClose=${true}>
						<ui-text .state.variant=${'body'}>End-edge panel. Close via the header, the backdrop, or drag.</ui-text>
					</ui-slideout>
					<ui-slideout
						#slideout_start
						.state.side=${'start'}
						.state.heading=${'Filters'}
						.state.showClose=${true}
						.state.closeLabel=${'Close'}
						.state.backdrop=${true}
						.state.dragClose=${true}>
						<ui-text .state.variant=${'body'}>Start-edge panel. Same header + backdrop + drag-close.</ui-text>
					</ui-slideout>
				</section>
				</section>

				<section class="cat-section" data-cat-section="shell" #cat_shell ?hidden=${() => {
					return this.catSectionHidden('shell');
				}}>
					<header class="cat-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>Shell</ui-text>
					</header>

<section class="demo" data-cat="shell" ?hidden=${() => {
	return this.demoHidden('shell', 'UIDock dock navigation rail');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIDock</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>icon rail · active bar · horizontal & vertical orientation</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							align: 'center',
							wrap: true,
						}}>
							<ui-dock .state=${{
								items: this.state.dockItems,
								activeIndex: this.state.dockActiveIndex,
								orientation: 'vertical',
								showActiveBar: true,
							}}></ui-dock>
							<ui-dock .state=${{
								items: this.state.dockItems,
								activeIndex: this.state.dockActiveIndex,
								orientation: 'horizontal',
								showActiveBar: true,
							}}></ui-dock>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.dockExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="shell" ?hidden=${() => {
	return this.demoHidden('shell', 'DockIconButton dock icon button child icon tooltip size tone circle disabled');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>DockIconButton</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>ui-dock-icon-button · child of ui-dock · icon · tooltip · size · tone · circle · disabled · emitName=dock:select</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'xl',
							align: 'center',
							wrap: true,
						}}>
							<ui-dock .state=${{
								items: this.state.dockIconDemoItems,
								activeIndex: this.state.dockIconDemoActive,
								orientation: 'horizontal',
								showActiveBar: true,
							}}></ui-dock>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.dockIconButtonExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="shell" ?hidden=${() => {
	return this.demoHidden('shell', 'UITabButton tab button child id label icon active');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UITabButton</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>ui-tab-button · child of ui-tabs · id · label · icon · active (parent-stamped)</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-tabs .state.items=${this.state.tabButtonDemoItems}>
							<ui-surface slot="home" .state=${{
								tone: 'subtle',
								padding: 'md',
								radius: 'md',
							}}>
								<ui-text .state.variant=${'body'}>Home — icon + label tab.</ui-text>
							</ui-surface>
							<ui-surface slot="wallet" .state=${{
								tone: 'subtle',
								padding: 'md',
								radius: 'md',
							}}>
								<ui-text .state.variant=${'body'}>Wallet — icon + label tab.</ui-text>
							</ui-surface>
							<ui-surface slot="label" .state=${{
								tone: 'subtle',
								padding: 'md',
								radius: 'md',
							}}>
								<ui-text .state.variant=${'body'}>Label only — no icon.</ui-text>
							</ui-surface>
						</ui-tabs>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.tabButtonExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="shell" ?hidden=${() => {
	return this.demoHidden('shell', 'UIAppBar app bar top masthead');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAppBar</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>fixed top masthead · action cluster · framed via contain</ui-text>
					</div>
					<div class="shell-frame shell-frame-bar">
						<ui-app-bar .state=${{
							items: this.state.appBarActions,
						}}>
							<ui-text slot="brand" .state.variant=${'mono'} .state.tone=${'accent'}>⩝ VIAT</ui-text>
						</ui-app-bar>
					</div>
				
						<ui-code-block .state.language=${'html'} .state.code=${this.state.appBarExample}></ui-code-block>
				</section>

<section class="demo" data-cat="shell" ?hidden=${() => {
	return this.demoHidden('shell', 'UIStatusBar status bar bottom cells');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIStatusBar</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>fixed bottom bar · info cells · dividers · framed via contain</ui-text>
					</div>
					<div class="shell-frame shell-frame-bar">
						<ui-status-bar .state=${{
							items: this.state.statusCells,
							dividers: true,
						}}></ui-status-bar>
					</div>
				
						<ui-code-block .state.language=${'html'} .state.code=${this.state.statusBarExample}></ui-code-block>
				</section>

<section class="demo" data-cat="shell" ?hidden=${() => {
	return this.demoHidden('shell', 'UIStatusCell status cell child label value valueClass');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIStatusCell</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>ui-status-cell · child of ui-status-bar · label · value · valueClass · hidden (parent-filtered)</ui-text>
					</div>
					<div class="shell-frame shell-frame-bar">
						<ui-status-bar .state=${{
							items: this.state.statusCellDemoItems,
							dividers: true,
						}}></ui-status-bar>
					</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.statusCellExample}></ui-code-block>
				</section>

<section class="demo" data-cat="shell" ?hidden=${() => {
	return this.demoHidden('shell', 'UISidebar UIPulldown drawer overlay');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UISidebar · UIPulldown</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>app-shell overlays · pulldown opens live + drag the sheet up to close · sidebar is a REAL right-edge drawer driven by open/close/toggle methods + hotkey + swipe</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'horizontal',
							gap: 'lg',
							align: 'stretch',
							wrap: true,
						}}>
							<div class="demo-shell-controls">
								<ui-button .state=${{
									label: 'Open pulldown',
									tone: 'primary',
								}} @button:click=${this.openPulldownDemo}></ui-button>
								<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>UIPulldown — the agent overlay slides from the top edge over the whole viewport. Open here; close from inside, or drag the sheet (anywhere on its empty surface, or the bottom grab handle) up.</ui-text>
							</div>
							<div class="demo-shell-controls">
								<ui-stack .state=${{
									orientation: 'horizontal',
									gap: 'sm',
									wrap: true,
								}}>
									<ui-button .state=${{
										label: 'Open',
										tone: 'primary',
										size: 'sm',
									}} @button:click=${this.openSidebarDemo}></ui-button>
									<ui-button .state=${{
										label: 'Close',
										variant: 'outline',
										size: 'sm',
									}} @button:click=${this.closeSidebarDemo}></ui-button>
									<ui-button .state=${{
										label: 'Toggle',
										variant: 'outline',
										size: 'sm',
									}} @button:click=${this.toggleSidebarDemo}></ui-button>
								</ui-stack>
								<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>UISidebar — a real right-edge drawer. The component ships the open() / close() / toggle() methods (these three buttons call them — toggle() flips, so one button both opens and closes), the ⌘B / Ctrl+B hotkey, and swipe / drag-to-close. Wire any button to those methods; no baked-in button.</ui-text>
							</div>
						</ui-stack>
					
						<ui-code-block .state.language=${'html'} .state.code=${this.state.sidebarExample}></ui-code-block>
					</ui-surface>
					<ui-sidebar #sidebar_demo .state.side=${'right'} .state.hotkey=${'mod+b'}>
						<nav class="demo-sidebar-nav">
							<div class="demo-sidebar-head">
								<ui-text .state.variant=${'overline'} .state.tone=${'muted'}>UISidebar · right drawer</ui-text>
							</div>
							<a class="demo-sidebar-link" href="#">Wallet</a>
							<a class="demo-sidebar-link" href="#">Explorer</a>
							<a class="demo-sidebar-link" href="#">Accounts</a>
							<a class="demo-sidebar-link" href="#">Settings</a>
						</nav>
					</ui-sidebar>
					<ui-pulldown #pulldown_demo>
						<div class="demo-pulldown-panel">
							<ui-text .state.variant=${'body'}>Agent overlay — slides from the top edge. Drag the top handle up to close.</ui-text>
							<ui-button .state=${{
								label: 'Close',
								size: 'sm',
								variant: 'ghost',
							}} @button:click=${this.closePulldownDemo}></ui-button>
						</div>
					</ui-pulldown>
				</section>

<section class="demo" data-cat="shell" ?hidden=${() => {
	return this.demoHidden('shell', 'UIBreadcrumbs breadcrumb path navigation');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIBreadcrumbs</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>items · links + current page · separators · ellipsis overflow</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-breadcrumbs .state.items=${this.state.breadcrumbItems}></ui-breadcrumbs>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.breadcrumbsExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="shell" ?hidden=${() => {
	return this.demoHidden('shell', 'UINavTrigger nav trigger label icon href disabled chevron tooltip');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UINavTrigger</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>child of ui-nav-section · itemId · label · href (plain link) · icon-only · tooltip · disabled · chevron when the item has a panel</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-nav-section .state.items=${this.state.navTriggerDemoItems}></ui-nav-section>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.navTriggerExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="shell" ?hidden=${() => {
	return this.demoHidden('shell', 'UINavPane nav pane panelId links active slideOffset slot');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UINavPane</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>child of ui-nav-section · panelId · label · links via ui-nav-link · active + slideOffset stamped by parent · open a trigger to see the pane</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-nav-section .state.items=${this.state.navPaneDemoItems}></ui-nav-section>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.navPaneExample}></ui-code-block>
					</ui-surface>
				</section>

<section class="demo" data-cat="shell" ?hidden=${() => {
	return this.demoHidden('shell', 'UINavLink nav link label description href icon disabled');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UINavLink</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>child of ui-nav-pane · linkId · label · description · href · icon · disabled · open Links to see the rows</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-nav-section .state.items=${this.state.navLinkDemoItems}></ui-nav-section>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.navLinkExample}></ui-code-block>
					</ui-surface>
				</section>
				</section>

				<section class="cat-section" data-cat-section="concepts" #cat_concepts ?hidden=${() => {
					return this.catSectionHidden('concepts');
				}}>
					<header class="cat-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>State Flow</ui-text>
					</header>

<section class="demo" data-cat="concepts" ?hidden=${() => {
	return this.demoHidden('concepts', 'carry-down state share reactive proxy propagation shared object deep mutation dock .state= flow explain');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>State Carry-Down</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>one shared object via .state= · root write flows down · child primitive write mirrors up · tree order does not matter</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<demo-carry-top></demo-carry-top>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.carryDownExample}></ui-code-block>
					</ui-surface>
				</section>
				</section>

				<section class="cat-section" data-cat-section="patterns" #cat_patterns ?hidden=${() => {
					return this.catSectionHidden('patterns');
				}}>
					<header class="cat-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>Patterns</ui-text>
					</header>

<section class="demo" data-cat="patterns" ?hidden=${() => {
	return this.demoHidden('patterns', 'UISvgBands svg bands decorative divider edge battlement zigzag wave');
}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UISvgBands</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>parametric SVG edge band · zigzag / battlement / steep / wave · stroke or fill · flip</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							orientation: 'vertical',
							gap: 'lg',
						}}>
							<ui-svg-bands .state.shape=${'zigzag'} .state.segments=${20} .state.tone=${'accent'} style="--band-height: 2rem"></ui-svg-bands>
							<ui-svg-bands .state.shape=${'battlement'} .state.segments=${14} .state.tone=${'success'} style="--band-height: 2rem"></ui-svg-bands>
							<ui-svg-bands .state.shape=${'steep'} .state.segments=${16} .state.tone=${'warning'} style="--band-height: 2rem"></ui-svg-bands>
							<ui-svg-bands .state.shape=${'wave'} .state.segments=${10} .state.tone=${'info'} style="--band-height: 2.25rem"></ui-svg-bands>
							<ui-svg-bands .state.shape=${'battlement'} .state.segments=${14} .state.fill=${true} .state.tone=${'accent'} style="--band-height: 2.25rem"></ui-svg-bands>
							<ui-svg-bands .state.shape=${'wave'} .state.segments=${10} .state.fill=${true} .state.flip=${true} .state.tone=${'danger'} style="--band-height: 2.25rem"></ui-svg-bands>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.svgBandsExample}></ui-code-block>
					</ui-surface>
				</section>


				</section>
					</main>
				</div>
			</div>
		`;
	}
}
customElements.define('preview-view', PreviewView);
export default PreviewView;
