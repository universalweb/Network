// Active environment subsystems for this app. Each import self-initializes
// on load. Comment out (or delete) modules this app does not need; doing so
// removes the listeners and state writes entirely.
import '../components/core/environment/viewport.js';
import '../components/core/environment/device.js';
import '../components/core/environment/locale.js';
import '../components/core/environment/media.js';
import '../components/core/environment/connection.js';
// Opt-in (require explicit user action via requestGeo() / requestBattery()):
// import '../components/core/environment/geo.js';
// import '../components/core/environment/battery.js';
