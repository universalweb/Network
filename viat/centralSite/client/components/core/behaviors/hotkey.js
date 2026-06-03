/*
 * Declarative hotkey binding — the `hotkey="combo"` template attribute.
 * Replaces the old `shortcut=` behavior and shares the one keyboard subsystem
 * (core/hotkeys/hotkeys.js) with the programmatic `this.hotKey()`.
 *
 * On a match the element fires a custom `hotkey` event (bubbling, composed);
 * the consumer wires it declaratively — `<el hotkey="mod+k" @hotkey=${this.go}>`.
 * No synthetic `.click()` — that would conflate keyboard activation with
 * pointer input and force every click-watching handler to disambiguate. The
 * event is the activation.
 */
import { registerHotkey } from '../hotkeys/hotkeys.js';

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

export const hotkey = {
	name: 'hotkey',
	install(element, combo) {
		/*
		 * Template-installed hotkeys: behaviors track an unregister function,
		 * not the entry — there is no component-side `hotkeyEntries` for a
		 * raw element. The entry stays anonymous in the registry and the
		 * `WeakRef` + `FinalizationRegistry` net handles the abnormal path.
		 */
		return registerHotkey(element, combo, activateFromTemplate, 'template').unregister;
	},
};
