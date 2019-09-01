import component from '../component';
component({
	name: 'flatButton',
	template: `<a class="btn-floating btn-large waves-effect waves-light {{data.color}}" on-click="['action']">
    {{#data.icon}}
      <i class="material-icons {{data.icon.direction}}">{{data.icon.name}}</i>
    {{/}}
    {{#data.text}}
      {{data.text}}
    {{/}}
  </a>`
});
console.log('flatButton');
