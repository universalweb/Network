import component from '../component';
component({
	name: 'select',
	template: `<select>
		{{#data.options}}
      <option value="{{value}}" {{disabled? 'disabled' : ''}} {{selected? 'selected' : ''}}>{{text}}</option>
		{{/}}
    </select>`
});
console.log('select');
