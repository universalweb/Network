/*
	Hover-open driver for Playwright and happy-dom.
	locator.hover() FAILS on these components: Playwright actionability
	hit-tests the locator centre, which is a child CE (ui-invert-arrow
	inside .split-caret, inner button inside ui-icon-button) that
	intercepts the pointer. page.mouse.move does not check actionability.
	page.locator('ui-split-button') also misses hosts nested in preview
	shadows. Pierce every shadow root.
	Sequence that works (Playwright MCP, headed or headless — capability
	is hover:hover / pointer:fine / maxTouchPoints 0, not a gate):
	1. Pierce shadows, getBoundingClientRect of the HOVER TARGET
	   (unified split-button: .split cluster — pointerenter is on the
	   cluster; .split-caret enter only fires when split:true)
	   (tooltip: the inner native button of a composed control)
	2. page.mouse.move(0, 0) FIRST — pointerenter does not re-fire if the
	   mouse is already inside the target from a previous probe
	3. page.mouse.move(cx, cy) onto the target centre
	4. Wait with setTimeout (page.evaluate + globalThis.setTimeout).
	   requestAnimationFrame loops inside page.evaluate wedge this harness
	   and never return.
	Overlay intercepting pointer events was NOT the cause on the
	split-button preview. The driver, not the component, was the gap.
*/
export function collectHosts(tag) {
	const found = [];
	const pending = [document];
	/*
	 * Length is re-read: this queue grows as shadow hosts are discovered.
	 * Caching it would skip every nested root.
	 */
	for (let index = 0; index < pending.length; index += 1) {
		const node = pending[index];
		const root = node.shadowRoot || node;
		if (!root.querySelectorAll) {
			continue;
		}
		const matches = root.querySelectorAll(tag);
		const matchCount = matches.length;
		for (let matchIndex = 0; matchIndex < matchCount; matchIndex += 1) {
			found.push(matches[matchIndex]);
		}
		const all = root.querySelectorAll('*');
		const allCount = all.length;
		for (let childIndex = 0; childIndex < allCount; childIndex += 1) {
			if (all[childIndex].shadowRoot) {
				pending.push(all[childIndex]);
			}
		}
	}
	return found;
}
export function centerOf(element) {
	const box = element.getBoundingClientRect();
	return {
		x: box.left + (box.width / 2),
		y: box.top + (box.height / 2),
		width: box.width,
		height: box.height,
	};
}
export function waitPage(page, delayMs) {
	return page.evaluate((delay) => {
		return new Promise((accept) => {
			globalThis.setTimeout(accept, delay);
		});
	}, delayMs);
}
export async function hoverOpenWithMouse(page, rect) {
	await page.mouse.move(0, 0);
	await waitPage(page, 40);
	await page.mouse.move(rect.x, rect.y);
	await waitPage(page, 80);
}
export function dispatchPointerEnter(element) {
	element.dispatchEvent(new PointerEvent('pointerenter', {
		bubbles: false,
		composed: true,
	}));
}
export function dispatchPointerLeave(element) {
	element.dispatchEvent(new PointerEvent('pointerleave', {
		bubbles: false,
		composed: true,
	}));
}
export function waitMs(delayMs) {
	return new Promise((accept) => {
		globalThis.setTimeout(accept, delayMs);
	});
}
/*
 * Self-contained page.evaluate callbacks. Playwright serializes ONLY the
 * function passed to evaluate — it cannot see sibling exports.
 */
export function probeHoverTarget(args) {
	const tag = args.tag;
	const selector = args.selector;
	const found = [];
	const pending = [document];
	for (let index = 0; index < pending.length; index += 1) {
		const node = pending[index];
		const root = node.shadowRoot || node;
		if (!root.querySelectorAll) {
			continue;
		}
		const matches = root.querySelectorAll(tag);
		const matchCount = matches.length;
		for (let matchIndex = 0; matchIndex < matchCount; matchIndex += 1) {
			found.push(matches[matchIndex]);
		}
		const all = root.querySelectorAll('*');
		const allCount = all.length;
		for (let childIndex = 0; childIndex < allCount; childIndex += 1) {
			if (all[childIndex].shadowRoot) {
				pending.push(all[childIndex]);
			}
		}
	}
	const host = found[0];
	if (!host) {
		return {
			error: `no ${tag}`,
		};
	}
	const hoverEl = selector ? host.shadowRoot?.querySelector(selector) : host;
	if (!hoverEl) {
		return {
			error: `no ${selector}`,
		};
	}
	const box = hoverEl.getBoundingClientRect();
	const surface = host.shadowRoot?.querySelector('.menu-surface');
	return {
		x: box.left + (box.width / 2),
		y: box.top + (box.height / 2),
		width: box.width,
		height: box.height,
		popoverOpen: Boolean(surface?.matches(':popover-open')),
		latched: host.menuLatched === true,
	};
}
export function probeTooltipShell() {
	const tip = document.querySelector('ui-tooltip');
	if (!tip) {
		return {
			present: false,
			open: false,
			text: '',
		};
	}
	const shell = tip.shadowRoot?.querySelector('.tooltip-shell');
	return {
		present: true,
		open: Boolean(tip.isOpen || shell?.matches(':popover-open')),
		text: (tip.state?.text || shell?.textContent || '').trim(),
	};
}
export function probeTooltipTrigger() {
	const found = [];
	const pending = [document];
	for (let index = 0; index < pending.length; index += 1) {
		const node = pending[index];
		const root = node.shadowRoot || node;
		if (!root.querySelectorAll) {
			continue;
		}
		const matches = root.querySelectorAll('ui-icon-button');
		const matchCount = matches.length;
		for (let matchIndex = 0; matchIndex < matchCount; matchIndex += 1) {
			found.push(matches[matchIndex]);
		}
		const all = root.querySelectorAll('*');
		const allCount = all.length;
		for (let childIndex = 0; childIndex < allCount; childIndex += 1) {
			if (all[childIndex].shadowRoot) {
				pending.push(all[childIndex]);
			}
		}
	}
	const host = found[0];
	if (!host) {
		return {
			error: 'no ui-icon-button',
		};
	}
	const innerButton = host.shadowRoot?.querySelector('ui-button');
	const control = innerButton?.shadowRoot?.querySelector('button') ||
		host.shadowRoot?.querySelector('button');
	if (!control) {
		return {
			error: 'no inner button',
		};
	}
	const box = control.getBoundingClientRect();
	return {
		x: box.left + (box.width / 2),
		y: box.top + (box.height / 2),
		width: box.width,
		height: box.height,
		label: control.getAttribute('aria-label') || host.state?.tooltip || '',
	};
}
