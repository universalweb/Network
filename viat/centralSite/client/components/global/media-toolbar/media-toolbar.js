/**
 *	NAME: MediaToolbar
 *	TAG: ui-media-toolbar
 *
 *	── DESCRIPTION ──────────────────────────────────────────────────────
 *	DESCRIPTION: ui-media-toolbar — nine-button media chrome (rotate, zoom,
 *	flip, download, fullscreen, close). Owns flags only. Emits; the host applies.
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (HTML) ─────────────────────────────────────────────────────
 *	  <ui-media-toolbar
 *	    .state.showFlip=${true} .state.showZoom=${true}
 *	    .state.showRotate=${true} .state.showDownload=${true}
 *	    .state.overlay=${false}></ui-media-toolbar>
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (JS) ───────────────────────────────────────────────────────
 *	  import { UIMediaToolbar } from './media-toolbar.js';
 *	  const host = new UIMediaToolbar({ overlay: true });
 *	  host.addEventListener('media-toolbar:action', (domEvent) => {
 *	    applyAction(domEvent.detail.data.action);
 *	  });
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── EVENTS ───────────────────────────────────────────────────────────
 *	  media-toolbar:action { action }
 *	  action is rotate-left | rotate-right | zoom-in | zoom-out | flip-x |
 *	  flip-y | download | fullscreen | close
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── META ─────────────────────────────────────────────────────────────
 *	Author: Universal Web
 *	Date: 2026-09-03
 *	─────────────────────────────────────────────────────────────────────
 */
import '../icon-button/icon-button.js';
import { isTrue, WebComponent } from 'webcomponent';
export class UIMediaToolbar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		toolbar: './media-toolbar.css',
	};
	static state = {
		showFlip: true,
		showZoom: true,
		showRotate: true,
		showDownload: true,
		overlay: false,
	};
	emitAction(action) {
		this.emit('media-toolbar:action', {
			action,
		});
	}
	handleRotateLeft() {
		this.emitAction('rotate-left');
	}
	handleRotateRight() {
		this.emitAction('rotate-right');
	}
	handleZoomIn() {
		this.emitAction('zoom-in');
	}
	handleZoomOut() {
		this.emitAction('zoom-out');
	}
	handleFlipX() {
		this.emitAction('flip-x');
	}
	handleFlipY() {
		this.emitAction('flip-y');
	}
	handleDownload() {
		this.emitAction('download');
	}
	handleFullscreen() {
		this.emitAction('fullscreen');
	}
	handleClose() {
		this.emitAction('close');
	}
	fullIcon() {
		return isTrue(this.state.overlay) ? 'minimize' : 'maximize';
	}
	fullTip() {
		return isTrue(this.state.overlay) ? 'Exit fullscreen' : 'Fullscreen';
	}
	render() {
		this.html`
			<div class="media-tools"
				?data-flip=${this.state.showFlip}
				?data-zoom=${this.state.showZoom}
				?data-rotate=${this.state.showRotate}
				?data-download=${this.state.showDownload}
				?data-open=${this.state.overlay}>
				<ui-icon-button data-tool="rotate" .state.icon=${'rotate-ccw'} .state.tooltip=${'Rotate left'} .state.size=${'sm'} @icon-button:click=${this.handleRotateLeft}></ui-icon-button>
				<ui-icon-button data-tool="rotate" .state.icon=${'rotate-cw'} .state.tooltip=${'Rotate right'} .state.size=${'sm'} @icon-button:click=${this.handleRotateRight}></ui-icon-button>
				<ui-icon-button data-tool="zoom" .state.icon=${'zoom-in'} .state.tooltip=${'Zoom in'} .state.size=${'sm'} @icon-button:click=${this.handleZoomIn}></ui-icon-button>
				<ui-icon-button data-tool="zoom" .state.icon=${'zoom-out'} .state.tooltip=${'Zoom out'} .state.size=${'sm'} @icon-button:click=${this.handleZoomOut}></ui-icon-button>
				<ui-icon-button data-tool="flip" .state.icon=${'flip-horizontal'} .state.tooltip=${'Flip horizontal'} .state.size=${'sm'} @icon-button:click=${this.handleFlipX}></ui-icon-button>
				<ui-icon-button data-tool="flip" .state.icon=${'flip-vertical'} .state.tooltip=${'Flip vertical'} .state.size=${'sm'} @icon-button:click=${this.handleFlipY}></ui-icon-button>
				<ui-icon-button data-tool="download" .state.icon=${'download'} .state.tooltip=${'Download'} .state.size=${'sm'} @icon-button:click=${this.handleDownload}></ui-icon-button>
				<ui-icon-button data-tool="full" .state.icon=${this.fullIcon} .state.tooltip=${this.fullTip} .state.size=${'sm'} @icon-button:click=${this.handleFullscreen}></ui-icon-button>
				<ui-icon-button data-tool="close" .state.icon=${'x'} .state.tooltip=${'Close'} .state.size=${'sm'} @icon-button:click=${this.handleClose}></ui-icon-button>
			</div>
		`;
	}
}
customElements.define('ui-media-toolbar', UIMediaToolbar);
