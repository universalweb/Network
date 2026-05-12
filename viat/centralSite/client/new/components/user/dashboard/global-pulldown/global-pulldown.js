import '../../../global/pulldown/pulldown.js';
import { WebComponent } from '../../../core/index.js';
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
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html`
			<ui-pulldown #pulldown
				.state=${this.pulldownState}
				@pulldown:open=${this.handleOpen}
				@pulldown:close=${this.handleClose}>
				<div class="gpd-content">
					<header class="gpd-header">
						<h2>Pull-Down Drawer</h2>
						<p>Drag the top bar down to reveal this panel. Past the snap threshold it commits to full screen with the bar pinned at the bottom. Drag the bar back up to dismiss.</p>
					</header>
					<slot></slot>
				</div>
			</ui-pulldown>
		`;
	}
}
customElements.define('global-pulldown', GlobalPulldown);
