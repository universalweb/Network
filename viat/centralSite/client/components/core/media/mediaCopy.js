/*
	Shared media copy: heading, caption, subtitle, description, plus captionAlign.
	ui-media-stage and ui-gallery-thumb both render this set; ui-gallery and
	ui-media-lightbox both feed it. Caption still resolves from `label` so
	existing items keep working. `heading` is the state key — `title` on an
	item maps onto it (HTMLElement.title is the native tooltip attribute).
*/
import { isTrue } from '@universalweb/utilitylib';
const ALIGN = new Set([
	'center', 'start', 'end',
]);
const SHOW_FLAG = {
	heading: 'showHeading',
	caption: 'showCaption',
	subtitle: 'showSubtitle',
	description: 'showDescription',
};
export function mediaCopyAlign(value) {
	const token = String(value || 'center');
	return ALIGN.has(token) ? token : 'center';
}
export function resolveMediaCopy(source) {
	const item = source || {};
	return {
		heading: item.heading || item.title || '',
		caption: item.caption || item.label || '',
		subtitle: item.subtitle || '',
		description: item.description || '',
		captionAlign: mediaCopyAlign(item.captionAlign),
	};
}
export function isCopyHidden(state, field) {
	const flagName = SHOW_FLAG[field];
	if (flagName && !isTrue(state[flagName])) {
		return true;
	}
	const copy = resolveMediaCopy(state);
	return !copy[field];
}
