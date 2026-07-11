/*
	DESCRIPTION: ui-feature-carousel — a ui-carousel preset for feature showcases.
	Cross-fades + scales between slides (cult-ui parity), dot indicators, 3s
	autoplay, and click-to-advance. All mechanics inherited from UICarousel.
*/
import { UICarousel } from '../carousel/carousel.js';
export class UIFeatureCarousel extends UICarousel {
	static state = {
		transition: 'fade',
		indicators: 'dots',
		autoplay: true,
		interval: 3000,
		advanceOnClick: true,
	};
}
customElements.define('ui-feature-carousel', UIFeatureCarousel);
