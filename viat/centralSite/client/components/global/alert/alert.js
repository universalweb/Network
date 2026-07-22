/*
	DESCRIPTION: ui-alert — inline callout / banner. Tone drives the accent bar,
	background tint and leading icon; the message rides the default slot.
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-alert .state.tone=${'warning'} .state.heading=${'Unsynced'} .state.dismissible=${true}>
	    Your local state is ahead of the network.
	  </ui-alert>
	Tones: 'info' | 'success' | 'warning' | 'danger' (each maps to an existing
	--color-* status token — no new colors). `icon` overrides the derived glyph;
	`icon='none'` hides it. Dismiss closes the alert and emits `alert:dismiss`.
	─────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
const TONE_ICONS = {
	info: 'info',
	success: 'circle-check',
	warning: 'triangle-alert',
	danger: 'octagon-alert',
};
export class UIAlert extends WebComponent {
	static url = import.meta.url;
	static styles = {
		alert: './alert.css',
	};
	static state = {
		tone: 'info',
		// Heading text. NB: NOT `title` — `title` is a native HTMLElement property, so a
		// `.title=`/`title=` binding sets the host's native tooltip and never reaches state,
		// leaving the heading silently empty. Same footgun that killed the button tooltips.
		heading: '',
		dismissible: false,
		icon: '',
		open: true,
	};
	get toneIcon() {
		if (this.state.icon === 'none') {
			return '';
		}
		return this.state.icon || TONE_ICONS[this.state.tone] || TONE_ICONS.info;
	}
	handleDismiss() {
		this.state.open = false;
		this.emit('alert:dismiss', {
			tone: this.state.tone,
		});
	}
	render() {
		this.html`
			<div class="al" role="alert" data-tone=${this.state.tone} ?hidden=${!this.state.open}>
				<ui-icon class="al-icon" ?hidden=${!this.toneIcon} .state.name=${this.toneIcon} .state.size=${'sm'}></ui-icon>
				<div class="al-content">
					<p class="al-title" ?hidden=${!this.state.heading}>${this.state.heading}</p>
					<div class="al-body"><slot></slot></div>
				</div>
				<button class="al-dismiss" type="button" tooltip="Dismiss" ?hidden=${!this.state.dismissible} @click=${this.handleDismiss}>
					<ui-icon .state.name=${'x'} .state.size=${'xs'}></ui-icon>
				</button>
			</div>
		`;
	}
}
customElements.define('ui-alert', UIAlert);
