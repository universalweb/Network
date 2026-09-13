/*
	DESCRIPTION: ui-signup — email + password + confirm-password form composed from
	ui-field, ui-input, and ui-button. Mismatch on confirmPassword surfaces as a field error.
	── EVENTS ───────────────────────────────────────────────────────────
	  signup:submit { email, password }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-signup .state.heading=${'Create account'} @signup:submit=${this.onSignup}></ui-signup>
*/
import '../button/button.js';
import '../field/field.js';
import '../input/input.js';
import { WebComponent } from 'webcomponent';
export class UISignup extends WebComponent {
	static url = import.meta.url;
	static styles = {
		signup: './signup.css',
	};
	static state = {
		heading: '',
		submitLabel: 'Create account',
		email: '',
		password: '',
		confirmPassword: '',
		busy: false,
	};
	onMount() {
		this.animateIn();
	}
	confirmError() {
		if (!this.state.confirmPassword) {
			return '';
		}
		if (this.state.confirmPassword === this.state.password) {
			return '';
		}
		return 'Passwords do not match';
	}
	handleEmail(domEvent) {
		this.state.email = domEvent.detail?.data?.value ?? '';
	}
	handlePassword(domEvent) {
		this.state.password = domEvent.detail?.data?.value ?? '';
	}
	handleConfirmPassword(domEvent) {
		this.state.confirmPassword = domEvent.detail?.data?.value ?? '';
	}
	/*
	 * The submit gate is SEPARATE from confirmError() on purpose.
	 *
	 * confirmError() is live field feedback, and it deliberately stays quiet while
	 * `confirmPassword` is still empty — shouting "Passwords do not match" at
	 * someone who has not finished typing is hostile. But gating submit on that
	 * error alone meant a BLANK confirmPassword sailed through (blank produced
	 * no error), so the password could be set and the confirmation skipped
	 * entirely — defeating the only reason the field exists. An empty password
	 * submitted just as happily.
	 *
	 * `required` on the fields cannot save this either: handleSubmit calls
	 * preventDefault(), so native constraint validation never runs. Every guard
	 * has to live here.
	 */
	canSubmit() {
		if (!this.state.email || !this.state.password) {
			return false;
		}
		return this.state.confirmPassword === this.state.password;
	}
	handleSubmit(domEvent) {
		domEvent.preventDefault();
		if (!this.canSubmit()) {
			return;
		}
		this.emit('signup:submit', {
			email: this.state.email,
			password: this.state.password,
		});
	}
	render() {
		this.html`
			<form class="su" @submit=${this.handleSubmit}>
				<h2 class="su-heading" ?hidden=${!this.state.heading}>${this.state.heading}</h2>
				<ui-field .state.label=${'Email'} .state.required=${true}>
					<ui-input
						.state.value=${this.state.email}
						.state.type=${'email'}
						.state.autocomplete=${'username'}
						.state.placeholder=${'you@example.com'}
						.state.required=${true}
						@input:input=${this.handleEmail}></ui-input>
				</ui-field>
				<ui-field .state.label=${'Password'} .state.required=${true}>
					<ui-input
						.state.value=${this.state.password}
						.state.type=${'password'}
						.state.autocomplete=${'new-password'}
						.state.required=${true}
						@input:input=${this.handlePassword}></ui-input>
				</ui-field>
				<ui-field .state.label=${'Confirm password'} .state.required=${true} .state.error=${this.confirmError()}>
					<ui-input
						.state.value=${this.state.confirmPassword}
						.state.type=${'password'}
						.state.autocomplete=${'new-password'}
						.state.required=${true}
						.state.invalid=${Boolean(this.confirmError())}
						@input:input=${this.handleConfirmPassword}></ui-input>
				</ui-field>
				<ui-button
					.state.label=${this.state.submitLabel}
					.state.tone=${'primary'}
					.state.fullwidth=${true}
					.state.disabled=${this.state.busy}
					.state.loading=${this.state.busy}
					@button:click=${this.handleSubmit}></ui-button>
			</form>
		`;
	}
}
customElements.define('ui-signup', UISignup);
