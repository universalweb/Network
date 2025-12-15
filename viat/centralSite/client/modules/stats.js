import * as walletState from './state.js';
import {
	getCurrentAddress,
	hideAccountStats,
	setAccountStats,
	showAccountStats,
} from './ui.js';
import { formatAmount } from './utils.js';
import { loadRecentTransactions } from './transactions.js';
const defaultStats = {
	balance: '⩝0',
	balanceClass: 'stat-value',
	totalIn: '󰆹0',
	totalOut: '󰆸0',
	activity: '󰇈0',
};
export async function updateStatsWithDefaults() {
	setAccountStats(defaultStats);
	showAccountStats();
}
export async function loadAccountStats(address = getCurrentAddress()) {
	if (!address) {
		hideAccountStats();
		return;
	}
	try {
		showAccountStats();
		if (!walletState.state.client || typeof walletState.state.client.getAccount !== 'function') {
			await updateStatsWithDefaults();
			return;
		}
		const response = await walletState.state.client.getAccount(address);
		const info = response?.account || response;
		if (!info || response?.success === false) {
			await updateStatsWithDefaults();
			return;
		}
		const balance = BigInt(info.balance || 0);
		const totalIn = BigInt(info.totalIn || 0);
		const totalOut = BigInt(info.totalOut || 0);
		const activity = totalIn + totalOut;
		setAccountStats({
			balance: `⩝${formatAmount(balance)}`,
			balanceClass: balance > 0n ? 'stat-value positive' : 'stat-value',
			totalIn: `󰆹${formatAmount(totalIn)}`,
			totalOut: `󰆸${formatAmount(totalOut)}`,
			activity: `󰇈${formatAmount(activity)}`,
		});
		await loadRecentTransactions(1, {
			append: false,
		});
	} catch (error) {
		console.error('loadAccountStats failed', error);
		hideAccountStats();
		await updateStatsWithDefaults();
	}
}
