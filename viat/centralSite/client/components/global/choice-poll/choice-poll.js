/*
	DESCRIPTION: ui-choice-poll — a ui-poll preset. Single-select that locks the
	moment you pick (no Vote button); results reveal instantly. All logic lives in
	the UIPoll base; this only flips the `instant` default.
*/
import { UIPoll } from '../poll/poll.js';
export class UIChoicePoll extends UIPoll {
	static state = {
		instant: true,
	};
}
customElements.define('ui-choice-poll', UIChoicePoll);
