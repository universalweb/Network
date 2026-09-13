/**
 *	NAME: Changelog
 *	TAG: ui-changelog
 *
 *	── DESCRIPTION ──────────────────────────────────────────────────────
 *	DESCRIPTION: ui-changelog — a document of releases. A changelog IS
 *	a timeline of releases in the domain sense; ui-timeline is already
 *	the event-stream list (`{ time, label, description, icon, tone }`,
 *	light rows, click-to-select). Release entries need version + date +
 *	grouped lists, so this host lists ui-changelog-release articles
 *	(which list ui-changelog-group). Framework `this.list` is not a
 *	second copy of the timeline engine.
 *	REJECTED: extending UITimeline (converting light rows into a document
 *	row is a rewrite; interactive/heading/groups/orientation is a config
 *	matrix); composing `<ui-timeline>` as a child (groups cannot mount
 *	inside a light row; flattening them into `description` drops list
 *	semantics; the row stays a select target); a frozen Added/Changed/
 *	Fixed/Removed enum — groups are caller-supplied `{ heading, items,
 *	tone? }`; copying the timeline rail (a second visual engine).
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (HTML) ─────────────────────────────────────────────────────
 *	  <ui-changelog .state.heading=${'Changelog'} .state.items=${releases}></ui-changelog>
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (JS) ───────────────────────────────────────────────────────
 *	  import { UIChangelog } from './changelog.js';
 *	  const host = new UIChangelog({ heading: 'Changelog', items: releases });
 *	  document.body.append(host);
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── META ─────────────────────────────────────────────────────────────
 *	Author: Universal Web
 *	Date: 2026-09-05
 *	─────────────────────────────────────────────────────────────────────
 */
import '../empty-state/empty-state.js';
import { isArray, isEmpty } from '@universalweb/utilitylib';
import { WebComponent } from 'webcomponent';
import { UIChangelogRelease } from '../changelog-release/changelog-release.js';
export class UIChangelog extends WebComponent {
	static url = import.meta.url;
	static styles = {
		changelog: './changelog.css',
	};
	static state = {
		heading: '',
		items: [],
	};
	itemKey(item) {
		return item.id ?? item.version;
	}
	hideHeading() {
		return isEmpty(String(this.state.heading ?? '').trim());
	}
	hasNoReleases() {
		return !isArray(this.state.items) || isEmpty(this.state.items);
	}
	renderEmpty() {
		if (!this.hasNoReleases()) {
			return '';
		}
		return this.htmlElement`<ui-empty-state
			.state.heading=${'No releases'}
			.state.hint=${'Nothing has been published yet.'}></ui-empty-state>`;
	}
	render() {
		this.html`
			<section class="changelog">
				<h2 class="changelog-heading" ?hidden=${this.hideHeading}>${this.state.heading}</h2>
				${this.renderEmpty}
				<div class="changelog-list" ?hidden=${this.hasNoReleases}>
					${this.list('items', UIChangelogRelease, this.itemKey)}
				</div>
			</section>
		`;
	}
}
customElements.define('ui-changelog', UIChangelog);
