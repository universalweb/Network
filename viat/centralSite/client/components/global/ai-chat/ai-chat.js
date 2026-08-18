/*
 * `<ui-ai-chat>` — a reusable, provider-agnostic chat app component with a
 * built-in OpenAI-compatible BRIDGE transport. Point it at a single base URL
 * (`…/v1`, the installation0 Grok-bridge style) and it works out of the box:
 * streams the answer (`content`) and the agent's thinking (`reasoning_content`,
 * shown as a live collapsible block), probes `/v1/models` for the status badge,
 * selects a model, and aborts mid-stream. Composes `<ui-ai-message>` for the log
 * plus chrome shells (empty state, suggestions, typing, error, export,
 * scroll-to-latest, optional model select / usage).
 *
 * Two ways to extend, no provider glue inside:
 *   - COMPOSE: listen for `ai-chat:turn-complete` { id, content, reasoning } and
 *     call `continueWith(role, content, { hidden })` to inject a follow-up turn
 *     (e.g. a tool round-trip). The agent layer never touches the transport.
 *   - OVERRIDE: set `.manual` true; the component emits `ai-chat:submit` { text }
 *     and runs NO transport — the consumer drives via `appendMessage` /
 *     `beginAssistant` / `streamToken` / `streamReasoning` / `finishAssistant`.
 * Also emits `ai-chat:status` { status } and `ai-chat:error` { message }.
 */
