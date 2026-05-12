// User plugins for this app. Each import is expected to call
// registerPlugin() at module load. They run after environment is up
// (see new/index.js boot sequence) so they can read globalState.environment
// from their init().
//
// Example:
//   import '../components/myPlugin/plugin.js';
