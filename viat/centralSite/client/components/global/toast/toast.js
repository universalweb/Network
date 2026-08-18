/*
	DESCRIPTION: ui-toast — bottom (default) overlay toast stack (Toast).
	Transient messages over the page — NOT the notification center.
	Mount once (body/app-shell): <ui-toast #toaster></ui-toast>
	  this.refs.toaster.show({ title, description?, itemType?, timeout?, actionLabel? })
	Events: toast:show | toast:dismiss | toast:action
*/
import { WebComponent } from 'webcomponent';
import { UIToastItem } from '../toast-item/toast-item.js';
const DEFAULT_TIMEOUT = 4000;
const POSITIONS = new Set([
	'bottom-center',
	'bottom-end',
	'bottom-start',
	'top-center',
	'top-end',
	'top-start',
]);
const ITEM_TYPES = new Set([
	'default', 'success', 'info', 'warning', 'error', 'loading',
]);
export class UIToast extends WebComponent {
	static url = import.meta.url;
	static styles = {
		toast: './toast.css',
	};
	static state = {
		items: [],
		// Default style: bottom center of the viewport.
		position: 'bottom-center',
		// Max visible toasts; older ones drop off the front of the stack.
		limit: 5,
	};
	nextId = 0;
	onConnect() {
		/*
		 * Top-layer so toasts sit above dialogs / drawers. Manual popover —
		 * same pattern as ui-notification.
		 */
		if (typeof this.showPopover === 'function' && !this.hasAttribute('popover')) {
			this.setAttribute('popover', 'manual');
		}
		if (typeof this.showPopover === 'function' && !this.matches(':popover-open')) {
			this.showPopover();
		}
		this.observe('position', this.syncPositionAttr);
		this.syncPositionAttr(this.state.position);
		this.observe('items', this.queueStampStack);
	}
	queueStampStack() {
		this.nextFrame().then(() => {
			if (!this.isDisconnected) {
				this.stampStackIndexes();
			}
		});
	}
	syncPositionAttr(position) {
		const next = POSITIONS.has(position) ? position : 'bottom-center';
		this.dataset.position = next;
		if (next !== this.state.position) {
			this.state.position = next;
		}
	}
	/**
	 * Push a toast. Returns its id (or null if empty).
	 * @param {object} spec - Toast fields.
	 * @param {string} [spec.title] - Heading line.
	 * @param {string} [spec.description] - Body line.
	 * @param {string} [spec.itemType] - default|success|info|warning|error|loading
	 * @param {string} [spec.type] - Alias of itemType (naming).
	 * @param {number} [spec.timeout] - ms; 0 = sticky; loading defaults to 0.
	 * @param {string} [spec.actionLabel] - Optional action button label.
	 * @param {string} [spec.position] - One-shot viewport corner for this host.
	 * @returns {number|null} - Toast id, or null when both title and description empty.
	 */
	show(spec = {}) {
		const title = spec.title ?? '';
		const description = spec.description ?? '';
		if (!title && !description) {
			return null;
		}
		const rawKind = spec.itemType ?? spec.type ?? 'default';
		const itemType = ITEM_TYPES.has(rawKind) ? rawKind : 'default';
		let timeout = spec.timeout;
		if (timeout === undefined) {
			timeout = itemType === 'loading' ? 0 : DEFAULT_TIMEOUT;
		}
		if (spec.position && POSITIONS.has(spec.position)) {
			this.state.position = spec.position;
		}
		const toastId = ++this.nextId;
		const next = {
			id: toastId,
			toastId,
			title,
			description,
			itemType,
			timeout: Number(timeout) || 0,
			actionLabel: spec.actionLabel ?? '',
			exiting: false,
			createdAt: Date.now(),
		};
		const items = [next, ...this.state.items];
		const limit = Math.max(1, Number(this.state.limit) || 5);
		this.state.items = items.length > limit ? items.slice(0, limit) : items;
		this.repromotePopover();
		// After the list patches, stamp deck indices for stacked CSS.
		this.nextFrame?.().then?.(() => {
			if (!this.isDisconnected) {
				this.stampStackIndexes();
			}
		});
		this.emit('toast:show', {
			id: toastId,
			item: next,
		});
		return toastId;
	}
	/**
	 * Promise helper: loading toast, then success or error.
	 * @param {Promise} task - Async work.
	 * @param {{loading?: string, success?: string|Function, error?: string|Function}} labels - Status copy.
	 * @returns {Promise} - Resolves/rejects with the task.
	 */
	async promise(task, labels = {}) {
		const loadingId = this.show({
			title: labels.loading ?? 'Loading…',
			itemType: 'loading',
			timeout: 0,
		});
		try {
			const result = await task;
			if (loadingId != null) {
				this.dismiss(loadingId);
			}
			const successText = typeof labels.success === 'function' ? labels.success(result) : (labels.success ?? 'Done');
			this.show({
				title: successText,
				itemType: 'success',
			});
			return result;
		} catch (error) {
			if (loadingId != null) {
				this.dismiss(loadingId);
			}
			const errorText = typeof labels.error === 'function' ? labels.error(error) : (labels.error ?? (error?.message || 'Something went wrong'));
			this.show({
				title: errorText,
				itemType: 'error',
			});
			throw error;
		}
	}
	dismiss(toastId) {
		this.state.items = this.state.items.filter((item) => {
			return item.toastId !== toastId && item.id !== toastId;
		});
		this.emit('toast:dismiss', {
			id: toastId,
		});
	}
	clear() {
		this.state.items = [];
	}
	repromotePopover() {
		if (typeof this.hidePopover !== 'function' || typeof this.showPopover !== 'function') {
			return;
		}
		try {
			if (this.matches?.(':popover-open')) {
				this.hidePopover();
			}
			this.showPopover();
		} catch (error) {
			console.warn('[toast] re-promote failed', error);
		}
	}
	handleDismiss(domEvent) {
		const toastId = domEvent.detail?.data?.id;
		if (toastId !== undefined) {
			this.dismiss(toastId);
		}
	}
	handleAction(domEvent) {
		const toastId = domEvent.detail?.data?.id;
		if (toastId === undefined) {
			return;
		}
		this.emit('toast:action', {
			id: toastId,
		});
		this.dismiss(toastId);
	}
	itemKey(item) {
		return item.toastId ?? item.id;
	}
	/**
	 * Stamp stack index (0 = front) onto live toast-item hosts for deck CSS.
	 * Called after list paint — list() owns the children; we only set a CSS var.
	 */
	stampStackIndexes() {
		const items = this.state.items;
		const count = items.length;
		const hostList = this.findComponents('ui-toast-item') || [];
		const hostCount = hostList.length;
		for (let index = 0; index < hostCount; index += 1) {
			const host = hostList[index];
			const toastId = host?.state?.toastId ?? host?.state?.id;
			let stackIndex = index;
			for (let itemIndex = 0; itemIndex < count; itemIndex += 1) {
				const item = items[itemIndex];
				if ((item.toastId ?? item.id) === toastId) {
					stackIndex = itemIndex;
					break;
				}
			}
			host.style.setProperty('--toast-i', String(stackIndex));
			host.dataset.stack = String(stackIndex);
		}
	}
	onRender() {
		this.stampStackIndexes();
	}
	render() {
		this.html`
			<div
				class="toast-viewport"
				data-position=${this.state.position}
				@toast-item:dismiss=${this.handleDismiss}
				@toast-item:action=${this.handleAction}>
				${this.list('items', UIToastItem, this.itemKey)}
			</div>
		`;
	}
}
customElements.define('ui-toast', UIToast);
