/**
 *	NAME: Animated icon registry
 *
 *	── DESCRIPTION ──────────────────────────────────────────────────────
 *	Wallet-site motion recipes, keyed by NAME so ui-icon (and every
 *	consumer that already passes a name string — menu leadIcon, nav
 *	trigger, menubar row, icon-button) can resolve them through the
 *	existing icon channel. Keys live under `anim-` so they never steal
 *	a Lucide sprite id (compass, hop, rainbow, settings, sidebar are
 *	glyphs). `state.animated` remains the explicit recipe override
 *	(any glyph + any recipe). Recipes themselves (data-animate values)
 *	keep the wallet names: bob, compass, hop, flip, rainbow, settings,
 *	sidebar.
 *	REJECTED: a family of per-recipe custom elements (parallel icon
 *	system; consumers still mount <ui-icon>; catalog explosion).
 *	REJECTED: adding an `animated` field to menubar / nav-section /
 *	menu-item / button (N call-site changes; fails dual-use by name).
 *	REJECTED: registering the raw recipe names that collide with
 *	Lucide (every static compass / settings / hop would start moving).
 *	REJECTED: a second renderer or nested CE inside ui-icon — the
 *	glyph is still a sprite <use>; motion is CSS on data-animate.
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── META ─────────────────────────────────────────────────────────────
 *	Author: Universal Web
 *	Date: 2026-09-05
 *	─────────────────────────────────────────────────────────────────────
 */
export const ANIMATED_ICONS = Object.freeze({
	'anim-bob': Object.freeze({
		glyph: 'wallet',
		animate: 'bob',
	}),
	'anim-compass': Object.freeze({
		glyph: 'compass',
		animate: 'compass',
	}),
	'anim-hop': Object.freeze({
		glyph: 'users',
		animate: 'hop',
	}),
	'anim-flip': Object.freeze({
		glyph: 'repeat-2',
		animate: 'flip',
	}),
	'anim-rainbow': Object.freeze({
		glyph: 'bot',
		animate: 'rainbow',
	}),
	'anim-settings': Object.freeze({
		glyph: 'settings',
		animate: 'settings',
	}),
	'anim-sidebar': Object.freeze({
		glyph: 'panel-left',
		animate: 'sidebar',
	}),
});
export function resolveAnimatedIcon(iconName) {
	if (!iconName) {
		return null;
	}
	return ANIMATED_ICONS[iconName] ?? null;
}
