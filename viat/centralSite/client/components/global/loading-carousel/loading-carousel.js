/*
	DESCRIPTION: ui-loading-carousel — a ui-carousel preset for "while you wait"
	tips. Slide transition with looping autoplay (4.5s) and progress-bar indicators
	that fill across each interval; prev/next arrows. Inherited from UICarousel.
*/
import { UICarousel } from '../carousel/carousel.js';
export class UILoadingCarousel extends UICarousel {
	static state = {
		transition: 'slide',
		indicators: 'progress',
		autoplay: true,
		interval: 4500,
		arrows: true,
		loop: true,
	};
}
customElements.define('ui-loading-carousel', UILoadingCarousel);
