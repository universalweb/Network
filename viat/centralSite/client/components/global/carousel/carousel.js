/*
	DESCRIPTION: ui-carousel — a slide/fade carousel (zero-dep, no build). A single
	track holds the slides; `transition` picks how the active one shows:
	  • slide — the flex track translates by activeIndex (spring).
	  • fade  — slides stack (grid) and cross-fade + scale.
	Optional autoplay (pauses on hover/drag, resets on manual nav), prev/next
	arrows (transparent over the media so they never obscure content; shape circle |
	rounded | square via `arrowShape`; optional reveal-on-hover via `arrowReveal` —
	hidden until the carousel is hovered or focused), click-to-advance,
	pointer/touch drag-to-step (the shared dragTrack
	gesture — finger-follow in slide mode, swipe-to-step in fade), keyboard nav
	(←/→ + Home/End — document-global hotkeys gated to the FOCUSED carousel so
	each instance owns its own keys; the per-instance `keyboard` flag enables or
	disables them), and two indicator styles: dots, or progress bars that fill
	over the autoplay interval.
	The canonical base for ui-feature-carousel (fade + dots + click) and
	ui-loading-carousel (slide + progress + loop).
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-carousel
	    .state.items=${[{ id: 'a', heading: 'Fast', description: '…' }, …]}
	    .state.transition=${'fade'} .state.autoplay=${true}>
	  </ui-carousel>
	─────────────────────────────────────────────────────────────────────
*/
import { html, WebComponent } from 'webcomponent';
class UICarouselSlide extends WebComponent {
	static url = import.meta.url;
	static styles = {
		carouselSlide: './carousel-slide.css',
	};
	static state = {
		id: '',
		eyebrow: '',
		heading: '',
		description: '',
		image: '',
		tone: 'accent',
		active: false,
	};
	onConnect() {
		// Reflect active to the host so the parent's transition CSS can target it
		// (the parent owns slide-vs-fade layout; the host is the positioned item).
		this.observe('active', () => {
			this.toggleAttribute('data-active', Boolean(this.state.active));
		}, {
			immediate: true,
		});
	}
	render() {
		this.html`
			<article class="slide" data-tone=${this.state.tone}>
				<span class="slide-media" ?hidden=${Boolean(this.state.image)} aria-hidden="true"></span>
				<img class="slide-img" ?hidden=${!this.state.image} src=${this.state.image || ''} alt="" loading="lazy">
				<span class="slide-body">
					<span class="slide-eyebrow" ?hidden=${!this.state.eyebrow}>${this.state.eyebrow}</span>
					<span class="slide-heading" ?hidden=${!this.state.heading}>${this.state.heading}</span>
					<span class="slide-desc" ?hidden=${!this.state.description}>${this.state.description}</span>
				</span>
			</article>
		`;
	}
}
customElements.define('ui-carousel-slide', UICarouselSlide);
export class UICarousel extends WebComponent {
	static url = import.meta.url;
	static styles = {
		carousel: './carousel.css',
	};
	static state = {
		items: [],
		activeIndex: 0,
		transition: 'slide',
		indicators: 'dots',
		autoplay: false,
		interval: 4000,
		arrows: false,
		advanceOnClick: false,
		loop: true,
		drag: true,
		keyboard: true,
		arrowShape: 'circle',
		arrowReveal: false,
		// Dot/progress indicator keys — rebuilt from items.length + activeIndex.
		dots: [],
	};
	slideWidth = 0;
	dragController = null;
	onConnect() {
		// Mark the active slide the moment slides bind (covers pre-connect set).
		this.observe('items', this.handleItemsChange, {
			immediate: true,
		});
		this.observe('activeIndex', this.syncDots);
		this.observe('indicators', this.syncDots);
		// Keyboard nav binds here, not onMount: the hotkey registry is document-
		// level (no refs needed) and onConnect fires once per connect, so it never
		// double-registers on a re-render the way an onMount gesture install would.
		// The lifecycle sweep releases the entries on disconnect.
		this.installKeys();
	}
	handleItemsChange() {
		this.syncActive();
		this.syncDots();
	}
	/* Structural dots list + on flags (tabs-style deep write for the active dot). */
	syncDots() {
		if (this.state.indicators === 'none') {
			if (this.state.dots.length) {
				this.state.dots = [];
			}
			return;
		}
		const count = this.state.items.length;
		const active = this.state.activeIndex;
		const dots = this.state.dots;
		if (dots.length !== count) {
			const next = [];
			for (let index = 0; index < count; index += 1) {
				next.push({
					id: index,
					on: index === active,
				});
			}
			this.state.dots = next;
			return;
		}
		for (let index = 0; index < count; index += 1) {
			const want = index === active;
			if (Boolean(dots[index].on) !== want) {
				dots[index].on = want;
			}
		}
	}
	onMount() {
		this.startAutoplay();
		this.installDrag();
	}
	slideKey(item) {
		return item.id;
	}
	installDrag() {
		if (!this.state.drag) {
			return;
		}
		// A full re-render rebuilds the shadow tree, so the viewport is a NEW element
		// and any prior gesture is bound to a discarded node. Destroy it before
		// rebinding — otherwise a re-render (the gallery toggles section visibility)
		// stacks installs and one swipe settles N times. Drop the dead controller
		// from the auto-clean set too, so it doesn't accumulate across re-renders.
		if (this.dragController) {
			this.gestureUnsubs?.delete(this.dragController);
			this.dragController.destroy();
		}
		// One detent = one viewport width. The gesture tracks document-wide moves,
		// gates tap-vs-drag, suppresses the post-drag click, and reports a single
		// signed step on release; this component owns only the visual follow.
		this.dragController = this.dragTrack(this.refs.viewport, {
			axis: 'x',
			extent: () => {
				return this.slideWidth || this.measureViewport();
			},
			canStep: (step) => {
				return this.canStep(step);
			},
			onStart: () => {
				this.handleDragStart();
			},
			onMove: (delta) => {
				this.handleDragMove(delta);
			},
			onSettle: (step) => {
				this.handleDragSettle(step);
			},
		});
	}
	measureViewport() {
		const viewportEl = this.refs.viewport;
		return viewportEl ? viewportEl.getBoundingClientRect().width : 0;
	}
	canStep(step) {
		if (this.state.loop) {
			return true;
		}
		const next = this.state.activeIndex + step;
		return next >= 0 && next <= this.state.items.length - 1;
	}
	handleDragStart() {
		this.slideWidth = this.measureViewport();
		this.stopAutoplay();
		// Kill the spring so the track tracks the finger 1:1 (slide mode only —
		// fade has no spatial track to follow).
		if (this.state.transition === 'slide' && this.refs.track) {
			this.refs.track.style.transition = 'none';
		}
		this.refs.viewport?.classList.add('is-dragging');
	}
	handleDragMove(delta) {
		if (this.state.transition !== 'slide') {
			return;
		}
		const track = this.refs.track;
		if (!track) {
			return;
		}
		const base = -this.state.activeIndex * 100;
		const offset = this.resistEdge(delta);
		track.style.transform = `translateX(calc(${base}% + ${offset}px))`;
	}
	resistEdge(delta) {
		// Rubber-band past a hard edge (no loop): dampen the travel so it reads as
		// bounded, not broken.
		if (this.state.loop) {
			return delta;
		}
		const atFirst = this.state.activeIndex === 0;
		const atLast = this.state.activeIndex === this.state.items.length - 1;
		if ((atFirst && delta > 0) || (atLast && delta < 0)) {
			return delta * 0.35;
		}
		return delta;
	}
	handleDragSettle(step) {
		const track = this.refs.track;
		const slideMode = this.state.transition === 'slide';
		this.refs.viewport?.classList.remove('is-dragging');
		if (track && slideMode) {
			// Hand the transform back to the CSS spring — the committed branch's
			// string-form `style=` patch, or the imperative restore below, animates.
			track.style.transition = '';
		}
		const before = this.state.activeIndex;
		if (step !== 0) {
			this.goTo(before + step);
		}
		// Drive the restore off what ACTUALLY happened, never a prediction: goTo can
		// no-op even with a committed step (clamped no-loop edge, or a single-slide
		// wrap). If the index didn't move, no patch pass fires → snap home here.
		if (track && slideMode && this.state.activeIndex === before) {
			track.style.transform = `translateX(${-before * 100}%)`;
		}
		this.restartAutoplay();
	}
	installKeys() {
		// Register unconditionally; `this.state.keyboard` is re-checked live in the
		// handler (isKeyboardTarget), so the flag is a reversible per-instance switch
		// rather than a connect-time-only decision. While disabled the entries just
		// no-op on dispatch (and are WeakRef'd + auto-swept), so the cost is nil.
		// preventDefault:false is load-bearing — the registry sets blockDefault from
		// this option the moment the handler is INVOKED, before our gate decides
		// whether to act. Leaving it on would swallow every arrow/Home/End press for
		// any mounted carousel, hijacking page scroll globally. So we suppress the
		// default ourselves, only on the press we actually consume.
		const options = {
			preventDefault: false,
		};
		this.hotKey('arrowleft', this.handleKey, options);
		this.hotKey('arrowright', this.handleKey, options);
		this.hotKey('home', this.handleKey, options);
		this.hotKey('end', this.handleKey, options);
	}
	isKeyboardTarget() {
		// The hotkey registry is document-global — one keydown reaches EVERY mounted
		// carousel. Two gates make the keys belong to exactly one instance:
		//   • this.state.keyboard — the per-instance enable switch, read live so it
		//     toggles hotkeys on/off at runtime, not just at connect.
		//   • :focus-within       — only one element holds focus at a time, so only
		//     the focused carousel answers. (Hover was the bug: a focused carousel
		//     plus the mouse merely resting over a different one stepped BOTH on one
		//     press. Keyboard nav follows focus, never the cursor.)
		return this.state.keyboard && this.matches(':focus-within');
	}
	handleKey(keyEvent, canonical) {
		if (!this.isKeyboardTarget()) {
			return;
		}
		if (canonical === 'arrowleft') {
			this.goTo(this.state.activeIndex - 1);
		} else if (canonical === 'arrowright') {
			this.goTo(this.state.activeIndex + 1);
		} else if (canonical === 'home') {
			this.goTo(0);
		} else {
			this.goTo(this.state.items.length - 1);
		}
		keyEvent.preventDefault();
		this.restartAutoplay();
	}
	syncActive() {
		const slides = this.state.items;
		const active = this.state.activeIndex;
		for (let index = 0; index < slides.length; index += 1) {
			const want = index === active;
			// Idempotent — write only on change so this never feeds back into the
			// `slides` observer as an infinite loop.
			if (Boolean(slides[index].active) !== want) {
				slides[index].active = want;
			}
		}
	}
	goTo(index) {
		const count = this.state.items.length;
		if (count === 0) {
			return;
		}
		let next = index;
		if (this.state.loop) {
			next = (((index % count) + count) % count);
		} else {
			next = Math.max(0, Math.min(count - 1, index));
		}
		if (next === this.state.activeIndex) {
			return;
		}
		this.state.activeIndex = next;
		this.syncActive();
		this.emit('carousel:change', {
			index: next,
		});
	}
	startAutoplay() {
		if (!this.state.autoplay || this.state.items.length < 2) {
			return;
		}
		this.stopAutoplay();
		this.autoplayTimer = this.addInterval(() => {
			this.goTo(this.state.activeIndex + 1);
		}, this.state.interval);
	}
	stopAutoplay() {
		if (this.autoplayTimer) {
			this.stopInterval(this.autoplayTimer);
			this.autoplayTimer = null;
		}
	}
	restartAutoplay() {
		if (this.state.autoplay) {
			this.startAutoplay();
		}
	}
	handlePrev() {
		this.goTo(this.state.activeIndex - 1);
		this.restartAutoplay();
	}
	handleNext() {
		this.goTo(this.state.activeIndex + 1);
		this.restartAutoplay();
	}
	handleDotClick(domEvent) {
		const button = domEvent.target.closest('button.dot');
		if (!button) {
			return;
		}
		const index = Number(button.dataset.index);
		if (Number.isNaN(index)) {
			return;
		}
		this.goTo(index);
		this.restartAutoplay();
	}
	dotRow(item) {
		return html`<button type="button" class="dot" data-index=${item.id} ?data-on=${item.on} aria-label=${`Go to slide ${item.id + 1}`}><span class="dot-fill"></span></button>`;
	}
	dotKey(item) {
		return item.id;
	}
	handleSlideClick() {
		if (!this.state.advanceOnClick) {
			return;
		}
		this.goTo(this.state.activeIndex + 1);
		this.restartAutoplay();
	}
	handlePointerEnter() {
		this.stopAutoplay();
	}
	handlePointerLeave() {
		this.startAutoplay();
	}
	trackStyle() {
		if (this.state.transition !== 'slide') {
			return '';
		}
		return `transform: translateX(-${this.state.activeIndex * 100}%)`;
	}
	viewportTabIndex() {
		// Focusable only while keyboard nav is on, so a disabled carousel stays out
		// of the tab order instead of being a focus trap that does nothing.
		return this.state.keyboard ? '0' : '-1';
	}
	intervalStyle() {
		return `--carousel-interval: ${Number(this.state.interval) || 0}ms`;
	}
	render() {
		this.html`
			<div
				class="carousel"
				data-transition=${this.state.transition}
				data-indicators=${this.state.indicators}
				data-drag=${this.state.drag ? 'on' : 'off'}
				data-arrow-shape=${this.state.arrowShape}
				data-arrow-reveal=${this.state.arrowReveal ? 'on' : 'off'}
				style=${this.intervalStyle}
				@pointerenter=${this.handlePointerEnter}
				@pointerleave=${this.handlePointerLeave}>
				<div #viewport class="viewport" tabindex=${this.viewportTabIndex} role="group" aria-roledescription="carousel" aria-label="Carousel">
					<div #track class="track" style=${this.trackStyle} @click=${this.handleSlideClick}>
						${this.list('items', UICarouselSlide, this.slideKey)}
					</div>
					<button class="nav prev" type="button" ?hidden=${!this.state.arrows} tooltip="Previous" aria-label="Previous slide" @click=${this.handlePrev}>
						<ui-icon .state.name=${'chevron-left'} .state.size=${'sm'}></ui-icon>
					</button>
					<button class="nav next" type="button" ?hidden=${!this.state.arrows} tooltip="Next" aria-label="Next slide" @click=${this.handleNext}>
						<ui-icon .state.name=${'chevron-right'} .state.size=${'sm'}></ui-icon>
					</button>
				</div>
				<div class="dots" ?hidden=${this.state.indicators === 'none'} @click=${this.handleDotClick}>${this.list('dots', this.dotRow, this.dotKey)}</div>
			</div>
		`;
	}
}
customElements.define('ui-carousel', UICarousel);
