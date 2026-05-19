import '../ai-status-indicator/ai-status-indicator.js';
import { WebComponent, each } from 'webcomponent';
import { listAllTools } from '../../../core/ai/index.js';
const DEFAULT_ENDPOINT = 'http://localhost:1234/v1/chat/completions';
const DEFAULT_MODEL = 'local-model';
const SSE_DELIMITER = '\n\n';
const SSE_DATA_PREFIX = 'data:';
const SSE_DONE = '[DONE]';
const HEALTH_TIMEOUT_MS = 2500;
const PRIMING_USER_MESSAGE = 'Reply in ONE short sentence (under 20 words) inviting me to give a command. If you need page context, call getPageMap. If you need a tool\'s input schema, call getToolSchema.';
// LM Studio mirrors the OpenAI spec, so `GET /v1/models` is a cheap
// liveness probe that returns the list of loaded models on a 200. The
// chat-completions endpoint we use for actual messages lives at the same
// base; deriving the probe URL from the chat URL keeps a single user-
// configurable endpoint.
function deriveHealthURL(chatEndpoint) {
	const trimmed = String(chatEndpoint ?? '').trim();
	if (!trimmed) {
		return '';
	}
	const idx = trimmed.indexOf('/v1/');
	if (idx < 0) {
		return '';
	}
	return `${trimmed.slice(0, idx + 4)}models`;
}
// Two flavours:
//   $VIAT.CMD[name, id]                      → call with empty args
//   $VIAT.CMD[name, id, {"k":"v", …}]        → call with JSON args
// The third group is greedy on `{…}` so a JSON object with commas inside
// doesn't trip the outer split. Whitespace between groups is tolerated.
const VIAT_CMD_REGEX = /\$VIAT\.CMD\[\s*([A-Za-z_][\w-]*)\s*,\s*([^,\]]+?)\s*(?:,\s*(\{[\s\S]*?\}))?\s*\]/g;
const MAX_TOOL_ROUND_TRIPS = 5;
function parseViatCommands(text) {
	if (!text) {
		return [];
	}
	const out = [];
	const seen = new Set();
	VIAT_CMD_REGEX.lastIndex = 0;
	let match = VIAT_CMD_REGEX.exec(text);
	while (match !== null) {
		const name = match[1];
		const callId = match[2].trim();
		const argsRaw = match[3];
		// Parse defensively — a malformed args payload should not nuke the
		// whole command stream. We surface the parse failure as the args
		// payload `{ _parseError: '…' }` so the tool handler can decide
		// whether to bail or proceed with defaults.
		let args = {};
		if (argsRaw) {
			try {
				args = JSON.parse(argsRaw);
			} catch (parseError) {
				args = {
					_parseError: parseError?.message ?? 'invalid JSON args',
					_raw: argsRaw,
				};
			}
		}
		const key = `${name}|${callId}`;
		if (!seen.has(key)) {
			seen.add(key);
			out.push({
				name,
				callId,
				args,
			});
		}
		match = VIAT_CMD_REGEX.exec(text);
	}
	return out;
}
function formatAiResponse(name, callId, value) {
	const payload = value === undefined ? 'null' : JSON.stringify(value);
	return `$AI.CMD[${name}, ${callId}, ${payload}]`;
}
// Short tool digest — name + description + mutating flag. NO inputSchema
// here. Callers fetch the full schema on demand via the `getToolSchema`
// tool so the system prompt stays tight and we don't bloat every chat
// turn with unused JSON shapes.
function formatToolDigest(tools) {
	if (!tools.length) {
		return '(no tools registered)';
	}
	const lines = [];
	for (let i = 0; i < tools.length; i++) {
		const tool = tools[i];
		const mutTag = tool.mutating ? ' [MUT]' : '';
		lines.push(`- ${tool.name}${mutTag}: ${tool.description || '(no description)'}`);
	}
	return lines.join('\n');
}
// Minimal system prompt. Page map + per-tool input schemas are NO LONGER
// embedded here — every byte that ships every turn is a tax on first-
// response latency for local models. The AI fetches them on demand:
//   - `getPageMap`      → returns the live component tree
//   - `getToolSchema`   → returns one tool's full input schema by name
// That cuts the system prompt from ~10KB to ~1.5KB on a typical session.
function buildSystemPrompt(toolsDigest) {
	return [
		'You are the LOCAL AGENT for Viat — a post-quantum cryptocurrency. You run inside the user\'s Viat Wallet client. Be concise and direct.',
		'',
		'PROTOCOL',
		'Call a tool by emitting EXACTLY one of these tokens on its own line:',
		'  $VIAT.CMD[<NAME>, <CALL_ID>]',
		'  $VIAT.CMD[<NAME>, <CALL_ID>, <ARGS_JSON>]',
		'CALL_ID is a short unique id you mint (e.g. a1, a2). ARGS_JSON is a single-line JSON object — include it whenever the tool needs arguments (see getToolSchema). The browser replies on a later turn with:',
		'  $AI.CMD[<NAME>, <CALL_ID>, <ANSWER>]',
		'Wait for the matching reply before claiming the action succeeded. Plain prose around command tokens is fine.',
		'',
		'WHAT YOU CAN DO',
		'You have a digest of available tools below. To learn a tool\'s arguments call:',
		'  $VIAT.CMD[getToolSchema, s1, {"name":"<toolName>"}]',
		'To see the current page tree (every component is agent-addressable) call:',
		'  $VIAT.CMD[getPageMap, p1]',
		'Only fetch the map / schemas when you actually need them — they\'re large.',
		'',
		'TOOLS',
		toolsDigest,
		'',
		'EXAMPLE',
		'User: "What\'s my balance?"',
		'You emit: $VIAT.CMD[getWalletAmount, w1]',
		'Browser replies: $AI.CMD[getWalletAmount, w1, {"amount":"250,000"}]',
		'You then say: "Your wallet holds 250,000 VIAT."',
	].join('\n');
}
class AIChatMessage extends WebComponent {
	static url = import.meta.url;
	static styles = {
		message: './ai-chat-message.css',
	};
	static state = {
		id: '',
		role: 'user',
		content: '',
	};
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="${() => {
				return `aim aim-${this.state.role}`;
			}}">
				<div class="aim-role">${() => {
					return (this.state.role === 'user' ? 'YOU' : 'AI');
				}}</div>
				<div class="aim-content">${this.state.content}</div>
			</div>
		`;
	}
}
customElements.define('ai-chat-message', AIChatMessage);
export class AIChat extends WebComponent {
	static url = import.meta.url;
	static styles = {
		chat: './ai-chat.css',
	};
	static state = {
		endpoint: DEFAULT_ENDPOINT,
		model: DEFAULT_MODEL,
		messages: [],
		inputValue: '',
		streaming: false,
		errorText: '',
		systemPrompt: '',
		connectionState: 'offline',
	};
	controller = null;
	healthController = null;
	messageSeq = 0;
	onMount() {
		this.delegate('pulldown:open', this.handlePulldownOpen);
		this.refreshSystemPrompt();
		// Probe up-front so the indicator badge is accurate before the
		// user opens the pulldown. Cheap — single GET with a short
		// timeout and the response is small (just a model list).
		this.checkConnection();
	}
	onDisconnect() {
		this.controller?.abort();
		this.controller = null;
		this.healthController?.abort();
		this.healthController = null;
		this.state.streaming = false;
	}
	handlePulldownOpen() {
		this.refreshSystemPrompt();
		// Re-check on every open so the badge reflects the current state
		// (the LM Studio server might have started/stopped while the
		// pulldown was closed). The priming message only fires once the
		// probe resolves online — keeps the user from staring at the
		// "DISCONNECTED" badge while a doomed POST hangs.
		this.checkConnection().then((isOnline) => {
			if (isOnline) {
				this.maybePrime();
			}
		});
	}
	async checkConnection() {
		// Single in-flight probe — abort any prior one so a slow probe
		// can't overwrite a fresher result.
		this.healthController?.abort();
		const controller = new AbortController();
		this.healthController = controller;
		const url = deriveHealthURL(this.state.endpoint);
		if (!url) {
			this.state.connectionState = 'offline';
			return false;
		}
		this.state.connectionState = 'checking';
		const timeoutId = this.setTimeout(() => {
			controller.abort();
		}, HEALTH_TIMEOUT_MS);
		try {
			const response = await fetch(url, {
				method: 'GET',
				signal: controller.signal,
			});
			clearTimeout(timeoutId);
			if (this.healthController !== controller) {
				return this.state.connectionState === 'online';
			}
			const ok = response.ok;
			this.state.connectionState = ok ? 'online' : 'offline';
			this.healthController = null;
			return ok;
		} catch (probeError) {
			clearTimeout(timeoutId);
			if (this.healthController !== controller) {
				return this.state.connectionState === 'online';
			}
			this.state.connectionState = 'offline';
			this.healthController = null;
			return false;
		}
	}
	refreshSystemPrompt() {
		const tools = formatToolDigest(listAllTools());
		this.state.systemPrompt = buildSystemPrompt(tools);
	}
	hasAssistantReply() {
		const list = this.state.messages;
		for (let i = 0; i < list.length; i++) {
			const msg = list[i];
			if (msg.role === 'assistant' && msg.content) {
				return true;
			}
		}
		return false;
	}
	maybePrime() {
		if (this.state.streaming) {
			return;
		}
		if (this.hasAssistantReply()) {
			return;
		}
		this.state.errorText = '';
		this.pushMessage('user', PRIMING_USER_MESSAGE, {
			hidden: true,
		});
		this.streamReply(0).catch((streamErr) => {
			return this.handleStreamError(streamErr);
		});
	}
	runCommand(cmd) {
		const root = this.findPageRoot();
		const tools = root.aiTools();
		const def = tools.get(cmd.name);
		if (!def) {
			return Promise.resolve(formatAiResponse(cmd.name, cmd.callId, {
				error: `Unknown tool "${cmd.name}"`,
			}));
		}
		const invocation = Promise.resolve(def.handler({
			component: root,
			args: cmd.args ?? {},
			ctx: {
				source: 'ai-chat',
			},
		}));
		return invocation
			.then((value) => {
				return formatAiResponse(cmd.name, cmd.callId, value);
			})
			.catch((toolErr) => {
				return formatAiResponse(cmd.name, cmd.callId, {
					error: toolErr?.message ?? 'Tool error',
				});
			});
	}
	async dispatchCommandsIn(assistantId, depth) {
		if (depth >= MAX_TOOL_ROUND_TRIPS) {
			return;
		}
		const list = this.state.messages;
		let msg = null;
		for (let i = list.length - 1; i >= 0; i--) {
			if (list[i].id === assistantId) {
				msg = list[i];
				break;
			}
		}
		if (!msg || !msg.content) {
			return;
		}
		const commands = parseViatCommands(msg.content);
		if (!commands.length) {
			return;
		}
		const responses = await Promise.all(commands.map((cmd) => {
			return this.runCommand(cmd);
		}));
		const replyText = responses.join('\n');
		console.log('[AI ROUND-TRIP]', {
			depth,
			commands,
			replyText,
		});
		this.pushMessage('user', replyText, {
			hidden: true,
		});
		await this.streamReply(depth + 1).catch((streamErr) => {
			return this.handleStreamError(streamErr);
		});
	}
	findPageRoot() {
		let cursor = this;
		while (true) {
			const rootNode = cursor.getRootNode();
			const host = rootNode instanceof ShadowRoot ? rootNode.host : null;
			if (!host || typeof host.aiMap !== 'function') {
				return cursor;
			}
			cursor = host;
		}
	}
	onRendered() {
		const logEl = this.refs.log;
		if (logEl) {
			logEl.scrollTop = logEl.scrollHeight;
		}
	}
	nextId() {
		this.messageSeq += 1;
		return `m${this.messageSeq}`;
	}
	pushMessage(role, content, opts) {
		const id = this.nextId();
		const msg = {
			id,
			role,
			content,
		};
		if (opts?.hidden) {
			msg.hidden = true;
		}
		this.state.messages.push(msg);
		return id;
	}
	replaceContent(id, content) {
		const list = this.state.messages;
		for (let i = list.length - 1; i >= 0; i--) {
			if (list[i].id === id) {
				list[i] = {
					...list[i],
					content,
				};
				return;
			}
		}
	}
	visibleMessages() {
		const list = this.state.messages;
		const out = [];
		for (let i = 0; i < list.length; i++) {
			if (!list[i].hidden) {
				out.push(list[i]);
			}
		}
		return out;
	}
	buildPayload(excludeId) {
		const list = this.state.messages;
		const out = [];
		if (this.state.systemPrompt) {
			out.push({
				role: 'system',
				content: this.state.systemPrompt,
			});
		}
		for (let i = 0; i < list.length; i++) {
			const msg = list[i];
			if (msg.id === excludeId) {
				continue;
			}
			out.push({
				role: msg.role,
				content: msg.content,
			});
		}
		return {
			model: this.state.model,
			messages: out,
			stream: true,
		};
	}
	handleSubmit() {
		if (this.state.streaming) {
			this.handleAbort();
			return;
		}
		this.handleSend();
	}
	handleSend() {
		const text = this.state.inputValue.trim();
		if (!text) {
			return;
		}
		this.state.inputValue = '';
		this.state.errorText = '';
		this.pushMessage('user', text);
		this.streamReply(0).catch((streamErr) => {
			return this.handleStreamError(streamErr);
		});
	}
	handleAbort() {
		this.controller?.abort();
		this.controller = null;
		this.state.streaming = false;
	}
	handleStreamError(streamErr) {
		if (streamErr?.name === 'AbortError') {
			return;
		}
		this.state.connectionState = 'offline';
		this.state.streaming = false;
		this.controller = null;
	}
	handleKeyDown(domEvent) {
		if (domEvent.key === 'Enter' && !domEvent.shiftKey) {
			domEvent.preventDefault();
			this.handleSend();
		}
	}
	handleClear() {
		this.handleAbort();
		this.state.messages = [];
		this.state.errorText = '';
	}
	async streamReply(depth = 0) {
		this.state.streaming = true;
		this.state.connectionState = 'connecting';
		const controller = new AbortController();
		this.controller = controller;
		const payload = this.buildPayload(null);
		let response;
		try {
			response = await fetch(this.state.endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
				signal: controller.signal,
			});
		} catch (fetchErr) {
			if (fetchErr?.name !== 'AbortError') {
				this.state.connectionState = 'offline';
			}
			this.state.streaming = false;
			this.controller = null;
			return;
		}
		if (!response.ok) {
			this.state.connectionState = 'offline';
			this.state.streaming = false;
			this.controller = null;
			return;
		}
		if (!response.body) {
			this.state.connectionState = 'offline';
			this.state.streaming = false;
			this.controller = null;
			return;
		}
		this.state.connectionState = 'online';
		const assistantId = this.pushMessage('assistant', '');
		const reader = response.body.getReader();
		const decoder = new TextDecoder('utf-8');
		let buffer = '';
		let accumulated = '';
		let finished = false;
		while (true) {
			const chunk = await reader.read();
			if (chunk.done) {
				break;
			}
			buffer += decoder.decode(chunk.value, {
				stream: true,
			});
			let sepIndex = buffer.indexOf(SSE_DELIMITER);
			while (sepIndex !== -1) {
				const eventText = buffer.slice(0, sepIndex);
				buffer = buffer.slice(sepIndex + SSE_DELIMITER.length);
				const parsed = this.parseSseEvent(eventText);
				if (parsed === SSE_DONE) {
					finished = true;
					break;
				}
				if (parsed) {
					const delta = parsed?.choices?.[0]?.delta?.content;
					if (delta) {
						accumulated += delta;
						this.replaceContent(assistantId, accumulated);
					}
				}
				sepIndex = buffer.indexOf(SSE_DELIMITER);
			}
			if (finished) {
				break;
			}
		}
		this.state.streaming = false;
		this.controller = null;
		await this.dispatchCommandsIn(assistantId, depth);
	}
	parseSseEvent(eventText) {
		const lines = eventText.split('\n');
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (!line.startsWith(SSE_DATA_PREFIX)) {
				continue;
			}
			const payload = line.slice(SSE_DATA_PREFIX.length).trim();
			if (payload === SSE_DONE) {
				return SSE_DONE;
			}
			if (!payload) {
				return null;
			}
			return JSON.parse(payload);
		}
		return null;
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="ai-chat">
				<header class="aic-header">
					<div class="aic-titlebar">
						<div class="aic-title-group">
							<span class="aic-title">LOCAL AI</span>
							<ai-status-indicator .status=${this.state.connectionState}></ai-status-indicator>
						</div>
						<button class="aic-clear" @click=${this.handleClear} ?disabled=${this.state.messages.length === 0 && !this.state.streaming}>CLEAR</button>
					</div>
					<span class="aic-endpoint">${this.state.endpoint}</span>
				</header>
				<div #log class="aic-log">
					${() => {
						return each(this.visibleMessages(), AIChatMessage, (msg) => {
							return msg.id;
						});
					}}
				</div>
				<div class="${() => {
					return `aic-error${this.state.errorText ? ' is-visible' : ''}`;
				}}">${this.state.errorText}</div>
				<footer class="aic-input-row">
					<textarea #input
						name="local-ai-input"
						class="aic-input"
						placeholder="Message local AI…"
						rows="2"
						$value="inputValue"
						?disabled=${this.state.streaming}
						@keydown=${this.handleKeyDown}></textarea>
					<button class="${() => {
						return `aic-btn${this.state.streaming ? ' is-streaming' : ''}`;
					}}" @click=${this.handleSubmit}>
						${() => {
							return (this.state.streaming ? 'STOP' : 'SEND');
						}}
					</button>
				</footer>
			</div>
		`;
	}
}
customElements.define('ai-chat', AIChat);
