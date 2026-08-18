/*
 * `<ui-ai-scroll-bottom>` — floating control that appears when a chat log is
 * scrolled up, and jumps back to the newest messages on click. Mirror of
 * ui-to-top for bottom-sticky chat. Pure UI — bind the scroll surface via
 * `.setScrollTarget(element)` (shadow log) or `.scrollSelector` (light DOM).
 * Emits `ai-scroll-bottom:click` {}.
 */
import '../button/button.js';
import { WebComponent } from 'webcomponent';
const DEFAULT_THRESHOLD = 48;
function resolveScrollSelector(selector) {
	if (!selector) {
		return null;
	}
	return globalThis.document.querySelector(selector);
}
export class UIAiScrollBottom extends WebComponent {
	static url = import.meta.url;
	static styles = {
		scrollBottom: './ai-scroll-bottom.css',
	};
	static state = {
		label: 'Jump to latest',
		icon: 'arrow-down',
		tone: 'primary',
		size: 'sm',
		// sticky (default float) | static (always visible, demos)
		position: 'sticky',
		scrollSelector: '',
		// px from bottom before the control appears
		threshold: DEFAULT_THRESHOLD,
		visible: false,
		smooth: true,
		disabled: false,
	};
	#explicitScrollTarget = null;
	scrollTargetRef = null;
	setScrollTarget(element) {
		this.#explicitScrollTarget = element ?? null;
		this.attachScrollTarget();
	}
	get scrollTarget() {
		return this.#explicitScrollTarget ?? this.scrollTargetRef?.deref() ?? null;
	}
	set scrollTarget(element) {
		this.setScrollTarget(element);
	}
	onConnect() {
		this.observe('scrollSelector', this.handleScrollSelectorChange);
		this.observe('threshold', this.syncVisible);
		this.attachScrollTarget();
	}
	onMount() {
		this.attachScrollTarget();
	}
	onDisconnect() {
		this.detachScrollTarget();
	}
	handleScrollSelectorChange() {
		if (this.#explicitScrollTarget) {
			return;
		}
		this.attachScrollTarget();
	}
	handleEvent(domEvent) {
		if (domEvent.type === 'scroll') {
			this.syncVisible();
		}
	}
	resolveScrollContainer() {
		if (this.#explicitScrollTarget?.isConnected) {
			return this.#explicitScrollTarget;
		}
		if (this.#explicitScrollTarget && !this.#explicitScrollTarget.isConnected) {
			this.#explicitScrollTarget = null;
		}
		return resolveScrollSelector(this.state.scrollSelector);
	}
	attachScrollTarget() {
		const target = this.resolveScrollContainer();
		const current = this.scrollTargetRef?.deref() ?? null;
		if (target === current) {
			this.syncVisible();
			return;
		}
		this.detachScrollTarget();
		if (!target) {
			return;
		}
		this.scrollTargetRef = new WeakRef(target);
		target.addEventListener('scroll', this, {
			passive: true,
		});
		this.syncVisible();
	}
	detachScrollTarget() {
		const target = this.scrollTargetRef?.deref() ?? null;
		if (target) {
			target.removeEventListener('scroll', this);
		}
		this.scrollTargetRef = null;
	}
	distanceFromBottom(target) {
		if (!target) {
			return 0;
		}
		return target.scrollHeight - target.scrollTop - target.clientHeight;
	}
	syncVisible() {
		if (this.state.position === 'static') {
			if (!this.state.visible) {
				this.state.visible = true;
			}
			return;
		}
		const target = this.scrollTargetRef?.deref() ?? this.resolveScrollContainer();
		const threshold = Number(this.state.threshold) || DEFAULT_THRESHOLD;
		const next = this.distanceFromBottom(target) > threshold;
		if (next !== this.state.visible) {
			this.state.visible = next;
		}
	}
	/* Never name this isVisible — base WebComponent owns isVisible as a lifecycle boolean. */
	get showControl() {
		return this.state.position === 'static' || this.state.visible;
	}
	get controlAriaHidden() {
		return !this.showControl;
	}
	handleClick(domEvent) {
		domEvent.stopPropagation();
		const target = this.scrollTargetRef?.deref() ?? this.resolveScrollContainer();
		if (target) {
			const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
			const behavior = this.state.smooth && !reduceMotion ? 'smooth' : 'auto';
			target.scrollTo({
				top: target.scrollHeight,
				left: 0,
				behavior,
			});
		}
		this.emit('ai-scroll-bottom:click', {});
	}
	render() {
		this.html`
			<div class="aisb"
				data-position=${this.state.position}
				?data-visible=${this.showControl}
				?aria-hidden=${this.controlAriaHidden}>
				<ui-button
					class="aisb-btn"
					.state.variant=${'solid'}
					.state.tone=${this.state.tone}
					.state.size=${this.state.size}
					.state.leadicon=${this.state.icon}
					.state.label=${''}
					.state.tooltip=${this.state.label}
					.state.disabled=${this.state.disabled}
					@button:click=${this.handleClick}></ui-button>
			</div>
		`;
	}
}
customElements.define('ui-ai-scroll-bottom', UIAiScrollBottom);
