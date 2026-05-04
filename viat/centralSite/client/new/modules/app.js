import '../components/index.js';
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
import { WebComponent, setGlobal } from '../components/core/base.js';
const appHost = new CSSStyleSheet();
appHost.replaceSync(`:host { display: block; width: 100vw; height: 100vh; overflow: hidden;  }`);
class AppView extends WebComponent {
	static styles = {
		appHost,
	};
	static async create(state, config) {
		const app = new this(await state, config);
		await WebComponent.preRender(app, document.body);
		return app;
	}
	handleNotify(domEvent) {
		this.getComponent('ui-notification')?.show(domEvent.detail?.data ?? {});
	}
	handleSidebarToggle() {
		this.refs.dashboard?.getComponent('dashboard-sidebar')?.toggle();
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<ui-notification></ui-notification>
			<app-dashboard
				@notify=${this.handleNotify}
				@open-dashboard-sidebar=${this.handleSidebarToggle}></app-dashboard>
		`;
	}
	get refs() {
		const dashboard = this.getComponent('app-dashboard');
		return {
			dashboard,
			activityLog: dashboard?.getComponent('activity-log'),
			globalBottomBar: dashboard?.getComponent('global-bottom-bar'),
			globalDock: dashboard?.getComponent('global-dock'),
			networkStats: dashboard?.getComponent('dashboard-sidebar')?.getComponent('network-stats'),
			centerBar: dashboard?.getComponent('center-bar'),
			globalTopBar: dashboard?.getComponent('global-top-bar'),
			transmitPanel: dashboard?.getComponent('transmit-panel'),
			walletAmount: dashboard?.getComponent('wallet-amount'),
			walletPanel: dashboard?.getComponent('wallet-panel'),
			walletParams: dashboard?.getComponent('wallet-params'),
		};
	}
	async onRender() {
		const dashboard = this.getComponent('app-dashboard');
		await WebComponent.waitRenderTree(dashboard);
		const { refs } = this;
		Object.assign(refs.centerBar.state, CENTER_BAR);
		Object.assign(refs.globalTopBar.state, TOP_BAR);
		refs.globalDock.state.items = DOCK.items;
		refs.networkStats.state.chainStatus = CHAIN_STATUS;
		refs.networkStats.state.networkData = NETWORK_DATA;
		Object.assign(refs.walletPanel.state, WALLET_PANEL);
		refs.walletParams.state.params = WALLET_PARAMS;
		Object.assign(refs.walletAmount.state, WALLET_AMOUNT);
		Object.assign(refs.transmitPanel.state, TRANSMIT);
		refs.globalBottomBar.state.columns = BOTTOM_BAR_COLUMNS;
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
