/*
 * Test-owned gap token table. util-layout.css is the runtime source;
 * this table is the independent expectation so a CSS or component fork fails.
 * Shared by ui-stack and ui-grid tests — one vocabulary, one pin.
 */
export const GAP_SCALE = [
	{
		token: 'none',
		value: '0',
	},
	{
		token: 'xs',
		value: 'var(--space-2, 0.25rem)',
	},
	{
		token: 'sm',
		value: 'var(--space-3, 0.5rem)',
	},
	{
		token: 'md',
		value: 'var(--space-4, 0.75rem)',
	},
	{
		token: 'lg',
		value: 'var(--space-6, 1.25rem)',
	},
	{
		token: 'xl',
		value: 'var(--space-8, 2rem)',
	},
];
