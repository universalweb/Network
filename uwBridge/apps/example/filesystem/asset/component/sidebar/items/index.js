(async function sidebarItems() {
  const {
    translate
  } = app;
  exports.items = [{
    text: 'Dashboard',
    icon: 'dashboard',
    click: 'routerLoad',
    href: '/'
  }, {
    text: 'Profile',
    icon: 'person',
    click: 'routerLoad',
    href: '/@/',
    loginState: true
  }, {
    text: 'Settings',
    icon: 'settings_applications',
    click: 'routerLoad',
    href: '/user/settings',
    loginState: true
  }, {
    text: translate.contact.label,
    icon: 'megaphone',
    click: 'routerLoad',
    href: '/page/contact'
  }, {
    text: translate.privacypolicy.label,
    icon: 'assignment',
    click: 'routerLoad',
    href: '/page/privacypolicy'
  }, {
    text: 'Logout',
    icon: 'power_settings_new',
    section: false,
    click: 'logout',
    loginState: true
  }];
})();
