import './components/index.js';
import {
	ACCOUNT_PANEL,
	ACTIVITY_ENTRIES,
	ACTIVITY_TABS,
	BOTTOM_BAR_COLUMNS,
	CHAIN_STATUS,
	NAV_SECTIONS,
	NETWORK_DATA,
	TOP_BAR,
	TRANSMIT,
	WALLET_AMOUNT,
	WALLET_PARAMS,
} from './components/appDefaults.js';
import { WebComponent } from './components/componentLibrary/base.js';
class ViatApp extends WebComponent {
	store = {
		account: {},
		activity: {
			entries: [...ACTIVITY_ENTRIES],
		},
		wallet: {},
	};
	constructor() {
		super();
		this.shadowRoot.innerHTML = `
			<viat-frame></viat-frame>
			<viat-notification></viat-notification>
			<viat-dashboard>
				<viat-top-bar slot="top-bar"></viat-top-bar>
				<viat-account-panel slot="account-panel"></viat-account-panel>
				<viat-nav-menu slot="nav-menu"></viat-nav-menu>
				<viat-wallet-amount slot="wallet-amount"></viat-wallet-amount>
				<viat-transmit-panel slot="transmit-panel"></viat-transmit-panel>
				<viat-activity-log slot="activity-log"></viat-activity-log>
				<viat-wallet-params slot="wallet-params"></viat-wallet-params>
				<viat-network-stats slot="network-stats"></viat-network-stats>
				<viat-bottom-bar slot="bottom-bar"></viat-bottom-bar>
			</viat-dashboard>
		`;
	}
	get refs() {
		return {
			activityLog: this.getComponent('viat-activity-log'),
			accountPanel: this.getComponent('viat-account-panel'),
			bottomBar: this.getComponent('viat-bottom-bar'),
			navMenu: this.getComponent('viat-nav-menu'),
			networkStats: this.getComponent('viat-network-stats'),
			notifications: this.getComponent('viat-notification'),
			topBar: this.getComponent('viat-top-bar'),
			transmitPanel: this.getComponent('viat-transmit-panel'),
			walletAmount: this.getComponent('viat-wallet-amount'),
			walletParams: this.getComponent('viat-wallet-params'),
		};
	}
	onConnect() {
		const { refs } = this;
		refs.accountPanel.bindNotifications(refs.notifications);
		refs.topBar.updateState({
			...TOP_BAR,
		});
		refs.navMenu.updateState({
			activeLabel: 'wallet',
			sections: NAV_SECTIONS,
		});
		refs.networkStats.updateState({
			chainStatus: CHAIN_STATUS,
			networkData: NETWORK_DATA,
		});
		refs.walletParams.updateState({
			params: WALLET_PARAMS,
		});
		refs.walletAmount.updateState({
			...WALLET_AMOUNT,
		});
		refs.transmitPanel.updateState({
			...TRANSMIT,
		});
		refs.bottomBar.updateState({
			columns: BOTTOM_BAR_COLUMNS,
		});
		refs.activityLog.updateState({
			activeTab: 'All',
			entries: this.store.activity.entries,
			tabs: ACTIVITY_TABS,
		});
		refs.accountPanel.updateState({
			...ACCOUNT_PANEL,
		});
		this.setWalletAddress('viat1newwalletaddressxxxxxxxxxxxxxxxxxxxx');
		this.setProfileName('Elon Musk');
		this.setViatAmount('250,000', '250,000.000000000');
		this.setTimeout(() => {
			this.addActivityEntry({
				message: 'viat1demo...timeout :: +3.500000000 VIAT :: DEMO EVENT :: 0x1sec0001',
			});
		}, 1000);
		window.walletApp = this;
	}
	addActivityEntry(entry = {}) {
		const next = {
			direction: entry.direction ?? 'in',
			message: entry.message ?? '',
			status: entry.status ?? 'ok',
			timestamp: entry.timestamp ?? new Date().toLocaleTimeString('en-GB', {
				hour12: false,
			}),
		};
		this.store.activity.entries = [next, ...this.store.activity.entries];
		this.refs.activityLog.updateState({
			entries: this.store.activity.entries,
		});
		return next;
	}
	setProfileName(profileName) {
		this.store.account.profileName = profileName;
		this.refs.accountPanel.updateState({
			profileName,
		});
	}
	setWalletAddress(walletAddress) {
		this.store.account.walletAddress = walletAddress;
		this.refs.accountPanel.updateState({
			walletAddress,
		});
	}
	setViatAmount(amount, amountFull = `${amount}.000000000`) {
		Object.assign(this.store.wallet, {
			amount,
			amountFull,
		});
		this.refs.walletAmount.updateState({
			amount,
			amountFull,
		});
	}
}
customElements.define('viat-app', ViatApp);
