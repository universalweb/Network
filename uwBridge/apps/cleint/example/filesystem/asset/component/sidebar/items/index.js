(async () => {
  const {
    translate
  } = app;
  exports.items = [{
    hide: false,
    icon: true,
    section: true,
    text: 'Menu',
    options: [{
      click: 'routerLoad',
      href: '/',
      icon: 'dashboard',
      text: 'Dashboard',
    }, {
      click: 'routerLoad',
      href: '/@/',
      icon: 'person',
      loginState: true,
      text: 'Profile',
    }, {
      click: 'routerLoad',
      href: '/user/settings',
      icon: 'settings_applications',
      loginState: true,
      text: 'Settings',
    }, {
      click: 'routerLoad',
      href: '/page/about',
      icon: 'info',
      text: translate.about.label,
    }, {
      click: 'routerLoad',
      href: '/page/contact',
      icon: 'megaphone',
      text: translate.contact.label,
    }, {
      click: 'routerLoad',
      href: '/page/privacypolicy',
      icon: 'assignment',
      text: translate.privacypolicy.label,
    }, {
      click: 'refresh',
      icon: 'refresh',
      loginState: true,
      section: false,
      text: 'Refresh',
      tooltip: 'Refresh & reload the application',
    }, {
      click: 'logout',
      icon: 'power_settings_new',
      loginState: true,
      section: false,
      text: 'Logout',
    }, {
      click: 'openBrowser',
      href: 'https://www.patreon.com/hermesbyarity',
      icon: 'favorite',
      link: true,
      section: false,
      text: 'Donate & Support',
    }, {
      click: 'openBrowser',
      href: 'https://twitter.com/aritysoftware',
      icon: 'icon-twitter',
      link: true,
      section: false,
      text: 'Twitter',
      tooltip: 'Hermes Twitter',
    }, {
      click: 'openBrowser',
      href: 'http://aritysoftware.com/',
      icon: 'link',
      link: true,
      section: false,
      text: 'Aritysoftware',
      tooltip: 'Hermes website',
    }, {
      click: 'openBrowser',
      href: 'http://fb.me/hermesbyarity',
      icon: 'icon-facebook',
      link: true,
      section: false,
      text: 'Facebook',
      tooltip: 'Hermes facebook',
    }],
  }, {
    click: 'restartApp',
    hide: true,
    icon: 'spin3 icon-spin',
    text: 'New App Version is out',
    tooltip: 'Click to reload the app',
  }];
})();
