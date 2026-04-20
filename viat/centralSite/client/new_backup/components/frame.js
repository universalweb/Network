import { hostSheet, loadSheet, resetSheet } from './shared-styles.js';
import { WebComponent } from './componentLibrary/base.js';
const frameStyles = await loadSheet(new URL('../styles/frame.css', import.meta.url));
const host = hostSheet(`
:host {
	position: fixed;
	top: 16px;
	left: 16px;
	right: 16px;
	bottom: 16px;
	border: 1px solid var(--frame-border);
	pointer-events: none;
	z-index: 100;
}
`);
export class ViatFrame extends WebComponent {
	constructor() {
		super([
			resetSheet,
			host,
			frameStyles,
		]);
		this.shadowRoot.innerHTML = `
			<div class="corner corner-tl"></div>
			<div class="corner corner-tr"></div>
			<div class="corner corner-bl"></div>
			<div class="corner corner-br"></div>
		`;
	}
}
customElements.define('viat-frame', ViatFrame);
