/*
	DESCRIPTION: ui-search-input — ui-input wrapper pinned to type=search.
	Leading search glyph, trailing clear when non-empty, optional loading
	spinner. Debounced `search-input:search` (default 250ms) plus live
	`search-input:input`. Enter → `search-input:submit`. Escape clears.
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-search-input .state.placeholder=${'filter…'}
	    @search-input:search=${this.handleQuery}></ui-search-input>
	  <ui-field .state.label=${'Search'}>
	    <ui-search-input $value="query"></ui-search-input>
	  </ui-field>
	─────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-30
*/
import '../icon/icon.js';
import '../input/input.js';
import { hasValue, isNumber, WebComponent } from 'webcomponent';
const DEFAULT_DEBOUNCE = 250;
export class UISearchInput extends WebComponent {
	static url = import.meta.url;
	static styles = {
		searchInput: './search-input.css',
	};
	static state = {
		value: '',
		placeholder: 'Search…',
		size: 'md',
		tone: 'default',
		disabled: false,
		loading: false,
		debounce: DEFAULT_DEBOUNCE,
		tooltip: '',
	};
	hideClear() {
		const value = this.state.value;
		return !(hasValue(value) && value !== '');
	}
	hideSpinner() {
		return this.state.loading !== true;
	}
	onConnect() {
		this.on('keydown', this.handleKeydown);
	}
	handleInput(domEvent) {
		domEvent.stopPropagation();
		const value = domEvent.detail?.data?.value ?? '';
		this.state.value = value;
		this.emit('search-input:input', {
			value,
		});
		this.armSearch();
	}
	handleChange(domEvent) {
		domEvent.stopPropagation();
		const value = domEvent.detail?.data?.value ?? '';
		this.state.value = value;
		this.emit('search-input:change', {
			value,
		});
	}
	armSearch() {
		const delay = this.state.debounce;
		const ms = isNumber(delay) && delay > 0 ? delay : 0;
		if (ms === 0) {
			this.searchTimer?.clear();
			this.emitSearch(this);
			return;
		}
		(this.searchTimer ??= this.createTimeout(this.emitSearch, ms)).run(undefined, ms);
	}
	emitSearch(component) {
		const host = component || this;
		host.emit('search-input:search', {
			value: host.state.value,
		});
	}
	handleClear() {
		if (this.state.disabled === true) {
			return;
		}
		this.searchTimer?.clear();
		this.state.value = '';
		this.emit('search-input:input', {
			value: '',
		});
		this.emit('search-input:change', {
			value: '',
		});
		this.emit('search-input:search', {
			value: '',
		});
	}
	handleKeydown(domEvent) {
		if (this.state.disabled === true) {
			return;
		}
		if (domEvent.key === 'Escape') {
			if (this.state.value === '') {
				return;
			}
			domEvent.preventDefault();
			this.handleClear();
			return;
		}
		if (domEvent.key === 'Enter') {
			this.searchTimer?.clear();
			this.emit('search-input:submit', {
				value: this.state.value,
			});
		}
	}
	render() {
		this.html`
			<search class="block">
				<ui-input class="search-input-field"
					.state.type=${'search'}
					.state.value=${this.state.value}
					.state.placeholder=${this.state.placeholder}
					.state.size=${this.state.size}
					.state.tone=${this.state.tone}
					.state.disabled=${this.state.disabled}
					.state.tooltip=${this.state.tooltip}
					.state.placeholderCase=${'none'}
					@input:input=${this.handleInput}
					@input:change=${this.handleChange}>
					<ui-icon slot="leading" class="shrink-0" .state.name=${'search'} .state.size=${'sm'} .state.tone=${'muted'}></ui-icon>
					<ui-icon slot="trailing" class="search-input-spin shrink-0" .state.name=${'loader-circle'} .state.size=${'sm'} .state.spin=${true} ?hidden=${this.hideSpinner}></ui-icon>
					<button slot="trailing" type="button" class="search-input-clear inline-flex items-center" ?hidden=${this.hideClear} aria-label="Clear search" @click=${this.handleClear}>
						<ui-icon .state.name=${'x'} .state.size=${'sm'}></ui-icon>
					</button>
				</ui-input>
			</search>
		`;
	}
}
customElements.define('ui-search-input', UISearchInput);
