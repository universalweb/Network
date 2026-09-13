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
import { captureRects, playFlip, WebComponent } from 'webcomponent';
import { UIVoteItem } from '../vote-item/vote-item.js';
const TALLY_FLIP_MS = 380;
const TALLY_FLIP_EASE = 'cubic-bezier(0.34, 1.3, 0.64, 1)';
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
	async reorderWithFlip() {
		const listEl = this.refs.votelist;
		if (!listEl || this.state.sortBy === 'none') {
			this.applySort();
			return;
		}
		// FIRST: measure every row before the reorder.
		const first = captureRects(listEl.children);
		// LAST: re-rank — the keyed list relocates the SAME nodes via moveBefore.
		this.applySort();
		// INVERT + PLAY on the next frame, once the patch has moved the nodes.
		await this.nextFrame();
		if (this.isDisconnected) {
			return;
		}
		const listAfter = this.refs.votelist;
		if (!listAfter) {
			return;
		}
		playFlip(listAfter.children, first, {
			durationMs: TALLY_FLIP_MS,
			easing: TALLY_FLIP_EASE,
		});
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
