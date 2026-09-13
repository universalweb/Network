/*
 * Shared FILE VOCABULARY — what kind of file this is, which icon stands for it,
 * and how to say its size.
 *
 * These lived inside ui-file-upload-item, which is the row of a *picker*. But
 * "what kind of file is this" is not a property of picking one: ui-attachment
 * shows a file the user has ALREADY sent or received, with no input element in
 * sight, and it needs exactly the same three answers. Extracting rather than
 * copying is what stops the two drifting on what counts as an image, or on
 * whether 1024 bytes reads as "1.0 KB".
 *
 * Deliberately dependency-free — no framework import — so it can be tested
 * directly and consumed from anywhere, the same shape as notice-stack.js.
 */
const KIND_BY_EXT = Object.freeze({
	'7z': 'archive',
	aac: 'audio',
	avi: 'video',
	avif: 'image',
	bmp: 'image',
	c: 'code',
	cjs: 'code',
	cpp: 'code',
	css: 'code',
	csv: 'spreadsheet',
	doc: 'text',
	docx: 'text',
	flac: 'audio',
	gif: 'image',
	go: 'code',
	gz: 'archive',
	h: 'code',
	html: 'code',
	ico: 'image',
	java: 'code',
	jpeg: 'image',
	jpg: 'image',
	js: 'code',
	json: 'json',
	jsx: 'code',
	m4a: 'audio',
	md: 'text',
	mjs: 'code',
	mkv: 'video',
	mov: 'video',
	mp3: 'audio',
	mp4: 'video',
	ogg: 'audio',
	ogv: 'video',
	pdf: 'text',
	png: 'image',
	py: 'code',
	rar: 'archive',
	rs: 'code',
	rtf: 'text',
	svg: 'image',
	tar: 'archive',
	tgz: 'archive',
	ts: 'code',
	tsv: 'spreadsheet',
	tsx: 'code',
	txt: 'text',
	wav: 'audio',
	webm: 'video',
	webp: 'image',
	xls: 'spreadsheet',
	xlsx: 'spreadsheet',
	zip: 'archive',
});
const KIND_ICON = Object.freeze({
	archive: 'file-archive',
	audio: 'file-audio',
	code: 'file-code',
	file: 'file',
	image: 'file-image',
	json: 'file-json',
	spreadsheet: 'file-spreadsheet',
	text: 'file-text',
	video: 'file-video',
});
/**
 * File extension without the leading dot.
 * @param {string} fileName - Original file name.
 * @returns {string} Lowercase extension, or empty.
 */
export function extensionOf(fileName) {
	const text = String(fileName || '').toLowerCase();
	const dot = text.lastIndexOf('.');
	if (dot < 0 || dot === text.length - 1) {
		return '';
	}
	return text.slice(dot + 1);
}
/**
 * Coarse kind used for the type icon and for whether a media thumb is possible.
 * MIME wins when it is meaningful; the extension is the fallback, because a
 * file dragged from some sources arrives with an empty or generic type.
 * @param {string} mime - File MIME (`File.type`).
 * @param {string} fileName - Original file name.
 * @returns {string} Kind token.
 */
export function fileKind(mime, fileName) {
	const mimeText = String(mime || '').toLowerCase();
	if (mimeText.startsWith('image/')) {
		return 'image';
	}
	if (mimeText.startsWith('video/')) {
		return 'video';
	}
	if (mimeText.startsWith('audio/')) {
		return 'audio';
	}
	if (mimeText === 'application/json' || mimeText.endsWith('+json')) {
		return 'json';
	}
	if (
		mimeText === 'text/javascript' ||
		mimeText === 'application/javascript' ||
		mimeText === 'application/typescript'
	) {
		return 'code';
	}
	if (
		mimeText === 'text/csv' ||
		mimeText.includes('spreadsheet') ||
		mimeText.includes('excel')
	) {
		return 'spreadsheet';
	}
	if (
		mimeText.includes('zip') ||
		mimeText.includes('tar') ||
		mimeText.includes('compressed') ||
		mimeText.includes('gzip')
	) {
		return 'archive';
	}
	if (mimeText.startsWith('text/')) {
		return 'text';
	}
	if (
		mimeText === 'application/pdf' ||
		mimeText.includes('word') ||
		mimeText.includes('document')
	) {
		return 'text';
	}
	return KIND_BY_EXT[extensionOf(fileName)] || 'file';
}
/**
 * Lucide icon name for a file kind.
 * @param {string} kind - Kind token from `fileKind`.
 * @returns {string} Sprite id.
 */
export function fileTypeIcon(kind) {
	return KIND_ICON[kind] || KIND_ICON.file;
}
/**
 * Human-readable byte size.
 * @param {number} bytes - File size in bytes.
 * @returns {string} Formatted size, or empty when the input is not a size.
 */
export function formatFileSize(bytes) {
	/*
	 * `null` and `''` both coerce to 0, so a missing size used to read as a
	 * confident "0 B". Only an actual number is a size; everything else is an
	 * absence, and an absence should render nothing.
	 */
	if (typeof bytes !== 'number' && typeof bytes !== 'string') {
		return '';
	}
	if (String(bytes).trim() === '') {
		return '';
	}
	const size = Number(bytes);
	if (!Number.isFinite(size) || size < 0) {
		return '';
	}
	if (size < 1024) {
		return `${size} B`;
	}
	if (size < 1048576) {
		return `${(size / 1024).toFixed(1)} KB`;
	}
	return `${(size / 1048576).toFixed(1)} MB`;
}
