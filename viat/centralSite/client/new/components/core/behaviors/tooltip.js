// Tooltip is a registry-only entry — the actual mouseover→show pipeline
// lives in core/tooltips/tooltip-service.js. Keeping the attribute name
// here means the template extractor strips and registers it like every
// other behavior, no special-case path.
export const tooltip = {
	name: 'tooltip',
};
