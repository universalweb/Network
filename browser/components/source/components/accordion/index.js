import component from '../../component';
component({
	name: 'accordion',
	template: `<ul uk-accordion>
    <li>
        <a class="uk-accordion-title" href="#"></a>
        <div class="uk-accordion-content"></div>
    </li>
</ul>`
});
console.log('accordion');
