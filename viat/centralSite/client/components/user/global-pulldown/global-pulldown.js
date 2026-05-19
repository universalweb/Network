import '../../global/pulldown/pulldown.js';
import './ai-chat/ai-chat.js';
import './help-panel/help-panel.js';
import './info-panel/info-panel.js';
import './setup-panel/setup-panel.js';
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
		},
	};
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
	onConnect() {
		// Mirror the viewport bucket onto our own host so CSS can use the
		// portable `:host(.vw-xs)` form. `:host-context()` is unreliable on
		// older mobile Safari (pre-16.4) which still ships on plenty of
		// iPhones — using a self-applied class makes the mobile hide rules
		// fire on every browser we support.
		this.syncViewportClass();
		this.delegate('viewport:change', this.handleViewportChange);
	}
	syncViewportClass() {
		const w = this.globalState?.environment?.viewport?.w ?? 'lg';
		const next = [];
		const current = (this.classList.value || '').split(/\s+/);
		for (let i = 0; i < current.length; i += 1) {
			const token = current[i];
			if (token && !token.startsWith('vw-')) {
				next.push(token);
			}
		}
		next.push(`vw-${w}`);
		this.classList.value = next.join(' ');
	}
	handleViewportChange = () => {
		this.syncViewportClass();
	};
	handleBackdropClick(domEvent) {
		if (domEvent.target !== domEvent.currentTarget) {
			return;
		}
		this.emit('pulldown:state', {
			open: false,
		});
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
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
