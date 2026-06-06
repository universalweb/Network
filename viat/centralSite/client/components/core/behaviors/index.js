/*
 * Single import point: pulls every builtin into the registry on first load,
 * then re-exports the public API for downstream code. Order is intentional —
 * we register fast/common behaviors first so any ordered iteration favors them.
 */
import { autoResize } from './autoResize.js';
import { autofocus } from './autofocus.js';
import { autoselect } from './autoselect.js';
import { hotkey } from './hotkey.js';
import { registerBehavior } from './registry.js';
import { reveal } from './reveal.js';
import { scrollReport } from './scrollReport.js';
import { tooltip } from './tooltip.js';
registerBehavior(tooltip.name, tooltip);
registerBehavior(hotkey.name, hotkey);
registerBehavior(autofocus.name, autofocus);
registerBehavior(autoselect.name, autoselect);
registerBehavior(autoResize.name, autoResize);
registerBehavior(reveal.name, reveal);
registerBehavior(scrollReport.name, scrollReport);
export {
	registerBehavior,
	getBehavior,
	isBehaviorAttr,
	behaviorAttrNames,
} from './registry.js';
