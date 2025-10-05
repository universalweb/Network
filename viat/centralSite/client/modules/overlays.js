let lockCount = 0;
function updateScrollLock() {
	document.body.style.overflow = lockCount > 0 ? 'hidden' : '';
}
function acquireLock() {
	lockCount += 1;
	updateScrollLock();
}
function releaseLock() {
	lockCount = Math.max(0, lockCount - 1);
	updateScrollLock();
}
export function createOverlay(element) {
	if (!element) {
		return {
			openOverlay() {},
			closeOverlay() {},
			isOpen() {
				return false;
			},
		};
	}
	function openOverlay(options = {}) {
		const config = options;
		if (config.extraClass) {
			element.dataset.extraClass = config.extraClass;
			element.classList.add(config.extraClass);
		}
		element.classList.add('active');
		acquireLock();
		if (config.focus) {
			config.focus.focus();
		}
	}
	function closeOverlay() {
		element.classList.remove('active');
		if (element.dataset.extraClass) {
			element.classList.remove(element.dataset.extraClass);
			delete element.dataset.extraClass;
		}
		releaseLock();
	}
	element.addEventListener('click', (evt) => {
		if (evt.target === element) {
			closeOverlay();
		}
	});
	return {
		openOverlay,
		closeOverlay,
		isOpen() {
			return element.classList.contains('active');
		},
	};
}
export function closeAll(overlays) {
	overlays.forEach((overlay) => {
		if (overlay.isOpen()) {
			overlay.closeOverlay();
		}
	});
}
