/*
	DESCRIPTION: ui-feature-voting — a ui-vote-tally preset for feature roadmaps.
	Shows row descriptions and a roomier layout (variant 'feature'); inherits the
	upvote toggle, count-up, and FLIP reorder from UIVoteTally.
*/
import { UIVoteTally } from '../vote-tally/vote-tally.js';
export class UIFeatureVoting extends UIVoteTally {
	static state = {
		variant: 'feature',
	};
}
customElements.define('ui-feature-voting', UIFeatureVoting);
