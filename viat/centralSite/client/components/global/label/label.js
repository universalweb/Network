/*
	DESCRIPTION: ui-label — form label primitive (Label). Optional
	required marker and description line. Use with forId to associate a control.
*/
import { WebComponent } from 'webcomponent';
export class UILabel extends WebComponent {
	static url = import.meta.url;
	static styles = {
		label: './label.css',
	};
	static state = {
		text: '',
		// Host id of the control this label describes.
		forId: '',
		required: false,
		description: '',
		disabled: false,
	};
	render() {
		this.html`
			<div class="lb" ?data-disabled=${this.state.disabled}>
				<label class="lb-text" for=${this.state.forId}>
					<span>${this.state.text}<slot></slot></span>
					<span class="lb-req" aria-hidden="true" ?hidden=${!this.state.required}>*</span>
				</label>
				<span class="lb-desc" ?hidden=${!this.state.description}>${this.state.description}</span>
			</div>
		`;
	}
}
customElements.define('ui-label', UILabel);
