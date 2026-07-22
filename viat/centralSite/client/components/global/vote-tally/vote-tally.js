/*
	DESCRIPTION: ui-vote-tally — an upvote leaderboard (zero-dep, no build). Each
	row carries an independent upvote toggle and a live count; voting re-ranks the
	list. cult-ui's vote-tally / feature-voting ship ZERO motion — we add two:
	  • count-up — the row number rolls to its new value (rAF tween, eased).
	  • FLIP reorder — when a vote changes the ranking, rows slide to their new
	    seats (measure → keyed moveBefore relocates the nodes → invert → play).
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-vote-tally
	    .state.heading=${'Most wanted'}
	    .state.items=${[{ id: 'a', label: 'Dark mode', votes: 42 }, …]}>
	  </ui-vote-tally>
	`sortBy`: desc (default) | asc | none. The base for ui-feature-voting.
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from 'webcomponent';
const COUNT_MS = 500;
const FLIP_MS = 380;
const FLIP_SPRING = 'cubic-bezier(0.34, 1.3, 0.64, 1)';
function prefersReducedMotion() {
	return Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
}
class UIVoteItem extends WebComponent {
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
export class UIVoteTally extends WebComponent {
	static url = import.meta.url;
	static styles = {
		voteTally: './vote-tally.css',
	};
	static state = {
		items: [],
		sortBy: 'desc',
		heading: '',
		variant: 'default',
	};
	onConnect() {
		// Seed + maintain the ranking the moment `items` is bound (and re-seed if a
		// parent re-applies an unsorted array). `immediate` covers the case where
		// items is already set before connect; the change-guard in applySort stops
		// the reassign from re-triggering this into a loop.
		this.observe('items', () => {
			this.applySort();
		}, {
			immediate: true,
		});
	}
	itemKey(item) {
		return item.id;
	}
	handleVote(domEvent) {
		const id = domEvent.detail?.data?.id;
		if (id === undefined || id === null) {
			return;
		}
		const items = this.state.items;
		for (let index = 0; index < items.length; index += 1) {
			const item = items[index];
			if (item.id === id) {
				const wasVoted = Boolean(item.voted);
				item.voted = !wasVoted;
				item.votes = Math.max(0, (Number(item.votes) || 0) + (wasVoted ? -1 : 1));
				break;
			}
		}
		this.reorderWithFlip();
	}
	toggleSort() {
		this.state.sortBy = this.state.sortBy === 'desc' ? 'asc' : 'desc';
		this.reorderWithFlip();
	}
	applySort() {
		const direction = this.state.sortBy;
		if (direction === 'none') {
			return;
		}
		const current = this.state.items;
		const sorted = current.slice().sort((first, second) => {
			const firstVotes = Number(first.votes) || 0;
			const secondVotes = Number(second.votes) || 0;
			return direction === 'asc' ? (firstVotes - secondVotes) : (secondVotes - firstVotes);
		});
		// Only write when the order actually changes — this both avoids needless
		// reorders and breaks the observe → applySort → reassign feedback loop.
		let changed = false;
		for (let index = 0; index < sorted.length; index += 1) {
			if (sorted[index] !== current[index]) {
				changed = true;
				break;
			}
		}
		if (changed) {
			this.state.items = sorted;
		}
	}
	reorderWithFlip() {
		const listEl = this.refs.votelist;
		if (!listEl || this.state.sortBy === 'none' || prefersReducedMotion()) {
			this.applySort();
			return;
		}
		// FIRST: measure every row before the reorder.
		const firstRects = new Map();
		const before = listEl.children;
		for (let index = 0; index < before.length; index += 1) {
			firstRects.set(before[index], before[index].getBoundingClientRect());
		}
		// LAST: re-rank — the keyed list relocates the SAME nodes via moveBefore.
		this.applySort();
		// INVERT + PLAY on the next frame, once the patch has moved the nodes.
		this.nextFrame().then(() => {
			this.playFlip(firstRects);
		});
	}
	playFlip(firstRects) {
		const listEl = this.refs.votelist;
		if (!listEl) {
			return;
		}
		const after = listEl.children;
		for (let index = 0; index < after.length; index += 1) {
			const element = after[index];
			const prev = firstRects.get(element);
			if (!prev) {
				continue;
			}
			const now = element.getBoundingClientRect();
			const deltaX = prev.left - now.left;
			const deltaY = prev.top - now.top;
			if (deltaX === 0 && deltaY === 0) {
				continue;
			}
			element.animate([
				{
					transform: `translate(${deltaX}px, ${deltaY}px)`,
				},
				{
					transform: 'translate(0, 0)',
				},
			], {
				duration: FLIP_MS,
				easing: FLIP_SPRING,
			});
		}
	}
	render() {
		this.html`
			<div class="tally" data-variant=${this.state.variant}>
				<div class="tally-head" ?hidden=${!this.state.heading}>
					<span class="tally-title">${this.state.heading}</span>
					<button
						class="tally-sort" type="button"
						?hidden=${this.state.sortBy === 'none'}
						tooltip="Toggle sort order"
						@click=${this.toggleSort}>
						<ui-icon .state.name=${() => {
							return this.state.sortBy === 'asc' ? 'arrow-up-narrow-wide' : 'arrow-down-wide-narrow';
						}} .state.size=${'sm'}></ui-icon>
					</button>
				</div>
				<div class="tally-list" #votelist @vote-tally:toggle=${this.handleVote}>
					${this.list('items', UIVoteItem, this.itemKey)}
				</div>
			</div>
		`;
	}
}
customElements.define('ui-vote-tally', UIVoteTally);
