# Template Prompt · Class Doc Pack for Agents

Use this with any class. Replace every `{{...}}` value before sending.

## Fill values

- `{{className}}`: class to document
- `{{classFilePath}}`: absolute or repo-relative source path
- `{{targetDir}}`: output folder
- `{{baselineTech}}`: baseline to compare against (example: native Web Components)
- `{{skillFileName}}`: skill filename (example: `{{className}}-authoring.SKILL.md`)
- `{{classMethods}}`: List of all class methods either directly on the class or assigned to the prototype

## Prompt to send an agent

Create a compact, token-efficient documentation pack for `{{className}}` from `{{classFilePath}}`.

Output all files into `{{targetDir}}`:

1. `{{className}}.md`
2. `diagram.mmd` (Mermaid source)
3. `{{skillFileName}}`

Requirements:

- Keep writing compact, clear, and implementation-focused.
- In `{{className}}.md`, explain the class purpose, architecture, and practical usage.
- Include a concise positioning summary: why this class is a superior reactive layer vs `{{baselineTech}}` (when applicable).
- Include agentic AI integration notes: how components can be searched and controlled without requiring model vision.
- Group methods by purpose and relevance (example priority tiers: P0/P1/P2).
- If the class inherits/mixes methods, include inherited API that materially affects usage.
- Avoid filler; prefer short bullets and dense signal.

Mermaid requirements (`diagram.mmd`):

- Build one method map grouped by purpose and relevance.
- Show important relationships/flows between methods.
- Keep labels concise and readable.

Skill file requirements (`{{skillFileName}}`):

- Must be a practical authoring skill for building custom classes based on this class.
- Include frontmatter with `name` and `description`.
- Include: scaffold rules, lifecycle rules, render/state rules, style rules, event/global rules, optional AI rules, and verification checklist.
- Keep it action-oriented so another agent can generate code from it directly.

Process expectations:

- Inspect the class source deeply before writing.
- Verify method list accuracy from source, not assumptions.
- Render Mermaid once to ensure syntax is valid.
- Save all files in `{{targetDir}}`.

Return format:

- Short completion summary
- File list with one-line purpose each
- Any assumptions or limitations
