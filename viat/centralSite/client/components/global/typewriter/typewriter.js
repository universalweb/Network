/*
	DESCRIPTION: ui-typewriter — a char-stream text effect (zero-dep, no build).
	Types a phrase out one character at a time; with multiple phrases it pauses,
	deletes, and types the next, optionally looping. A self-scheduling
	this.setTimeout chain drives it (auto-cleaned on disconnect), so typing,
	deleting, and the hold each get their own cadence. Motion-sensitive users get
	the final text instantly — no stream.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-typewriter .state.phrases=${['Fast.', 'Final.', 'Verifiable.']} .state.loop=${true}></ui-typewriter>
	  <ui-typewriter .state.text=${'One-shot headline.'}></ui-typewriter>
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from 'webcomponent';
// Pick the active phrase list: explicit `phrases` wins, else the single `text`.
function resolvePhrases(state) {
	if (Array.isArray(state.phrases) && state.phrases.length > 0) {
		return state.phrases;
	}
	if (state.text) {
		return [state.text];
	}
	return [];
}
export class UITypewriter extends WebComponent {
	static url = import.meta.url;
	static styles = {
		typewriter: './typewriter.css',
	};
	static state = {
		phrases: [],
		text: '',
		displayed: '',
		speed: 55,
		deleteSpeed: 30,
		pause: 1600,
		startDelay: 250,
		loop: false,
		cursor: true,
	};
	static config = {
		debugPatchOn: false,
	};
	onConnect() {
		// Cursor position + phase live off-state — only `displayed` drives render.
		this.phraseIndex = 0;
		this.charIndex = 0;
		this.mode = 'typing';
	}
	prefersReducedMotion() {
		return Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
	}
	onMount() {
		const phrases = resolvePhrases(this.state);
		if (phrases.length === 0) {
			return;
		}
		if (this.prefersReducedMotion()) {
			this.state.displayed = phrases[0];
			return;
		}
		this.setTimeout(() => {
			this.typeStep();
		}, this.state.startDelay);
	}
	typeStep() {
		const phrases = resolvePhrases(this.state);
		if (phrases.length === 0) {
			return;
		}
		const current = phrases[this.phraseIndex % phrases.length];
		if (this.mode === 'deleting') {
			this.charIndex -= 1;
			this.state.displayed = current.slice(0, Math.max(0, this.charIndex));
			if (this.charIndex <= 0) {
				this.mode = 'typing';
				this.phraseIndex = (this.phraseIndex + 1) % phrases.length;
				this.setTimeout(() => {
					this.typeStep();
				}, this.state.speed);
				return;
			}
			this.setTimeout(() => {
				this.typeStep();
			}, this.state.deleteSpeed);
			return;
		}
		this.charIndex += 1;
		this.state.displayed = current.slice(0, this.charIndex);
		if (this.charIndex >= current.length) {
			const multi = phrases.length > 1;
			// A single phrase with loop off is a one-shot — leave it on screen.
			if (!multi && !this.state.loop) {
				return;
			}
			this.mode = 'paused';
			this.setTimeout(() => {
				this.startDeleting();
			}, this.state.pause);
			return;
		}
		this.setTimeout(() => {
			this.typeStep();
		}, this.state.speed);
	}
	startDeleting() {
		this.mode = 'deleting';
		this.typeStep();
	}
	render() {
		this.html`
			<span class="tw-text">${this.state.displayed}</span><span class="tw-cursor" aria-hidden="true" ?hidden=${!this.state.cursor}></span>
		`;
	}
}
customElements.define('ui-typewriter', UITypewriter);
