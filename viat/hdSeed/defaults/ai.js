/**
 * Specifies the high-level functionalities or service interfaces
 * related to AI operations that can be attached to the tree structure.
 */
export const AI_TYPES = {
	AGENT: 0,
	ANALYTICS: 1,
	ASK: 2,
	EDIT: 3,
	PLAN: 4,
	CHATBOT: 5,
	API: 6,
};
/**
 * Distinct mapping defining specialized roles of AI agents operating
 * within the structured Viat environment.
 */
export const AI_AGENT_TYPES = {
	CODER: 0,
	WRITER: 1,
	ARTIST: 2,
};
export default {
	AI_TYPES,
	AI_AGENT_TYPES,
};
