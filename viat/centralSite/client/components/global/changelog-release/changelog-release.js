/**
 *	NAME: ChangelogRelease
 *	TAG: ui-changelog-release
 *
 *	── DESCRIPTION ──────────────────────────────────────────────────────
 *	DESCRIPTION: ui-changelog-release — one release article: version
 *	heading, date, optional badge, optional summary, then grouped change
 *	lists via ui-changelog-group. Identity of a changelog entry that
 *	ui-timeline cannot carry (its item is time/label/description).
 *	REJECTED: composing ui-timeline as the row (light rows, string
 *	description, click-to-select); extending UITimeline (event-stream
 *	policy: orientation, density, rail, select); a frozen change-type
 *	enum — groups are caller-supplied `{ heading, items, tone? }`.
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (HTML) ─────────────────────────────────────────────────────
 *	  <ui-changelog-release .state.version=${'1.2.0'} .state.date=${'2026-09-01'}></ui-changelog-release>
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (JS) ───────────────────────────────────────────────────────
 *	  import { UIChangelogRelease } from './changelog-release.js';
 *	  const host = new UIChangelogRelease({ version: '1.2.0', date: '2026-09-01' });
 *	  document.body.append(host);
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── META ─────────────────────────────────────────────────────────────
 *	Author: Universal Web
 *	Date: 2026-09-05
 *	─────────────────────────────────────────────────────────────────────
 */
import '../badge/badge.js';
import { isEmpty } from '@universalweb/utilitylib';
import { WebComponent } from 'webcomponent';
import { UIChangelogGroup } from '../changelog-group/changelog-group.js';
export class UIChangelogRelease extends WebComponent {
	static url = import.meta.url;
	static styles = {
		changelogRelease: './changelog-release.css',
	};
	static state = {
		id: '',
		version: '',
		date: '',
		datetime: '',
		heading: '',
		badge: '',
		tone: '',
		groups: [],
	};
	groupKey(item) {
		return item.id ?? item.heading;
	}
	dateTime() {
		const explicit = String(this.state.datetime ?? '').trim();
		if (explicit !== '') {
			return explicit;
		}
		return String(this.state.date ?? '').trim();
	}
	hideDate() {
		return isEmpty(String(this.state.date ?? '').trim());
	}
	hideSummary() {
		return isEmpty(String(this.state.heading ?? '').trim());
	}
	hideBadge() {
		return isEmpty(String(this.state.badge ?? '').trim());
	}
	badgeTone() {
		return this.state.tone || 'neutral';
	}
	renderBadge() {
		if (this.hideBadge()) {
			return '';
		}
		return this.htmlElement`<ui-badge
			.state.label=${this.state.badge}
			.state.tone=${this.badgeTone}
			.state.size=${'sm'}></ui-badge>`;
	}
	render() {
		this.html`
			<article class="changelog-release">
				<header class="changelog-release-head">
					<h2 class="changelog-version">${this.state.version}</h2>
					<time class="changelog-date"
						datetime=${this.dateTime}
						?hidden=${this.hideDate}>${this.state.date}</time>
					${this.renderBadge}
				</header>
				<p class="changelog-summary" ?hidden=${this.hideSummary}>${this.state.heading}</p>
				<div class="changelog-groups">
					${this.list('groups', UIChangelogGroup, this.groupKey)}
				</div>
			</article>
		`;
	}
}
customElements.define('ui-changelog-release', UIChangelogRelease);
