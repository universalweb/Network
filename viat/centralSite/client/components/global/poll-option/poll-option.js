import { WebComponent } from 'webcomponent';
export class UIPollOption extends WebComponent {
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
				class="poll-option" type="button"
				?data-selected=${this.state.selected}
				?data-revealed=${this.state.revealed}
				aria-pressed=${this.state.selected}
				@click=${this.handleClick}>
				<span class="poll-option-bar" style=${this.barStyle} aria-hidden="true"></span>
				<span class="poll-option-face">
					<span class="poll-option-mark" aria-hidden="true"></span>
					<span class="poll-option-text">
						<span class="poll-option-label">${this.state.label}</span>
						<span class="poll-option-desc" ?hidden=${!this.state.description}>${this.state.description}</span>
					</span>
					<span class="poll-option-pct" ?hidden=${!this.state.revealed}>${this.state.percentage}%</span>
				</span>
			</button>
		`;
	}
}
customElements.define('ui-poll-option', UIPollOption);
