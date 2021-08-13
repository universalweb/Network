(async () => {
  exports.items = [{
    click: 'sidebarToggle',
    currentClass: 'sidebarOpen',
    currentIcon: 'chevron_left',
    icon: 'menu',
    id: 'sidebar',
    tooltip: 'Sidebar',
  }, {
    click: 'routerLoad',
    href: '/',
    icon: 'dashboard',
    id: 'dashboard',
    loginState: true,
    tooltip: 'Dashboard',
  }, {
    click: 'openBrowser',
    href: 'https://www.paypal.me/tommarchi/2',
    icon: 'face',
    id: 'donate',
    tooltip: 'Support development & buy me a coffee',
  }, {
    id: 'login',
    click: 'routerLoad',
    href: '/page/login',
    icon: 'perm_identity',
    loginState: false,
    right: true,
    tooltip: 'Login or Signup',
  }];
})();
