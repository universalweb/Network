/*
 * Hand-rolled, zero-dependency markdown renderer for the AI chat. Two concerns:
 *
 *   segmentMarkdown(content) → ordered render PARTS: fenced ``` blocks become
 *     `code` parts (routed to <ui-code-block>); everything between becomes
 *     `text` parts carrying pre-rendered, already-SAFE html.
 *   markdownToHtml(md) → the block+inline renderer for one text segment.
 *
 * Security model: escape-by-default. Every text run is HTML-escaped FIRST, so
 * any raw markup the model emits is inert text; markdown tokens (`*`, `` ` ``,
 * `[` …) survive escaping and are turned into a fixed, known set of safe tags.
 * Link hrefs are scheme-checked (http/https/mailto/relative/anchor only). No
 * sanitizer dependency is needed because no untrusted string ever reaches the
 * DOM as markup — only renderer-emitted tags do. Runs ONLY on settled content
 * (never mid-stream), so the parser is never fed a half-open fence on a hot path.
 */
const FENCE_OPEN_RE = /^\s*`{3,}\s*([\w+-]*)\s*$/;
const FENCE_CLOSE_RE = /^\s*`{3,}\s*$/;
const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const HR_RE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const BLOCKQUOTE_RE = /^\s*>/;
const UL_RE = /^\s*[-*+]\s+(.*)$/;
const OL_RE = /^\s*\d+\.\s+(.*)$/;
const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const BOLD_STAR_RE = /\*\*([^*]+)\*\*/g;
const BOLD_UNDER_RE = /(?<!\w)__([^_]+)__(?!\w)/g;
const ITALIC_STAR_RE = /\*([^*]+)\*/g;
const ITALIC_UNDER_RE = /(?<!\w)_([^_]+)_(?!\w)/g;
const STRIKE_RE = /~~([^~]+)~~/g;
function escapeHtml(value) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}
// Hrefs are already HTML-escaped (whole run escaped before this runs), so the
// only remaining risk is the URL SCHEME — block javascript:/data: by allowing
// an explicit allowlist and falling back to an inert anchor.
function safeUrl(url) {
	const trimmed = url.trim();
	const lower = trimmed.toLowerCase();
	if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('mailto:')) {
		return trimmed;
	}
	if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
		return trimmed;
	}
	return '#';
}
function renderLink(match, label, url) {
	return `<a class="md-link" href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}
function applyEmphasis(text) {
	// Links first so a URL's parens aren't eaten by italic; bold before italic
	// so `**x**` resolves to <strong>, not two stray <em>. Underscore variants
	// are word-boundary-gated so identifiers like snake_case stay literal.
	return text
		.replace(LINK_RE, renderLink)
		.replace(BOLD_STAR_RE, '<strong>$1</strong>')
		.replace(BOLD_UNDER_RE, '<strong>$1</strong>')
		.replace(ITALIC_STAR_RE, '<em>$1</em>')
		.replace(ITALIC_UNDER_RE, '<em>$1</em>')
		.replace(STRIKE_RE, '<del>$1</del>');
}
function renderInline(text) {
	const escaped = escapeHtml(text);
	// Split on inline code spans (odd indices = code content). Emphasis runs
	// only on the non-code runs so `*`/`_` inside `code` stays literal.
	const segments = escaped.split(/`([^`]+)`/g);
	let out = '';
	for (let index = 0; index < segments.length; index += 1) {
		if (index % 2 === 1) {
			out += `<code class="md-icode">${segments[index]}</code>`;
			continue;
		}
		out += applyEmphasis(segments[index]);
	}
	return out;
}
function trimCell(value) {
	return value.trim();
}
function splitRow(line) {
	let trimmed = line.trim();
	if (trimmed.startsWith('|')) {
		trimmed = trimmed.slice(1);
	}
	if (trimmed.endsWith('|')) {
		trimmed = trimmed.slice(0, -1);
	}
	return trimmed.split('|').map(trimCell);
}
function isTableStart(lines, index) {
	const header = lines[index];
	const separator = lines[index + 1];
	if (!header || !separator || header.indexOf('|') < 0) {
		return false;
	}
	return (/^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)+\|?\s*$/).test(separator);
}
function startsNewBlock(lines, index) {
	const line = lines[index];
	return HEADING_RE.test(line) || HR_RE.test(line) || BLOCKQUOTE_RE.test(line) || UL_RE.test(line) || OL_RE.test(line) || isTableStart(lines, index);
}
function renderHeading(line) {
	const match = HEADING_RE.exec(line);
	const level = match[1].length;
	return `<h${level} class="md-h md-h${level}">${renderInline(match[2].trim())}</h${level}>`;
}
function collectBlockquote(lines, start, blocks) {
	// Inline-only quote body (one <p>, soft breaks). Chat quotes are short prose;
	// rendering inline keeps this leaf and avoids a markdownToHtml back-reference.
	let index = start;
	const inner = [];
	while (index < lines.length && BLOCKQUOTE_RE.test(lines[index])) {
		inner.push(renderInline(lines[index].replace(/^\s*>\s?/, '')));
		index += 1;
	}
	blocks.push(`<blockquote class="md-quote"><p class="md-p">${inner.join('<br>')}</p></blockquote>`);
	return index;
}
function collectList(lines, start, tag, itemRe, blocks) {
	let index = start;
	let items = '';
	while (index < lines.length && itemRe.test(lines[index])) {
		const match = itemRe.exec(lines[index]);
		items += `<li class="md-li">${renderInline(match[1].trim())}</li>`;
		index += 1;
	}
	blocks.push(`<${tag} class="md-list md-${tag}">${items}</${tag}>`);
	return index;
}
function collectTable(lines, start, blocks) {
	const headers = splitRow(lines[start]);
	let index = start + 2;
	let body = '';
	while (index < lines.length && lines[index].indexOf('|') >= 0 && lines[index].trim() !== '') {
		const cells = splitRow(lines[index]);
		body += '<tr>';
		for (let column = 0; column < headers.length; column += 1) {
			body += `<td>${renderInline(cells[column] ?? '')}</td>`;
		}
		body += '</tr>';
		index += 1;
	}
	let head = '';
	for (let column = 0; column < headers.length; column += 1) {
		head += `<th>${renderInline(headers[column])}</th>`;
	}
	blocks.push(`<table class="md-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`);
	return index;
}
function collectParagraph(lines, start, blocks) {
	let index = start;
	const rows = [];
	while (index < lines.length && lines[index].trim() !== '') {
		if (index !== start && startsNewBlock(lines, index)) {
			break;
		}
		rows.push(renderInline(lines[index].trim()));
		index += 1;
	}
	blocks.push(`<p class="md-p">${rows.join('<br>')}</p>`);
	return index;
}
export function markdownToHtml(source) {
	const lines = String(source ?? '').replace(/\r\n?/g, '\n').split('\n');
	const blocks = [];
	let index = 0;
	while (index < lines.length) {
		const line = lines[index];
		if (line.trim() === '') {
			index += 1;
		} else if (HEADING_RE.test(line)) {
			blocks.push(renderHeading(line));
			index += 1;
		} else if (HR_RE.test(line)) {
			blocks.push('<hr class="md-hr">');
			index += 1;
		} else if (BLOCKQUOTE_RE.test(line)) {
			index = collectBlockquote(lines, index, blocks);
		} else if (UL_RE.test(line)) {
			index = collectList(lines, index, 'ul', UL_RE, blocks);
		} else if (OL_RE.test(line)) {
			index = collectList(lines, index, 'ol', OL_RE, blocks);
		} else if (isTableStart(lines, index)) {
			index = collectTable(lines, index, blocks);
		} else {
			index = collectParagraph(lines, index, blocks);
		}
	}
	return blocks.join('\n');
}
// Pre-render a text run into a `text` part. Skips blank runs; id keys off the
// growing parts length so every part id stays unique for the keyed list diff.
function pushTextPart(parts, buffer) {
	if (buffer.length === 0) {
		return;
	}
	const joined = buffer.join('\n');
	if (joined.trim() === '') {
		return;
	}
	parts.push({
		id: `t${parts.length}`,
		kind: 'text',
		html: markdownToHtml(joined),
	});
}
export function segmentMarkdown(content) {
	const lines = String(content ?? '').replace(/\r\n?/g, '\n').split('\n');
	const parts = [];
	let buffer = [];
	let index = 0;
	while (index < lines.length) {
		const fenceMatch = FENCE_OPEN_RE.exec(lines[index]);
		if (fenceMatch) {
			pushTextPart(parts, buffer);
			buffer = [];
			index += 1;
			const codeLines = [];
			while (index < lines.length && !FENCE_CLOSE_RE.test(lines[index])) {
				codeLines.push(lines[index]);
				index += 1;
			}
			// Step past the closing fence (or past end if the stream cut it off).
			index += 1;
			parts.push({
				id: `c${parts.length}`,
				kind: 'code',
				code: codeLines.join('\n'),
				lang: fenceMatch[1].trim(),
			});
			continue;
		}
		buffer.push(lines[index]);
		index += 1;
	}
	pushTextPart(parts, buffer);
	if (parts.length === 0) {
		parts.push({
			id: 't0',
			kind: 'text',
			html: '',
		});
	}
	return parts;
}
