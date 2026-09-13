/**
 *	NAME: CommentSection
 *	TAG: ui-comment-section
 *
 *	── DESCRIPTION ──────────────────────────────────────────────────────
 *	DESCRIPTION: ui-comment-section — threaded comments. A FLAT `items`
 *	array with `parentId` + stamped `depth`; collapse writes `muted` on
 *	descendants from the derived `thread` list. Callers write `items`.
 *	Composes ui-comment (row) which composes ui-message (identity +
 *	bubble). Sort is sibling-local (newest / oldest / top).
 *	REJECTED: a recursive ui-comment-section (N nested list spots, collapse
 *	and sort become a tree of diffs); extending ui-message-scroller
 *	(stick-to-bottom chat, no thread/vote/collapse); extending ui-message
 *	(chat WHO/align policy is the wrong shape); rebuilding bubbles,
 *	avatars, or identity; composing ui-vote-tally (leaderboard).
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (HTML) ─────────────────────────────────────────────────────
 *	  <ui-comment-section .state.items=${thread}></ui-comment-section>
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (JS) ───────────────────────────────────────────────────────
 *	  import { UICommentSection } from './comment-section.js';
 *	  const host = new UICommentSection({ items: thread });
 *	  document.body.append(host);
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── EVENTS ───────────────────────────────────────────────────────────
 *	  comment-section:submit { id, text, parentId }
 *	  comment-section:reply { id }
 *	  comment-section:vote { id, value }
 *	  comment-section:collapse { id, expanded }
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── META ─────────────────────────────────────────────────────────────
 *	Author: Universal Web
 *	Date: 2026-09-05
 *	─────────────────────────────────────────────────────────────────────
 */
