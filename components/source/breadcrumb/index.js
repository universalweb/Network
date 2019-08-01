import component from '../component';
component({
	name: 'breadcrumb',
	template: `<nav>
    <div class="nav-wrapper">
      <div class="col s12">
				{{#data.items}}
        	<a href="{{url}}" on-click="['action']" class="breadcrumb">{{title}}</a>
				{{/}}
      </div>
    </div>
  </nav>`
});
console.log('breadcrumb');
