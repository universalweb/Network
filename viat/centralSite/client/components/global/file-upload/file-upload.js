/*
	DESCRIPTION: ui-file-upload — choose + drag/drop file list. Files live on a
	plain instance field (identity); `fileItems` is the reactive render buffer
	of `{ id, file }` (File by reference). Rows are `ui-file-upload-item`.
	Emits file-upload:select {files}, file-upload:remove {file,files},
	file-upload:clear {files}.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-file-upload .state.accept=${'image/*'} .state.multiple=${true}
	    @file-upload:select=${this.onFiles}></ui-file-upload>
	─────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { isString, WebComponent } from 'webcomponent';
import { UIFileUploadItem } from '../file-upload-item/file-upload-item.js';
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
	/**
	 * Content-stable id — used for row keys AND dedupe.
	 * @param {File} file - Browser File.
	 * @returns {string} `name:size:lastModified`.
	 */
	idFor(file) {
		return fileId(file);
	}
	rebuildItems() {
		const files = this.liveFiles;
		const items = new Array(files.length);
		const fileCount = files.length;
		for (let index = 0; index < fileCount; index += 1) {
			const file = files[index];
			items[index] = {
				id: this.idFor(file),
				file,
			};
		}
		this.state.fileItems = items;
	}
	/**
	 * Whether `file`'s content id is already present.
	 * @param {File} file - Browser File to look for.
	 * @param {Array} [files] - List to search; defaults to the live selection.
	 * The batch add passes the array it is BUILDING, because dedupe has to
	 * consider files already accepted from the same drop and not just the ones
	 * that were there beforehand.
	 * @returns {boolean} True when an equal-id file is already in the list.
	 */
	hasFile(file, files) {
		const list = files || this.liveFiles;
		const probe = this.idFor(file);
		const fileCount = list.length;
		for (let index = 0; index < fileCount; index += 1) {
			if (this.idFor(list[index]) === probe) {
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
				/*
				 * Against `next`, not the pre-batch list: two copies of one file
				 * (same name/size/lastModified, different folders) ride in on a
				 * single multi-file drop, and checking only what was there before
				 * let both land — duplicate ids in a keyed list.
				 */
				if (!this.hasFile(file, next)) {
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
	handleItemRemove(domEvent) {
		this.removeFile(domEvent.detail?.data?.id);
	}
	hasFiles() {
		return this.state.fileItems.length > 0;
	}
	isFileListEmpty() {
		return this.state.fileItems.length === 0;
	}
	render() {
		this.html`
			<div class="file-upload" ?data-disabled=${this.state.disabled} ?data-over=${this.state.over}>
				<input #input class="file-upload-input" type="file"
					accept=${this.state.accept}
					?multiple=${this.state.multiple}
					?disabled=${this.state.disabled}
					@change=${this.handleInputChange}>
				<div class="file-upload-zone"
					@click=${this.openPicker}
					@dragenter=${this.handleDragEnter}
					@dragover=${this.handleDragOver}
					@dragleave=${this.handleDragLeave}
					@drop=${this.handleDrop}>
					<ui-icon class="file-upload-icon" .state=${this.state.uploadIcon}></ui-icon>
					<span class="file-upload-drop">${this.state.dropLabel}</span>
					<button type="button" class="file-upload-choose" data-variant="outline" data-tone="neutral" data-size="sm"
						?disabled=${this.state.disabled}
						@click=${this.handleChooseClick}>${this.state.chooseLabel}</button>
				</div>
				<div class="file-upload-list" ?hidden=${this.isFileListEmpty}
					@file-upload-item:remove=${this.handleItemRemove}>
					${this.list('fileItems', UIFileUploadItem)}
				</div>
				<div class="file-upload-empty" ?hidden=${this.hasFiles}>${this.state.emptyMessage}</div>
				<div class="file-upload-actions" ?hidden=${this.isFileListEmpty}>
					<button type="button" class="file-upload-clear" data-variant="ghost" data-tone="neutral" data-size="sm"
						?disabled=${this.state.disabled}
						@click=${this.clearFiles}>Clear</button>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-file-upload', UIFileUpload);
