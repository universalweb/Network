/*
	One flat row of a <ui-json-inspector> tree. Its own custom element so a row owns
	its caret/copy controls and copied-flash WITHOUT the parent reaching across rows
	(child emits → parent listens). Carries only PRIMITIVE display fields (keyLabel,
	preview string, type, depth, path) — never the live subtree — so the keyed list
	diff is cheap and no large object is cloned per row. The parent owns the data +
	expand-set and re-flattens; a row only renders what it was handed and emits
	`json-row:toggle` { path } on click. Copy-path is self-contained via `copyText`.
*/
import { WebComponent } from 'webcomponent';
const COPY_FLASH_MS = 1000;
export class UIJsonRow extends WebComponent {
	static url = import.meta.url;
	static styles = {
		jsonRow: './json-row.css',
	};
	static state = {
		keyLabel: '',
		isIndex: false,
		preview: '',
		type: 'string',
		depth: 0,
		expandable: false,
		expanded: false,
		path: '',
		childCount: 0,
		matched: false,
		copyPath: true,
		copied: false,
	};
	handleToggle() {
		if (this.state.expandable !== true) {
			return;
		}
		this.emit('json-row:toggle', {
			path: this.state.path,
		});
	}
	async handleCopy(domEvent) {
		domEvent.stopPropagation();
		const accepted = await this.copyText(this.state.path);
		if (accepted !== true) {
			return;
		}
		this.state.copied = true;
		this.setTimeout(() => {
			this.state.copied = false;
		}, COPY_FLASH_MS);
	}
	indentVar() {
		return `--depth:${this.state.depth}`;
	}
	ariaLevel() {
		return this.state.depth + 1;
	}
	ariaExpanded() {
		return this.state.expandable ? String(this.state.expanded) : null;
	}
	isLeaf() {
		return this.state.expandable !== true;
	}
	caretGlyph() {
		if (this.state.expandable !== true) {
			return '';
		}
		return this.state.expanded ? '▾' : '▸';
	}
	copyHidden() {
		return this.state.copyPath !== true;
	}
	copyGlyph() {
		return this.state.copied ? '✓' : '⧉';
	}
	render() {
		this.html`
			<div class="jr" role="treeitem" data-type=${this.state.type} ?data-matched=${this.state.matched}
				aria-level=${this.ariaLevel} aria-expanded=${this.ariaExpanded} style=${this.indentVar}
				@click=${this.handleToggle}>
				<button #caret type="button" class="jr-caret" ?disabled=${this.isLeaf} aria-hidden="true">${this.caretGlyph}</button>
				<span class="jr-key" ?data-index=${this.state.isIndex}>${this.state.keyLabel}</span>
				<span class="jr-sep">:</span>
				<span class="jr-value" data-type=${this.state.type}>${this.state.preview}</span>
				<button type="button" class="jr-copy" ?hidden=${this.copyHidden} ?data-copied=${this.state.copied}
					aria-label="Copy path" @click=${this.handleCopy}>${this.copyGlyph}</button>
			</div>
		`;
	}
}
customElements.define('ui-json-row', UIJsonRow);
