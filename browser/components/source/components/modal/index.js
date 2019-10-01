
import component from '../../component';
component({
	name: 'modal',
	template: `<button uk-toggle="target: #my-id" type="button">
	</button>
	<div id="my-id" uk-modal>
    <div class="uk-modal-dialog uk-modal-body">
        <h2 class="uk-modal-title"></h2>
        <button class="uk-modal-close" type="button"></button>
  	</div>
	</div>`
});
console.log('modal');
