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
import { WebComponent, setGlobalState } from '../components/base/base.js';
const appHost = new CSSStyleSheet();
appHost.replaceSync(`:host { display: block; width: 100vw; height: 100vh; overflow: hidden; }`);
class AppView extends WebComponent {
	constructor() {
		super({
			styles: [appHost],
		});
	}
	static async create() {
		const app = new this();
		await WebComponent.preRender(app, document.body);
		return app;
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<ui-notification></ui-notification>
			<app-dashboard>
				<center-bar slot="center-bar"></center-bar>
				<global-top-bar slot="global-top-bar"></global-top-bar>
				<global-dock slot="global-dock">
					<account-panel slot="account"></account-panel>
				</global-dock>
				<wallet-panel slot="wallet-panel"></wallet-panel>
				<wallet-amount slot="wallet-amount"></wallet-amount>
				<transmit-panel slot="transmit-panel"></transmit-panel>
				<activity-log slot="activity-log"></activity-log>
				<wallet-params slot="wallet-params"></wallet-params>
				<network-stats slot="network-stats"></network-stats>
				<global-bottom-bar slot="global-bottom-bar"></global-bottom-bar>
			</app-dashboard>
		`;
	}
	get refs() {
		return {
			activityLog: this.getComponent('activity-log'),
			globalBottomBar: this.getComponent('global-bottom-bar'),
			globalDock: this.getComponent('global-dock'),
			networkStats: this.getComponent('network-stats'),
			centerBar: this.getComponent('center-bar'),
			globalTopBar: this.getComponent('global-top-bar'),
			transmitPanel: this.getComponent('transmit-panel'),
			walletAmount: this.getComponent('wallet-amount'),
			walletPanel: this.getComponent('wallet-panel'),
			walletParams: this.getComponent('wallet-params'),
		};
	}
	onRender() {
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
		setGlobalState({
			walletAddress: 'TESTADDRESS',
		});
		setGlobalState({
			profileName: 'Elon Musk',
		});
		setGlobalState({
			walletAmount: {
				amount: '250,000',
				amountFull: '250,000.000000000.000000000',
			},
		});
	}
}
customElements.define('app-view', AppView);
export default AppView;
