(async() => {
  const gui = require('nw.gui'),
    win = gui.Window.get();
  if (!localStorage.moved) {
    window.moveTo(0, 0);
    win.resizeTo(window.screen.availWidth, window.screen.availHeight);
  }
  localStorage.moved = 1;
  win.show();
  win.focus();
  app.on({
    '*.openBrowser' (event) {
      $.openBrowser(event.get('href') || event.original.target.getAttribute('data-href'));
    },
  });
  import 'js/action/browserCheck.js';
})();
