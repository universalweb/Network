/*
	DESCRIPTION: ui-tag-input — a token / tag entry field (filter chips, recipient
	lists, label sets). A flex-wrap field of removable <ui-chip>s followed by a
	growing text input. Type + Enter (or the delimiter key) commits a tag;
	Backspace on an empty input removes the last; pasting delimited text splits
	into many; the ✕ on a chip removes it.
	── OWNERSHIP ─────────────────────────────────────────────────────────
	  UNCONTROLLED, like the codebase's other collection components: `.state.values=`
	  (strings OR {label,value}) is the INITIAL value, read once on mount; the
	  component then owns the live list internally (`liveTags`) and reports every
	  change via events. No writeback needed — and no controlled-echo wasted-set.
	── EVENTS ───────────────────────────────────────────────────────────
	  tag-input:change { values: string[] }  the full value list after any change
	  tag-input:add     { value }            a single addition
	  tag-input:remove  { value }            a single removal
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-tag-input .state.values=${['react', 'vue']} .state.placeholder=${'Add framework…'}
	    .state.max=${8} @tag-input:change=${e => save(e.detail.data.values)}></ui-tag-input>
	──────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from 'webcomponent';
import { UIChip } from '../chip/chip.js';
export class UITagInput extends WebComponent {
	static url = import.meta.url;
	static styles = {
		tagInput: './tag-input.css',
	};
	static state = {
		values: [],
		// Reactive render buffer — chip-state objects derived from `liveTags`,
		// rebuilt only on a real mutation so list() keyed-diffs the chips.
		tagItems: [],
		placeholder: 'Add tag…',
		max: 0,
		size: 'md',
		tone: 'neutral',
		removable: true,
		disabled: false,
		allowDuplicates: false,
		delimiter: ',',
	};
	// The live source of truth — normalized {label, value} objects. Seeded from the
	// `values` seed once on connect; never re-read from it after (uncontrolled).
	liveTags = [];
	onConnect() {
		const seed = Array.isArray(this.state.values) ? this.state.values : [];
		this.liveTags = seed.map((tag) => {
			return {
				label: this.tagLabel(tag),
				value: this.tagValue(tag),
			};
		});
		// Observe only the PRIMITIVE group props (never `values` — that's seed-only, and
		// observing an array prop is what reintroduces the controlled wasted-set echo).
		// This keeps the chips reactive to runtime disabled/size/tone/removable changes.
		this.observe([
			'removable',
			'size',
			'tone',
			'disabled',
		], this.rebuildItems);
		this.rebuildItems();
	}
	rebuildItems() {
		const removable = this.state.removable && !this.state.disabled;
		const items = new Array(this.liveTags.length);
		for (let index = 0; index < this.liveTags.length; index += 1) {
			items[index] = {
				label: this.liveTags[index].label,
				value: this.liveTags[index].value,
				removable,
				disabled: this.state.disabled,
				size: this.state.size,
				tone: this.state.tone,
			};
		}
		this.state.tagItems = items;
	}
	tagLabel(tag) {
		if (typeof tag === 'string') {
			return tag;
		}
		return tag.label ?? String(tag.value ?? '');
	}
	tagValue(tag) {
		if (typeof tag === 'string') {
			return tag;
		}
		return tag.value ?? tag.label ?? '';
	}
	tagKey(item) {
		return item.value;
	}
	atLimit() {
		return this.state.max > 0 && this.liveTags.length >= this.state.max;
	}
	hasTag(value) {
		const probe = value.toLowerCase();
		for (let index = 0; index < this.liveTags.length; index += 1) {
			if (this.liveTags[index].value.toLowerCase() === probe) {
				return true;
			}
		}
		return false;
	}
	currentValues() {
		return this.liveTags.map((tag) => {
			return tag.value;
		});
	}
	addTag(raw) {
		const text = String(raw).trim();
		if (!text || this.state.disabled || this.atLimit()) {
			return false;
		}
		if (!this.state.allowDuplicates && this.hasTag(text)) {
			return false;
		}
		this.liveTags = [
			...this.liveTags,
			{
				label: text,
				value: text,
			},
		];
		this.rebuildItems();
		this.emit('tag-input:add', {
			value: text,
		});
		this.emitChange();
		return true;
	}
	removeTag(value) {
		const next = this.liveTags.filter((tag) => {
			return tag.value !== value;
		});
		if (next.length === this.liveTags.length) {
			return;
		}
		this.liveTags = next;
		this.rebuildItems();
		this.emit('tag-input:remove', {
			value,
		});
		this.emitChange();
	}
	removeLast() {
		if (!this.liveTags.length) {
			return;
		}
		this.removeTag(this.liveTags[this.liveTags.length - 1].value);
	}
	emitChange() {
		this.emit('tag-input:change', {
			values: this.currentValues(),
		});
	}
	commitInput() {
		const input = this.refs.input;
		if (input && this.addTag(input.value)) {
			input.value = '';
		}
	}
	handleKeydown(domEvent) {
		const input = this.refs.input;
		if (domEvent.key === 'Enter' || domEvent.key === this.state.delimiter) {
			domEvent.preventDefault();
			this.commitInput();
		} else if (domEvent.key === 'Backspace' && input && input.value === '') {
			this.removeLast();
		}
	}
	handlePaste(domEvent) {
		const text = domEvent.clipboardData?.getData('text') ?? '';
		if (!text.includes(this.state.delimiter) && !text.includes('\n')) {
			return;
		}
		domEvent.preventDefault();
		// Split on the CONFIGURED delimiter and any newline. Routing the delimiter
		// through a newline join avoids regex escaping and honors a custom delimiter
		// (the hardcoded `,` ignored it).
		const parts = text.split(this.state.delimiter).join('\n').split(/[\n\r]+/);
		for (let index = 0; index < parts.length; index += 1) {
			this.addTag(parts[index]);
		}
	}
	handleChipRemove(domEvent) {
		this.removeTag(domEvent.detail?.data?.value);
	}
	focusInput() {
		this.refs.input?.focus();
	}
	render() {
		this.html`
			<div class="ti" ?data-disabled=${this.state.disabled}
				@click=${this.focusInput} @chip:remove=${this.handleChipRemove}>
				${this.list('tagItems', UIChip, this.tagKey)}
				<input #input class="ti-input" type="text"
					placeholder=${this.state.placeholder}
					?disabled=${this.state.disabled}
					@keydown=${this.handleKeydown} @paste=${this.handlePaste}>
			</div>
		`;
	}
}
customElements.define('ui-tag-input', UITagInput);
