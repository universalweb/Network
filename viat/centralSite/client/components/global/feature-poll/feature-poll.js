/*
	DESCRIPTION: ui-feature-poll — a ui-poll preset for feature roadmaps. Shows
	option descriptions and a roomier layout (variant 'feature'); single-select +
	Vote button. All behavior is inherited from UIPoll.
*/
import { UIPoll } from '../poll/poll.js';
export class UIFeaturePoll extends UIPoll {
	static state = {
		variant: 'feature',
		buttonLabel: 'Cast vote',
	};
}
customElements.define('ui-feature-poll', UIFeaturePoll);
