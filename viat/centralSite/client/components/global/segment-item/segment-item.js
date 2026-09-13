/*
	DESCRIPTION: ui-segment-item — one structured cell inside <ui-segment-strip>.
	Renders icon · label · value · description · hint as a vertical data stack so
	callers can show KPIs, facts, or feature points without free-form markup.
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  Items arrive as-is via list()/filter() from the parent strip:
	    { id, label, value?, description?, hint?, icon?, tone?, href?, interactive? }
	  Clickable when interactive or href is set:
	    segment-item:select  { id, value, label }
	─────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
export class UISegmentItem extends WebComponent {
	static url = import.meta.url;
	static styles = {
		segmentItem: './segment-item.css',
	};
	static state = {
		id: '',
		label: '',
		value: '',
		description: '',
		hint: '',
		icon: '',
		tone: 'accent',
		href: '',
		interactive: false,
		muted: false,
	};
	get isLink() {
		return Boolean(String(this.state.href || '').trim());
	}
	get isInteractive() {
		return this.state.interactive === true || this.isLink;
	}
	get hideIcon() {
		return !String(this.state.icon || '').trim();
	}
	get hideValue() {
		return !String(this.state.value ?? '').trim();
	}
	get hideDescription() {
		return !String(this.state.description || '').trim();
	}
	get hideHint() {
		return !String(this.state.hint || '').trim();
	}
	onConnect() {
		this.observe([
			'interactive',
			'href',
		], this.syncInteractiveAttr);
		this.syncInteractiveAttr();
	}
	/*
	 * House hover language keys off [data-interactive]. The painted
	 * surface is the inner .segment-item (data-hover=wash); the host
	 * carries the same hook so a probe of the custom element sees it.
	 */
	syncInteractiveAttr() {
		this.toggleAttribute('data-interactive', this.isInteractive);
	}
	hoverToken() {
		return this.isInteractive ? 'wash' : '';
	}
	handleClick(domEvent) {
		if (this.state.interactive !== true) {
			return;
		}
		if (this.isLink) {
			return;
		}
		domEvent.preventDefault();
		this.emit('segment-item:select', {
			id: this.state.id,
			value: this.state.value,
			label: this.state.label,
		});
	}
	handleKey(domEvent) {
		if (this.state.interactive !== true || this.isLink) {
			return;
		}
		const { key } = domEvent;
		if (key === 'Enter' || key === ' ') {
			domEvent.preventDefault();
			this.handleClick(domEvent);
		}
	}
	render() {
		if (this.isLink) {
			this.html`
				<a class="segment-item"
					data-hover=${this.hoverToken}
					data-tone=${this.state.tone || 'accent'}
					?data-interactive=${this.isInteractive}
					href=${this.state.href}
					role="listitem">
					<span class="segment-item-icon" ?hidden=${this.hideIcon} aria-hidden="true">
						<ui-icon .state.name=${this.state.icon} .state.size=${'md'}></ui-icon>
					</span>
					<span class="segment-item-body">
						<span class="segment-item-head">
							<span class="segment-item-label">${this.state.label}</span>
							<span class="segment-item-hint" ?hidden=${this.hideHint}>${this.state.hint}</span>
						</span>
						<span class="segment-item-value" ?hidden=${this.hideValue}>${this.state.value}</span>
						<span class="segment-item-description" ?hidden=${this.hideDescription}>${this.state.description}</span>
					</span>
				</a>
			`;
			return;
		}
		this.html`
			<div class="segment-item"
				data-hover=${this.hoverToken}
				data-tone=${this.state.tone || 'accent'}
				?data-interactive=${this.isInteractive}
				role=${this.isInteractive ? 'button' : 'listitem'}
				tabindex=${this.isInteractive ? '0' : '-1'}
				@click=${this.handleClick}
				@keydown=${this.handleKey}>
				<span class="segment-item-icon" ?hidden=${this.hideIcon} aria-hidden="true">
					<ui-icon .state.name=${this.state.icon} .state.size=${'md'}></ui-icon>
				</span>
				<span class="segment-item-body">
					<span class="segment-item-head">
						<span class="segment-item-label">${this.state.label}</span>
						<span class="segment-item-hint" ?hidden=${this.hideHint}>${this.state.hint}</span>
					</span>
					<span class="segment-item-value" ?hidden=${this.hideValue}>${this.state.value}</span>
					<span class="segment-item-description" ?hidden=${this.hideDescription}>${this.state.description}</span>
				</span>
			</div>
		`;
	}
}
customElements.define('ui-segment-item', UISegmentItem);
