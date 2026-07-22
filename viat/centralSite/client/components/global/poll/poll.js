/*
	DESCRIPTION: ui-poll — a select → lock → animated-results poll (zero-dep, no
	build). Renders an option list (ui-poll-option children); the user picks one
	(single-select / radio) or several (multiple / checkbox), votes, and the
	results reveal as spring-grown percentage bars. The canonical base for
	ui-choice-poll / ui-feature-poll / ui-poll-widget (thin preset subclasses).
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-poll
	    .state.question=${'Which ships first?'}
	    .state.items=${[{ id: 'a', label: 'Wallet', votes: 12 }, …]}>
	  </ui-poll>
	`multiple` → checkbox multi-select; `instant` → single-select locks on pick
	(no Vote button). Percentages + the user's +1 are computed at lock-time and
	deep-written onto each option (never a per-render enrichment loop).
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from 'webcomponent';
class UIPollOption extends WebComponent {
	static url = import.meta.url;
	static styles = {
		pollOption: './poll-option.css',
	};
	static state = {
		id: '',
		label: '',
		description: '',
		votes: 0,
		percentage: 0,
		selected: false,
		revealed: false,
	};
	// Method ref → reactive spot: the bar width tracks `percentage`, so the
	// lock-time write animates 0 → final via the CSS inline-size transition.
	barStyle() {
		return `inline-size: ${Number(this.state.percentage) || 0}%`;
	}
	handleClick() {
		// The child only announces intent; the parent owns selection in both
		// modes (single = exclusive, multi = toggle) via event-time deep writes.
		this.emit('poll:select', {
			id: this.state.id,
		});
	}
	render() {
		this.html`
			<button
				class="opt" type="button"
				?data-selected=${this.state.selected}
				?data-revealed=${this.state.revealed}
				aria-pressed=${this.state.selected}
				@click=${this.handleClick}>
				<span class="opt-bar" style=${this.barStyle} aria-hidden="true"></span>
				<span class="opt-face">
					<span class="opt-mark" aria-hidden="true"></span>
					<span class="opt-text">
						<span class="opt-label">${this.state.label}</span>
						<span class="opt-desc" ?hidden=${!this.state.description}>${this.state.description}</span>
					</span>
					<span class="opt-pct" ?hidden=${!this.state.revealed}>${this.state.percentage}%</span>
				</span>
			</button>
		`;
	}
}
customElements.define('ui-poll-option', UIPollOption);
export class UIPoll extends WebComponent {
	static url = import.meta.url;
	static styles = {
		poll: './poll.css',
	};
	static state = {
		items: [],
		question: '',
		multiple: false,
		instant: false,
		variant: 'default',
		locked: false,
		showResults: false,
		hasSelection: false,
		totalVotes: 0,
		buttonLabel: 'Vote',
		votedLabel: 'Voted ✓',
	};
	optionKey(item) {
		return item.id;
	}
	handleSelect(domEvent) {
		if (this.state.locked) {
			return;
		}
		const id = domEvent.detail?.data?.id;
		if (id === undefined || id === null) {
			return;
		}
		const options = this.state.items;
		let anySelected = false;
		for (let index = 0; index < options.length; index += 1) {
			const option = options[index];
			if (this.state.multiple) {
				if (option.id === id) {
					option.selected = !option.selected;
				}
			} else {
				option.selected = option.id === id;
			}
			if (option.selected) {
				anySelected = true;
			}
		}
		this.state.hasSelection = anySelected;
		// Single-select instant mode skips the Vote button entirely.
		if (this.state.instant && !this.state.multiple) {
			this.lockIn();
		}
	}
	lockIn() {
		if (this.state.locked) {
			return;
		}
		const options = this.state.items;
		let anySelected = false;
		for (let index = 0; index < options.length; index += 1) {
			if (options[index].selected) {
				anySelected = true;
				break;
			}
		}
		if (!anySelected) {
			return;
		}
		// Tally the user's +1 onto each picked option, then total.
		let total = 0;
		for (let index = 0; index < options.length; index += 1) {
			const option = options[index];
			const base = Number(option.votes) || 0;
			const tallied = option.selected ? base + 1 : base;
			option.votes = tallied;
			total += tallied;
		}
		// Deep-write the group-relative percentage onto each option (event-time,
		// not per render) and reveal — the child's bar animates to it.
		for (let index = 0; index < options.length; index += 1) {
			const option = options[index];
			option.percentage = total > 0 ? Math.round((Number(option.votes) / total) * 100) : 0;
			option.revealed = true;
		}
		this.assignState({
			locked: true,
			showResults: true,
			totalVotes: total,
		});
		this.emit('poll:vote', {
			totalVotes: total,
		});
	}
	handleVoteClick() {
		this.lockIn();
	}
	voteDisabled() {
		return Boolean(this.state.locked || !this.state.hasSelection);
	}
	render() {
		this.html`
			<div
				class="poll"
				data-variant=${this.state.variant}
				?data-locked=${this.state.locked}
				?data-multiple=${this.state.multiple}>
				<p class="poll-q" ?hidden=${!this.state.question}>${this.state.question}</p>
				<div class="poll-opts" @poll:select=${this.handleSelect}>
					${this.list('items', UIPollOption, this.optionKey)}
				</div>
				<div class="poll-foot" ?hidden=${this.state.instant}>
					<ui-button .state=${{
						label: this.state.locked ? this.state.votedLabel : this.state.buttonLabel,
						tone: 'primary',
						size: 'sm',
						disabled: this.voteDisabled(),
					}} @button:click=${this.handleVoteClick}></ui-button>
					<span class="poll-total" ?hidden=${!this.state.showResults}>${this.state.totalVotes} votes</span>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-poll', UIPoll);
