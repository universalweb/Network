/*
	DESCRIPTION: ui-org-chart — organization hierarchy cards.
	Recursive: each node list('children', UIOrgNode). Org charts are small;
	recursive CEs are the right visual (connectors + card tree), not flat rows.
	Depth is capped at ORG_MAX_DEPTH. Job title is `author` (not `role`).
	Node copy reads `label || name` and `author || title` (string only —
	objects never interpolate). Recursive kids are `${this.list('children', UIOrgNode)}`.
	── EVENTS ───────────────────────────────────────────────────────────
	  org-chart:select { id, item }
	  org-chart:toggle { id, expanded }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-org-chart .state.items=${[{ id, label, author, children }]}></ui-org-chart>
	──────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { isArray, isString } from '@universalweb/utilitylib';
import { WebComponent } from 'webcomponent';
const ORG_MAX_DEPTH = 12;
/**
 * First non-empty string among candidates. Objects stay out of text spots.
 * @param {...*} candidates - Field values from the node item.
 * @returns {string} First non-empty string, or empty string.
 */
function firstText(...candidates) {
	const count = candidates.length;
	for (let index = 0; index < count; index += 1) {
		const value = candidates[index];
		if (isString(value) && value) {
			return value;
		}
	}
	return '';
}
/**
 * Resolve a raw org node by id (depth-capped, cycle-safe via max depth).
 * @param {object[]} items - Org roots.
 * @param {string} needle - Node id.
 * @param {number} [depth] - Walk depth.
 * @returns {object|null} Raw item or null.
 */
function findOrgItem(items, needle, depth) {
	const walkDepth = depth ?? 0;
	if (!isArray(items) || walkDepth >= ORG_MAX_DEPTH || needle == null || needle === '') {
		return null;
	}
	const target = String(needle);
	const count = items.length;
	for (let index = 0; index < count; index += 1) {
		const item = items[index];
		if (!item) {
			continue;
		}
		if (String(item.id) === target) {
			return item;
		}
		const found = findOrgItem(item.children, target, walkDepth + 1);
		if (found) {
			return found;
		}
	}
	return null;
}
export class UIOrgNode extends WebComponent {
	static url = import.meta.url;
	static styles = {
		orgChart: './org-chart.css',
	};
	static state = {
		id: '',
		label: '',
		author: '',
		icon: '',
		description: '',
		children: [],
		expanded: true,
		selected: false,
		depth: 0,
	};
	onConnect() {
		this.stampChildDepth();
	}
	stampChildDepth() {
		const next = (Number(this.state.depth) || 0) + 1;
		const kids = this.state.children;
		if (!isArray(kids) || next >= ORG_MAX_DEPTH) {
			return;
		}
		const count = kids.length;
		for (let index = 0; index < count; index += 1) {
			const child = kids[index];
			if (child && child.depth == null) {
				child.depth = next;
			}
		}
	}
	handleSelect() {
		// Parent resolves the RAW item from its items tree (§2 — never a synthetic copy).
		this.emit('org-node:select', {
			id: this.state.id,
		});
	}
	handleToggle(domEvent) {
		domEvent.stopPropagation();
		this.state.expanded = this.state.expanded !== true;
		this.emit('org-node:toggle', {
			id: this.state.id,
			expanded: this.state.expanded,
		});
	}
	hasChildren() {
		return isArray(this.state.children) && this.state.children.length > 0;
	}
	canNest() {
		return (Number(this.state.depth) || 0) < ORG_MAX_DEPTH;
	}
	kidsHidden() {
		return this.state.expanded !== true || this.hasChildren() !== true || !this.canNest();
	}
	displayLabel() {
		return firstText(this.state.label, this.state.name);
	}
	displayAuthor() {
		return firstText(this.state.author, this.state.title);
	}
	toggleHidden() {
		return this.hasChildren() !== true;
	}
	iconHidden() {
		return !this.state.icon;
	}
	authorHidden() {
		return !this.displayAuthor();
	}
	displayDescription() {
		return firstText(this.state.description);
	}
	descHidden() {
		return !this.displayDescription();
	}
	caretName() {
		return this.state.expanded ? 'chevron-down' : 'chevron-right';
	}
	render() {
		this.html`
			<div class="oc-node" ?data-selected=${this.state.selected}>
				<div class="oc-card" @click=${this.handleSelect}>
					<button type="button" class="oc-toggle" ?hidden=${this.toggleHidden} aria-label="Toggle reports" @click=${this.handleToggle}>
						<ui-icon .state.name=${this.caretName} .state.size=${'sm'}></ui-icon>
					</button>
					<ui-icon class="oc-icon" ?hidden=${this.iconHidden} .state.name=${this.state.icon} .state.size=${'md'}></ui-icon>
					<div class="oc-copy">
						<div class="oc-name">${this.displayLabel}</div>
						<div class="oc-author" ?hidden=${this.authorHidden}>${this.displayAuthor}</div>
						<div class="oc-desc" ?hidden=${this.descHidden}>${this.displayDescription}</div>
					</div>
				</div>
				<div class="oc-kids" ?hidden=${this.kidsHidden}>
					${this.list('children', UIOrgNode)}
				</div>
			</div>
		`;
	}
}
customElements.define('ui-org-node', UIOrgNode);
export class UIOrgChart extends WebComponent {
	static url = import.meta.url;
	static styles = {
		orgChart: './org-chart.css',
	};
	static state = {
		items: [],
		value: '',
	};
	handleNodeSelect(domEvent) {
		const data = domEvent.detail?.data;
		if (!data) {
			return;
		}
		const id = String(data.id ?? '');
		this.state.value = id;
		this.stampSelected(this.state.items, id, 0);
		this.emit('org-chart:select', {
			id,
			item: findOrgItem(this.state.items, id, 0),
		});
	}
	handleNodeToggle(domEvent) {
		const data = domEvent.detail?.data;
		if (!data) {
			return;
		}
		this.emit('org-chart:toggle', {
			id: data.id,
			expanded: data.expanded,
		});
	}
	stampSelected(items, id, depth) {
		const walkDepth = depth ?? 0;
		if (!isArray(items) || walkDepth >= ORG_MAX_DEPTH) {
			return;
		}
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			const item = items[index];
			if (!item) {
				continue;
			}
			item.selected = String(item.id) === id;
			this.stampSelected(item.children, id, walkDepth + 1);
		}
	}
	itemKey(item, index) {
		return item.id ?? index;
	}
	render() {
		this.html`
			<div class="oc" @org-node:select=${this.handleNodeSelect} @org-node:toggle=${this.handleNodeToggle}>
				${this.list('items', UIOrgNode, this.itemKey)}
			</div>
		`;
	}
}
customElements.define('ui-org-chart', UIOrgChart);
