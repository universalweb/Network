/*
	DESCRIPTION: ui-poll-widget — a compact ui-poll preset (variant 'widget') meant
	to drop into a sidebar or card. Inherits all UIPoll behavior; popover / dialog
	presentation modes will reuse ui-popover / ui-modal later rather than rebuild.
*/
import { UIPoll } from '../poll/poll.js';
export class UIPollWidget extends UIPoll {
	static state = {
		variant: 'widget',
		buttonLabel: 'Submit',
	};
}
customElements.define('ui-poll-widget', UIPollWidget);
