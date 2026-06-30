import './registerRoots.js';
/* paged-list (root `paged`) + ui-stat-table (dir name ≠ resolver rest) don't
   auto-resolve through registerRoots, so define them by side-effect import. */
import '../components/global/paged-list/paged-list.js';
import '../components/global/ui-stat-table/ui-stat-table.js';
/* ui-sidebar is fixed-position app-shell chrome only summoned here on demand, so
   it's pulled in explicitly rather than left to a lazy first-render resolve. */
import '../components/global/sidebar/sidebar.js';
/* ui-tooltip lives under core/ (not the global/<tag> path the resolver scans),
   so the `tooltip=` behavior's lazy `whenDefined('ui-tooltip')` would hang here
   forever without this side-effect import — no tooltips would ever show. */
import '../components/core/tooltips/tooltip.js';
/* Carry-down pattern demo (demo-carry-top/mid/leaf) — preview-only showcase of
   `.state=` shared-object deep-mutation propagation; not on the resolver path. */
import '../components/preview/carry-down-demo/carry-down-demo.js';
import { html, WebComponent } from 'webcomponent';
import { BootScreen } from '../components/global/boot-screen/boot-screen.js';
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
		ringThresholds: [
			{
				at: 90,
				tone: 'danger',
			},
		],
		trackerSegments: [
			{
				tone: 'success',
				label: 'block 4818 · ok',
			},
			{
				tone: 'success',
				label: 'block 4819 · ok',
			},
			{
				tone: 'success',
				label: 'block 4820 · ok',
			},
			{
				tone: 'warning',
				label: 'block 4821 · slow finality',
			},
			{
				tone: 'success',
				label: 'block 4822 · ok',
			},
			{
				tone: 'success',
				label: 'block 4823 · ok',
			},
			{
				tone: 'danger',
				label: 'block 4824 · missed',
			},
			{
				tone: 'success',
				label: 'block 4825 · ok',
			},
			{
				tone: 'success',
				label: 'block 4826 · ok',
			},
			{
				tone: 'success',
				label: 'block 4827 · ok',
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
		switchExample: `
<ui-switch
  .state.checked=\${this.state.darkMode}
  .state.label=\${'Dark mode'}
  @switch:change=\${this.handleToggle}>
</ui-switch>`,
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
  .state.tone=\${'success'}>
</ui-sparkline>`,
		carryDownExample: `
// top owns ONE shared object, passes it down by reference
<demo-carry-mid .state=\${this.state.payload}></demo-carry-mid>

// mid renders the shared array through list()
render() { this.html\`\${list('items', DemoCarryLeaf)}\`; }

// ancestor-origin deep write at the top → the leaf re-renders
this.state.payload.items[0].tooltip = 'Wallet 1';`,
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
  .state.options=\${[
    { id: 'a', label: 'Wallet', votes: 142 },
    { id: 'b', label: 'Staking', votes: 98 },
  ]}>
</ui-poll>`,
		voteTallyExample: `
<ui-vote-tally
  .state.heading=\${'Most wanted'}
  .state.items=\${[
    { id: 'a', label: 'Dark mode', votes: 42 },
    { id: 'b', label: 'Mobile app', votes: 88 },
  ]}>
</ui-vote-tally>`,
		carouselExample: `
<ui-feature-carousel
  .state.slides=\${[
    { id: 'a', eyebrow: 'New', heading: 'Fast', description: '…' },
    { id: 'b', eyebrow: 'New', heading: 'Final', description: '…' },
  ]}>
</ui-feature-carousel>`,
		videoPlayerExample: `
<ui-hover-video-player .state.src=\${'/clip.mp4'}></ui-hover-video-player>
<ui-youtube-video-player .state.videoId=\${'aqz-KE-bpKQ'}></ui-youtube-video-player>`,
		colorPickerExample: `
<ui-color-picker
  .state.color=\${'#6366f1'} .state.alpha=\${85} .state.format=\${'rgba'}
  @color-change=\${this.handleColor}>
</ui-color-picker>`,
		tagInputExample: `
<ui-tag-input
  .state.tags=\${['react', 'vue']} .state.placeholder=\${'Add framework…'}
  .state.max=\${8} @tags:change=\${e => save(e.detail.data.tags)}>
</ui-tag-input>`,
		sliderExample: `
<ui-slider .state.value=\${40} @slider:change=\${e => save(e.detail.data.value)}></ui-slider>
<ui-slider .state.range=\${true} .state.low=\${20} .state.high=\${70} .state.marks=\${true}
  .state.showLabel=\${'always'}></ui-slider>
<ui-slider .state.orientation=\${'vertical'} .state.step=\${5} .state.valueSuffix=\${'%'}></ui-slider>`,
		calendarExample: `
<ui-calendar @date-change=\${this.handlePick}></ui-calendar>
<ui-range-calendar @range-change=\${this.handleRange}></ui-range-calendar>
<ui-event-calendar .state.events=\${events}></ui-event-calendar>
<ui-mini-calendar></ui-mini-calendar>`,
		progressRingExample: `
<ui-progress-ring
  .state.value=\${72}
  .state.size=\${'lg'}
  .state.thresholds=\${[{ at: 90, tone: 'danger' }]}>
</ui-progress-ring>`,
		trackerExample: `
<ui-tracker .state.segments=\${[
  { tone: 'success', label: 'block 4820 · ok' },
  { tone: 'warning', label: 'slow finality' },
  { tone: 'danger',  label: 'missed' },
]}></ui-tracker>`,
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
		jsonInspectorExample: `
<ui-json-inspector
  .state.data=\${blockPayload}
  .state.expandDepth=\${1}></ui-json-inspector>
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
		heatmapExample: `
<ui-heatmap .state.mode=\${'calendar'} .state.data=\${[
  { date: '2026-01-02', value: 4 }, { date: '2026-01-15', value: 18 },
]}></ui-heatmap>
<ui-heatmap .state.data=\${[[12, 4, 9], [3, 18, 14]]}
  .state.rowLabels=\${['A', 'B']} .state.colLabels=\${['x', 'y', 'z']}></ui-heatmap>`,
		metricExample: `
<ui-metric
  .state.label=\${'TPS (peak)'} .state.value=\${'9,410'}
  .state.delta=\${12.4} .state.trend=\${[6, 7, 9, 11, 13, 14]}
  .state.tone=\${'accent'}>
</ui-metric>`,
		detailListExample: `
<ui-detail-list .state.columns=\${2} .state.pairs=\${[
  { label: 'Hash', value: '0x9f3a…c2', mono: true, copy: true },
  { label: 'Block', value: '4,182,907', mono: true },
  { label: 'Status', value: 'Confirmed' },
]}></ui-detail-list>`,
		kbdExample: `
<ui-kbd .state.keys=\${['cmd', 'k']}></ui-kbd>
<ui-kbd .state.keys=\${['ctrl', 'shift', 'p']}></ui-kbd>
<ui-kbd .state.keys=\${['esc']}></ui-kbd>`,
		legendExample: `
<ui-legend .state.series=\${[
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
<ui-avatar .state.name=\${'Ada Lovelace'} .state.size=\${'lg'}></ui-avatar>
<ui-avatar .state.name=\${'0xA1f2…c4'} .state.shape=\${'square'} .state.status=\${'online'}></ui-avatar>
<ui-avatar .state.src=\${'/u/42.png'} .state.name=\${'Grace H.'}></ui-avatar>`,
		toggleGroupExample: `
<ui-toggle-group .state.items=\${[
  { value: '1h', label: '1H' }, { value: '24h', label: '24H' }, { value: '7d', label: '7D' },
]} .state.value=\${'24h'}></ui-toggle-group>`,
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
		/* Gallery nav. `activeCategory` filters the stage; `navQuery` is the live
		   name filter. Category ids must match each section's demoHidden(cat,…). */
		activeCategory: 'all',
		navQuery: '',
		categories: [
			{
				id: 'all',
				label: 'All',
				icon: 'layout-grid',
			},
			{
				id: 'layout',
				label: 'Layout',
				icon: 'layout-dashboard',
			},
			{
				id: 'typography',
				label: 'Typography',
				icon: 'type',
			},
			{
				id: 'forms',
				label: 'Forms',
				icon: 'text-cursor-input',
			},
			{
				id: 'actions',
				label: 'Actions',
				icon: 'square-mouse-pointer',
			},
			{
				id: 'feedback',
				label: 'Feedback',
				icon: 'activity',
			},
			{
				id: 'data',
				label: 'Data',
				icon: 'table',
			},
			{
				id: 'ai',
				label: 'AI',
				icon: 'sparkles',
			},
			{
				id: 'overlays',
				label: 'Overlays',
				icon: 'layers',
			},
			{
				id: 'shell',
				label: 'Shell',
				icon: 'panels-top-left',
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
				animate: 'bob',
			},
			{
				id: 'explorer',
				icon: 'compass',
				tooltip: 'Explorer',
				animate: 'compass',
			},
			{
				id: 'accounts',
				icon: 'users',
				tooltip: 'Accounts',
				animate: 'hop',
			},
			{
				id: 'swap',
				icon: 'arrow-left-right',
				tooltip: 'Swap',
				animate: 'flip',
			},
		],
		dockActiveId: 'explorer',
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
	};
	static async create(state, config, mountTarget = document.body) {
		const view = new this(await state, config);
		await WebComponent.preRender(view, mountTarget);
		return view;
	}
	/* Stable display+data contract for the <paged-list> demo (mirrors the
	   explorer's instance-field pattern; the loader arrow preserves `this`). */
	/* Stable static demo data for the easy-component batch — instance fields give
	   one stable reference per instance (same discipline as listConfig below). The
	   gallery images are inline data-URI SVGs so the demo needs no network. */
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
		emptyText: 'No rows.',
		loadingText: 'Loading rows…',
		pagingStyle: 'loadmore',
	};
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
		const tags = domEvent.detail?.data?.tags ?? [];
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
		this.state.pickedDate = domEvent.detail?.data?.date ?? '';
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
	openModal() {
		this.refs.modal.open();
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
			title: 'Heads up',
			message: 'A default notification just landed.',
		});
	}
	notifyError() {
		this.refs.notify.show({
			title: 'Transfer failed',
			message: 'The node rejected the transaction.',
			itemType: 'error',
		});
	}
	showLoadingScreen() {
		const loadingScreen = this.refs.loading;
		loadingScreen.open({
			title: 'Syncing chain',
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
	setCategory(domEvent) {
		const categoryId = domEvent.currentTarget?.dataset?.id;
		if (categoryId) {
			this.state.activeCategory = categoryId;
		}
	}
	/**
	 * Visibility predicate for a demo card — true = hidden. A card shows when the
	 * active category matches (or 'all') AND its name matches the live query.
	 * @param {string} category - The card's category id.
	 * @param {string} searchName - The card's searchable label.
	 * @returns {boolean} Whether the card should be hidden.
	 */
	demoHidden(category, searchName) {
		const active = this.state.activeCategory;
		const categoryOk = active === 'all' || active === category;
		const query = this.state.navQuery.trim().toLowerCase();
		const queryOk = query === '' || searchName.toLowerCase().includes(query);
		return !(categoryOk && queryOk);
	}
	syncSelect(domEvent) {
		this.state.selectValue = domEvent.detail?.data?.value ?? domEvent.target.value;
	}
	syncSwitch(domEvent) {
		this.state.switchChecked = domEvent.detail?.checked ?? domEvent.target.checked;
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
	handleWizardStep(domEvent) {
		this.state.wizardStep = domEvent.detail?.data?.index ?? this.state.wizardStep;
	}
	wizardNext() {
		this.state.wizardStep = Math.min(this.state.wizardStep + 1, this.wizardSteps.length - 1);
	}
	handleSpeedDialAction(domEvent) {
		this.state.confirmResult = `speed-dial → ${domEvent.detail?.data?.value}`;
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
		// ui-pulldown opens off the `pulldown:state` document-bus event.
		this.emit('pulldown:state', {
			open: true,
		});
	}
	closePulldownDemo() {
		this.emit('pulldown:state', {
			open: false,
		});
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
		// Synthetic in-memory loader (3 pages × 8 rows) — no SDK, no network.
		const page = options.reset ? 1 : (options.cursor ?? 1);
		const totalPages = 3;
		const pageSize = 8;
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
		return html `
			<div class="demo-paged-row">
				<span class="demo-mono demo-paged-id">#${row.id}</span>
				<span class="demo-mono">${row.hash}</span>
				<span class="demo-mono demo-paged-amount">${row.amount} VIAT</span>
			</div>
		`;
	}
	pagedHead() {
		// paged-list consumes renderHead via `^html` — it wants a raw markup
		// STRING, not an html`` template (which would serialize to its spot form).
		// Static markup, no interpolation, so a plain string is XSS-safe.
		return `
			<div class="demo-paged-row demo-paged-head">
				<span class="demo-mono">#</span>
				<span class="demo-mono">HASH</span>
				<span class="demo-mono demo-paged-amount">AMOUNT</span>
			</div>
		`;
	}
	render() {
		this.html `
			<div class="gallery">
				<aside class="rail">
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
					<nav class="rail-nav">
						<button class="rail-cat" data-id="all" ?data-on=${this.state.activeCategory === 'all'} @click=${this.setCategory}>
							<ui-icon class="rail-cat-icon" .state=${{
								name: 'layout-grid',
								size: 'sm',
							}}></ui-icon><span class="rail-cat-label">All</span>
						</button>
						<button class="rail-cat" data-id="layout" ?data-on=${this.state.activeCategory === 'layout'} @click=${this.setCategory}>
							<ui-icon class="rail-cat-icon" .state=${{
								name: 'layout-dashboard',
								size: 'sm',
							}}></ui-icon><span class="rail-cat-label">Layout</span>
						</button>
						<button class="rail-cat" data-id="typography" ?data-on=${this.state.activeCategory === 'typography'} @click=${this.setCategory}>
							<ui-icon class="rail-cat-icon" .state=${{
								name: 'type',
								size: 'sm',
							}}></ui-icon><span class="rail-cat-label">Typography</span>
						</button>
						<button class="rail-cat" data-id="forms" ?data-on=${this.state.activeCategory === 'forms'} @click=${this.setCategory}>
							<ui-icon class="rail-cat-icon" .state=${{
								name: 'text-cursor-input',
								size: 'sm',
							}}></ui-icon><span class="rail-cat-label">Forms</span>
						</button>
						<button class="rail-cat" data-id="actions" ?data-on=${this.state.activeCategory === 'actions'} @click=${this.setCategory}>
							<ui-icon class="rail-cat-icon" .state=${{
								name: 'square-mouse-pointer',
								size: 'sm',
							}}></ui-icon><span class="rail-cat-label">Actions</span>
						</button>
						<button class="rail-cat" data-id="feedback" ?data-on=${this.state.activeCategory === 'feedback'} @click=${this.setCategory}>
							<ui-icon class="rail-cat-icon" .state=${{
								name: 'activity',
								size: 'sm',
							}}></ui-icon><span class="rail-cat-label">Feedback</span>
						</button>
						<button class="rail-cat" data-id="data" ?data-on=${this.state.activeCategory === 'data'} @click=${this.setCategory}>
							<ui-icon class="rail-cat-icon" .state=${{
								name: 'table',
								size: 'sm',
							}}></ui-icon><span class="rail-cat-label">Data</span>
						</button>
						<button class="rail-cat" data-id="overlays" ?data-on=${this.state.activeCategory === 'overlays'} @click=${this.setCategory}>
							<ui-icon class="rail-cat-icon" .state=${{
								name: 'layers',
								size: 'sm',
							}}></ui-icon><span class="rail-cat-label">Overlays</span>
						</button>
						<button class="rail-cat" data-id="shell" ?data-on=${this.state.activeCategory === 'shell'} @click=${this.setCategory}>
							<ui-icon class="rail-cat-icon" .state=${{
								name: 'panels-top-left',
								size: 'sm',
							}}></ui-icon><span class="rail-cat-label">Shell</span>
						</button>
					</nav>
					<div class="rail-foot">
						<ui-text .state.variant=${'overline'} .state.tone=${'muted'}>theme</ui-text>
						<ui-theme-select></ui-theme-select>
					</div>
				</aside>
				<main class="stage">
					<header class="stage-head">
						<ui-text .state.variant=${'display'} .state.tone=${'accent'}>Component Index</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>tier-0 atoms · viat / universal-web-components · this gallery is built from the components it shows</ui-text>
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
					</ui-surface>
				</section>

				<section class="demo" data-cat="layout" ?hidden=${() => {
					return this.demoHidden('layout', 'UIStack stack layout flex');
				}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIStack</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>flex layout · direction · gap · align · justify</ui-text>
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
									direction: 'row',
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
									direction: 'column',
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
									direction: 'row',
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
							direction: 'column',
							gap: 'md',
						}}>
							<ui-text .state.variant=${'body'}>Section above the rule</ui-text>
							<ui-divider></ui-divider>
							<ui-text .state.variant=${'body'}>Section below the rule</ui-text>
							<ui-divider .state.label=${'OR'}></ui-divider>
							<ui-divider .state.variant=${'dashed'}></ui-divider>
							<ui-stack .state=${{
								direction: 'row',
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
					</ui-surface>
				</section>

				<section class="demo" data-cat="data" ?hidden=${() => {
					return this.demoHidden('data', 'UIChip chip tag token filter removable selectable');
				}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIChip</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>tones · removable ✕ · selectable filter · sizes</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'column',
							gap: 'md',
						}}>
							<ui-stack .state=${{
								direction: 'row',
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
								direction: 'row',
								gap: 'sm',
								wrap: true,
								align: 'center',
							}}>
								<ui-chip .state.label=${'React'} .state.value=${'react'} .state.removable=${true}></ui-chip>
								<ui-chip .state.label=${'Vue'} .state.value=${'vue'} .state.tone=${'success'} .state.removable=${true}></ui-chip>
								<ui-chip .state.label=${'Svelte'} .state.value=${'svelte'} .state.tone=${'warning'} .state.removable=${true}></ui-chip>
							</ui-stack>
							<ui-stack .state=${{
								direction: 'row',
								gap: 'sm',
								wrap: true,
								align: 'center',
							}}>
								<ui-chip .state.label=${'Filter on'} .state.interactive=${true} .state.selected=${true} .state.tone=${'accent'}></ui-chip>
								<ui-chip .state.label=${'Filter off'} .state.interactive=${true} .state.tone=${'accent'}></ui-chip>
								<ui-chip .state.label=${'Small'} .state.size=${'sm'}></ui-chip>
								<ui-chip .state.label=${'Large'} .state.size=${'lg'}></ui-chip>
								<ui-chip .state.label=${'Disabled'} .state.disabled=${true} .state.removable=${true}></ui-chip>
							</ui-stack>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="demo" data-cat="ai" ?hidden=${() => {
					return this.demoHidden('ai', 'UIAiMessage ai chat message reasoning plan tool call sources approval inquire markdown code stream');
				}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAiMessage · AI blocks</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>markdown + fenced code · streaming/settled · reasoning · plan · tool-call · sources · approval · inquire</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'column',
							gap: 'md',
						}}>
							<ui-ai-message .state.author=${'user'} .state.content=${'Get me a swap quote for VIAT → UDSP'}></ui-ai-message>
							<ui-ai-message .state.author=${'assistant'} .state.content=${this.state.aiAssistantContent}></ui-ai-message>
							<ui-ai-reasoning .state.text=${this.state.aiReasoningText} .state.expanded=${true}></ui-ai-reasoning>
							<ui-ai-plan .state.steps=${this.state.aiPlanSteps}></ui-ai-plan>
							<ui-ai-tool-call .state.name=${'getWalletAmount'} .state.args=${this.state.aiToolArgs} .state.result=${this.state.aiToolResult} .state.status=${'done'} .state.expanded=${true}></ui-ai-tool-call>
							<ui-ai-sources .state.sources=${this.state.aiSources}></ui-ai-sources>
							<ui-ai-approval .state.name=${'sendFunds'} .state.summary=${'Send 100 VIAT to bob.viat'} .state.args=${this.state.aiToolArgs}></ui-ai-approval>
							<ui-ai-inquire .state.question=${'Which network should I use?'} .state.mode=${'choice'} .state.options=${this.state.aiInquireOptions}></ui-ai-inquire>
						</ui-stack>
					</ui-surface>
				</section>

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
							direction: 'row',
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
							direction: 'column',
							gap: 'lg',
							wrap: true,
						}}>
							<ui-pin-input .state.length=${6} .state.type=${'numeric'} @pin:complete=${this.handlePinComplete} @pin:input=${this.handlePinInput}></ui-pin-input>
							<ui-pin-input .state.length=${4} .state.type=${'numeric'} .state.masked=${true} @pin:complete=${this.handlePinComplete}></ui-pin-input>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>${this.state.pinResult || 'enter a code'}</ui-text>
						</ui-stack>
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
							direction: 'row',
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
					</ui-surface>
				</section>

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
							direction: 'row',
							gap: 'lg',
							align: 'center',
							wrap: true,
						}}>
							<ui-fab .state.icon=${'plus'} .state.label=${'Add'} .state.position=${'static'} @fab:click=${this.handleFabClick}></ui-fab>
							<ui-fab .state.icon=${'star'} .state.label=${'Favourite'} .state.extended=${true} .state.tone=${'success'} .state.position=${'static'}></ui-fab>
							<ui-fab .state.icon=${'settings'} .state.tone=${'danger'} .state.size=${'md'} .state.position=${'static'}></ui-fab>
						</ui-stack>
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
							direction: 'row',
							gap: 'xl',
							align: 'end',
							justify: 'around',
							wrap: true,
						}}>
							<ui-speed-dial .state.icon=${'plus'} .state.position=${'static'} .state.direction=${'up'} .state.actions=${this.speedDialActions} @speed-dial:action=${this.handleSpeedDialAction}></ui-speed-dial>
							<ui-speed-dial .state.icon=${'share-2'} .state.tone=${'accent'} .state.trigger=${'hover'} .state.position=${'static'} .state.direction=${'down'} .state.actions=${this.speedDialActions} @speed-dial:action=${this.handleSpeedDialAction}></ui-speed-dial>
						</ui-stack>
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
							direction: 'column',
							gap: 'md',
						}}>
							<ui-pagination .state.page=${this.state.demoPage} .state.count=${42} @page:change=${this.handleDemoPage}></ui-pagination>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Page ${this.state.demoPage} of 42</ui-text>
						</ui-stack>
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
							direction: 'row',
							gap: 'lg',
							align: 'center',
							wrap: true,
						}}>
							<ui-number-stepper .state.value=${this.state.demoQty} .state.min=${0} .state.max=${10} @stepper:change=${this.handleDemoQty}></ui-number-stepper>
							<ui-number-stepper .state.value=${1.5} .state.step=${0.5} .state.precision=${1} .state.suffix=${'×'}></ui-number-stepper>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Qty: ${this.state.demoQty}</ui-text>
						</ui-stack>
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
							direction: 'row',
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
							}} @buttonClick=${this.rollAnim}></ui-button>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="demo" data-cat="data" ?hidden=${() => {
					return this.demoHidden('data', 'UIImageList image list gallery grid masonry photos');
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
					</ui-surface>
				</section>

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
							direction: 'column',
							gap: 'lg',
						}}>
							<ui-stepper .state.active=${this.state.wizardStep} .state.steps=${this.wizardSteps} @step:change=${this.handleWizardStep}></ui-stepper>
							<ui-button .state=${{
								label: 'Next step',
								tone: 'primary',
								size: 'sm',
							}} @buttonClick=${this.wizardNext}></ui-button>
						</ui-stack>
					</ui-surface>
				</section>

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
							direction: 'row',
							gap: 'lg',
							align: 'center',
							wrap: true,
						}}>
							<ui-menu .state.label=${'Actions ▾'} .state.items=${this.menuItems} @menu:select=${this.handleMenuSelect}></ui-menu>
							<ui-menu .state.label=${'Align end ▾'} .state.placement=${'bottom-end'} .state.items=${this.menuItems} @menu:select=${this.handleMenuSelect}></ui-menu>
							<div style="transform: translateZ(0); overflow: hidden; padding: 0.75rem; border: 1px dashed var(--surface-border, rgba(255, 255, 255, 0.2)); border-radius: 0.5rem;">
								<ui-menu .state.label=${'Inside transform ▾'} .state.items=${this.menuItems} @menu:select=${this.handleMenuSelect}></ui-menu>
							</div>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>last menu sits in a clipped+transformed box — it still escapes (top layer)</ui-text>
						</ui-stack>
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
							direction: 'row',
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
					</ui-surface>
				</section>

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
							direction: 'column',
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
							direction: 'row',
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
							}} @buttonClick=${this.toggleSpin}></ui-button>
						</ui-stack>
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
							direction: 'column',
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
							direction: 'column',
							gap: 'md',
						}}>
							<ui-stack .state=${{
								direction: 'row',
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
								direction: 'row',
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
								direction: 'row',
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
								direction: 'row',
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
								direction: 'row',
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
								direction: 'row',
								gap: 'sm',
								align: 'center',
							}}>
								<ui-button .state=${{
									label: 'Click me',
									tone: 'primary',
								}} @buttonClick=${this.bumpClick}></ui-button>
								<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>clicks: ${this.state.clickCount}</ui-text>
							</ui-stack>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="demo" data-cat="forms" ?hidden=${() => {
					return this.demoHidden('forms', 'UIInput input form field');
				}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIInput</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>sizes · tones · disabled · readonly</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'column',
							gap: 'md',
						}}>
							<ui-stack .state=${{
								direction: 'row',
								gap: 'md',
								wrap: true,
							}}>
								<ui-input .state=${{
									value: this.state.emailValue,
									type: 'email',
									placeholder: 'sm size · email',
									size: 'sm',
								}} @input=${this.syncEmail}></ui-input>
								<ui-input .state=${{
									value: this.state.emailValue,
									type: 'email',
									placeholder: 'md size (default)',
									size: 'md',
								}} @input=${this.syncEmail}></ui-input>
								<ui-input .state=${{
									value: this.state.emailValue,
									type: 'email',
									placeholder: 'lg size',
									size: 'lg',
								}} @input=${this.syncEmail}></ui-input>
							</ui-stack>
							<ui-stack .state=${{
								direction: 'row',
								gap: 'md',
								wrap: true,
							}}>
								<ui-input .state=${{
									placeholder: 'disabled',
									disabled: true,
								}}></ui-input>
								<ui-input .state=${{
									placeholder: 'readonly',
									value: 'cannot edit',
									readonly: true,
								}}></ui-input>
								<ui-input .state=${{
									placeholder: 'error tone',
									tone: 'error',
								}}></ui-input>
							</ui-stack>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>live email value: <ui-text .state.variant=${'mono'}>${this.state.emailValue || '(empty)'}</ui-text></ui-text>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="demo" data-cat="forms" ?hidden=${() => {
					return this.demoHidden('forms', 'UIField field label form');
				}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIField</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>labelled wrapper · help · error · required</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'column',
							gap: 'lg',
						}}>
							<ui-field .state=${{
								label: 'Email address',
								help: 'We\'ll never share your email.',
								required: true,
							}}>
								<ui-input .state=${{
									value: this.state.emailValue,
									type: 'email',
									placeholder: 'you@example.com',
								}} @input=${this.syncEmail}></ui-input>
							</ui-field>
							<ui-field .state=${{
								label: 'Search',
								error: 'No results found',
							}}>
								<ui-input .state=${{
									value: this.state.searchValue,
									type: 'search',
									placeholder: 'try anything',
									tone: 'error',
								}} @input=${this.syncSearch}></ui-input>
							</ui-field>
							<ui-field .state=${{
								label: 'Amount',
								help: 'inline layout',
								inline: true,
							}}>
								<ui-input .state=${{
									value: this.state.amountValue,
									type: 'number',
									placeholder: '0.00',
								}} @input=${this.syncAmount}></ui-input>
							</ui-field>
						</ui-stack>
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
							direction: 'row',
							gap: 'xl',
							wrap: true,
							align: 'start',
						}}>
							<ui-poll .state.question=${'Which should we build first?'} .state.options=${this.state.pollBaseOptions}></ui-poll>
							<ui-choice-poll .state.question=${'Pick your top priority (instant)'} .state.options=${this.state.pollChoiceOptions}></ui-choice-poll>
							<ui-feature-poll .state.question=${'Vote on the next feature'} .state.options=${this.state.pollFeatureOptions}></ui-feature-poll>
							<ui-poll-widget .state.question=${'Select all you want (multi)'} .state.options=${this.state.pollWidgetOptions} .state.multiple=${true}></ui-poll-widget>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.pollExample}></ui-code-block>
					</ui-surface>
				</section>

				<section class="demo" data-cat="forms" ?hidden=${() => {
					return this.demoHidden('forms', 'UIColorPicker color picker hue saturation lightness hex swatch presets');
				}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIColorPicker</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>HSL square (drag) · hue + alpha dials · format DROPDOWN (HEX / RGB / RGBA / HSL / HSLA) · default .color / .alpha / .format props · preset grid · emits color-change</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'row',
							gap: 'xl',
							align: 'center',
							wrap: true,
						}}>
							<ui-color-picker .state.color=${'#6366f1'} .state.alpha=${85} .state.format=${'rgba'} @color-change=${this.handleColorChange}></ui-color-picker>
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
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>token field of removable ui-chips · Enter / comma commits · Backspace removes last · paste splits · max · emits tags:change</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'column',
							gap: 'md',
						}}>
							<ui-tag-input .state.tags=${this.state.tagValues} .state.placeholder=${'Add a tag…'} .state.max=${8} @tags:change=${this.handleTagsChange}></ui-tag-input>
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
							direction: 'column',
							gap: 'xl',
						}}>
							<ui-stack .state=${{
								direction: 'column',
								gap: 'sm',
							}}>
								<ui-slider .state.value=${40} @slider:change=${this.handleSliderChange}></ui-slider>
								<ui-text .state.variant=${'body'} .state.tone=${'muted'}>Value: ${this.state.sliderReadout}</ui-text>
							</ui-stack>
							<ui-stack .state=${{
								direction: 'column',
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
							direction: 'column',
							gap: 'lg',
						}}>
							<ui-stack .state=${{
								direction: 'row',
								gap: 'xl',
								wrap: true,
								align: 'start',
							}}>
								<ui-stack .state=${{
									direction: 'column',
									gap: 'sm',
								}}>
									<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Single · ${this.state.pickedDate || '(pick a day)'}</ui-text>
									<ui-calendar @date-change=${this.handleDatePick}></ui-calendar>
								</ui-stack>
								<ui-stack .state=${{
									direction: 'column',
									gap: 'sm',
								}}>
									<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Range · ${this.state.pickedRange || '(pick start → end)'}</ui-text>
									<ui-range-calendar @range-change=${this.handleRangePick}></ui-range-calendar>
								</ui-stack>
								<ui-stack .state=${{
									direction: 'column',
									gap: 'sm',
								}}>
									<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Mini</ui-text>
									<ui-mini-calendar></ui-mini-calendar>
								</ui-stack>
							</ui-stack>
							<ui-event-calendar .state.viewYear=${2026} .state.viewMonth=${5} .state.events=${this.state.calendarEvents}></ui-event-calendar>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.calendarExample}></ui-code-block>
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
							direction: 'row',
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
								direction: 'row',
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
								}} @buttonClick=${this.bumpBadge}></ui-button>
							</ui-stack>
						</ui-stack>
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
							direction: 'row',
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
							direction: 'row',
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
							direction: 'column',
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
							direction: 'row',
							gap: 'lg',
							wrap: true,
						}}>
							<ui-surface .state=${{
								tone: 'subtle',
								padding: 'md',
								radius: 'md',
							}}>
								<ui-empty-state .state=${{
									title: 'No transactions yet',
								}}></ui-empty-state>
							</ui-surface>
							<ui-surface .state=${{
								tone: 'subtle',
								padding: 'md',
								radius: 'md',
							}}>
								<ui-empty-state .state=${{
									icon: '⊘',
									title: 'Wallet is empty',
									hint: 'Fund your wallet to get started.',
									actionLabel: 'Open faucet',
								}}></ui-empty-state>
							</ui-surface>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="demo" data-cat="data" ?hidden=${() => {
					return this.demoHidden('data', 'UIPanel panel chrome');
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
							direction: 'row',
							gap: 'md',
							wrap: true,
						}}>
							<ui-panel .state=${{
								id: 'WALLET',
								title: 'ADDRESS',
							}}></ui-panel>
							<ui-panel .state=${{
								id: 'NET',
								title: 'STATUS',
								showDot: false,
							}}></ui-panel>
						</ui-stack>
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
						}} @buttonClick=${this.openModal}></ui-button>
						<ui-modal #modal>
							<ui-surface .state=${{
								tone: 'popup',
								padding: 'lg',
								radius: 'lg',
							}}>
								<ui-stack .state=${{
									direction: 'column',
									gap: 'md',
								}}>
									<ui-text .state.variant=${'h3'} .state.tone=${'accent'}>Confirm transfer</ui-text>
									<ui-text .state.variant=${'body'} .state.tone=${'muted'}>This sends 12.4 VIAT to the selected address. This action cannot be undone.</ui-text>
									<ui-stack .state=${{
										direction: 'row',
										gap: 'sm',
										justify: 'end',
									}}>
										<ui-button .state=${{
											label: 'Cancel',
											variant: 'ghost',
										}} @buttonClick=${this.closeModal}></ui-button>
										<ui-button .state=${{
											label: 'Confirm',
											tone: 'primary',
										}} @buttonClick=${this.closeModal}></ui-button>
									</ui-stack>
								</ui-stack>
							</ui-surface>
						</ui-modal>
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
								direction: 'column',
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
					</ui-surface>
				</section>

				<section class="demo" data-cat="overlays" ?hidden=${() => {
					return this.demoHidden('overlays', 'UIPopover popover morph compact account menu');
				}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIPopover</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>compact morph · snappier spring · transparent click-catcher (no scrim)</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-popover .state.label=${'Account ▾'} .state.heading=${'Signed in as'}>
							<ui-stack .state=${{
								direction: 'column',
								gap: 'sm',
							}}>
								<ui-text .state.variant=${'body'}>0xA1B2…9F3A</ui-text>
								<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Switch wallet · Settings · Sign out</ui-text>
							</ui-stack>
						</ui-popover>
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
								direction: 'column',
								gap: 'md',
							}}>
								<ui-text .state.variant=${'body'} .state.tone=${'muted'}>Full node detail morphs out of the card. Uptime 99.98%, last block 4,821,330, region eu-west.</ui-text>
								<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Peers: 3 · Inbound 1.2MB/s · Outbound 0.8MB/s</ui-text>
							</ui-stack>
						</ui-expandable-card>
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
								direction: 'column',
								gap: 'md',
							}}>
								<ui-text .state.variant=${'body'} .state.tone=${'muted'}>A full-height drawer that morphs out of the trigger button rather than a plain slide.</ui-text>
								<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>Address · Public key · Trapdoor hash · Saved at</ui-text>
							</ui-stack>
						</ui-morph-drawer>
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
							direction: 'row',
							gap: 'sm',
							wrap: true,
						}}>
							<ui-button .state=${{
								label: 'Windows-style (right)',
								tone: 'primary',
							}} @buttonClick=${this.openControlsModal}></ui-button>
							<ui-button .state=${{
								label: 'macOS-style (left)',
								tone: 'primary',
								variant: 'outline',
							}} @buttonClick=${this.openMacModal}></ui-button>
							<ui-button .state=${{
								label: 'With afterAction callback',
								variant: 'ghost',
							}} @buttonClick=${this.openMaximizedStartModal}></ui-button>
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
									direction: 'column',
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
									direction: 'column',
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
									direction: 'column',
									gap: 'md',
								}}>
									<ui-text .state.variant=${'h3'} .state.tone=${'accent'}>afterAction</ui-text>
									<ui-text .state.variant=${'body'} .state.tone=${'muted'}>When you close this modal the registered callback fires with the close returnValue. Watch the confirm-behavior section below.</ui-text>
								</ui-stack>
							</ui-surface>
						</ui-modal>
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
							direction: 'row',
							gap: 'md',
							align: 'center',
						}}>
							<ui-close-button></ui-close-button>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>hover → rotate(90deg); active → rotate(180deg)</ui-text>
						</ui-stack>
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
							direction: 'column',
							gap: 'lg',
						}}>
							<ui-tabs .state.transition=${'slide'} .state.tabs=${this.state.tabsHorizontal}>
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
								<ui-tabs .state.tabs=${this.state.tabsHorizontal}>
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
							<ui-tabs .state.orientation=${'vertical'} .state.tabs=${this.state.tabsVertical}>
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
							direction: 'row',
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
					</ui-surface>
				</section>

				<section class="demo" data-cat="overlays" ?hidden=${() => {
					return this.demoHidden('overlays', 'UINotification notification toast');
				}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UINotification</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>stacked toasts · default · error</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'row',
							gap: 'sm',
							wrap: true,
							align: 'center',
						}}>
							<ui-button .state=${{
								label: 'Push notification',
								tone: 'primary',
							}} @buttonClick=${this.notifyDefault}></ui-button>
							<ui-button .state=${{
								label: 'Push error',
								tone: 'danger',
							}} @buttonClick=${this.notifyError}></ui-button>
						</ui-stack>
						<ui-notification #notify></ui-notification>
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
						}} @buttonClick=${this.showLoadingScreen}></ui-button>
						<ui-loading-screen #loading></ui-loading-screen>
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
						}} @buttonClick=${this.showBootScreen}></ui-button>
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
							direction: 'row',
							gap: 'lg',
							align: 'center',
							wrap: true,
						}}>
							<ui-select .state=${{
								value: this.state.selectValue,
								options: this.state.selectOptions,
							}} @change=${this.syncSelect}></ui-select>
							<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>selected: <ui-text .state.variant=${'mono'}>${this.state.selectValue}</ui-text></ui-text>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="demo" data-cat="actions" ?hidden=${() => {
					return this.demoHidden('actions', 'UIIconButton icon button');
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
							direction: 'row',
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
								animate: 'compass',
							}}></ui-icon-button>
						</ui-stack>
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
							actions: this.state.toolbarActions,
						}}></ui-toolbar>
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
							direction: 'row',
							gap: 'lg',
							align: 'center',
							wrap: true,
						}}>
							<ui-status-indicator .state.status=${'online'}></ui-status-indicator>
							<ui-status-indicator .state.status=${'connecting'}></ui-status-indicator>
							<ui-status-indicator .state.status=${'offline'}></ui-status-indicator>
							<ui-stack .state=${{
								direction: 'row',
								gap: 'sm',
								align: 'center',
							}}>
								<ui-status-indicator .state.status=${this.state.statusValue}></ui-status-indicator>
								<ui-button .state=${{
									label: 'Cycle',
									size: 'sm',
									variant: 'outline',
								}} @buttonClick=${this.cycleStatus}></ui-button>
							</ui-stack>
						</ui-stack>
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
							title: 'NETWORK',
							hint: 'live · 24h delta',
							columns: this.state.statTableColumns,
							rows: this.state.statTableRows,
						}}></ui-stat-table>
					</ui-surface>
				</section>

				<section class="demo" data-cat="data" ?hidden=${() => {
					return this.demoHidden('data', 'UIPagedList paged list load more');
				}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>PagedList</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>load-more pager · synthetic loader (3 pages × 8 rows) · head row</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<paged-list class="demo-paged" .state=${this.listConfig}></paged-list>
					</ui-surface>
				</section>

				<section class="demo" data-cat="overlays" ?hidden=${() => {
					return this.demoHidden('overlays', 'UIWhiteboxModal whitebox lightbox image');
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
						}} @buttonClick=${this.openWhitebox}></ui-button>
						<ui-whitebox-modal #whitebox .state=${{
							src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="%230A1128"/><text x="320" y="190" font-family="monospace" font-size="40" fill="%2300F0FF" text-anchor="middle">⩝ VIAT</text></svg>',
							alt: 'VIAT placeholder',
							caption: 'A synthetic SVG frame — swap src for any image or video URL.',
						}}></ui-whitebox-modal>
					</ui-surface>
				</section>

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
							direction: 'row',
							gap: 'xl',
							align: 'center',
							wrap: true,
						}}>
							<ui-dock .state=${{
								items: this.state.dockItems,
								activeId: this.state.dockActiveId,
								orientation: 'vertical',
								showActiveBar: true,
							}}></ui-dock>
							<ui-dock .state=${{
								items: this.state.dockItems,
								activeId: this.state.dockActiveId,
								orientation: 'horizontal',
								showActiveBar: true,
							}}></ui-dock>
						</ui-stack>
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
							actions: this.state.appBarActions,
						}}>
							<ui-text slot="brand" .state.variant=${'mono'} .state.tone=${'accent'}>⩝ VIAT</ui-text>
						</ui-app-bar>
					</div>
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
							cells: this.state.statusCells,
							dividers: true,
						}}></ui-status-bar>
					</div>
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
							direction: 'row',
							gap: 'lg',
							align: 'stretch',
							wrap: true,
						}}>
							<div class="demo-shell-controls">
								<ui-button .state=${{
									label: 'Open pulldown',
									tone: 'primary',
								}} @buttonClick=${this.openPulldownDemo}></ui-button>
								<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>UIPulldown — the agent overlay slides from the top edge over the whole viewport. Open here; close from inside, or drag the sheet (anywhere on its empty surface, or the bottom grab handle) up.</ui-text>
							</div>
							<div class="demo-shell-controls">
								<ui-stack .state=${{
									direction: 'row',
									gap: 'sm',
									wrap: true,
								}}>
									<ui-button .state=${{
										label: 'Open',
										tone: 'primary',
										size: 'sm',
									}} @buttonClick=${this.openSidebarDemo}></ui-button>
									<ui-button .state=${{
										label: 'Close',
										variant: 'outline',
										size: 'sm',
									}} @buttonClick=${this.closeSidebarDemo}></ui-button>
									<ui-button .state=${{
										label: 'Toggle',
										variant: 'outline',
										size: 'sm',
									}} @buttonClick=${this.toggleSidebarDemo}></ui-button>
								</ui-stack>
								<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>UISidebar — a real right-edge drawer. The component ships the open() / close() / toggle() methods (these three buttons call them — toggle() flips, so one button both opens and closes), the ⌘B / Ctrl+B hotkey, and swipe / drag-to-close. Wire any button to those methods; no baked-in button.</ui-text>
							</div>
						</ui-stack>
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
							}} @buttonClick=${this.closePulldownDemo}></ui-button>
						</div>
					</ui-pulldown>
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
							direction: 'row',
							gap: 'xl',
							align: 'center',
							wrap: true,
						}}>
							<ui-switch
								.state.checked=${this.state.switchChecked}
								.state.label=${'Dark mode'}
								@switch:change=${this.syncSwitch}></ui-switch>
							<ui-text .state.variant=${'mono'} .state.tone=${'muted'}>state.switchChecked = ${this.state.switchChecked}</ui-text>
							<ui-switch .state.size=${'sm'} .state.label=${'Small'}></ui-switch>
							<ui-switch .state.checked=${true} .state.label=${'On by default'}></ui-switch>
							<ui-switch .state.disabled=${true} .state.label=${'Disabled'}></ui-switch>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.switchExample}></ui-code-block>
					</ui-surface>
				</section>

				<section class="demo" data-cat="layout" ?hidden=${() => {
					return this.demoHidden('layout', 'UIHoverVideoPlayer UIYoutubeVideoPlayer video player hover play youtube lite facade iframe');
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
							direction: 'row',
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

				<section class="demo" data-cat="layout" ?hidden=${() => {
					return this.demoHidden('layout', 'UICarousel carousel feature loading slider track autoplay fade slide dots progress');
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
							direction: 'row',
							gap: 'xl',
							wrap: true,
							align: 'start',
						}}>
							<ui-carousel .state.slides=${this.state.baseCarouselSlides} .state.arrows=${true} style="max-inline-size: 30rem; inline-size: 100%"></ui-carousel>
							<ui-feature-carousel .state.slides=${this.state.featureCarouselSlides()} style="max-inline-size: 30rem; inline-size: 100%"></ui-feature-carousel>
							<ui-loading-carousel .state.slides=${this.state.loadingCarouselSlides()} style="max-inline-size: 30rem; inline-size: 100%"></ui-loading-carousel>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.carouselExample}></ui-code-block>
					</ui-surface>
				</section>

				<section class="demo" data-cat="layout" ?hidden=${() => {
					return this.demoHidden('layout', 'UIAccordion accordion collapsible details');
				}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAccordion</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>native details · shared group = one-open · animated open height</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'column',
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
							direction: 'column',
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
							direction: 'row',
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
					return this.demoHidden('data', 'UIMetric KPI metric card stat delta sparkline');
				}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIMetric</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>KPI card · big value · signed delta · trend sparkline · tone spine</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="grid">
							<ui-metric .state.label=${'TPS (peak)'} .state.value=${'9,410'} .state.delta=${12.4} .state.trend=${this.state.metricTrendTps} .state.tone=${'accent'}></ui-metric>
							<ui-metric .state.label=${'Finality'} .state.value=${'1.8s'} .state.delta=${-8.2} .state.invertDelta=${true} .state.trend=${this.state.metricTrendFinality} .state.tone=${'success'}></ui-metric>
							<ui-metric .state.label=${'Validators'} .state.value=${'128'} .state.delta=${1.6} .state.hint=${'24h'} .state.trend=${this.state.sparkValues} .state.tone=${'info'}></ui-metric>
						</div>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.metricExample}></ui-code-block>
					</ui-surface>
				</section>

				<section class="demo" data-cat="data" ?hidden=${() => {
					return this.demoHidden('data', 'UISparkline sparkline trend chart line area');
				}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UISparkline</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>hand-rolled SVG · line / area · tone scale · non-scaling stroke</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'row',
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

				<section class="demo" data-cat="data" ?hidden=${() => {
					return this.demoHidden('data', 'carry-down state share reactive proxy propagation shared object deep mutation dock .state=');
				}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>State Carry-Down</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>one shared object passed by .state= · an ancestor-origin deep write flows through list() to the leaf · mirrors GlobalDock → UIDock → DockIconButton</ui-text>
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

				<section class="demo" data-cat="data" ?hidden=${() => {
					return this.demoHidden('data', 'UISvgBands svg bands decorative divider edge battlement zigzag wave');
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
							direction: 'column',
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
							direction: 'row',
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

				<section class="demo" data-cat="feedback" ?hidden=${() => {
					return this.demoHidden('feedback', 'UIProgressRing radial gauge progress dial');
				}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIProgressRing</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>radial gauge · sizes · centre value · threshold recolor</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'row',
							gap: 'xl',
							align: 'center',
							wrap: true,
						}}>
							<ui-progress-ring .state.value=${38} .state.size=${'sm'} .state.tone=${'accent'}></ui-progress-ring>
							<ui-progress-ring .state.value=${72} .state.size=${'md'} .state.tone=${'success'}></ui-progress-ring>
							<ui-progress-ring .state.value=${94} .state.size=${'lg'} .state.thresholds=${this.state.ringThresholds}></ui-progress-ring>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.progressRingExample}></ui-code-block>
					</ui-surface>
				</section>

				<section class="demo" data-cat="data" ?hidden=${() => {
					return this.demoHidden('data', 'UITracker status squares uptime health bars');
				}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UITracker</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>status squares · per-segment tone + label · uptime / finality history</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-tracker .state.segments=${this.state.trackerSegments} .state.label=${'Recent block finality'}></ui-tracker>
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
							direction: 'row',
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
						<ui-json-inspector #json_demo .state.data=${this.state.jsonSample} .state.expandDepth=${1}></ui-json-inspector>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.jsonInspectorExample}></ui-code-block>
					</ui-surface>
				</section>

				<section class="demo" data-cat="data" ?hidden=${() => {
					return this.demoHidden('data', 'UIHeatmap heatmap calendar matrix value color scale tooltip legend activity density tx per day github contributions');
				}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIHeatmap</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>matrix or GitHub-style calendar · continuous value→color (themeable) · per-cell tooltip · legend · UTC date math · emits heatmap:cell</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'column',
							gap: 'xl',
						}}>
							<ui-heatmap #heatmap_cal .state.mode=${'calendar'} .state.data=${this.state.heatmapCalendar}></ui-heatmap>
							<ui-heatmap #heatmap_mat .state.data=${this.state.heatmapMatrix} .state.rowLabels=${this.state.heatmapMatrixRows} .state.colLabels=${this.state.heatmapMatrixCols} .state.showValues=${true}></ui-heatmap>
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
						<ui-detail-list .state.columns=${2} .state.pairs=${this.state.detailPairs}></ui-detail-list>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.detailListExample}></ui-code-block>
					</ui-surface>
				</section>

				<section class="demo" data-cat="data" ?hidden=${() => {
					return this.demoHidden('data', 'UIKbd keyboard shortcut keycap hint hotkey');
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
							direction: 'row',
							gap: 'xl',
							align: 'center',
							wrap: true,
						}}>
							<ui-kbd .state.keys=${this.state.kbdKeysCmdK}></ui-kbd>
							<ui-kbd .state.keys=${this.state.kbdKeysCtrlShiftP}></ui-kbd>
							<ui-kbd .state.keys=${this.state.kbdKeysAltEnter}></ui-kbd>
							<ui-kbd .state.keys=${this.state.kbdKeysEsc}></ui-kbd>
							<ui-kbd .state.keys=${this.state.kbdKeysUpDown}></ui-kbd>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.kbdExample}></ui-code-block>
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
						<ui-legend .state.series=${this.state.legendSeries} .state.interactive=${true}></ui-legend>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.legendExample}></ui-code-block>
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
							direction: 'row',
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

				<section class="demo" data-cat="data" ?hidden=${() => {
					return this.demoHidden('data', 'UIAvatar avatar initials identicon hue status dot');
				}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIAvatar</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>initials fallback · deterministic hue from name · circle / square · status dot · sizes</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'row',
							gap: 'lg',
							align: 'center',
							wrap: true,
						}}>
							<ui-avatar .state.name=${'Ada Lovelace'} .state.size=${'lg'} .state.status=${'online'}></ui-avatar>
							<ui-avatar .state.name=${'Grace Hopper'} .state.size=${'md'} .state.status=${'away'}></ui-avatar>
							<ui-avatar .state.name=${'0xA1f2…c4'} .state.shape=${'square'} .state.size=${'md'} .state.status=${'busy'}></ui-avatar>
							<ui-avatar .state.name=${'Validator 07'} .state.size=${'sm'}></ui-avatar>
							<ui-avatar .state.initials=${'VX'} .state.size=${'sm'} .state.status=${'offline'}></ui-avatar>
							<ui-avatar .state.name=${'Network Ops'} .state.size=${'xs'}></ui-avatar>
						</ui-stack>
						<ui-code-block .state.language=${'html'} .state.code=${this.state.avatarExample}></ui-code-block>
					</ui-surface>
				</section>

				<section class="demo" data-cat="actions" ?hidden=${() => {
					return this.demoHidden('actions', 'UIToggleGroup segmented control single multi range toggle');
				}}>
					<div class="preview-section-head">
						<ui-text .state.variant=${'overline'} .state.tone=${'accent'}>UIToggleGroup</ui-text>
						<ui-text .state.variant=${'caption'} .state.tone=${'muted'}>segmented control · single (range) or multi-select · emits toggle:change</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'row',
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

				</main>
			</div>
		`;
	}
}
customElements.define('preview-view', PreviewView);
export default PreviewView;
