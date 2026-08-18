import '../../global/pulldown/pulldown.js';
import './ai-chat/ai-chat.js';
import './help-panel/help-panel.js';
import './info-panel/info-panel.js';
import './setup-panel/setup-panel.js';
import { WebComponent } from 'webcomponent';
import { lockBackgroundScroll, unlockBackgroundScroll } from '../../global/scroll-lock.js';
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
			handlePosition: 'bottom',
		},
	};
	scrollLocked = false;
	open() {
		this.emit('pulldown:toggle', {
			open: true,
		});
	}
	close() {
		this.emit('pulldown:toggle', {
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
	 * `pulldown:toggle` bus signal ui-pulldown animates from, so it catches EVERY
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
		this.delegate('pulldown:toggle', this.handlePulldownScrollState);
	}
	render() {
		this.html`
			<ui-pulldown #pulldown
				.state=${this.state.pulldown}
				@pulldown:open=${this.handleOpen}
				@pulldown:close=${this.handleClose}>
				<div class="gpd-content">
					<div class="gpd-mobile-notice" role="status">
						<span class="gpd-mobile-notice-id">⩝ LOCAL AGENT</span>
						<p class="gpd-mobile-notice-body">The Local AI chat is desktop-only for now — it streams from a local LLM endpoint that needs a keyboard-friendly workflow. The help and info panels below stay available on every screen size.</p>
					</div>
					<div class="gpd-columns">
						<aside class="gpd-col gpd-col-help">
							<info-panel></info-panel>
							<setup-panel></setup-panel>
							<help-panel></help-panel>
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
