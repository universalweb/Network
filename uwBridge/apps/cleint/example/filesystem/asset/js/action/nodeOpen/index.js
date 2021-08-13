(async function() {
  const exec = require('child_process')
    .exec;
  const path = require('path');
  function escapeMethod(s) {
    return s.replace(/"/g, '\\\"');
  }
  /**
   * open a file or uri using the default application for the file type.
   *
   * @return {ChildProcess} - the child process object.
   * @param {string} target - the file/uri to open.
   * @param {string} appName - (optional) the application to be used to open the
   *      file (for example, "chrome", "firefox")
   * @param {function(Error)} callback - called with null on success, or
   *      an error object that contains a property 'code' with the exit
   *      code of the process.
   */
  function open(target, appName, callback) {
    let opener;
    if (typeof (appName) === 'function') {
      callback = appName;
      appName = null;
    }
    switch (process.platform) {
    case 'darwin':
      if (appName) {
        opener = `open -a "${escapeMethod(appName)}"`;
      } else {
        opener = 'open';
      }
      break;
    case 'win32':
      // if the first parameter to start is quoted, it uses that as the title
      // so we pass a blank title so we can quote the file we are opening
      if (appName) {
        opener = `start "" "${escapeMethod(appName)}"`;
      } else {
        opener = 'start ""';
      }
      break;
    default:
      if (appName) {
        opener = escapeMethod(appName);
      } else {
        // use Portlands xdg-open everywhere else
        opener = path.join(__dirname, '../vendor/xdg-open');
      }
      break;
    }
    if (process.env.SUDO_USER) {
      opener = `sudo -u ${process.env.SUDO_USER} ${opener}`;
    }
    return exec(`${opener} "${escapeMethod(target)}"`, callback);
  }
  app.openBrowser = open;
})();
