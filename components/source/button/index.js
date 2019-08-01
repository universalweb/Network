import component from '../component';
component({
	name: 'btn',
	template: `<a class="waves-effect {{data.floating? 'btn-floating' : ''}} {{data.disabled? 'disabled' : ''}} {{data.waves? data.waves : 'waves-light'}} {{data.type? 'btn-'+type : 'btn'}} {{data.tooltip? 'tooltipped' : ''}}"
	data-position="{{data.tooltip.position? data.tooltip.position : '' }}"
	data-tooltip="{{data.tooltip.text? data.tooltip.text : ''}}" on-click="['action']">
    {{#data.icon}}
      <i class="material-icons {{data.icon.direction}}">{{data.icon.name}}</i>
    {{/}}
    {{#data.text}}
      {{data.text}}
    {{/}}
  </a>`
});
console.log('button');
