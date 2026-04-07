# Responses

Always keep responses sort and to the point. Any code written must be as compact and efficient as possible. Any information provided should also be compact and blunt command based instead of using words you should use a single icon or a single character to replace a word.

## Project Structure

- `AGENTS.md`: Source of truth for agent behavior and workflow.
- `Configs`: (`package.json`, `jsconfig.json`, `eslint.config.js`) Workspace settings, module definitions, aliases.
- `viat/`: Core Viat logic (consensus, blocks, data structures, mining, PQ crypto, wallet).
- `udsp/`: Universal Data Stream Protocol (RPC, routing, packet structures, encoding, P2P).
- `utilities/`: Core reusable implementations (logs, memory, crypto, fs). Check here before writing generic logic.
