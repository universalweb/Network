import * as clientModule from './modules/client.js';
import * as elementsModule from './modules/elements.js';
import * as state from './modules/state.js';
import * as stats from './modules/stats.js';
import * as transactions from './modules/transactions.js';
import * as ui from './modules/ui.js';
const elements = elementsModule.getElements();
function getAddressFromURL() {
	const urlParams = new URLSearchParams(window.location.search);
	let address = urlParams.get('address');
	if (address) {
		address = address.replace(/ /g, '+');
	}
	return address;
}
function setAddressInUI(address) {
	// put the address into the elements that the modules expect
	if (elements.statAddress) {
		elements.statAddress.textContent = address || '-';
	}
	if (elements.from) {
		const el = elements.from.querySelector('.address-text');
		if (el) {
			el.textContent = address || '';
			if (address) {
				el.classList.remove('placeholder');
			} else {
				el.classList.add('placeholder');
			}
		}
	}
	// Update UI toggles
	ui.toggleAddressDependentUI(Boolean(address && address.length === 32));
}
function initClient() {
	const client = clientModule.initClient();
	return client;
}
async function init() {
	const address = getAddressFromURL();
	if (!address) {
		document.getElementById('accountAddress').textContent = 'No address specified in URL. Use ?address=YOUR_ADDRESS';
		document.getElementById('accountAddress').classList.add('error');
		document.getElementById('txLoading').style.display = 'none';
		document.getElementById('txEmpty').textContent = 'Please provide an address parameter in the URL';
		document.getElementById('txEmpty').style.display = 'block';
		return;
	}
	// initialize client and modules
	initClient();
	// set the address into UI elements so modules can pick it up
	setAddressInUI(address);
	document.getElementById('accountAddress').textContent = address;
	// Load account stats and transactions using modules
	try {
		// show page-level loading indicator
		document.getElementById('txLoading').style.display = 'block';
		await Promise.all([
			stats.loadAccountStats(address),
			transactions.loadRecentTransactions(1, {
				append: false,
			}),
		]);
		// hide loading when done
		document.getElementById('txLoading').style.display = 'none';
		// stats module may set display:block; ensure our grid layout is applied
		const acctStats = document.getElementById('accountStats');
		if (acctStats) {
			acctStats.style.display = 'grid';
		}
	} catch (error) {
		console.error('Initialization failed', error);
		document.getElementById('txLoading').style.display = 'none';
	}
	// wire load more button
	if (elements.txLoadMore) {
		elements.txLoadMore.addEventListener('click', async () => {
			const nextPage = state.state.currentPage + 1;
			elements.txLoadMore.disabled = true;
			try {
				await transactions.loadRecentTransactions(nextPage, {
					append: true,
				});
			} catch (e) {
				console.error('Load more failed', e);
			} finally {
				elements.txLoadMore.disabled = false;
			}
		});
	}
}
// Expose a simple initializer
export default {
	init,
};
// Auto-run on module load so account.html doesn't need inline script
init().catch((err) => {
	console.error('account.js initialization error:', err);
});
