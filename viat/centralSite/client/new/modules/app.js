import '../components/index.js';
import {
	ACCOUNT_PANEL,
	ACTIVITY_ENTRIES,
	ACTIVITY_TABS,
	BOTTOM_BAR_COLUMNS,
	CENTER_BAR,
	CHAIN_STATUS,
	NAV_SECTIONS,
	NETWORK_DATA,
	TOP_BAR,
	TRANSMIT,
	WALLET_AMOUNT,
	WALLET_PANEL,
	WALLET_PARAMS,
} from '../components/appDefaults.js';
import { WebComponent } from '../components/base/base.js';
const appHost = new CSSStyleSheet();
appHost.replaceSync(`:host { display: block; width: 100vw; height: 100vh; overflow: hidden; }`);
class AppView extends WebComponent {
	store = {
		account: {},
		activity: {
			entries: [...ACTIVITY_ENTRIES],
		},
		wallet: {},
	};
	constructor() {
		super([appHost]);
		this.shadowRoot.appendChild(document.createElement('ui-notification'));
	}
	static async create() {
		const app = new this();
		await WebComponent.preRender(app, document.body);
		return app;
	}
	buildDashboard() {
		const dashboard = document.createElement('app-dashboard');
		dashboard.innerHTML = `
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
		`;
		return dashboard;
	}
	get refs() {
		return {
			activityLog: this.getComponent('activity-log'),
			globalBottomBar: this.getComponent('global-bottom-bar'),
			globalDock: this.getComponent('global-dock'),
			networkStats: this.getComponent('network-stats'),
			notifications: this.getComponent('ui-notification'),
			centerBar: this.getComponent('center-bar'),
			globalTopBar: this.getComponent('global-top-bar'),
			transmitPanel: this.getComponent('transmit-panel'),
			walletAmount: this.getComponent('wallet-amount'),
			walletPanel: this.getComponent('wallet-panel'),
			walletParams: this.getComponent('wallet-params'),
		};
	}
	onConnect() {
		this.shadowRoot.appendChild(this.buildDashboard());
		const { refs } = this;
		Object.assign(refs.centerBar.state, CENTER_BAR);
		Object.assign(refs.globalTopBar.state, TOP_BAR);
		refs.globalDock.state.activeLabel = 'wallet';
		refs.globalDock.state.sections = NAV_SECTIONS;
		refs.networkStats.state.chainStatus = CHAIN_STATUS;
		refs.networkStats.state.networkData = NETWORK_DATA;
		Object.assign(refs.walletPanel.state, WALLET_PANEL);
		refs.walletParams.state.params = WALLET_PARAMS;
		Object.assign(refs.walletAmount.state, WALLET_AMOUNT);
		Object.assign(refs.transmitPanel.state, TRANSMIT);
		refs.globalBottomBar.state.columns = BOTTOM_BAR_COLUMNS;
		refs.activityLog.activeTab = 'All';
		refs.activityLog.entries = this.store.activity.entries;
		refs.activityLog.state.tabs = ACTIVITY_TABS;
		this.setWalletAddress('TESTADDRESS');
		this.setProfileName('Elon Musk');
		this.setViatAmount('250,000', '250,000.000000000');
		this.setTimeout(() => {
			this.addActivityEntry({
				message: 'viat1demo...timeout :: +3.500000000 VIAT :: DEMO EVENT :: 0x1sec0001',
			});
		}, 2000);
	}
	addActivityEntry(entry = {}) {
		this.getComponent('activity-log').addEntry({
			direction: entry.direction ?? 'in',
			message: entry.message ?? '',
			status: entry.status ?? 'ok',
			timestamp: entry.timestamp ?? new Date().toLocaleTimeString('en-GB', {
				hour12: false,
			}),
		});
	}
	setProfileName(profileName) {
		this.store.account.profileName = profileName;
	}
	setWalletAddress(walletAddress) {
		this.store.account.walletAddress = walletAddress;
		this.refs.walletAmount.state.walletAddress = walletAddress;
		this.refs.walletPanel.state.walletAddress = walletAddress;
	}
	setViatAmount(amount, amountFull = `${amount}.000000000`) {
		Object.assign(this.store.wallet, {
			amount,
			amountFull,
		});
		this.refs.walletAmount.state.amount = amount;
		this.refs.walletAmount.state.amountFull = amountFull;
	}
}
customElements.define('app-view', AppView);
export default AppView;
