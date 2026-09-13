/*
	Test-only Node resolver for the bare `webcomponent` importmap specifier.
	Browsers resolve it via the client importmap (`webcomponent` →
	`/components/core/index.js`). Node has no importmap, so any file that
	`import { WebComponent } from 'webcomponent'` fails under `node --test`
	with ERR_MODULE_NOT_FOUND.
	Import this module BEFORE loading any file that uses that specifier —
	the same side-effect-install shape as happyDomRefShim.js. `registerHooks`
	is in-thread and synchronous, so a subsequent static or dynamic import
	in the same process sees the mapping. A `node --test --import <this file>`
	on the root test script would make it automatic for every suite file;
	that is a package.json change outside the current hold.
*/
import { register, registerHooks } from 'node:module';
import { resolve } from './webcomponentSpecifierLoader.js';
let installed = false;
function installWebcomponentSpecifier() {
	if (installed) {
		return;
	}
	installed = true;
	if (typeof registerHooks === 'function') {
		registerHooks({
			resolve,
		});
		return;
	}
	register(new URL('./webcomponentSpecifierLoader.js', import.meta.url).href, import.meta.url);
}
installWebcomponentSpecifier();
