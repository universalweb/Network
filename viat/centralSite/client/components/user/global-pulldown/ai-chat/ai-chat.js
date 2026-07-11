/*
 * `<ai-chat>` — the VIAT agent chat. A thin app component that COMPOSES the
 * reusable global `<ui-ai-chat>` (which owns the UI, message model, and the
 * OpenAI-compatible bridge transport) and layers ONLY the Viat-specific agent
 * protocol on top: the `$VIAT.CMD[…]` / `$AI.CMD[…]` tool round-trip, the Viat
 * system prompt + live tool digest, page-tree agent addressing, and the
 * connection-aware priming nudge. No UI, no SSE, no message bookkeeping here —
 * all of that is the global component's job. The two are deliberately de-glued:
 * `ui-ai-chat` carries zero Viat knowledge.
 */
import '../../../global/ai-chat/ai-chat.js';
import {
	enableAi, isFunction, isShadowRoot, WebComponent,
} from 'webcomponent';
import { listAllTools } from '../../../core/ai/index.js';
const DEFAULT_ENDPOINT = 'http://localhost:1234/v1';
const DEFAULT_MODEL = 'local-model';
const PRIMING_USER_MESSAGE = 'Reply in ONE short sentence (under 20 words) inviting me to give a command. If you need page context, call getPageMap. If you need a tool\'s input schema, call getToolSchema.';
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
		const toolName = match[1];
		const callId = match[2].trim();
		const argsRaw = match[3];
		// Parse defensively — a malformed args payload should not nuke the whole
		// command stream. We surface the parse failure as the args payload
		// `{ _parseError: '…' }` so the tool handler can bail or use defaults.
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
		const key = `${toolName}|${callId}`;
		if (!seen.has(key)) {
			seen.add(key);
			out.push({
				name: toolName,
				callId,
				args,
			});
		}
		match = VIAT_CMD_REGEX.exec(text);
	}
	return out;
}
function formatAiResponse(toolName, callId, value) {
	const payload = value === undefined ? 'null' : JSON.stringify(value);
	return `$AI.CMD[${toolName}, ${callId}, ${payload}]`;
}
// Short tool digest — name + description + mutating flag. NO inputSchema here;
// callers fetch the full schema on demand via `getToolSchema` so the system
// prompt stays tight rather than bloating every turn with unused JSON shapes.
function formatToolDigest(tools) {
	if (!tools.length) {
		return '(no tools registered)';
	}
	const lines = [];
	for (let index = 0; index < tools.length; index += 1) {
		const tool = tools[index];
		const mutTag = tool.mutating ? ' [MUT]' : '';
		lines.push(`- ${tool.name}${mutTag}: ${tool.description || '(no description)'}`);
	}
	return lines.join('\n');
}
// Minimal system prompt. Page map + per-tool input schemas are fetched on demand
// (`getPageMap` / `getToolSchema`) rather than embedded — every byte shipped each
// turn taxes first-response latency on local models.
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
export class AIChat extends WebComponent {
	static url = import.meta.url;
	static styles = {
		chat: './ai-chat.css',
	};
	static state = {
		endpoint: DEFAULT_ENDPOINT,
		model: DEFAULT_MODEL,
		systemPrompt: '',
	};
	// Tool round-trip depth — incremented per command-bearing turn, reset on the
	// final prose answer (no commands) or at the cap. Lives HERE so the global
	// transport stays oblivious to the Viat protocol loop.
	roundTripDepth = 0;
	onConnect() {
		this.delegate('pulldown:open', this.handlePulldownOpen);
	}
	onMount() {
		this.refreshSystemPrompt();
	}
	refreshSystemPrompt() {
		const tools = formatToolDigest(listAllTools());
		this.state.systemPrompt = buildSystemPrompt(tools);
	}
	handlePulldownOpen() {
		/*
		 * The agent is being opened — this is the moment AI is needed, so arm the
		 * lazy AI registry now (idempotent; the first open applies the mixin and
		 * backfills the live component tree). It must run BEFORE refreshSystemPrompt
		 * so the tool digest and page addressing (aiTools / aiMap / findPageRoot) see
		 * the whole page rather than an empty registry.
		 */
		enableAi();
		// Re-digest tools + re-probe on every open; prime once we know we're online
		// (so the user never stares at a DISCONNECTED badge behind a doomed POST).
		this.refreshSystemPrompt();
		this.primeWhenOnline();
	}
	async primeWhenOnline() {
		const chat = this.refs.chat;
		if (!chat) {
			return;
		}
		const isOnline = await chat.checkConnection();
		if (isOnline) {
			this.maybePrime();
		}
	}
	hasAssistantReply() {
		const chat = this.refs.chat;
		if (!chat) {
			return false;
		}
		const list = chat.state.messages;
		for (let index = 0; index < list.length; index += 1) {
			if (list[index].role === 'assistant' && list[index].content) {
				return true;
			}
		}
		return false;
	}
	maybePrime() {
		const chat = this.refs.chat;
		if (!chat || chat.state.streaming || this.hasAssistantReply()) {
			return;
		}
		chat.continueWith('user', PRIMING_USER_MESSAGE, {
			hidden: true,
		});
	}
	// Walk up the shadow tree to the page root that exposes the agent surface
	// (`aiMap`) — every Viat component is agent-addressable through it.
	findPageRoot() {
		let cursor = this;
		while (true) {
			const rootNode = cursor.getRootNode();
			const host = isShadowRoot(rootNode) ? rootNode.host : null;
			if (!host || !isFunction(host.aiMap)) {
				return cursor;
			}
			cursor = host;
		}
	}
	async runCommand(cmd) {
		const root = this.findPageRoot();
		const tools = root.aiTools();
		const def = tools.get(cmd.name);
		if (!def) {
			return formatAiResponse(cmd.name, cmd.callId, {
				error: `Unknown tool "${cmd.name}"`,
			});
		}
		try {
			const value = await def.handler({
				component: root,
				args: cmd.args ?? {},
				ctx: {
					source: 'ai-chat',
				},
			});
			return formatAiResponse(cmd.name, cmd.callId, value);
		} catch (toolError) {
			return formatAiResponse(cmd.name, cmd.callId, {
				error: toolError?.message ?? 'Tool error',
			});
		}
	}
	handleTurnComplete(domEvent) {
		const content = domEvent.detail?.data?.content ?? '';
		const commands = parseViatCommands(content);
		if (!commands.length) {
			// Final prose answer — the chain is done.
			this.roundTripDepth = 0;
			return;
		}
		if (this.roundTripDepth >= MAX_TOOL_ROUND_TRIPS) {
			this.roundTripDepth = 0;
			return;
		}
		this.roundTripDepth += 1;
		this.dispatchCommands(commands);
	}
	async dispatchCommands(commands) {
		const pending = [];
		for (let index = 0; index < commands.length; index += 1) {
			pending.push(this.runCommand(commands[index]));
		}
		const responses = await Promise.all(pending);
		const chat = this.refs.chat;
		if (!chat) {
			return;
		}
		// Feed the tool replies back as a HIDDEN user turn → the global streams
		// the agent's next turn → emits turn-complete → we loop until no commands.
		chat.continueWith('user', responses.join('\n'), {
			hidden: true,
		});
	}
	render() {
		this.html `
			<ui-ai-chat #chat
				.state.endpoint=${this.state.endpoint}
				.state.model=${this.state.model}
				.state.systemPrompt=${this.state.systemPrompt}
				.state.heading=${'LOCAL AI'}
				@ai-chat:turn-complete=${this.handleTurnComplete}></ui-ai-chat>
		`;
	}
}
customElements.define('ai-chat', AIChat);
