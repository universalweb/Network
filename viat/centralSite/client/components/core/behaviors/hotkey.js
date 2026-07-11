/*
 * Declarative hotkey binding — the `hotkey="combo"` template attribute.
 * Replaces the old `shortcut=` behavior and shares the one keyboard subsystem
 * (core/hotkeys/hotkeys.js) with the programmatic `this.hotKey()`.
 *
 * On a match the element fires a custom `hotkey` event (bubbling, composed);
 * the consumer wires it declaratively — `<element hotkey="mod+k" @hotkey=${this.go}>`.
 * No synthetic `.click()` — that would conflate keyboard activation with
 * pointer input and force every click-watching handler to disambiguate. The
 * event is the activation.
 */
import { createHotkeyEntry, releaseHotkeyEntry } from '../hotkeys/hotkeys.js';
/*
 * element → registry entry. The entry is the teardown handle; keeping it here
 * (instead of a per-install unregister closure) makes uninstall a WeakMap read.
 * The `WeakRef` + `FinalizationRegistry` net inside hotkeys.js still covers the
 * abnormal path where an element is GC'd without teardown.
 */
const entryByElement = new WeakMap();
function activateFromTemplate(keyEvent, combo) {
	// `this` is the element the behavior was installed on.
	this.dispatchEvent(new CustomEvent('hotkey', {
		bubbles: true,
		composed: true,
		detail: {
			combo,
			keyEvent,
		},
	}));
}
class HotkeyBehavior {
	name = 'hotkey';
	install(element, combo) {
		const entry = createHotkeyEntry(element, combo, activateFromTemplate, 'template');
		if (entry) {
			entryByElement.set(element, entry);
		}
	}
	uninstall(element) {
		const entry = entryByElement.get(element);
		if (entry) {
			releaseHotkeyEntry(entry);
			entryByElement.delete(element);
		}
	}
}
export const hotkey = new HotkeyBehavior();
