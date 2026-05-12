// Global keyboard shortcut binding via the `shortcut="mod+k"` attribute.
// "mod" maps to ⌘ on macOS, Ctrl elsewhere. Other modifiers: ctrl, alt,
// shift, meta. The element receives a programmatic click() when matched.
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
const elementsBySpec = new Map();
function normalize(spec) {
	const parts = String(spec).toLowerCase().split('+').map((p) => {
		return p.trim();
	}).filter(Boolean);
	const mods = new Set();
	let key = '';
	for (let i = 0; i < parts.length; i++) {
		const part = parts[i];
		if (part === 'mod') {
			mods.add(isMac ? 'meta' : 'ctrl');
			continue;
		}
		if (part === 'ctrl' || part === 'alt' || part === 'shift' || part === 'meta') {
			mods.add(part);
			continue;
		}
		key = part;
	}
	const modList = ['ctrl', 'alt', 'shift', 'meta'].filter((m) => {
		return mods.has(m);
	});
	return `${modList.join('+')}|${key}`;
}
function handleKeydown(event) {
	const mods = [];
	if (event.ctrlKey) {
		mods.push('ctrl');
	}
	if (event.altKey) {
		mods.push('alt');
	}
	if (event.shiftKey) {
		mods.push('shift');
	}
	if (event.metaKey) {
		mods.push('meta');
	}
	const key = event.key.toLowerCase();
	const signature = `${mods.join('+')}|${key}`;
	const elements = elementsBySpec.get(signature);
	if (!elements || elements.size === 0) {
		return;
	}
	const target = elements.values().next().value;
	if (!target?.isConnected) {
		elements.delete(target);
		return;
	}
	event.preventDefault();
	target.click();
}
export const shortcut = {
	name: 'shortcut',
	init() {
		document.addEventListener('keydown', handleKeydown);
	},
	install(element, value) {
		const signature = normalize(value);
		let bucket = elementsBySpec.get(signature);
		if (!bucket) {
			bucket = new Set();
			elementsBySpec.set(signature, bucket);
		}
		bucket.add(element);
		return function uninstall() {
			bucket.delete(element);
			if (bucket.size === 0) {
				elementsBySpec.delete(signature);
			}
		};
	},
};
