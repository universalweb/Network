// Single import point: pulls every builtin into the registry on first load,
// then re-exports the public API for downstream code. Order is intentional —
// we register fast/common behaviors first so any ordered iteration favors them.
import { registerBehavior } from './registry.js';
import { tooltip } from './tooltip.js';
import { copy } from './copy.js';
import { confirm } from './confirm.js';
import { shortcut } from './shortcut.js';
import { outsideClick } from './outsideClick.js';
import { autofocus } from './autofocus.js';
import { autoselect } from './autoselect.js';
import { autoResize } from './autoResize.js';
import { reveal } from './reveal.js';
registerBehavior(tooltip.name, tooltip);
registerBehavior(copy.name, copy);
registerBehavior(confirm.name, confirm);
registerBehavior(shortcut.name, shortcut);
registerBehavior(outsideClick.name, outsideClick);
registerBehavior(autofocus.name, autofocus);
registerBehavior(autoselect.name, autoselect);
registerBehavior(autoResize.name, autoResize);
registerBehavior(reveal.name, reveal);
export {
	registerBehavior,
	getBehavior,
	isBehaviorAttr,
	behaviorAttrNames,
} from './registry.js';
