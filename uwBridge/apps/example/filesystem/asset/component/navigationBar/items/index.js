(async function () {
  exports.items = [{
    id: 'sidebar',
    icon: 'menu',
    currentIcon: 'chevron_left',
    tooltip: 'Sidebar',
    click: 'sidebarToggle',
    currentClass: 'sidebarOpen',
    active: true
  }, {
    id: 'dashboard',
    tooltip: 'Dashboard',
    icon: 'dashboard',
    click: 'routerLoad',
    href: '/',
    loginState: true,
  }];
})();
