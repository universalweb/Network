import { WebComponent } from 'webcomponent';
const COUNT_MS = 500;
function prefersReducedMotion() {
	return Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
}
export class UIVoteItem extends WebComponent {
	static url = import.meta.url;
	static styles = {
		voteItem: './vote-item.css',
	};
	static state = {
		id: '',
		label: '',
		description: '',
		votes: 0,
		shownVotes: 0,
		voted: false,
	};
	onConnect() {
		this.counting = false;
		// Roll the displayed count whenever the real vote count changes.
		this.observe('votes', () => {
			this.countTo(Number(this.state.votes) || 0);
		});
	}
	onMount() {
		this.countTo(Number(this.state.votes) || 0);
	}
	countTo(target) {
		this.countTarget = target;
		if (prefersReducedMotion()) {
			this.state.shownVotes = target;
			return;
		}
		this.countFrom = Number(this.state.shownVotes) || 0;
		this.countStart = globalThis.performance.now();
		if (!this.counting) {
			this.counting = true;
			this.countStep();
		}
	}
	countStep() {
		if (this.isDisconnected) {
			this.counting = false;
			return;
		}
		const elapsed = globalThis.performance.now() - this.countStart;
		const fraction = Math.min(1, elapsed / COUNT_MS);
		const eased = 1 - ((1 - fraction) ** 3);
		this.state.shownVotes = Math.round(this.countFrom + ((this.countTarget - this.countFrom) * eased));
		if (fraction < 1) {
			this.nextFrame().then(() => {
				this.countStep();
			});
			return;
		}
		this.state.shownVotes = this.countTarget;
		this.counting = false;
	}
	handleUp() {
		this.emit('vote-tally:toggle', {
			id: this.state.id,
		});
	}
	render() {
		this.html`
			<div class="vote" ?data-voted=${this.state.voted}>
				<button class="vote-up" type="button" aria-pressed=${this.state.voted} aria-label="Upvote" @click=${this.handleUp}>
					<ui-icon class="vote-chevron" .state.name=${'chevron-up'} .state.size=${'sm'}></ui-icon>
					<span class="vote-count">${this.state.shownVotes}</span>
				</button>
				<span class="vote-text">
					<span class="vote-label">${this.state.label}</span>
					<span class="vote-desc" ?hidden=${!this.state.description}>${this.state.description}</span>
				</span>
			</div>
		`;
	}
}
customElements.define('ui-vote-item', UIVoteItem);
