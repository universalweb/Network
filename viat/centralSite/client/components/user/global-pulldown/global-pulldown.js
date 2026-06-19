import '../../global/pulldown/pulldown.js';
import './ai-chat/ai-chat.js';
import './help-panel/help-panel.js';
import './info-panel/info-panel.js';
import './setup-panel/setup-panel.js';
import { lockBackgroundScroll, unlockBackgroundScroll } from '../../global/scroll-lock.js';
import { WebComponent } from 'webcomponent';
const PULLDOWN_HOTKEYS = [
	{
		id: 'esc',
		keys: ['Esc'],
		desc: 'Close pulldown',
	},
	{
		id: 'send',
		keys: ['Enter'],
		desc: 'Send message',
	},
	{
		id: 'newline',
		keys: ['Shift', 'Enter'],
		joiner: '+',
		desc: 'Newline in chat',
	},
	{
		id: 'toggle',
		keys: ['~', '`'],
		joiner: '/',
		desc: 'Toggle pulldown',
	},
];
export class GlobalPulldown extends WebComponent {
	static url = import.meta.url;
	static styles = {
		globalPulldown: './global-pulldown.css',
	};
	static state = {
		pulldown: {
			trigger: 'main',
			threshold: 0.3,
			velocity: 0.5,
			// ui-pulldown defaults to a bottom grab handle, but this overlay fills its
			// whole surface with ai-chat (compose box anchored at the bottom) and is
			// already dismissed by the top-bar pull gesture + backdrop click — so opt
			// the handle out rather than float a grab strip over the chat controls.
			handlePosition: 'none',
		},
	};
	scrollLocked = false;
	open() {
		this.emit('pulldown:state', {
			open: true,
		});
	}
	close() {
		this.emit('pulldown:state', {
			open: false,
		});
	}
	handleOpen() {
		this.emit('pulldown:open', {});
	}
	handleClose() {
		this.emit('pulldown:close', {});
	}
	/*
	 * Lock the background like the modals do — under document scroll the page
	 * behind the open pulldown would otherwise scroll/chain. Driven by the same
	 * `pulldown:state` bus signal ui-pulldown animates from, so it catches EVERY
	 * open/close path (drag, hotkey, button, backdrop). Guarded so this pulldown
	 * only ever moves the shared lock count by one.
	 */
	handlePulldownScrollState(domEvent) {
		const isOpen = domEvent?.detail?.data?.open === true;
		if (isOpen && !this.scrollLocked) {
			lockBackgroundScroll();
			this.scrollLocked = true;
		} else if (!isOpen && this.scrollLocked) {
			unlockBackgroundScroll();
			this.scrollLocked = false;
		}
	}
	onConnect() {
		// `data-vw` drives the mobile column-hide rules — see reflectViewport.
		this.reflectViewport();
		// Background scroll-lock keyed to the canonical open/close signal.
		this.delegate('pulldown:state', this.handlePulldownScrollState);
	}
	handleBackdropClick(domEvent) {
		if (domEvent.target !== domEvent.currentTarget) {
			return;
		}
		this.emit('pulldown:state', {
			open: false,
		});
	}
	render() {
		this.html `
			<ui-pulldown #pulldown
				.state=${this.state.pulldown}
				@pulldown:open=${this.handleOpen}
				@pulldown:close=${this.handleClose}>
				<div class="gpd-content" @click=${this.handleBackdropClick}>
					<div class="gpd-mobile-notice" role="status">
						<span class="gpd-mobile-notice-id">⩝ LOCAL AGENT</span>
						<p class="gpd-mobile-notice-body">The Local AI chat is desktop-only for now — it streams from a local LLM endpoint that needs a keyboard-friendly workflow. The help and info panels below stay available on every screen size.</p>
					</div>
					<div class="gpd-columns">
						<aside class="gpd-col gpd-col-help">
							<info-panel></info-panel>
							<setup-panel></setup-panel>
							<help-panel .shortcuts=${PULLDOWN_HOTKEYS}></help-panel>
						</aside>
						<section class="gpd-col gpd-col-chat">
							<ai-chat></ai-chat>
						</section>
						<aside class="gpd-col gpd-col-spacer"></aside>
					</div>
				</div>
			</ui-pulldown>
		`;
	}
}
customElements.define('global-pulldown', GlobalPulldown);
