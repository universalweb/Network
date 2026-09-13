/*
	DESCRIPTION: ui-task-card — one job on a task board. Header (handle +
	label + badge), content (description), footer (priority, tags, assignee).
	Empty regions are hidden. The column owns pointer drag; the board owns
	keyboard move. Host is the listitem (role + tabindex + aria-selected).
	The drag handle is tabindex -1 so it does not steal the roving tab stop.
	── EVENTS ─────────────────────────────────────────────────
	  task-card:select { id, additive, range }
	    click on the card body (not the handle). additive = ctrl/cmd,
	    range = shift.
	  task-card:activate { id }
	    Enter (host focused) or dblclick. The board starts inline edit.
	  task-card:edit { id, field, value, prior }
	    editor committed. The board runs updateCard.
	  task-card:context-menu { id, clientX, clientY }
	    right-click. The board re-emits; the host owns the menu.
	  task-card:drag { id, clientX, clientY, pointerId }
	    pointerdown on the handle. The column starts DragReorder.
	  task-card:key { id, key, additive, range }
	    keydown on the focused host. The board interprets arrows / Space /
	    Enter / Escape. keydown does not compose across shadow, so this
	    event is the crossing. While an editor is open, Escape cancels
	    the edit only — it is not forwarded.
	── USAGE ──────────────────────────────────────────────────
	  <ui-task-card
	    .state.id=${'pump'}
	    .state.label=${'Wire pump'}
	    .state.description=${'Replace the cartridge'}
	    .state.priority=${'high'}></ui-task-card>
	Author: Universal Web
	Date: 2026-09-05
*/
import '../icon/icon.js';
import {
	html,
	isArray,
	WebComponent,
} from 'webcomponent';
import { itemKey } from '../../core/board/items.js';
import {
	isTopEscapable,
	pushEscapable,
	releaseEscapable,
} from '../../core/escape/escapeStack.js';
export class UITaskCard extends WebComponent {
	static url = import.meta.url;
	static styles = {
		taskCard: './task-card.css',
	};
	static state = {
		id: '',
		label: '',
		description: '',
		priority: '',
		tags: [],
		assignee: '',
		badge: '',
		selected: false,
		disabled: false,
		editingField: '',
	};
	editPrior = '';
	escapeRelease = null;
	handleDragStart(domEvent) {
		if (this.state.disabled === true) {
			return;
		}
		domEvent.preventDefault();
		if (domEvent.currentTarget?.setPointerCapture && domEvent.pointerId != null) {
			domEvent.currentTarget.setPointerCapture(domEvent.pointerId);
		}
		this.emit('task-card:drag', {
			id: itemKey(this.state),
			clientX: domEvent.clientX,
			clientY: domEvent.clientY,
			pointerId: domEvent.pointerId,
		});
	}
	onConnect() {
		this.setAttribute('role', 'listitem');
		this.observe('selected', this.syncSelectedAttr, {
			immediate: true,
		});
		this.on('keydown', this.handleKeydown);
		this.on('dblclick', this.handleActivate);
		this.on('contextmenu', this.handleContextMenu);
	}
	onDisconnect() {
		this.releaseEditorEscape();
	}
	syncSelectedAttr() {
		this.setAttribute('aria-selected', this.state.selected === true ? 'true' : 'false');
	}
	handleKeydown(domEvent) {
		if (this.state.disabled === true) {
			return;
		}
		if (this.state.editingField) {
			return;
		}
		const key = domEvent.key;
		if (key !== 'ArrowUp' && key !== 'ArrowDown' && key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== ' ' && key !== 'Enter' && key !== 'Escape') {
			return;
		}
		domEvent.preventDefault();
		this.emit('task-card:key', {
			id: itemKey(this.state),
			key,
			additive: domEvent.metaKey === true || domEvent.ctrlKey === true,
			range: domEvent.shiftKey === true,
		});
	}
	handleActivate(domEvent) {
		if (this.state.disabled === true) {
			return;
		}
		if (this.eventFromHandle(domEvent)) {
			return;
		}
		this.emit('task-card:activate', {
			id: itemKey(this.state),
		});
	}
	eventFromHandle(domEvent) {
		const path = domEvent.composedPath ? domEvent.composedPath() : [];
		const count = path.length;
		for (let index = 0; index < count; index += 1) {
			if (path[index]?.classList?.contains('task-card-handle')) {
				return true;
			}
		}
		return false;
	}
	handleContextMenu(domEvent) {
		if (this.state.disabled === true) {
			return;
		}
		domEvent.preventDefault();
		this.emit('task-card:context-menu', {
			id: itemKey(this.state),
			clientX: domEvent.clientX,
			clientY: domEvent.clientY,
		});
	}
	isEditing() {
		return Boolean(this.state.editingField);
	}
	beginEdit(field) {
		if (this.state.disabled === true) {
			return false;
		}
		const key = field || 'label';
		this.releaseEditorEscape();
		this.editPrior = this.state[key] ?? '';
		this.state.editingField = key;
		this.escapeRelease = pushEscapable(this);
		this.setTimeout(this.focusEditor, 0);
		return true;
	}
	focusEditor(component) {
		const card = component || this;
		const input = card.refs.edit;
		if (!input) {
			return;
		}
		input.focus();
		input.select();
	}
	releaseEditorEscape() {
		if (this.escapeRelease) {
			this.escapeRelease();
			this.escapeRelease = null;
		} else {
			releaseEscapable(this);
		}
	}
	commitEdit() {
		const field = this.state.editingField;
		if (!field) {
			return;
		}
		const input = this.refs.edit;
		const value = input ? input.value : this.state[field];
		const prior = this.editPrior;
		this.releaseEditorEscape();
		this.state.editingField = '';
		this.emit('task-card:edit', {
			id: itemKey(this.state),
			field,
			value,
			prior,
		});
	}
	cancelEdit() {
		if (!this.state.editingField) {
			return;
		}
		this.releaseEditorEscape();
		this.state.editingField = '';
	}
	handleEditKey(domEvent) {
		if (domEvent.key === 'Enter') {
			domEvent.preventDefault();
			domEvent.stopPropagation();
			this.commitEdit();
			return;
		}
		if (domEvent.key === 'Escape') {
			if (!isTopEscapable(this)) {
				return;
			}
			domEvent.preventDefault();
			domEvent.stopPropagation();
			this.cancelEdit();
		}
	}
	handleEditBlur() {
		if (!this.state.editingField) {
			return;
		}
		this.commitEdit();
	}
	handleSelect(domEvent) {
		if (this.state.disabled === true) {
			return;
		}
		this.emit('task-card:select', {
			id: itemKey(this.state),
			additive: domEvent.metaKey === true || domEvent.ctrlKey === true,
			range: domEvent.shiftKey === true,
		});
	}
	setGrabbed(on) {
		this.toggleAttribute('data-grabbed', on === true);
		this.setAttribute('aria-grabbed', on === true ? 'true' : 'false');
	}
	displayLabel() {
		return this.state.label || this.state.id;
	}
	hideContent() {
		return !this.state.description;
	}
	hideFooter() {
		if (this.state.priority) {
			return false;
		}
		if (this.state.assignee) {
			return false;
		}
		const tags = this.state.tags;
		return !(isArray(tags) && tags.length > 0);
	}
	hideBadge() {
		return !this.state.badge;
	}
	hidePriority() {
		return !this.state.priority;
	}
	hideAssignee() {
		return !this.state.assignee;
	}
	tagRow(tag) {
		return html`<span class="task-card-tag">${tag}</span>`;
	}
	renderLabel() {
		if (this.state.editingField === 'label') {
			return this.htmlElement`
				<input class="task-card-label-input" #edit
					value=${this.state.label}
					aria-label=${'Card title'}
					@keydown=${this.handleEditKey}
					@blur=${this.handleEditBlur}>
			`;
		}
		return this.htmlElement`
			<span class="task-card-label">${this.displayLabel}</span>
		`;
	}
	render() {
		this.html`
			<article class="task-card"
				?data-disabled=${this.state.disabled}
				aria-selected=${this.state.selected === true ? 'true' : 'false'}
				@click=${this.handleSelect}>
				<header class="task-card-head">
					<button type="button" class="task-card-handle" aria-label="Drag to reorder"
						tabindex="-1"
						?disabled=${this.state.disabled}
						@pointerdown=${this.handleDragStart}
						@click=${this.stopHandleClick}>
						<ui-icon .state.name=${'grip-vertical'} .state.size=${'sm'}></ui-icon>
					</button>
					${this.renderLabel}
					<span class="task-card-badge" ?hidden=${this.hideBadge}>${this.state.badge}</span>
				</header>
				<div class="task-card-body" ?hidden=${this.hideContent}>${this.state.description}</div>
				<footer class="task-card-foot" ?hidden=${this.hideFooter}>
					<span class="task-card-priority" ?hidden=${this.hidePriority}>${this.state.priority}</span>
					<span class="task-card-tags">${this.list('tags', this.tagRow)}</span>
					<span class="task-card-assignee" ?hidden=${this.hideAssignee}>${this.state.assignee}</span>
				</footer>
			</article>
		`;
	}
	stopHandleClick(domEvent) {
		domEvent.stopPropagation();
	}
}
customElements.define('ui-task-card', UITaskCard);
