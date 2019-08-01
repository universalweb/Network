import component from '../component';
component({
	name: 'switch',
	template: `<div class="switch">
  	<label>
      Off
      <input value="{{data.value}}" type="checkbox" {{data.disabled?  'disabled' : ''}}>
      <span class="lever"></span>
      On
    </label>
  </div>`
});
console.log('switch');
