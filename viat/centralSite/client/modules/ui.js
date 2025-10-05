import { getAddressTextElement, getElements } from './elements.js';
const elements = getElements();
export function animateReveal(element, animationClass) {
	if (!element) {
		return;
	}
	element.classList.remove(animationClass);
	requestAnimationFrame(() => {
		element.classList.add(animationClass);
		element.addEventListener('animationend', () => {
			element.classList.remove(animationClass);
		}, {
			once: true,
		});
	});
}
function toggleIdentityBar(hasAddress) {
	const identityBar = elements.identityBar;
	if (!identityBar) {
		return;
	}
	const hidden = identityBar.classList.contains('is-hidden');
	if (hasAddress && hidden) {
		identityBar.classList.remove('is-hidden');
		identityBar.dataset.visible = 'true';
		identityBar.hidden = false;
		identityBar.removeAttribute('hidden');
		animateReveal(identityBar, 'identity-bar-enter');
	} else if (!hasAddress && !hidden) {
		identityBar.classList.remove('identity-bar-enter');
		identityBar.classList.add('is-hidden');
		identityBar.dataset.visible = 'false';
		identityBar.hidden = false;
	}
}
function toggleActionButton(button, hasAddress) {
	if (!button) {
		return;
	}
	const hidden = button.classList.contains('is-hidden');
	button.hidden = false;
	if (hasAddress && hidden) {
		button.classList.remove('is-hidden');
		button.dataset.visible = 'true';
		button.disabled = false;
		animateReveal(button, 'control-reveal');
	} else if (!hasAddress && !hidden) {
		button.classList.add('is-hidden');
		button.dataset.visible = 'false';
		button.disabled = true;
		button.classList.remove('control-reveal');
		button.classList.remove('loading');
	}
}
export function toggleAddressDependentUI(hasAddress) {
	toggleIdentityBar(hasAddress);
	toggleActionButton(elements.showKeysBtn, hasAddress);
	toggleActionButton(elements.mintFundsBtn, hasAddress);
}
export function updateAddressDisplay(address) {
	const addressText = getAddressTextElement();
	if (addressText && elements.from) {
		if (address) {
			addressText.textContent = address;
			addressText.classList.remove('placeholder');
			elements.from.classList.remove('empty');
		} else {
			addressText.textContent = 'Address will appear here after generating keys...';
			addressText.classList.add('placeholder');
			elements.from.classList.add('empty');
		}
	}
	// Also update the address in stats if it exists
	if (elements.statAddress) {
		elements.statAddress.textContent = address || '-';
	}
	const hasAddress = typeof address === 'string' && address.length === 28;
	toggleAddressDependentUI(hasAddress);
	if (hasAddress && elements.welcomeOverlay) {
		elements.welcomeOverlay.classList.remove('active');
	}
}
export function getCurrentAddress() {
	const addressText = getAddressTextElement();
	if (addressText && !addressText.classList.contains('placeholder')) {
		return addressText.textContent.trim();
	}
	return '';
}
export function hasValidAddress() {
	const address = getCurrentAddress();
	return Boolean(address && address.length === 28);
}
export function showAccountStats() {
	const accountStats = elements.accountStats;
	if (!accountStats || accountStats.style.display === 'block') {
		return;
	}
	accountStats.style.display = 'block';
	accountStats.classList.remove('is-visible');
	requestAnimationFrame(() => {
		accountStats.classList.add('is-visible');
	});
}
export function hideAccountStats() {
	const accountStats = elements.accountStats;
	if (!accountStats) {
		return;
	}
	accountStats.classList.remove('is-visible');
	accountStats.style.display = 'none';
}
export function setAccountStats(values) {
	const stats = values;
	if (elements.statBalance) {
		elements.statBalance.textContent = stats.balance;
		elements.statBalance.className = stats.balanceClass;
	}
	if (elements.statTotalIn) {
		elements.statTotalIn.textContent = stats.totalIn;
	}
	if (elements.statTotalOut) {
		elements.statTotalOut.textContent = stats.totalOut;
	}
	if (elements.statTxCount) {
		elements.statTxCount.textContent = stats.activity;
	}
}
export function setAccountDefaults() {
	setAccountStats({
		balance: '⩝0',
		balanceClass: 'stat-value',
		totalIn: '󰆹0',
		totalOut: '󰆸0',
		activity: '󰇈0',
	});
}
export function showFieldError(element, input, message) {
	if (element) {
		element.textContent = message;
		element.classList.add('show');
	}
	if (input) {
		input.classList.add('invalid');
		input.style.borderColor = 'var(--danger)';
	}
}
export function clearFieldError(element, input) {
	if (element) {
		element.classList.remove('show');
	}
	if (input) {
		input.classList.remove('invalid');
		input.style.borderColor = '';
	}
}
export function resetTransactionForm() {
	if (elements.txTo) {
		elements.txTo.value = '';
	}
	if (elements.txAmount) {
		elements.txAmount.value = '1';
	}
	if (elements.txSignature) {
		elements.txSignature.value = '';
	}
}
export function setSendButtonState(enabled) {
	if (!elements.sendTransactionBtn) {
		return;
	}
	elements.sendTransactionBtn.disabled = !enabled;
}
export function setLoadingState(button, loading) {
	if (!button) {
		return;
	}
	if (loading) {
		button.classList.add('loading');
		button.disabled = true;
	} else {
		button.classList.remove('loading');
		button.disabled = false;
	}
}
