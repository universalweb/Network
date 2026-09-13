/*
	DESCRIPTION: ui-login — email + password form composed from ui-field,
	ui-input, and ui-button. Blank-slate primitive; the caller owns auth.
	── EVENTS ───────────────────────────────────────────────────────────
	  login:submit { email, password }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-login .state.heading=${'Sign in'} @login:submit=${this.onLogin}></ui-login>
*/
import '../button/button.js';
import '../field/field.js';
import '../input/input.js';
import { WebComponent } from 'webcomponent';
export class UILogin extends WebComponent {
	static url = import.meta.url;
	static styles = {
		login: './login.css',
	};
	static state = {
		heading: '',
		submitLabel: 'Sign in',
		email: '',
		password: '',
		busy: false,
	};
	onMount() {
		this.animateIn();
	}
	handleEmail(domEvent) {
		this.state.email = domEvent.detail?.data?.value ?? '';
	}
	handlePassword(domEvent) {
		this.state.password = domEvent.detail?.data?.value ?? '';
	}
	/*
	 * `required` on the fields does NOT gate this: handleSubmit calls
	 * preventDefault(), so native constraint validation never runs and the form
	 * happily emitted an empty credential pair. The guard has to live here.
	 */
	canSubmit() {
		return Boolean(this.state.email) && Boolean(this.state.password);
	}
	handleSubmit(domEvent) {
		domEvent.preventDefault();
		if (!this.canSubmit()) {
			return;
		}
		this.emit('login:submit', {
			email: this.state.email,
			password: this.state.password,
		});
	}
	render() {
		this.html`
			<form class="login" @submit=${this.handleSubmit}>
				<h2 class="login-heading" ?hidden=${!this.state.heading}>${this.state.heading}</h2>
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
						.state.autocomplete=${'current-password'}
						.state.required=${true}
						@input:input=${this.handlePassword}></ui-input>
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
customElements.define('ui-login', UILogin);
