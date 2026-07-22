/*
	DESCRIPTION: ui-chip — an interactive pill. Distinct from ui-badge (a passive
	status pill): a chip can be CLICKED to toggle `selected` (filter chips) and/or
	REMOVED via a trailing ✕ (input/token chips), and carries a `leading` slot for
	an avatar/icon. Shares badge's tone/size vocabulary but owns its own behavior.
	Tone/size are data-* ATTRIBUTES so the uwc.util `.tone-*` text utilities can't
	override the chip's full-tone color (the badge/surface doctrine).
	── EVENTS ───────────────────────────────────────────────────────────
	  chip:click  { value, selected }   fired on activation (when `interactive`)
	  chip:remove { value }             fired by the ✕ or Delete/Backspace
	  (payload arrives under event.detail.data; parents listen with @chip:remove=)
	── USAGE ────────────────────────────────────────────────────────────
	  Push data through the .state channel — a bare .label= sets a dead DOM
	  property and does NOT reach state:
	    <ui-chip .state.label=${'React'} .state.value=${'react'} .state.removable=${true}></ui-chip>
	    <ui-chip .state.label=${'Active'} .state.interactive=${true} .state.selected=${true}></ui-chip>
	  Or pass a whole reactive state object down (stays live via .state= carry-down):
	    <ui-chip .state=${this.state.reactChip}></ui-chip>
	  A parent consumes events with a template listener, never addEventListener:
	    <div @chip:remove=${this.handleChipRemove}>…</div>   // reads e.detail.data.value
	──────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from '../../core/index.js';
export class UIChip extends WebComponent {
	static url = import.meta.url;
	static styles = {
		chip: './chip.css',
	};
	static state = {
		label: '',
		value: '',
		tone: 'neutral',
		size: 'md',
		removable: false,
		interactive: false,
		selected: false,
		disabled: false,
	};
	handleClick() {
		if (this.state.disabled || !this.state.interactive) {
			return;
		}
		this.state.selected = !this.state.selected;
		this.emit('chip:click', {
			value: this.state.value,
			selected: this.state.selected,
		});
	}
	handleRemove(domEvent) {
		// Don't let the ✕ also trip the chip's own click/toggle.
		domEvent.stopPropagation();
		if (this.state.disabled) {
			return;
		}
		this.emit('chip:remove', {
			value: this.state.value,
		});
	}
	handleKey(domEvent) {
		if (this.state.disabled) {
			return;
		}
		const { key } = domEvent;
		if (this.state.interactive && (key === 'Enter' || key === ' ')) {
			domEvent.preventDefault();
			this.handleClick();
		} else if (this.state.removable && (key === 'Backspace' || key === 'Delete')) {
			domEvent.preventDefault();
			this.handleRemove(domEvent);
		}
	}
	render() {
		const interactive = this.state.interactive;
		this.html`
			<span class="chip"
				data-tone=${this.state.tone}
				data-size=${this.state.size}
				?data-interactive=${interactive}
				?data-removable=${this.state.removable}
				?data-selected=${this.state.selected}
				?data-disabled=${this.state.disabled}
				role=${interactive ? 'button' : 'group'}
				tabindex=${interactive && !this.state.disabled ? '0' : '-1'}
				aria-pressed=${interactive ? String(this.state.selected) : 'false'}
				@click=${this.handleClick}
				@keydown=${this.handleKey}>
				<span class="chip-leading"><slot name="leading"></slot></span>
				<span class="chip-label"><slot>${this.state.label}</slot></span>
				<button type="button" class="chip-remove" tabindex="-1"
					aria-label="Remove" @click=${this.handleRemove}>
					<span aria-hidden="true">&times;</span>
				</button>
			</span>
		`;
	}
}
customElements.define('ui-chip', UIChip);
