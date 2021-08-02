(async function () {
  import {
    translate
  } from 'language/global';
  $.translate = translate;
  import 'css/core/blotr.css';
  import 'css/core/flexbox.css';
  import 'css/core/theme.css';
  import 'css/core/animation.css';
  import 'css/core/tooltip.css';
  import 'routes/';
  import 'component/base/';
  import 'js/util/,js/lib/plugins/fly.js';
  import 'component/navigationBar/,component/sidebar/,component/layout/';
  import 'app/data/';
  import 'app/pipes/';
  import 'app/build/';
  import 'js/action/login.js';
  cnsl('Application Ready Module', 'important');
})();