import '../button/button.js';
import '../empty-state/empty-state.js';
import '../textarea/textarea.js';
import {
	isArray,
	isEmpty,
	isTrue,
} from '@universalweb/utilitylib';
import { WebComponent } from 'webcomponent';
import { UIComment } from '../comment/comment.js';
function parentKey(item) {
	const key = item?.parentId;
	if (key === undefined || key === null || key === '') {
		return '';
	}
	return String(key);
}
function compareComments(first, second, sortMode) {
	if (sortMode === 'top') {
		const voteDelta = (Number(second.votes) || 0) - (Number(first.votes) || 0);
		if (voteDelta !== 0) {
			return voteDelta;
		}
	}
	const firstTime = Number(first.time) || 0;
	const secondTime = Number(second.time) || 0;
	if (sortMode === 'oldest') {
		return firstTime - secondTime;
	}
	return secondTime - firstTime;
}
function sortCommentBucket(bucket, sortMode) {
	const count = bucket.length;
	if (count < 2) {
		return;
	}
	bucket.sort((first, second) => {
		return compareComments(first, second, sortMode);
	});
}
function flattenComments(childrenOf, ancestorId, depth, ordered) {
	const bucket = childrenOf.get(ancestorId);
	if (!bucket) {
		return;
	}
	const bucketCount = bucket.length;
	for (let index = 0; index < bucketCount; index += 1) {
		const item = bucket[index];
		item.depth = depth;
		const replies = childrenOf.get(item.id);
		item.replyCount = replies ? replies.length : 0;
		ordered.push(item);
		flattenComments(childrenOf, item.id, depth + 1, ordered);
	}
}
function isUnderCollapsed(item, byId) {
	let key = parentKey(item);
	while (key) {
		const ancestor = byId.get(key);
		if (!ancestor) {
			return false;
		}
		if (ancestor.expanded === false) {
			return true;
		}
		key = parentKey(ancestor);
	}
	return false;
}
function stampCommentThread(items, sortMode) {
	if (!isArray(items)) {
		return [];
	}
	const count = items.length;
	const byId = new Map();
	for (let index = 0; index < count; index += 1) {
		const item = items[index];
		if (!item?.id) {
			continue;
		}
		byId.set(item.id, item);
	}
	const childrenOf = new Map();
	const groupIds = [];
	for (let index = 0; index < count; index += 1) {
		const item = items[index];
		if (!item?.id) {
			continue;
		}
		let key = parentKey(item);
		if (key !== '' && !byId.has(key)) {
			key = '';
		}
		let bucket = childrenOf.get(key);
		if (!bucket) {
			bucket = [];
			childrenOf.set(key, bucket);
			groupIds.push(key);
		}
		bucket.push(item);
	}
	const groupCount = groupIds.length;
	for (let index = 0; index < groupCount; index += 1) {
		sortCommentBucket(childrenOf.get(groupIds[index]), sortMode);
	}
	const ordered = [];
	flattenComments(childrenOf, '', 0, ordered);
	const orderedCount = ordered.length;
	for (let index = 0; index < orderedCount; index += 1) {
		const item = ordered[index];
		item.muted = isUnderCollapsed(item, byId);
	}
	return ordered;
}
export class UICommentSection extends WebComponent {
	static url = import.meta.url;
	static styles = {
		commentSection: './comment-section.css',
	};
	static state = {
		items: [],
		/* Derived view of `items` (sibling sort + muted). Callers write `items`. */
		thread: [],
		sort: 'newest',
		composerText: '',
		composerName: 'You',
		replyTo: '',
		showComposer: true,
		showSort: true,
	};
	nextId = 0;
	onConnect() {
		this.observe([
			'items',
			'sort',
		], this.handleItemsChange, {
			immediate: true,
		});
		this.on('comment:vote', this.handleVote);
		this.on('comment:reply', this.handleReply);
		this.on('comment:collapse', this.handleCollapse);
	}
	sortFlag() {
		switch (this.state.sort) {
			case 'oldest': {
				return 'oldest';
			}
			case 'top': {
				return 'top';
			}
			default: {
				return 'newest';
			}
		}
	}
	itemKey(item) {
		return item.id ?? item.key;
	}
	hasNoComments() {
		return !isArray(this.state.items) || isEmpty(this.state.items);
	}
	handleItemsChange() {
		/*
		 * Visible-only `thread`. A same-membership list patch does not re-run a
		 * keep-predicate, so muted descendants must leave the array.
		 */
		const source = isArray(this.state.items) ? this.state.items : [];
		const ordered = stampCommentThread(source, this.sortFlag());
		const visible = [];
		const count = ordered.length;
		for (let index = 0; index < count; index += 1) {
			if (!ordered[index].muted) {
				visible.push(ordered[index]);
			}
		}
		this.state.thread = visible;
	}
	findItem(id) {
		const items = isArray(this.state.items) ? this.state.items : [];
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			if (items[index]?.id === id) {
				return items[index];
			}
		}
		return null;
	}
	submitLabel() {
		if (this.state.replyTo) {
			return 'Reply';
		}
		return 'Comment';
	}
	composerPlaceholder() {
		const replyId = this.state.replyTo;
		if (!replyId) {
			return 'Write a comment';
		}
		const target = this.findItem(replyId);
		const label = String(target?.author ?? '').trim();
		if (label === '') {
			return 'Write a reply';
		}
		return `Reply to ${label}`;
	}
	nextCommentId() {
		this.nextId += 1;
		return `c-${this.nextId}`;
	}
	focusComposer(component) {
		component.findComponent('ui-textarea')?.focus();
	}
	handleComposerInput(domEvent) {
		this.state.composerText = domEvent.detail?.data?.value ?? '';
	}
	handleReply(domEvent) {
		const id = domEvent.detail?.data?.id || '';
		this.state.replyTo = id;
		this.emit('comment-section:reply', {
			id,
		});
		this.setTimeout(this.focusComposer, 0);
	}
	handleCancelReply() {
		this.state.replyTo = '';
	}
	handleVote(domEvent) {
		const data = domEvent.detail?.data;
		const item = this.findItem(data?.id);
		if (item && data) {
			item.vote = data.value;
			if (data.votes !== undefined) {
				item.votes = data.votes;
			}
		}
		this.handleItemsChange();
		this.emit('comment-section:vote', data);
	}
	handleCollapse(domEvent) {
		const data = domEvent.detail?.data;
		const item = this.findItem(data?.id);
		if (item && data) {
			item.expanded = isTrue(data.expanded);
		}
		this.handleItemsChange();
		this.emit('comment-section:collapse', data);
	}
	handleSortNewest() {
		this.state.sort = 'newest';
	}
	handleSortOldest() {
		this.state.sort = 'oldest';
	}
	handleSortTop() {
		this.state.sort = 'top';
	}
	isSortNewest() {
		return this.sortFlag() === 'newest';
	}
	isSortOldest() {
		return this.sortFlag() === 'oldest';
	}
	isSortTop() {
		return this.sortFlag() === 'top';
	}
	handleSubmit() {
		const text = String(this.state.composerText ?? '').trim();
		if (text === '') {
			return;
		}
		let parentId = this.state.replyTo || '';
		if (parentId && !this.findItem(parentId)) {
			parentId = '';
		}
		const id = this.nextCommentId();
		const proceeded = this.emit('comment-section:submit', {
			id,
			text,
			parentId,
		}, {
			cancelable: true,
		});
		if (proceeded === false) {
			return;
		}
		const items = isArray(this.state.items) ? this.state.items.slice() : [];
		items.push({
			id,
			parentId,
			author: String(this.state.composerName ?? '').trim() || 'You',
			text,
			time: Date.now(),
			votes: 0,
			vote: 0,
			expanded: true,
		});
		this.state.composerText = '';
		this.state.replyTo = '';
		this.state.items = items;
	}
	renderSort() {
		if (!isTrue(this.state.showSort)) {
			return '';
		}
		return this.htmlElement`
			<div class="comment-sort" role="group" aria-label="Sort comments">
				<button type="button"
					data-variant="ghost"
					data-tone="neutral"
					data-size="xs"
					data-interactive
					aria-pressed=${this.isSortNewest}
					@click=${this.handleSortNewest}>Newest</button>
				<button type="button"
					data-variant="ghost"
					data-tone="neutral"
					data-size="xs"
					data-interactive
					aria-pressed=${this.isSortOldest}
					@click=${this.handleSortOldest}>Oldest</button>
				<button type="button"
					data-variant="ghost"
					data-tone="neutral"
					data-size="xs"
					data-interactive
					aria-pressed=${this.isSortTop}
					@click=${this.handleSortTop}>Top</button>
			</div>
		`;
	}
	renderEmpty() {
		if (!this.hasNoComments()) {
			return '';
		}
		return this.htmlElement`<ui-empty-state
			.state.heading=${'No comments'}
			.state.hint=${'Be the first to write one.'}></ui-empty-state>`;
	}
	renderComposer() {
		if (!isTrue(this.state.showComposer)) {
			return '';
		}
		return this.htmlElement`
			<div class="comment-composer">
				<ui-textarea
					.state.value=${this.state.composerText}
					.state.placeholder=${this.composerPlaceholder}
					.state.rows=${3}
					.state.autoResize=${true}
					@textarea:input=${this.handleComposerInput}></ui-textarea>
				<div class="comment-composer-actions">
					<ui-button
						.state.variant=${'ghost'}
						.state.size=${'sm'}
						.state.label=${'Cancel'}
						?hidden=${!this.state.replyTo}
						@button:click=${this.handleCancelReply}></ui-button>
					<ui-button
						.state.tone=${'primary'}
						.state.size=${'sm'}
						.state.label=${this.submitLabel}
						@button:click=${this.handleSubmit}></ui-button>
				</div>
			</div>
		`;
	}
	render() {
		this.html`
			<section class="comment-section">
				${this.renderSort}
				${this.renderComposer}
				${this.renderEmpty}
				<div class="comment-list" role="list" ?hidden=${this.hasNoComments}>
					${this.list('thread', UIComment, this.itemKey)}
				</div>
			</section>
		`;
	}
}
customElements.define('ui-comment-section', UICommentSection);
