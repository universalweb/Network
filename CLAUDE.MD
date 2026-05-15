# Network — Claude project rules

## Project context
- Project name in compact-memory: `Network`
- API reference docs live under `/agent/docs/`
- For WebComponent creation/refactor, follow [`agent/docs/WebComponent/webcomponent-authoring.SKILL.md`](agent/docs/WebComponent/webcomponent-authoring.SKILL.md)

## Code style
- No underscores in variable, method, or function names
- No `const x = () => {}` — use function declarations
- Names must be descriptive but short — no half names, no single-character names
- Don't shadow globals: never use `confirm`, `event`, `name`, `parent`, `type`, `alert`, `fetch`, etc. as bindings
- Utilities live in `utilities.js` or `@universalweb/utilitylib`

## Performance
- Write compact, modern, memory-efficient code
- Avoid `for…of` when an indexed `for` or a first-class utility function is faster
- Avoid `try/catch` in the browser or for cases that are easily avoidable

## Tooling
- Use `pnpm` — never `npm` or `yarn`
- Use Node.js (or Bun) for scripts — never Python or `python3`
- Run dev servers with Node.js, from the workspace folder (never `/dev/null` or root filesystem)
- Prefer proxy FS methods over direct `fs` calls

## Playwright
- Save all screenshots in the project-root `playwright/` folder
- Prefix every screenshot filename with `playwright-`
- Delete screenshots after they have been used, and clean up `.playwright-mcp/` logs after use

## Response style
- Keep responses short — prefer icons over words
