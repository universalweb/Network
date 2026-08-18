/*
 * `<ui-ai-search>` — in-thread search field for filtering a chat log. Pure UI:
 * two-way `query` + emits `ai-search:input` { query } (live) and
 * `ai-search:submit` { query } (Enter / button). Parent filters messages.
 * Drive with `.query`, `.placeholder`, `.disabled`.
 */
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
export class UIAiSearch extends WebComponent {
	static url = import.meta.url;
	static styles = {
		search: './ai-search.css',
	};
	static state = {
		query: '',
		placeholder: 'Search conversation…',
		disabled: false,
	};
	handleInput() {
		this.emit('ai-search:input', {
			query: this.state.query,
		});
	}
	handleClear() {
		if (this.state.disabled) {
			return;
		}
		this.state.query = '';
		this.emit('ai-search:input', {
			query: '',
		});
	}
	handleSubmit(domEvent) {
		domEvent.preventDefault();
		if (this.state.disabled) {
			return;
		}
		this.emit('ai-search:submit', {
			query: this.state.query,
		});
	}
	get hasQuery() {
		return Boolean(this.state.query);
	}
	render() {
		this.html`
			<form class="aise" @submit=${this.handleSubmit}>
				<ui-icon class="aise-icon" .state.name=${'search'} .state.size=${'sm'}></ui-icon>
				<input class="aise-input"
					type="search"
					name="ai-search-query"
					$value="query"
					placeholder=${this.state.placeholder}
					?disabled=${this.state.disabled}
					@input=${this.handleInput}
					autocomplete="off"
					spellcheck="false">
				<button type="button"
					class="aise-clear"
					?hidden=${!this.hasQuery}
					tooltip="Clear"
					@click=${this.handleClear}>
					<ui-icon .state.name=${'x'} .state.size=${'xs'}></ui-icon>
				</button>
			</form>
		`;
	}
}
customElements.define('ui-ai-search', UIAiSearch);
