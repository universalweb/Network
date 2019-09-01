import component from '../component';
component({
	name: 'modal',
	template: `<btn data="{{data.btn}}" />
  <div id="modal1" class="modal">
    <div class="modal-content">
      <h4>{{data.header}}</h4>
      <p>{{data.text}}</p>
    </div>
    <div class="modal-footer">
		{{#data.actions}}
      <a href="{{url}}" class="modal-{{type}} waves-effect waves-{{color}} btn-flat">{{text}}</a>
		{{/}}
    </div>
  </div>`
});
console.log('modal');
