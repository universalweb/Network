import '../components/user/dashboard/dashboard.js';
import '../components/user/global-bottom-bar/global-bottom-bar.js';
import '../components/user/global-dock/global-dock.js';
import '../components/user/global-pulldown/global-pulldown.js';
import '../components/user/global-sidebar/global-sidebar.js';
import '../components/user/global-top-bar/global-top-bar.js';
import '../components/user/settings-modal/settings-modal.js';
import '../components/user/swap-page/swap-page.js';
import './tools.js';
import '../components/core/tooltips/tooltip.js';
import {
	ACTIVITY_ENTRIES,
	ACTIVITY_TABS,
	BOTTOM_BAR_COLUMNS,
	CENTER_BAR,
	CHAIN_STATUS,
	DOCK,
	NETWORK_DATA,
	TOP_BAR,
	TRANSMIT,
	WALLET_AMOUNT,
	WALLET_PANEL,
	WALLET_PARAMS,
} from './appDefaults.js';
import { WebComponent, setGlobal } from 'webcomponent';
import VIATClientSDK from 'viat';
import { UINotification } from '../components/global/notification/notification.js';
function bytesToBase64(bytes) {
	const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	let binary = '';
	for (let index = 0; index < view.length; index += 1) {
		binary += String.fromCharCode(view[index]);
	}
	return globalThis.btoa(binary);
}
function base64ToBytes(text) {
	const cleaned = (text || '').trim().replace(/\s+/g, '');
	if (!cleaned) {
		throw new Error('Provide a base64-encoded wallet string');
	}
	const binary = globalThis.atob(cleaned);
	const view = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) {
		view[index] = binary.charCodeAt(index);
	}
	return view;
}
function toPublicHex(source) {
	if (!source) {
		return '';
	}
	const view = source instanceof Uint8Array ? source : new Uint8Array(source);
	let out = '';
	for (let index = 0; index < view.length; index += 1) {
		out += view[index].toString(16).padStart(2, '0');
	}
	return out;
}
class AppView extends WebComponent {
	static url = import.meta.url;
	static styles = {
		app: './app.css',
	};
	static state = {
		activePage: 'wallet',
	};
	id = 'app';
	notificationPanel = null;
	// SDK instance lives on the AppView only — it carries private keys,
	// hdWalletInstance, and walletSeeds. Never set into globalState; only the
	// public projection (address, public keys, trapdoor hash, label) lands in
	// `globalState.wallet`. Profile metadata is mirrored to `globalState.profile`
	// and rides with save/load via the SDK's `meta.extra` field.
	sdk = null;
	static async create(state, config) {
		const app = new this(await state, config);
		await WebComponent.preRender(app, document.body);
		return app;
	}
	async ensureSDK() {
		if (this.sdk) {
			return this.sdk;
		}
		this.sdk = await VIATClientSDK.create();
		return this.sdk;
	}
	getProfileMeta() {
		return this.globalState.profile ?? {};
	}
	async syncWalletPublics() {
		const sdk = this.sdk;
		const primary = sdk?.STATE?.primaryKeypair;
		const trapdoor = sdk?.STATE?.trapdoorKeypair;
		const trapdoorHash = sdk?.STATE?.trapdoorHash;
		const hasWallet = Boolean(sdk?.STATE?.walletSeeds?.seed);
		// Prefer the persisted save meta (carries the extra/profile data through
		// load); fall back to a fresh derivation when no save has occurred yet.
		let meta = sdk?.STATE?.walletSaveMeta;
		if (hasWallet && !meta?.address && sdk?.getWalletMeta) {
			try {
				meta = await sdk.getWalletMeta({
					label: sdk.STATE?.walletSaveMeta?.label,
					meta: this.getProfileMeta(),
				});
			} catch (error) {
				this.onRenderError(error);
			}
		}
		setGlobal({
			wallet: {
				hasWallet,
				address: meta?.address ?? '',
				publicKey: toPublicHex(primary?.publicKey),
				trapdoorPublicKey: toPublicHex(trapdoor?.publicKey),
				trapdoorHash: toPublicHex(trapdoorHash),
				label: meta?.label ?? '',
				walletSavedAt: meta?.createdAt ?? '',
			},
		});
		if (meta?.address) {
			setGlobal({
				walletAddress: meta.address,
			});
		}
		if (meta?.extra && typeof meta.extra === 'object') {
			setGlobal({
				profile: {
					...this.getProfileMeta(),
					...meta.extra,
				},
			});
		}
	}
	async handleWalletCreate(domEvent) {
		const data = domEvent.detail?.data ?? {};
		const sdk = await this.ensureSDK();
		await sdk.generateSiteWallet({
			meta: data.profileMeta ?? this.getProfileMeta(),
			label: data.label,
		});
		if (data.label) {
			await sdk.set('walletSaveMeta', {
				label: data.label,
			});
		}
		await this.syncWalletPublics();
		this.emit('wallet:state', {
			phase: 'created',
		});
	}
	async handleWalletSave(domEvent) {
		const data = domEvent.detail?.data ?? {};
		const sdk = await this.ensureSDK();
		const pkg = await sdk.createWalletPackage(data.password, {
			label: data.label,
			meta: data.profileMeta ?? this.getProfileMeta(),
		});
		const bytes = await sdk.serializeWalletPackage(pkg, 'cbor');
		const base64 = bytesToBase64(bytes);
		await sdk.set('walletSaveMeta', pkg.meta);
		await this.syncWalletPublics();
		this.emit('wallet:saved', {
			base64,
			meta: pkg.meta,
		});
	}
	async handleWalletLoad(domEvent) {
		const data = domEvent.detail?.data ?? {};
		const sdk = await this.ensureSDK();
		const bytes = base64ToBytes(data.base64);
		const pkg = await sdk.deserializeWalletPackage(bytes, 'cbor');
		const imported = await sdk.importWalletPackage(pkg, data.password);
		await this.syncWalletPublics();
		this.emit('wallet:state', {
			phase: 'loaded',
			meta: imported.meta,
		});
	}
	handleProfileUpdate(domEvent) {
		const data = domEvent.detail?.data ?? {};
		setGlobal({
			profile: {
				...this.getProfileMeta(),
				...(data.meta ?? {}),
			},
		});
	}
	ensureNotificationPanel() {
		if (this.notificationPanel?.isConnected) {
			return this.notificationPanel;
		}
		this.notificationPanel = new UINotification();
		document.body.appendChild(this.notificationPanel);
		return this.notificationPanel;
	}
	handleNotify(domEvent) {
		this.ensureNotificationPanel().show(domEvent.detail?.data ?? {});
	}
	syncViewportClass() {
		const w = this.globalState.environment?.viewport?.w ?? 'lg';
		this.classList.value = `vw-${w}`;
	}
	handleViewportChange = () => {
		this.syncViewportClass();
	};
	onMount() {
		this.syncViewportClass();
		this.delegate('viewport:change', this.handleViewportChange);
		this.delegate('open-settings', this.handleOpenSettings);
		this.delegate('toggle-pulldown', this.handleTogglePulldown);
		this.delegate('dockSelect', this.handleDockSelect);
		this.delegate('wallet:create', this.handleWalletCreate);
		this.delegate('wallet:save', this.handleWalletSave);
		this.delegate('wallet:load', this.handleWalletLoad);
		this.delegate('profile:update', this.handleProfileUpdate);
		globalThis.addEventListener('keydown', this.handleKeyShortcut);
	}
	handleOpenSettings = () => {
		this.getComponent('settings-modal')?.open();
	};
	handleTogglePulldown = () => {
		this.emit('pulldown:state', {
			open: !this.pulldownIsOpen(),
		});
	};
	handleDockSelect = (domEvent) => {
		const id = domEvent.detail?.source?.state?.id;
		if (id === 'swap' || id === 'wallet') {
			this.state.activePage = id;
		}
	};
	onVisible() {
		console.log('[AI MAP]\n%s', this.aiMap());
	}
	onDisconnect() {
		globalThis.removeEventListener('keydown', this.handleKeyShortcut);
		this.notificationPanel?.remove();
		this.notificationPanel = null;
	}
	handleKeyShortcut = (domEvent) => {
		if (domEvent.key === 'Escape') {
			if (this.pulldownIsOpen()) {
				this.emit('pulldown:state', {
					open: false,
				});
				domEvent.preventDefault();
			}
			return;
		}
		if (domEvent.key === '`' || domEvent.key === '~') {
			if (this.isTypingFocus()) {
				return;
			}
			this.emit('pulldown:state', {
				open: !this.pulldownIsOpen(),
			});
			domEvent.preventDefault();
		}
	};
	isTypingFocus() {
		let node = document.activeElement;
		while (node) {
			const tag = node.tagName;
			if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
				return true;
			}
			if (node.isContentEditable) {
				return true;
			}
			const shadow = node.shadowRoot;
			if (!shadow) {
				return false;
			}
			node = shadow.activeElement;
		}
		return false;
	}
	pulldownIsOpen() {
		return this.getComponent('global-pulldown')?.refs?.pulldown?.state?.open === true;
	}
	render() {
		// Shell owns persistent chrome; the page slot swaps via future router.
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<global-top-bar></global-top-bar>
			<div class="shell-body">
				<div class="shell-dock-rail">
					<global-dock></global-dock>
				</div>
				<div class="${() => {
					return `shell-page is-page-${this.state.activePage}`;
				}}">
					<app-dashboard class="shell-page-view" @notify=${this.handleNotify}></app-dashboard>
					<swap-page class="shell-page-view"></swap-page>
				</div>
				<global-sidebar></global-sidebar>
			</div>
			<global-bottom-bar></global-bottom-bar>
			<global-pulldown></global-pulldown>
			<settings-modal></settings-modal>
		`;
	}
	get refs() {
		const dashboard = this.getComponent('app-dashboard');
		return {
			dashboard,
			activityLog: dashboard?.getComponent('activity-log'),
			globalBottomBar: this.getComponent('global-bottom-bar'),
			globalDock: this.getComponent('global-dock'),
			networkStats: this.getComponent('global-sidebar')?.getComponent('network-stats'),
			centerBar: dashboard?.getComponent('center-bar'),
			globalTopBar: this.getComponent('global-top-bar'),
			globalPulldown: this.getComponent('global-pulldown'),
			transmitPanel: dashboard?.getComponent('transmit-panel'),
			walletAmount: dashboard?.getComponent('wallet-amount'),
			walletPanel: dashboard?.getComponent('wallet-panel'),
			walletStatsPanel: dashboard?.getComponent('wallet-stats-panel'),
			walletParams: dashboard?.getComponent('wallet-params'),
		};
	}
	async onRender() {
		// TODO: This is a bit of a hack to set the initial state of the dashboard components after they have been rendered. We should instead use the register component function that does this via the DOM but will need to make that a config for the component itself
		const dashboard = this.getComponent('app-dashboard');
		await dashboard.lifecycle.whenRendered;
		const { refs } = this;
		Object.assign(refs.centerBar.state, CENTER_BAR);
		Object.assign(refs.globalTopBar.state, TOP_BAR);
		refs.networkStats.state.chainStatus = CHAIN_STATUS;
		refs.networkStats.state.networkData = NETWORK_DATA;
		Object.assign(refs.walletStatsPanel.state, WALLET_PANEL);
		refs.walletParams.state.params = WALLET_PARAMS;
		Object.assign(refs.walletAmount.state, WALLET_AMOUNT);
		Object.assign(refs.transmitPanel.state, TRANSMIT);
		refs.globalBottomBar.state.columns = BOTTOM_BAR_COLUMNS;
		refs.globalDock.state.items = DOCK.items;
		refs.activityLog.state.activeTab = 'All';
		refs.activityLog.state.entries = ACTIVITY_ENTRIES;
		refs.activityLog.state.tabs = ACTIVITY_TABS;
		setGlobal({
			walletAddress: 'TESTADDRESS',
		});
		setGlobal({
			profileName: 'Elon Musk',
		});
		setGlobal({
			walletAmount: {
				amount: '250,000',
				amountFull: '250,000.000000000.000000000',
			},
		});
	}
}
customElements.define('app-view', AppView);
export default AppView;
