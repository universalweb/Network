import '../components/index.js';
import './tools.js';
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
import { WebComponent, setGlobal } from '../components/core/index.js';
import { UINotification } from '../components/global/notification/notification.js';
class AppView extends WebComponent {
	static url = import.meta.url;
	static styles = {
		app: './app.css',
	};
	id = 'app';
	notificationPanel = null;
	static async create(state, config) {
		const app = new this(await state, config);
		await WebComponent.preRender(app, document.body);
		return app;
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
		window.addEventListener('keydown', this.handleKeyShortcut);
	}
	onVisible() {
		console.log('[AI MAP]\n%s', this.aiMap());
	}
	onDisconnect() {
		window.removeEventListener('keydown', this.handleKeyShortcut);
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
				<div class="shell-page">
					<app-dashboard @notify=${this.handleNotify}></app-dashboard>
				</div>
				<global-sidebar></global-sidebar>
			</div>
			<global-bottom-bar></global-bottom-bar>
			<global-pulldown></global-pulldown>
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
		await dashboard.whenRendered;
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
