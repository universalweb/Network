/*
 * `<ui-ai-inquire>` — the agent asking the USER a question mid-task, either as
 * multiple-choice buttons or a free-text reply. On answer it locks, shows the
 * chosen value, and emits `ai-inquire:answer` { value } so the chat can feed the
 * reply back as the next user turn. Choice clicks are container-delegated (one
 * listener; each button carries data-value and has no inner nodes, so the event
 * target IS the button — no closest()). Drive with `.question`, `.mode`
 * ('choice' | 'text'), `.items` ([string | { label, value }]), `.placeholder`.
 */
import '../icon/icon.js';
import { html, isString, WebComponent } from 'webcomponent';
function optionValue(option) {
	return isString(option) ? option : option.value;
}
function optionLabel(option) {
	if (isString(option)) {
		return option;
	}
	return option.label ?? option.value;
}
export class UIAiInquire extends WebComponent {
	static url = import.meta.url;
	static styles = {
		inquire: './ai-inquire.css',
	};
	static state = {
		question: '',
		mode: 'choice',
		items: [],
		placeholder: 'Type a reply…',
		inputValue: '',
		answered: '',
	};
	get choiceOpen() {
		return this.state.mode === 'choice' && !this.state.answered;
	}
	get textOpen() {
		return this.state.mode === 'text' && !this.state.answered;
	}
	optionKey(option) {
		return optionValue(option);
	}
	renderOption(option) {
		return html`<button type="button" class="inq-opt" data-variant="outline" data-size="sm" data-value=${String(optionValue(option))}>${optionLabel(option)}</button>`;
	}
	handleOptionClick(domEvent) {
		if (this.state.answered) {
			return;
		}
		const value = domEvent.target?.dataset?.value;
		if (value === undefined) {
			return;
		}
		this.commit(value);
	}
	handleSubmit(domEvent) {
		domEvent.preventDefault();
		const value = this.state.inputValue.trim();
		if (!value) {
			return;
		}
		this.commit(value);
	}
	commit(value) {
		// First answer wins; a settled inquiry never re-fires.
		if (this.state.answered) {
			return;
		}
		this.state.answered = value;
		this.emit('ai-inquire:answer', {
			value,
		});
	}
	render() {
		this.html`
			<section class="inq" data-mode=${this.state.mode}>
				<header class="inq-head">
					<ui-icon class="inq-icon" .state.name=${'circle-help'} .state.size=${'sm'}></ui-icon>
					<span class="inq-q">${this.state.question}</span>
				</header>
				<div class="inq-choice" ?hidden=${!this.choiceOpen} @click=${this.handleOptionClick}>
					${this.list('items', this.renderOption, this.optionKey)}
				</div>
				<form class="inq-text" ?hidden=${!this.textOpen} @submit=${this.handleSubmit}>
					<input class="inq-input" $value="inputValue" placeholder=${this.state.placeholder}>
					<button type="submit" data-variant="solid" data-tone="primary" data-size="sm">Send</button>
				</form>
				<div class="inq-answer" ?hidden=${!this.state.answered}>
					<ui-icon class="inq-answer-icon" .state.name=${'check'} .state.size=${'xs'}></ui-icon>
					<span class="inq-answer-text">${this.state.answered}</span>
				</div>
			</section>
		`;
	}
}
customElements.define('ui-ai-inquire', UIAiInquire);
