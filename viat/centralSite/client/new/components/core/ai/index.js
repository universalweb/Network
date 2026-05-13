import './tools.js';
export { AIHost, host } from './host.js';
export {
	defineGlobalTool,
	defineInstanceTool,
	defineTagTool,
	eachComponent,
	getComponentById,
	getComponentId,
	getStats,
	getTools,
	listAllTools,
	listComponents,
	registerComponent,
	subscribe,
	unregisterComponent,
} from './registry.js';
export { defineTool } from './tools.js';
export {
	describeComponent,
	inspect,
	queryByLabel,
	queryByTag,
	resolveByIdOrPath,
	resolveReference,
	sanitize,
} from './descriptors.js';
export {
	getDirectChildren,
	getNameForComponent,
	getPathForComponent,
	getRootComponents,
	invalidatePathIndex,
	listPaths,
	pageOverview,
	peek,
	resolvePath,
} from './paths.js';
export {
	clearHighlights,
	highlight,
	textPageMap,
	visualPageMap,
} from './visual.js';
export {
	ERROR_CODES,
	dispatch,
	getMethod,
	makeError,
	registerMethod,
} from './protocol.js';
export {
	check,
	grant,
	reset as resetPermissions,
	revoke,
	setDefaultMutatingPolicy,
	setPolicy,
	setPrompt,
} from './permissions.js';
export {
	aiMethods,
	applyAiMixin,
} from './mixin.js';
export { LocalTransport } from './transports/local.js';
export { WebSocketTransport } from './transports/websocket.js';
export { WebRTCTransport } from './transports/webrtc.js';
export {
	WebMCPTransport,
	detectMcp,
	getMcpToolDescriptors,
} from './transports/webmcp.js';
