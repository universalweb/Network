const SELECTOR = 'button, [role="button"][data-tooltip], [role="button"][title], [role="button"][aria-label]';
let tooltipSingleton = null;
async function ensureTooltipSingleton() {
	await customElements.whenDefined('ui-tooltip');
	if (!tooltipSingleton?.isConnected) {
		tooltipSingleton = document.createElement('ui-tooltip');
		document.body.append(tooltipSingleton);
	}
	return tooltipSingleton;
}
function getTooltipText(target) {
	const text = target.dataset.tooltip ||
		target.getAttribute('aria-label') ||
		target.getAttribute('title') ||
		'';
	return text.trim();
}
function suppressNativeTooltip(target) {
	if (target.hasAttribute('title') && !target.dataset.tooltip) {
		target.dataset.tooltip = target.getAttribute('title') ?? '';
		target.removeAttribute('title');
	}
}
function findTrigger(domEvent) {
	const target = domEvent.composedPath()[0];
	return target instanceof Element ? target.closest(SELECTOR) : null;
}
export async function attachTooltips(root) {
	const tooltip = await ensureTooltipSingleton();
	const controller = new AbortController();
	const { signal } = controller;
	let activeTrigger = null;
	function showFor(trigger, mouseX, mouseY) {
		suppressNativeTooltip(trigger);
		const text = getTooltipText(trigger);
		if (!text) {
			return;
		}
		tooltip.show({
			text,
			targetRect: trigger.getBoundingClientRect(),
			mouseX,
			mouseY,
		});
	}
	root.addEventListener('pointerover', (domEvent) => {
		const trigger = findTrigger(domEvent);
		if (!trigger || trigger === activeTrigger) {
			return;
		}
		activeTrigger = trigger;
		showFor(trigger, domEvent.clientX, domEvent.clientY);
	}, {
		signal,
	});
	root.addEventListener('pointermove', (domEvent) => {
		if (activeTrigger) {
			tooltip.track(domEvent.clientX, domEvent.clientY);
		}
	}, {
		signal,
	});
	root.addEventListener('pointerout', (domEvent) => {
		if (!activeTrigger) {
			return;
		}
		const related = domEvent.relatedTarget;
		if (related instanceof Element && activeTrigger.contains(related)) {
			return;
		}
		activeTrigger = null;
		tooltip.hide();
	}, {
		signal,
	});
	root.addEventListener('focusin', (domEvent) => {
		const trigger = findTrigger(domEvent);
		if (!trigger || trigger === activeTrigger) {
			return;
		}
		activeTrigger = trigger;
		showFor(trigger);
	}, {
		signal,
	});
	root.addEventListener('focusout', (domEvent) => {
		if (!activeTrigger) {
			return;
		}
		const trigger = findTrigger(domEvent);
		if (!trigger) {
			return;
		}
		activeTrigger = null;
		tooltip.hide();
	}, {
		signal,
	});
	root.addEventListener('click', (domEvent) => {
		if (findTrigger(domEvent)) {
			activeTrigger = null;
			tooltip.hide();
		}
	}, {
		signal,
	});
	return () => {
		controller.abort();
		activeTrigger = null;
		tooltip.hide();
	};
}
