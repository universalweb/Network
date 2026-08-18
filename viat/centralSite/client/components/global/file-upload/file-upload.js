/*
	DESCRIPTION: ui-file-upload — choose + drag/drop file list (PrimeVue FileUpload
	basic mode). Files live on a plain instance field (identity); `fileItems` is
	the reactive render buffer. Emits file-upload:select {files},
	file-upload:remove {file,files}, file-upload:clear {files}.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-file-upload .state.accept=${'image/*'} .state.multiple=${true}
	    @file-upload:select=${this.onFiles}></ui-file-upload>
	─────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { isString } from '@universalweb/utilitylib';
import { WebComponent } from 'webcomponent';
/**
 * Human-readable byte size.
 * @param {number} bytes - File size in bytes.
 * @returns {string} Formatted size.
 */
function formatFileSize(bytes) {
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
/**
 * Stable id for a File (name + size + lastModified).
 * @param {File} file - Browser File.
 * @returns {string} Row id.
 */
function fileId(file) {
	return `${file.name}:${file.size}:${file.lastModified}`;
}
/**
 * Whether a file matches an accept token list (`image/*`, `.pdf`, mime).
 * @param {File} file - Browser File.
 * @param {string} accept - Comma-separated accept string.
 * @returns {boolean} True when the file is allowed.
 */
function fileMatchesAccept(file, accept) {
	if (!isString(accept) || !accept.trim()) {
		return true;
	}
	const tokens = accept.split(',');
	const tokenCount = tokens.length;
	const fileName = String(file.name || '').toLowerCase();
	const mime = String(file.type || '').toLowerCase();
	for (let index = 0; index < tokenCount; index += 1) {
		const token = tokens[index].trim().toLowerCase();
		if (!token) {
			continue;
		}
		if (token.endsWith('/*')) {
			const prefix = token.slice(0, token.indexOf('/'));
			if (mime.startsWith(`${prefix}/`)) {
				return true;
			}
			continue;
		}
		if (token.charAt(0) === '.') {
			if (fileName.endsWith(token)) {
				return true;
			}
			continue;
		}
		if (mime === token) {
			return true;
		}
	}
	return false;
}
export class UIFileUpload extends WebComponent {
	static url = import.meta.url;
	static styles = {
		fileUpload: './file-upload.css',
	};
	static state = {
		accept: '',
		multiple: false,
		disabled: false,
		chooseLabel: 'Choose',
		dropLabel: 'Drop files here or click to browse',
		emptyMessage: 'No files selected.',
		over: false,
		fileItems: [],
		uploadIcon: {
			name: 'upload',
			size: 'lg',
		},
	};
	liveFiles = [];
	dragDepth = 0;
	onConnect() {
		this.rebuildItems();
	}
	currentFiles() {
		return this.liveFiles.slice();
	}
	/** Content-stable id (name:size:lastModified) — used for row keys AND dedupe. */
	idFor(file) {
		return fileId(file);
	}
	rebuildItems() {
		const files = this.liveFiles;
		const items = new Array(files.length);
		const fileCount = files.length;
		for (let index = 0; index < fileCount; index += 1) {
			const file = files[index];
			const id = this.idFor(file);
			items[index] = {
				id,
				label: file.name,
				value: id,
				sizeLabel: formatFileSize(file.size),
			};
		}
		this.state.fileItems = items;
	}
	hasFile(file) {
		const probe = this.idFor(file);
		const files = this.liveFiles;
		const fileCount = files.length;
		for (let index = 0; index < fileCount; index += 1) {
			if (this.idFor(files[index]) === probe) {
				return true;
			}
		}
		return false;
	}
	addFileList(fileList) {
		if (this.state.disabled || !fileList || !fileList.length) {
			return;
		}
		const accept = this.state.accept;
		const incoming = [];
		const listCount = fileList.length;
		for (let index = 0; index < listCount; index += 1) {
			const file = fileList[index];
			if (!file || !fileMatchesAccept(file, accept)) {
				continue;
			}
			incoming.push(file);
		}
		if (!incoming.length) {
			return;
		}
		if (this.state.multiple === true) {
			const next = this.liveFiles.slice();
			const incomingCount = incoming.length;
			for (let index = 0; index < incomingCount; index += 1) {
				const file = incoming[index];
				if (!this.hasFile(file)) {
					next.push(file);
				}
			}
			this.liveFiles = next;
		} else {
			this.liveFiles = [incoming[0]];
		}
		this.rebuildItems();
		this.emit('file-upload:select', {
			files: this.currentFiles(),
		});
	}
	removeFile(itemId) {
		const files = this.liveFiles;
		const next = [];
		let removed = null;
		const fileCount = files.length;
		for (let index = 0; index < fileCount; index += 1) {
			const file = files[index];
			const id = this.idFor(file);
			if (id === itemId) {
				removed = file;
				continue;
			}
			next.push(file);
		}
		if (!removed) {
			return;
		}
		this.liveFiles = next;
		this.rebuildItems();
		this.emit('file-upload:remove', {
			file: removed,
			files: this.currentFiles(),
		});
	}
	clearFiles() {
		if (!this.liveFiles.length) {
			return;
		}
		this.liveFiles = [];
		this.rebuildItems();
		this.emit('file-upload:clear', {
			files: [],
		});
	}
	openPicker() {
		if (this.state.disabled) {
			return;
		}
		this.refs.input?.click();
	}
	handleChooseClick(domEvent) {
		domEvent.stopPropagation();
		this.openPicker();
	}
	handleInputChange(domEvent) {
		domEvent.stopPropagation();
		this.addFileList(domEvent.target.files);
		domEvent.target.value = '';
	}
	handleDragEnter(domEvent) {
		domEvent.preventDefault();
		if (this.state.disabled) {
			return;
		}
		this.dragDepth += 1;
		if (!this.state.over) {
			this.state.over = true;
		}
	}
	handleDragOver(domEvent) {
		domEvent.preventDefault();
	}
	handleDragLeave(domEvent) {
		domEvent.preventDefault();
		this.dragDepth -= 1;
		if (this.dragDepth <= 0) {
			this.dragDepth = 0;
			if (this.state.over) {
				this.state.over = false;
			}
		}
	}
	handleDrop(domEvent) {
		domEvent.preventDefault();
		this.dragDepth = 0;
		if (this.state.over) {
			this.state.over = false;
		}
		if (this.state.disabled) {
			return;
		}
		this.addFileList(domEvent.dataTransfer?.files);
	}
	handleRemoveClick(_domEvent, item) {
		this.removeFile(item?.id);
	}
	fileRow(item) {
		return this.partial`
			<li class="fu-row">
				<span class="fu-name">${item?.label}</span>
				<span class="fu-size">${item?.sizeLabel}</span>
				<button type="button" class="fu-remove" aria-label="Remove"
					@click=${this.handleRemoveClick}>×</button>
			</li>`;
	}
	fileKey(item) {
		return item.id;
	}
	hasFiles() {
		return this.state.fileItems.length > 0;
	}
	isFileListEmpty() {
		return this.state.fileItems.length === 0;
	}
	render() {
		this.html`
			<div class="fu" ?data-disabled=${this.state.disabled} ?data-over=${this.state.over}>
				<input #input class="fu-input" type="file"
					accept=${this.state.accept}
					?multiple=${this.state.multiple}
					?disabled=${this.state.disabled}
					@change=${this.handleInputChange}>
				<div class="fu-zone"
					@click=${this.openPicker}
					@dragenter=${this.handleDragEnter}
					@dragover=${this.handleDragOver}
					@dragleave=${this.handleDragLeave}
					@drop=${this.handleDrop}>
					<ui-icon class="fu-icon" .state=${this.state.uploadIcon}></ui-icon>
					<span class="fu-drop">${this.state.dropLabel}</span>
					<button type="button" class="fu-choose" data-variant="outline" data-tone="neutral" data-size="sm"
						?disabled=${this.state.disabled}
						@click=${this.handleChooseClick}>${this.state.chooseLabel}</button>
				</div>
				<ul class="fu-list" ?hidden=${this.isFileListEmpty}>
					${this.list('fileItems', this.fileRow, this.fileKey)}
				</ul>
				<div class="fu-empty" ?hidden=${this.hasFiles}>${this.state.emptyMessage}</div>
				<div class="fu-actions" ?hidden=${this.isFileListEmpty}>
					<button type="button" class="fu-clear" data-variant="ghost" data-tone="neutral" data-size="sm"
						?disabled=${this.state.disabled}
						@click=${this.clearFiles}>Clear</button>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-file-upload', UIFileUpload);
