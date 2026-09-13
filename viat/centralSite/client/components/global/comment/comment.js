/**
 *	NAME: Comment
 *	TAG: ui-comment
 *
 *	── DESCRIPTION ──────────────────────────────────────────────────────
 *	DESCRIPTION: ui-comment — one row in a comment thread. Identity and
 *	bubble are composed ui-message (which composes ui-text-message and
 *	ui-avatar). This class owns the thread chrome the chat primitives
 *	do not have: score, reply, collapse.
 *	REJECTED: rebuilding bubbles or identity (ui-message / ui-text-message
 *	already split WHO from the bubble); composing ui-vote-item (that is
 *	a leaderboard row with label+description, not a compact score);
 *	nesting ui-comment-section (recursive component — the section is a
 *	flat list with depth, this row is one item).
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (HTML) ─────────────────────────────────────────────────────
 *	  <ui-comment .state.author=${'Ada'} .state.text=${'Ship it.'}></ui-comment>
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (JS) ───────────────────────────────────────────────────────
 *	  import { UIComment } from './comment.js';
 *	  const host = new UIComment({ author: 'Ada', text: 'Ship it.' });
 *	  document.body.append(host);
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── EVENTS ───────────────────────────────────────────────────────────
 *	  comment:vote { id, value }
 *	  comment:reply { id }
 *	  comment:collapse { id, expanded }
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── META ─────────────────────────────────────────────────────────────
 *	Author: Universal Web
 *	Date: 2026-09-05
 *	─────────────────────────────────────────────────────────────────────
 */
import '../icon/icon.js';
import '../message/message.js';
import { isFalse, isTrue } from '@universalweb/utilitylib';
import { WebComponent } from 'webcomponent';
export class UIComment extends WebComponent {
	static url = import.meta.url;
	static styles = {
		comment: './comment.css',
	};
	static state = {
		id: '',
		parentId: '',
		author: '',
		avatar: '',
		text: '',
		time: 0,
		votes: 0,
		vote: 0,
		depth: 0,
		replyCount: 0,
		expanded: true,
		muted: false,
	};
	onConnect() {
		this.setAttribute('role', 'listitem');
	}
	displayName() {
		const label = String(this.state.author ?? '').trim();
		if (label === '') {
			return 'Anonymous';
		}
		return label;
	}
	depthValue() {
		return Number(this.state.depth) || 0;
	}
	isCollapsed() {
		return isFalse(this.state.expanded);
	}
	repliesExpanded() {
		return !isFalse(this.state.expanded);
	}
	hasReplies() {
		return (Number(this.state.replyCount) || 0) > 0;
	}
	isUpvoted() {
		return Number(this.state.vote) === 1;
	}
	isDownvoted() {
		return Number(this.state.vote) === -1;
	}
	upTone() {
		return this.isUpvoted() ? 'primary' : 'neutral';
	}
	downTone() {
		return this.isDownvoted() ? 'primary' : 'neutral';
	}
	collapseLabel() {
		if (this.isCollapsed()) {
			return 'Show replies';
		}
		return 'Hide replies';
	}
	expandedFlag() {
		return this.repliesExpanded() ? 'true' : 'false';
	}
	hideCollapse() {
		return !this.hasReplies();
	}
	upPressed() {
		return this.isUpvoted() ? 'true' : 'false';
	}
	downPressed() {
		return this.isDownvoted() ? 'true' : 'false';
	}
	applyVote(nextVote) {
		const current = Number(this.state.vote) || 0;
		const next = current === nextVote ? 0 : nextVote;
		this.state.vote = next;
		this.state.votes = (Number(this.state.votes) || 0) + (next - current);
		this.emit('comment:vote', {
			id: this.state.id,
			value: next,
			votes: this.state.votes,
		});
	}
	handleUp() {
		this.applyVote(1);
	}
	handleDown() {
		this.applyVote(-1);
	}
	handleReply() {
		this.emit('comment:reply', {
			id: this.state.id,
		});
	}
	handleCollapse() {
		this.state.expanded = isFalse(this.state.expanded);
		this.emit('comment:collapse', {
			id: this.state.id,
			expanded: isTrue(this.state.expanded),
		});
	}
	render() {
		this.html`
			<article class="comment"
				style=${`--comment-depth:${this.depthValue()}`}
				data-depth=${this.depthValue}
				?data-collapsed=${this.isCollapsed}>
				<ui-message
					.state.name=${this.displayName}
					.state.text=${this.state.text}
					.state.time=${this.state.time}
					.state.avatar=${this.state.avatar}
					.state.showAvatar=${true}
					.state.align=${'start'}></ui-message>
				<div class="comment-actions">
					<div class="comment-score">
						<button type="button"
							data-variant="ghost"
							data-tone=${this.upTone}
							data-size="xs"
							data-interactive
							aria-label="Upvote"
							aria-pressed=${this.upPressed}
							@click=${this.handleUp}>
							<ui-icon .state.name=${'chevron-up'} .state.size=${'sm'}></ui-icon>
						</button>
						<span class="comment-votes" aria-live="polite">${this.state.votes}</span>
						<button type="button"
							data-variant="ghost"
							data-tone=${this.downTone}
							data-size="xs"
							data-interactive
							aria-label="Downvote"
							aria-pressed=${this.downPressed}
							@click=${this.handleDown}>
							<ui-icon .state.name=${'chevron-down'} .state.size=${'sm'}></ui-icon>
						</button>
					</div>
					<button type="button"
						data-variant="ghost"
						data-tone="neutral"
						data-size="xs"
						data-interactive
						aria-label="Reply"
						@click=${this.handleReply}>Reply</button>
					<button type="button"
						data-variant="ghost"
						data-tone="neutral"
						data-size="xs"
						data-interactive
						?hidden=${this.hideCollapse}
						aria-expanded=${this.expandedFlag}
						aria-label=${this.collapseLabel}
						@click=${this.handleCollapse}>${this.collapseLabel}</button>
				</div>
			</article>
		`;
	}
}
customElements.define('ui-comment', UIComment);
