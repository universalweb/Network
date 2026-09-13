/*
	DESCRIPTION: ui-schedule-board — resource lanes × time. Housecall-Pro-style
	dispatch: technicians as lanes, position inside a lane is TIME.
	ASSUMPTION (cheap to revert): the ITEM is an ASSIGNMENT
	  `{ id, jobId, resourceId, start, end, recurrence? }`
	NOT the job. A job with two technicians is two blocks — one-item-one-lane
	stays true, and findConflicts is per-resource.
	RECURRENCE (cheap to revert): RRULE subset via core/time/recurrence.js.
	A template expands to the visible day only. Edits to one occurrence
	(detached exceptions) are OUT OF SCOPE this pass.
	SHARED WITH ui-task-board — core/board/items.js
	  master `items` is the source of truth (splice/notify, never reassign under
	  a parent carrier); observe-time grouping into `state.lanes`; one item, one
	  lane; change/select payload `{ items, id, lane }`. That list used to be two
	  copies of the same code; it is now one module, with `laneField` / `dataKey`
	  naming the fields so ONE job list can be grouped by technician here and by
	  status on the task board. Conflicts and overlap tracks stay HERE, reached
	  through the module's decorate hook — they are meaningless on a board where
	  position is ordinal.
	GENUINELY DIFFERENT
	  position inside a lane is snapped start/end (CSS inset from minutes), not
	  ordinal index. DragReorder.resolveIndex returns snapped start minutes
	  (`snapTo`); onMove/onCommit write start/end (duration preserved) and
	  resourceId. An overbooking drop is ALLOWED and flagged — dispatchers
	  overbook on purpose. prefers-reduced-motion skips FLIP, never the drop.
	REJECTED
	  a forked second board; subclassing UITaskBoard (would drag ordinal
	  order-list into a time canvas); job.resources[] rendering one job in
	  several lanes; hand-rolled CSS tracks (ui-grid is the shell); new time
	  math (core/time/interval.js); a `tone-*` class token (uwc.util would hide
	  the label); component-class rows with display:contents inside
	  ui-collection.
	COMPOSES ui-grid (named areas) · ui-schedule-lane · ui-scheduler-event ·
	core/time (findConflicts, parseTime) · ui-collection (virtualises resource
	lanes). Colour is `data-tone` / `--resource-fill`.
	MOVE RULES — core/board/moves.js, the same gate ui-task-board uses.
	  readOnly · wipLimits (jobs one resource may hold) · transitions (who may
	  hand work to whom). An overbooking drop stays ALLOWED and flagged unless a
	  rule says otherwise — dispatchers overbook on purpose.
	── EVENTS ─────────────────────────────────────────────────
	  schedule-board:select { item, id, lane, ids, items, additive, range }
	    click / shift-range / ctrl-or-cmd toggle. id/item stay the click
	    target so a detail pane still works; ids/items are the set.
	  schedule-board:change { items, id, lane }
	  schedule-board:move { id, item, from, to, start, kind }  CANCELABLE —
	    preventDefault() refuses the move, before anything is written.
	  schedule-board:refused { …move, rule, reason }  why a move did not land
	    (rule: read-only | transition | wip | veto).
	  schedule-board:history { direction, label, canUndo, canRedo }  after undo/redo.
	── HISTORY ──────────────────────────────────────────────
	  undo() / redo() → boolean. A reschedule restores the LANE AND THE CLOCK —
	  the lane alone would return a job to the right technician at the wrong
	  hour. readOnly blocks both directions; historyLimit bounds the stack.
	── SELECTION ────────────────────────────────────────────
	  selectionMode: 'multiple' (default) | 'single' | 'none'. Same module
	  and flags as ui-task-board. selectedItems() / clearSelection() /
	  selectAll() are the bulk surface.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-schedule-board
	    .state.resources=${[{ id: 'ada', label: 'Ada', tone: 'accent' }]}
	    .state.items=${[{ id: 'a1', jobId: 'hvac', resourceId: 'ada',
	      start: '09:00', end: '10:30', label: 'HVAC' }]}
	    .state.value=${'2026-08-22'}
	    @schedule-board:select=${this.onJob}></ui-schedule-board>
	─────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-28
*/
import '../grid/grid.js';
import {
	DragReorder,
	durationOf,
	html,
	isArray,
	WebComponent,
} from 'webcomponent';
import { BoardHistory } from '../../core/board/history.js';
import { findItem } from '../../core/board/items.js';
import { evaluateMove } from '../../core/board/moves.js';
import {
	BoardSelection,
	visibleKeys,
} from '../../core/board/selection.js';
import { COLLECTION_EVENT } from '../collection/collection.js';
import { UIScheduleLane } from '../schedule-lane/schedule-lane.js';
import {
	applyReschedule,
	dayWindow,
	groupAssignments,
	numericInterval,
	snapStart,
	ticksForWindow,
} from './lanes.js';
const GRID_AREAS = '"head" "body"';
const GRID_ROWS = 'auto minmax(16rem, 1fr)';
function laneItemKey(item) {
	return item.id;
}
export class UIScheduleBoard extends WebComponent {
	static url = import.meta.url;
	static styles = {
		scheduleBoard: './schedule-board.css',
	};
	static state = {
		resources: [],
		items: [],
		value: '',
		start: '08:00',
		end: '18:00',
		step: 60,
		lanes: [],
		ticks: [],
		/*
		 * Which assignment field names its lane, and which holds its identity —
		 * the same two knobs ui-task-board carries, so one job list can be grouped
		 * by technician here and by status there without changing shape.
		 */
		laneField: 'resourceId',
		dataKey: 'id',
		/*
		 * The same move rules ui-task-board carries, through the same gate. Here a
		 * WIP cap is "how many jobs one technician may hold" and a transition is
		 * "who may hand work to whom" — different sentences, one mechanism.
		 * An overbooking DROP stays allowed and flagged unless a rule says
		 * otherwise; dispatchers overbook on purpose.
		 */
		readOnly: false,
		wipLimits: null,
		transitions: null,
		/* Commands kept for undo; each pins the assignments it names. */
		historyLimit: 50,
		selectionMode: 'multiple',
	};
	onInit() {
		/*
		 * Collection chrome lives OFF state. `this.state = {…}` is replaceState
		 * (`{ ...incoming }`, no static-default re-merge) and would wipe a nested
		 * bag — then onConnect throwing on `.laneList.renderRow =` is the defect.
		 * Same shape as command/explorer/accounts-list `listConfig`. Assigned in
		 * onInit (not a class field) so a field initializer cannot run after
		 * super() and wipe it. Loader is a cached forwarder: engine calls it
		 * with `this` = the collection, so a board method ref would lose us.
		 */
		this.loadLanesForwarder = () => {
			return this.loadLanes();
		};
		/* Same cached-forwarder reason as loadLanesForwarder: the gate calls this
		   as a bare function, so a method reference would lose `this`. */
		this.moveProbe = (move) => {
			return this.probeMove(move);
		};
		/* Default depth here, configured depth on connect — `onInit` runs inside
		   the constructor, before `this.state` exists. */
		this.history = new BoardHistory();
		this.selection = new BoardSelection();
		this.laneList = {
			renderRow: UIScheduleLane,
			keyFn: laneItemKey,
			loader: this.loadLanesForwarder,
			showBar: false,
			virtual: true,
			estimatedHeight: 72,
			overscan: 2,
			tableMaxHeight: '28rem',
			pagingStyle: 'button',
			emptyMessage: '',
			itemNoun: 'resources',
		};
		this.drag = new DragReorder({
			owner: this,
			host: this,
			resolveIndex: 'resolveDragIndex',
			onMove: 'moveAssignment',
			onCommit: 'commitDrag',
			onEnd: 'handleDragEnd',
		});
		this.dragItemId = '';
		this.dragOriginLane = '';
		this.dragDuration = 0;
		this.dropLaneId = '';
		this.pendingStart = 0;
		this.pendingLane = '';
		this.dragSuppressSelect = false;
	}
	onDisconnect() {
		this.drag?.end();
	}
	onConnect() {
		this.observe([
			'resources',
			'items',
			'value',
			'start',
			'end',
			'step',
			'laneField',
			'dataKey',
		], this.syncBoard);
		this.observe('historyLimit', this.syncHistoryLimit, {
			immediate: true,
		});
		this.observe('selectionMode', this.syncSelectionMode, {
			immediate: true,
		});
		this.syncBoard();
	}
	syncHistoryLimit() {
		this.history.setLimit(this.state.historyLimit);
	}
	syncSelectionMode() {
		this.selection.setMode(this.state.selectionMode);
		this.selection.stamp(this.state.items, this.dataKey());
	}
	probeMove(move) {
		return this.emit('schedule-board:move', move, {
			cancelable: true,
		}) !== false;
	}
	moveRules() {
		return {
			readOnly: this.state.readOnly === true,
			wipLimits: this.state.wipLimits,
			transitions: this.state.transitions,
			canMove: this.moveProbe,
		};
	}
	/**
	 * Ask the gate, and on a refusal rebuild the lanes so the block springs back
	 * to the time and resource it actually still has.
	 * @param {object} move - `{ id, item, from, to, start, kind }`.
	 * @returns {boolean} Whether the move may proceed.
	 */
	allowMove(move) {
		const verdict = evaluateMove(move, this.moveRules(), this.state.lanes);
		if (verdict.allowed) {
			/* Allowed path only — a refusal mutates nothing to diff against. */
			this.history.begin(this.state.items, this.trackedFields());
			return true;
		}
		this.syncBoard();
		this.emit('schedule-board:refused', {
			...move,
			rule: verdict.rule,
			reason: verdict.reason,
		});
		return false;
	}
	/*
	 * A reschedule moves a block in TIME as well as between lanes, so undo has to
	 * put the clock back too — the lane alone would return the job to the right
	 * technician at the wrong hour. Same list, two more fields than a task board.
	 */
	trackedFields() {
		return [
			this.laneField(),
			'start',
			'end',
		];
	}
	commitMove(move) {
		const command = this.history.commit(this.state.items, move.kind);
		this.emit('schedule-board:change', {
			items: this.state.items,
			id: move.id,
			lane: move.to,
		});
		/* A landed move changes what undo can reach — see ui-task-board. */
		if (command) {
			this.emitHistory('commit', command.label);
		}
	}
	emitHistory(direction, label) {
		this.emit('schedule-board:history', {
			direction,
			label,
			canUndo: this.history.canUndo,
			canRedo: this.history.canRedo,
		});
	}
	/**
	 * Step the history and republish. Read-only blocks both directions.
	 * @param {string} direction - 'undo' or 'redo'.
	 * @returns {boolean} Whether a command was applied.
	 */
	stepHistory(direction) {
		if (this.state.readOnly === true) {
			return false;
		}
		let command = null;
		if (direction === 'redo') {
			command = this.history.redo(this.state.items);
		} else {
			command = this.history.undo(this.state.items);
		}
		if (!command) {
			return false;
		}
		this.stateBus?.notify('items');
		this.syncBoard();
		this.emit('schedule-board:change', {
			items: this.state.items,
			id: '',
			lane: '',
		});
		this.emitHistory(direction, command.label);
		return true;
	}
	undo() {
		return this.stepHistory('undo');
	}
	redo() {
		return this.stepHistory('redo');
	}
	laneField() {
		return this.state.laneField || 'resourceId';
	}
	dataKey() {
		return this.state.dataKey || 'id';
	}
	syncBoard() {
		const bounds = dayWindow(this.state.start, this.state.end);
		const step = Number(this.state.step);
		const tickStep = Number.isFinite(step) && step > 0 ? step : 60;
		this.style.setProperty('--schedule-board-start', String(bounds.start));
		this.style.setProperty('--schedule-board-span', String(bounds.span));
		this.style.setProperty('--schedule-board-step', String(tickStep));
		this.state.ticks = ticksForWindow(bounds.start, bounds.end, tickStep);
		this.state.lanes = groupAssignments(
			this.state.resources,
			this.state.items,
			this.state.value,
			this.laneField()
		);
		this.selection.prune(this.state.items, this.dataKey());
		this.selection.stamp(this.state.items, this.dataKey());
		this.emit(COLLECTION_EVENT.REFRESH);
	}
	loadLanes() {
		const lanes = isArray(this.state.lanes) ? this.state.lanes : [];
		return {
			items: lanes,
			nextCursor: null,
			hasMore: false,
			totalCount: lanes.length,
		};
	}
	findItem(id) {
		return findItem(this.state.items, id, this.dataKey());
	}
	handleEventSelect(domEvent) {
		if (this.dragSuppressSelect === true) {
			this.dragSuppressSelect = false;
			return;
		}
		const data = domEvent.detail?.data;
		const selected = data?.item;
		const entry = this.findItem(selected?.id) || selected;
		const id = entry?.id || '';
		const modifiers = {
			additive: data?.additive === true,
			range: data?.range === true,
		};
		this.selection.apply(id, modifiers, visibleKeys(this.state.lanes, this.dataKey()));
		this.selection.stamp(this.state.items, this.dataKey());
		this.emit('schedule-board:select', {
			item: entry,
			id,
			lane: entry?.[this.laneField()] || '',
			ids: this.selection.ids(),
			items: this.selection.items(this.state.items, this.dataKey()),
			additive: modifiers.additive,
			range: modifiers.range,
		});
	}
	selectedItems() {
		return this.selection.items(this.state.items, this.dataKey());
	}
	clearSelection() {
		this.selection.clear();
		this.selection.stamp(this.state.items, this.dataKey());
	}
	selectAll() {
		this.selection.selectAll(visibleKeys(this.state.lanes, this.dataKey()));
		this.selection.stamp(this.state.items, this.dataKey());
	}
	collectionHost() {
		return this.findComponent('ui-collection');
	}
	laneAtPoint(clientY) {
		const collection = this.collectionHost();
		const lanes = collection?.findComponents('ui-schedule-lane') || [];
		const count = lanes.length;
		for (let index = 0; index < count; index += 1) {
			const lane = lanes[index];
			const box = lane.getBoundingClientRect();
			if (clientY >= box.top && clientY <= box.bottom) {
				return lane;
			}
		}
		return null;
	}
	resolveDragIndex(pointer) {
		const fallback = this.drag.dragIndex;
		const lane = this.laneAtPoint(pointer.clientY);
		if (lane) {
			this.dropLaneId = String(lane.state.id || '');
		}
		const minutes = lane?.minutesAt(pointer.clientX);
		if (!Number.isFinite(minutes)) {
			return fallback;
		}
		const bounds = dayWindow(this.state.start, this.state.end);
		const step = Number(this.state.step);
		const tickStep = Number.isFinite(step) && step > 0 ? step : 15;
		return snapStart(minutes, tickStep, bounds.start, bounds.end, this.dragDuration);
	}
	moveAssignment(fromStart, toStart) {
		const laneId = this.dropLaneId || this.dragOriginLane;
		const sameTime = toStart === fromStart;
		const sameLane = String(laneId) === String(this.pendingLane);
		if (sameTime && sameLane) {
			return false;
		}
		this.pendingStart = toStart;
		this.pendingLane = laneId;
		return true;
	}
	applyPendingReschedule() {
		const entry = this.findItem(this.dragItemId);
		if (!entry) {
			return false;
		}
		if (!this.allowMove({
			id: this.dragItemId,
			item: entry,
			from: this.dragOriginLane,
			to: String(this.pendingLane || this.dragOriginLane),
			start: this.pendingStart,
			kind: 'reschedule',
		})) {
			return false;
		}
		applyReschedule(entry, this.pendingStart, this.pendingLane, this.laneField());
		this.stateBus?.notify('items');
		this.syncBoard();
		return true;
	}
	commitDrag() {
		const id = this.dragItemId;
		const applied = this.applyPendingReschedule();
		/* The click that ends a drag must still be swallowed even when the gate
		   refused it, or a refused drop opens the block's detail on release. */
		this.dragSuppressSelect = true;
		if (!applied) {
			return;
		}
		this.commitMove({
			id,
			to: this.pendingLane || '',
			kind: 'reschedule',
		});
	}
	handleDragEnd(info) {
		if (!info) {
			return;
		}
		const start = this.resolveDragIndex({
			clientX: info.clientX,
			clientY: info.clientY,
		});
		if (Number.isFinite(start)) {
			this.pendingStart = start;
		}
		if (this.dropLaneId) {
			this.pendingLane = this.dropLaneId;
		}
	}
	handleDragBegin(domEvent) {
		if (this.drag.active) {
			return;
		}
		const data = domEvent.detail?.data;
		if (!data?.id) {
			return;
		}
		const entry = this.findItem(data.id);
		if (!entry) {
			return;
		}
		const interval = numericInterval(entry);
		if (!interval) {
			return;
		}
		this.dragItemId = String(data.id);
		this.dragOriginLane = String(entry[this.laneField()] || '');
		this.dragDuration = durationOf(interval);
		this.dropLaneId = this.dragOriginLane;
		this.pendingStart = interval.start;
		this.pendingLane = this.dragOriginLane;
		const row = domEvent.detail?.source;
		this.drag.start(domEvent, interval.start, row);
	}
	reschedule(id, startMinutes, resourceId) {
		const entry = this.findItem(id);
		if (!entry) {
			return false;
		}
		const laneField = this.laneField();
		if (!this.allowMove({
			id: String(id),
			item: entry,
			from: String(entry[laneField] ?? ''),
			to: String(resourceId ?? entry[laneField] ?? ''),
			start: startMinutes,
			kind: 'reschedule',
		})) {
			return false;
		}
		applyReschedule(entry, startMinutes, resourceId, laneField);
		this.stateBus?.notify('items');
		this.syncBoard();
		this.commitMove({
			id: String(id),
			to: String(resourceId || entry[laneField] || ''),
			kind: 'reschedule',
		});
		return true;
	}
	tickRow(tick) {
		return html`<span class="schedule-board-tick" style=${`inset-inline-start:${tick.percent}%`}>${tick.label}</span>`;
	}
	render() {
		this.html`
			<div class="schedule-board" @scheduler-event:select=${this.handleEventSelect} @scheduler-event:drag=${this.handleDragBegin}>
				<ui-grid
					.state.areas=${GRID_AREAS}
					.state.columns=${1}
					.state.rows=${GRID_ROWS}
					.state.gap=${'none'}>
					<header class="schedule-board-head" style="grid-area:head">
						<span class="schedule-board-corner"></span>
						<div class="schedule-board-times">${this.list('ticks', this.tickRow)}</div>
					</header>
					<div class="schedule-board-body" style="grid-area:body">
						<ui-collection .state=${this.laneList}></ui-collection>
					</div>
				</ui-grid>
			</div>
		`;
	}
}
customElements.define('ui-schedule-board', UIScheduleBoard);
