import { liveChildren, registerChild } from './children.js';
import { attachTooltips } from '../tooltip-controller.js';
import { eventsMixin } from './events.js';
import { stateMixin } from './state.js';
export { liveChildren, registerChild } from './children.js';
const Base = eventsMixin(stateMixin(HTMLElement));
export class WebComponent extends Base {
	unbindTooltips = null;
	useTooltips = false;
	renderSeq = 0;
	unregisterFromParent = null;
	timeouts = new Set();
	constructor(sheets = [], opts = {}) {
		super();
		this.useTooltips = opts.tooltips === true;
		this.attachShadow({
			mode: 'open',
		});
		if (sheets.length) {
			this.shadowRoot.adoptedStyleSheets = sheets;
		}
	}
	connectedCallback() {
		const root = this.getRootNode();
		if (root instanceof ShadowRoot && root.host instanceof WebComponent) {
			this.unregisterFromParent = registerChild(root.host, this);
		}
		this.connectDelegatedEvents();
		this.onConnect();
		if (this.state) {
			this.applyState();
		} else {
			this.refresh();
		}
	}
	disconnectedCallback() {
		this.unregisterFromParent?.();
		this.unregisterFromParent = null;
		this.disconnectDelegatedEvents();
		this.unbindTooltips?.();
		this.unbindTooltips = null;
		for (const id of this.timeouts) {
			clearTimeout(id);
		}
		this.timeouts.clear();
		this.onDisconnect();
	}
	attributeChangedCallback(attributeName, oldVal, newVal) {
		this.onAttributeChange(attributeName, oldVal, newVal);
		if (this.isConnected) {
			this.refresh();
		}
	}
	getComponent(tag) {
		return liveChildren(this, tag.toLowerCase())[0] ?? null;
	}
	getComponents(tag) {
		return liveChildren(this, tag.toLowerCase());
	}
	// ── lifecycle hooks ───────────────────────────────────────────────────────
	onConnect() {}
	onDisconnect() {}
	onAttributeChange(attributeName, oldVal, newVal) {}
	render() {}
	// ── public helpers ────────────────────────────────────────────────────────
	async refresh() {
		const seq = ++this.renderSeq;
		await this.render();
		if (seq !== this.renderSeq) {
			return;
		}
		this.syncDelegatedEvents();
		if (this.useTooltips) {
			this.unbindTooltips?.();
			this.unbindTooltips = null;
			attachTooltips(this.getComponentRoot()).then((unbind) => {
				this.unbindTooltips = unbind;
			});
		}
	}
	setTimeout(fn, ms) {
		const id = setTimeout(() => {
			this.timeouts.delete(id);
			fn();
		}, ms);
		this.timeouts.add(id);
		return id;
	}
	clearTimeout(id) {
		clearTimeout(id);
		this.timeouts.delete(id);
	}
	getComponentRoot() {
		return this.shadowRoot ?? this;
	}
}
