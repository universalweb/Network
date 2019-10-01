
import component from '../../component';
component({
	name: 'floatingActionButton',
	template: `<div class="fixed-action-btn">
    <a class="btn-floating btn-large {{data.color}}">
      <i class="large material-icons">{{data.icon}}</i>
    </a>
    <ul>
		{{#data.actions}}
      <li><a class="btn-floating {{color}}"><i class="material-icons">{{icon}}</i></a></li>
		{{/}}
    </ul>
  </div>`
});
console.log('floatingActionButton');