import '../status-indicator/status-indicator.js';
import '../empty-state/empty-state.js';
import '../ai-suggestions/ai-suggestions.js';
import '../ai-typing/ai-typing.js';
import '../ai-error/ai-error.js';
import '../ai-export/ai-export.js';
import '../ai-scroll-bottom/ai-scroll-bottom.js';
import '../ai-new-messages/ai-new-messages.js';
import '../ai-model-select/ai-model-select.js';
import '../ai-usage/ai-usage.js';
import { WebComponent } from 'webcomponent';
import { UIAiMessage } from '../ai-message/ai-message.js';
import { probeModels, streamChat } from './bridge.js';
const HEALTH_TIMEOUT_MS = 2500;
export class UIAiChat extends WebComponent {
	static url = import.meta.url;
	static styles = {
		chat: './ai-chat.css',
	};
	static state = {
		// Base URL `…/v1`; the transport derives /chat/completions + /models.
		endpoint: '',
		// Payload model id (not the DOM `model` global — state key only).
		model: 'local-model',
		// Optional [{ value, label }] for the header model picker; empty = hidden.
		modelItems: [],
		systemPrompt: '',
		heading: 'AI CHAT',
		placeholder: 'Send a message…',
		emptyHeading: 'Start a conversation',
		emptyHint: 'Ask anything. Answers stream live.',
		// Optional starter chips shown when the log is empty.
		suggestions: [],
		// true → emit ai-chat:submit and run NO built-in transport (full override).
		manual: false,
		items: [],
		inputValue: '',
		streaming: false,
		// Streaming started but no content token yet (shows typing chrome).
		waiting: false,
		// offline | checking | connecting | online
		status: 'offline',
		error: '',
		// error | rate-limit | quota | offline — surface for <ui-ai-error>
		errorKind: 'error',
		// Sticky "N new" chip; parent/logic increments when scrolled up.
		newMessageCount: 0,
		// Optional usage meter (0 / null = hidden fields).
		promptTokens: 0,
		completionTokens: 0,
		totalTokens: 0,
		usageCost: null,
	};
	controller = null;
	healthController = null;
	messageSeq = 0;
	streamingMessageId = null;
	hasProbed = false;
	streamContent = '';
	streamReasoning = '';
	// User has scrolled away from the bottom — pin-to-latest is deferred.
	logPinned = true;
	onMount() {
		// Pin the log to the newest message when the user is already at bottom.
		this.observeAsync('items', this.handleLogScroll);
		this.bindScrollBottom();
		if (this.state.endpoint) {
			this.checkConnection();
		}
	}
	onRender() {
		this.bindScrollBottom();
	}
	onDisconnect() {
		this.controller?.abort();
		this.controller = null;
		this.healthController?.abort();
		this.healthController = null;
		this.state.streaming = false;
		this.state.waiting = false;
	}
	get clearDisabled() {
		return this.state.items.length === 0 && !this.state.streaming;
	}
	// Final-condition getters (bare ?hidden=${this.x} — never negate a method ref).
	get emptyHidden() {
		return this.state.items.length > 0 || this.state.streaming;
	}
	get modelSelectHidden() {
		return this.state.modelItems.length === 0;
	}
	get usageHidden() {
		return !this.state.totalTokens && !this.state.promptTokens && !this.state.completionTokens && this.state.usageCost == null;
	}
	bindScrollBottom() {
		const logEl = this.refs.log;
		const scroller = this.refs.scrollbottom;
		if (logEl && scroller?.setScrollTarget) {
			scroller.setScrollTarget(logEl);
		}
	}
	handleLogScroll() {
		if (!this.logPinned) {
			return;
		}
		const logEl = this.refs.log;
		if (logEl) {
			logEl.scrollTop = logEl.scrollHeight;
		}
	}
	handleLogUserScroll() {
		const logEl = this.refs.log;
		if (!logEl) {
			return;
		}
		const distance = logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight;
		this.logPinned = distance < 48;
		if (this.logPinned && this.state.newMessageCount) {
			this.state.newMessageCount = 0;
		}
	}
	// ── message model ──────────────────────────────────────────────────────
	nextId() {
		this.messageSeq += 1;
		return `m${this.messageSeq}`;
	}
	findMessage(id) {
		const list = this.state.items;
		for (let index = list.length - 1; index >= 0; index -= 1) {
			if (list[index].id === id) {
				return index;
			}
		}
		return -1;
	}
	appendMessage(role, content, opts) {
		const id = this.nextId();
		const msg = {
			id,
			// `role` feeds the model payload; `author` feeds <ui-ai-message>'s
			// display state (its key dodges the native `role` prop footgun).
			role,
			author: role,
			content,
			reasoning: '',
		};
		if (opts?.hidden) {
			msg.hidden = true;
		}
		if (opts?.streaming) {
			msg.streaming = true;
		}
		this.state.items.push(msg);
		if (!this.logPinned && role === 'assistant') {
			this.state.newMessageCount += 1;
		}
		return id;
	}
	patchMessage(id, patch) {
		const index = this.findMessage(id);
		if (index < 0) {
			return;
		}
		this.state.items[index] = {
			...this.state.items[index],
			...patch,
		};
	}
	// ── public driving API (used internally + by manual-mode consumers) ─────
	beginAssistant() {
		const id = this.appendMessage('assistant', '', {
			streaming: true,
		});
		this.streamingMessageId = id;
		this.streamContent = '';
		this.streamReasoning = '';
		this.state.waiting = true;
		return id;
	}
	streamToken(id, delta) {
		this.streamContent += delta;
		if (this.state.waiting) {
			this.state.waiting = false;
		}
		this.patchMessage(id, {
			content: this.streamContent,
		});
		this.markOnline();
	}
	streamThinking(id, delta) {
		this.streamReasoning += delta;
		if (this.state.waiting) {
			this.state.waiting = false;
		}
		this.patchMessage(id, {
			reasoning: this.streamReasoning,
		});
		this.markOnline();
	}
	finishAssistant(id) {
		// Settle the message → <ui-ai-message> parses the completed content once.
		if (this.streamingMessageId === id) {
			this.streamingMessageId = null;
		}
		this.state.waiting = false;
		this.patchMessage(id, {
			streaming: false,
		});
	}
	setStatus(connectionStatus) {
		if (this.state.status === connectionStatus) {
			return;
		}
		this.state.status = connectionStatus;
		this.emit('ai-chat:status', {
			status: connectionStatus,
		});
	}
	setError(text, kind) {
		this.state.error = text;
		if (kind) {
			this.state.errorKind = kind;
		}
		if (text) {
			this.emit('ai-chat:error', {
				message: text,
				kind: this.state.errorKind,
			});
		}
	}
	markOnline() {
		this.setStatus('online');
	}
	// ── high-level send API ─────────────────────────────────────────────────
	sendMessage(text) {
		const trimmed = String(text ?? '').trim();
		if (!trimmed) {
			return;
		}
		this.appendMessage('user', trimmed);
		this.runTurn();
	}
	continueWith(role, content, opts) {
		// Inject a follow-up turn — a tool reply (hidden) or a priming nudge.
		this.appendMessage(role, content, opts);
		this.runTurn();
	}
	buildPayload() {
		const out = [];
		if (this.state.systemPrompt) {
			out.push({
				role: 'system',
				content: this.state.systemPrompt,
			});
		}
		const list = this.state.items;
		for (let index = 0; index < list.length; index += 1) {
			out.push({
				role: list[index].role,
				content: list[index].content,
			});
		}
		return {
			model: this.state.model,
			items: out,
			stream: true,
		};
	}
	async runTurn() {
		this.state.streaming = true;
		this.state.error = '';
		this.setStatus('connecting');
		const controller = new AbortController();
		this.controller = controller;
		// Build BEFORE the placeholder so the empty assistant turn isn't sent.
		const payload = this.buildPayload();
		const assistantId = this.beginAssistant();
		try {
			await streamChat({
				url: this.state.endpoint,
				payload,
				signal: controller.signal,
				onContent: (delta) => {
					this.streamToken(assistantId, delta);
				},
				onReasoning: (delta) => {
					this.streamThinking(assistantId, delta);
				},
			});
		} catch (streamError) {
			this.handleStreamError(streamError);
			this.finishAssistant(assistantId);
			return;
		}
		this.state.streaming = false;
		this.controller = null;
		this.setStatus('online');
		this.finishAssistant(assistantId);
		this.emit('ai-chat:turn-complete', {
			id: assistantId,
			content: this.streamContent,
			reasoning: this.streamReasoning,
		});
	}
	handleStreamError(streamError) {
		this.state.streaming = false;
		this.state.waiting = false;
		this.controller = null;
		if (streamError?.name === 'AbortError') {
			return;
		}
		this.setStatus('offline');
		const text = streamError?.message ?? 'Stream failed';
		const lower = text.toLowerCase();
		let kind = 'error';
		if (lower.includes('rate') || lower.includes('429')) {
			kind = 'rate-limit';
		} else if (lower.includes('quota') || lower.includes('billing')) {
			kind = 'quota';
		} else if (lower.includes('network') || lower.includes('fetch') || lower.includes('offline')) {
			kind = 'offline';
		}
		this.setError(text, kind);
	}
	async checkConnection() {
		this.healthController?.abort();
		const controller = new AbortController();
		this.healthController = controller;
		if (!this.state.endpoint) {
			this.setStatus('offline');
			return false;
		}
		// Surface the transient 'checking' only on the first probe.
		if (!this.hasProbed) {
			this.hasProbed = true;
			this.setStatus('checking');
		}
		const abortTimer = this.setTimeout(() => {
			controller.abort();
		}, HEALTH_TIMEOUT_MS);
		const online = await probeModels(this.state.endpoint, controller.signal);
		abortTimer.clear();
		// A newer probe superseded this one — let its result stand.
		if (this.healthController !== controller) {
			return this.state.status === 'online';
		}
		this.healthController = null;
		this.setStatus(online ? 'online' : 'offline');
		return online;
	}
	// ── composer ───────────────────────────────────────────────────────────
	handleSend() {
		const text = this.state.inputValue.trim();
		if (!text) {
			return;
		}
		this.state.inputValue = '';
		this.state.error = '';
		this.emit('ai-chat:submit', {
			text,
		});
		// Manual mode: the consumer owns the turn (it heard ai-chat:submit).
		if (this.state.manual) {
			return;
		}
		this.appendMessage('user', text);
		this.runTurn();
	}
	handleSubmit() {
		if (this.state.streaming) {
			this.handleAbort();
			return;
		}
		this.handleSend();
	}
	handleAbort() {
		this.controller?.abort();
		this.controller = null;
		this.state.streaming = false;
		this.state.waiting = false;
		if (this.streamingMessageId) {
			this.finishAssistant(this.streamingMessageId);
		}
	}
	handleKeyDown(domEvent) {
		if (domEvent.key === 'Enter' && !domEvent.shiftKey) {
			domEvent.preventDefault();
			this.handleSend();
		}
	}
	handleClear() {
		this.clear();
	}
	handleSuggestion(domEvent) {
		const text = domEvent.detail?.data?.value ?? domEvent.detail?.data?.label ?? '';
		if (!text) {
			return;
		}
		this.state.inputValue = text;
		this.handleSend();
	}
	handleModelChange(domEvent) {
		const next = domEvent.detail?.data?.value ?? '';
		if (next) {
			this.state.model = next;
		}
	}
	handleErrorRetry() {
		this.state.error = '';
		if (this.state.endpoint) {
			this.checkConnection();
		}
	}
	handleErrorDismiss() {
		this.state.error = '';
	}
	handleNewMessagesClick() {
		this.logPinned = true;
		this.state.newMessageCount = 0;
		this.handleLogScroll();
	}
	// Public: reset the conversation (aborts any in-flight stream).
	clear() {
		this.handleAbort();
		this.state.items = [];
		this.state.error = '';
		this.state.newMessageCount = 0;
		this.logPinned = true;
		this.emit('ai-chat:clear', {});
	}
	render() {
		this.html`
			<div class="aic">
				<header class="aic-header">
					<div class="aic-titlebar">
						<div class="aic-title-group">
							<span class="aic-title">${this.state.heading}</span>
							<ui-status-indicator .state.status=${this.state.status}></ui-status-indicator>
						</div>
						<div class="aic-header-actions">
							<ui-ai-usage
								?hidden=${this.usageHidden}
								.state.promptTokens=${this.state.promptTokens}
								.state.completionTokens=${this.state.completionTokens}
								.state.totalTokens=${this.state.totalTokens}
								.state.cost=${this.state.usageCost}></ui-ai-usage>
							<ui-ai-export .state.items=${this.state.items} .state.filename=${'ai-chat'}></ui-ai-export>
							<button class="aic-clear" type="button" @click=${this.handleClear} ?disabled=${this.clearDisabled}>CLEAR</button>
						</div>
					</div>
					<div class="aic-subheader">
						<span class="aic-endpoint" ?hidden=${!this.state.endpoint}>${this.state.endpoint}</span>
						<ui-ai-model-select
							?hidden=${this.modelSelectHidden}
							.state.value=${this.state.model}
							.state.items=${this.state.modelItems}
							@ai-model-select:change=${this.handleModelChange}></ui-ai-model-select>
					</div>
				</header>
				<div class="aic-log-wrap">
					<div #log class="aic-log" @scroll=${this.handleLogUserScroll}>
						<div class="aic-empty" ?hidden=${this.emptyHidden}>
							<ui-empty-state
								.state.heading=${this.state.emptyHeading}
								.state.hint=${this.state.emptyHint}></ui-empty-state>
							<ui-ai-suggestions
								.state.items=${this.state.suggestions}
								.state.disabled=${this.state.streaming}
								@ai-suggestions:select=${this.handleSuggestion}></ui-ai-suggestions>
						</div>
						${this.filter('items', UIAiMessage, 'hidden')}
						<ui-ai-typing .state.active=${this.state.waiting}></ui-ai-typing>
					</div>
					<div class="aic-log-float">
						<ui-ai-new-messages
							.state.count=${this.state.newMessageCount}
							@ai-new-messages:click=${this.handleNewMessagesClick}></ui-ai-new-messages>
						<ui-ai-scroll-bottom #scrollbottom></ui-ai-scroll-bottom>
					</div>
				</div>
				<ui-ai-error
					.state.message=${this.state.error}
					.state.kind=${this.state.errorKind}
					@ai-error:retry=${this.handleErrorRetry}
					@ai-error:dismiss=${this.handleErrorDismiss}></ui-ai-error>
				<footer class="aic-input-row">
					<textarea #input
						name="ai-chat-input"
						class="aic-input autosize"
						placeholder=${this.state.placeholder}
						rows="2"
						$value="inputValue"
						?disabled=${this.state.streaming}
						@keydown=${this.handleKeyDown}></textarea>
					<button class="aic-btn" type="button" ?data-streaming=${this.state.streaming} @click=${this.handleSubmit}>
						${this.ifThen('streaming', 'STOP', 'SEND')}
					</button>
				</footer>
			</div>
		`;
	}
}
customElements.define('ui-ai-chat', UIAiChat);
