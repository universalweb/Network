import '../../../global/pulldown/pulldown.js';
import '../ai-chat/ai-chat.js';
import '../help-panel/help-panel.js';
import '../info-panel/info-panel.js';
import '../setup-panel/setup-panel.js';
import { WebComponent } from '../../../core/index.js';
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
		trigger: 'main',
		threshold: 0.3,
		velocity: 0.5,
	};
	pulldownState() {
		return {
			trigger: this.state.trigger,
			threshold: this.state.threshold,
			velocity: this.state.velocity,
		};
	}
	open() {
		this.refs.pulldown?.openPanel();
	}
	close() {
		this.refs.pulldown?.closePanel();
	}
	handleOpen() {
		this.emit('pulldown:open', {});
	}
	handleClose() {
		this.emit('pulldown:close', {});
	}
	handleBackdropClick = (domEvent) => {
		if (domEvent.target !== domEvent.currentTarget) {
			return;
		}
		this.emit('pulldown:state', {
			open: false,
		});
	};
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html`
			<ui-pulldown #pulldown
				.state=${this.pulldownState}
				@pulldown:open=${this.handleOpen}
				@pulldown:close=${this.handleClose}>
				<div class="gpd-content" @click=${this.handleBackdropClick}>
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
