/* eslint-disable */(function (factory) {
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
}((function () { 'use strict';

	const utility = globalThis.$;
	utility.cnsl = function(...args) {
		console.log(...args);
	};
	const app = {
		componentMethods: {},
		config: {},
		events: {},
		utility,
	};
	globalThis.app = app;

	const {
		utility: {
			isString: isString$1
		}
	} = app;
	const component = (config) => {
		const componentName = config.name;
		if (isString$1(componentName) && !config) {
			return new Ractive.components[componentName]();
		} else if (Ractive.components[componentName]) {
			return new Ractive.components[componentName](config);
		}
		Ractive.components[componentName] = Ractive.extend(config);
	};
	window.Ractive.prototype.data = {
		$: app.utility,
		getComponent(partialName) {
			const componentName = partialName;
			const partial = `<${partialName} />`;
			console.log(componentName);
			const partialsCheck = Boolean(this.partials[partialName]);
			if (!partialsCheck) {
				this.partials[partialName] = partial;
			}
			return partialName;
		},
		makePartial(id, template) {
			const key = `partial-${id}`;
			const partialsCheck = Boolean(this.partials[id]);
			if (partialsCheck) {
				return key;
			}
			this.partials[key] = template;
			return key;
		},
	};
	app.component = component;

	const {
		utility: {
			findIndex,
			hasValue: hasValue$1,
			get,
			isPlainObject: isPlainObject$1,
			findItem,
			assignDeep,
			ensureArray,
			assign: assign$3,
			each: each$1,
			isArray,
			isEmpty: isEmpty$1,
			sortNewest,
			sortOldest,
			clear,
		}
	} = app;
	const extendRactive = {
		async afterIndex(path, indexMatch, item, indexName = 'id') {
			const index = findIndex(this.get(path), indexMatch, indexName);
			if (hasValue$1(index)) {
				await this.splice(path, index + 1, 0, ...ensureArray(item));
			} else {
				await this.push(path, item);
			}
		},
		async assign(path, mergeObject) {
			const item = this.get(path);
			if (hasValue$1(item)) {
				assignDeep(item, mergeObject);
				await this.update(path);
				return item;
			}
		},
		async beforeIndex(path, indexMatch, item, indexName = 'id') {
			const index = findIndex(this.get(path), indexMatch, indexName);
			if (hasValue$1(index)) {
				await this.splice(path, index - 1, 0, ...ensureArray(item));
			} else {
				await this.push(path, item);
			}
		},
		async clearArray(path) {
			const arrayToClear = this.get(path);
			if (arrayToClear) {
				clear(arrayToClear);
				await this.update(path);
			}
		},
		findItem(path, indexMatch, indexName = 'id') {
			const item = findItem(this.get(path), indexMatch, indexName);
			if (hasValue$1(item)) {
				return item;
			}
		},
		getIndex(path, indexMatch, indexName = 'id') {
			const index = findIndex(this.get(path), indexMatch, indexName);
			if (hasValue$1(index)) {
				return index;
			}
		},
		async mergeItem(path, indexMatch, newVal, indexName = 'id') {
			const item = findItem(this.get(path), indexMatch, indexName);
			if (hasValue$1(item)) {
				assignDeep(item, newVal);
				await this.update(path);
				return item;
			}
		},
		async removeIndex(path, indexMatch, indexName = 'id') {
			const index = findIndex(this.get(path), indexMatch, indexName);
			if (hasValue$1(index)) {
				await this.splice(path, index, 1);
			}
		},
		async setIndex(path, indexMatch, item, indexName = 'id', optionsArg) {
			const options = optionsArg || {};
			const index = findIndex(this.get(path), indexMatch, indexName);
			if (hasValue$1(index)) {
				const pathSuffix = (options.pathSuffix) ? `.${options.pathSuffix}` : '';
				await this.set(`${path}.${index}${pathSuffix}`, item);
			} else if (get('conflict', options) === 'insert') {
				await this[get('conflictMethod', options) || 'push'](path, item);
			}
		},
		async sortNewest(path, property = 'id') {
			const array = this.get(path);
			sortNewest(array, property, true);
			await this.update(path);
		},
		async sortOldest(path, property = 'id') {
			const array = this.get(path);
			sortOldest(array, property, true);
			await this.update(path);
		},
		async syncCollection(path, newValArg, type = 'push', indexName = 'id') {
			const oldVal = this.get(path);
			if (isPlainObject$1(oldVal)) {
				assignDeep(oldVal, newValArg);
			} else {
				const newVal = ensureArray(newValArg);
				each$1(newVal, (item) => {
					const oldValItem = findItem(oldVal, item[indexName], indexName);
					if (hasValue$1(oldValItem)) {
						assign$3(oldValItem, item);
					} else {
						oldVal[type](item);
					}
				});
			}
			await this.update(path);
		},
		async toggleIndex(path, indexMatchArg, pathSuffixArg, indexName = 'id') {
			let indexMatch;
			const arrayCheck = isArray(indexMatchArg);
			if (arrayCheck && !isEmpty$1(indexMatchArg)) {
				indexMatch = indexMatchArg.shift();
			} else {
				indexMatch = indexMatchArg;
			}
			const index = findIndex(this.get(path), indexMatch, indexName);
			if (hasValue$1(index)) {
				const pathSuffix = (pathSuffixArg) ? `.${pathSuffixArg}` : '';
				await this.toggle(`${path}.${index}${pathSuffix}`);
			}
			if (arrayCheck && !isEmpty$1(indexMatchArg)) {
				await this.toggleIndex(path, indexMatchArg, pathSuffixArg, indexName);
			}
		},
		async updateItem(path, indexMatch, react, indexName = 'id') {
			const item = findItem(this.get(path), indexMatch, indexName);
			if (hasValue$1(item)) {
				react(item);
				await this.update(path);
				return item;
			}
		}
	};
	assign$3(Ractive.prototype, extendRactive);

	const {
		utility: {
			assign: assign$2,
			cnsl,
			compactMapArray,
			isEmpty,
			eachAsync,
			eachObject,
			eachArray,
			isString,
			isPlainObject,
			hasValue,
			drop
		},
	} = app;
	cnsl('Initilizing watchers module.', 'notify');
	const watchers = {};
	const watchersRegex = [];
	class RegexWatcher {
		constructor(type, callable) {
			callable.regex = type;
			this._ = {
				isWatcher: true,
			};
			this.callable = callable;
			this.number = watchersRegex.push(callable) - 1;
		}
		start() {
			if (!hasValue(this.number)) {
				this.number = watchersRegex.push(this.callable) - 1;
			}
		}
		stop() {
			if (hasValue(this.number)) {
				drop(watchersRegex, this.number);
				this.number = null;
			}
		}
	}
	const onRegex = (type, callable) => {
		return new RegexWatcher(type, callable);
	};
	class StringWatcher {
		constructor(type, callable, root) {
			this._ = {
				isWatcher: true,
			};
			this.root = () => {
				return root;
			};
			this.type = type;
			if (!watchers[type]) {
				watchers[type] = [];
			}
			const levelObject = watchers[type];
			this.number = levelObject.push(callable) - 1;
		}
		start() {
			if (!hasValue(this.number)) {
				this.number = watchers[this.type].push(this.callable) - 1;
			}
		}
		stop() {
			if (hasValue(this.number)) {
				drop(watchersRegex, this.number);
				this.number = null;
			}
		}
	}
	const onString = (type, callable, root) => {
		return new StringWatcher(type, callable, root);
	};
	class CollectionWatcher {
		constructor(object, settings) {
			const root = this;
			root._ = {
				isWatcher: true,
			};
			const watching = [];
			const prefix = (settings.prefix) ? `${settings.prefix}.` : '';
			const suffix = (settings.suffix) ? `.${settings.suffix}` : '';
			eachObject(object, (item, key) => {
				watching.push(onString(`${prefix}${key}${suffix}`, item, root));
			});
			root.watching = watching;
		}
		start() {
			eachArray(this.watching, (item) => {
				item.start();
			});
		}
		stop() {
			eachArray(this.watching, (item) => {
				item.stop();
			});
		}
	}
	const onCollection = (object, settings) => {
		return new CollectionWatcher(object, settings);
	};
	const watch = (type, callable) => {
		let method;
		if (isString(type)) {
			method = onString;
		} else if (isPlainObject(type)) {
			method = onCollection;
		} else {
			method = onRegex;
		}
		return method(type, callable);
	};
	watch.status = true;
	watch.start = () => {
		watch.status = true;
	};
	watch.stop = () => {
		watch.status = null;
	};
	const watcherUpdate = async (json) => {
		if (!watch.status || !json) {
			return;
		}
		const {
			body
		} = json;
		if (!body) {
			return;
		}
		const type = body.type;
		const subscribers = [];
		const levelObject = watchers[type];
		const regexSubscribers = compactMapArray(watchersRegex, (item) => {
			if (item.regex.test(type)) {
				return item;
			}
		});
		if (!isEmpty(regexSubscribers)) {
			subscribers.push(...regexSubscribers);
		}
		if (levelObject) {
			subscribers.push(...levelObject);
		}
		console.log(subscribers);
		if (subscribers.length) {
			eachAsync(subscribers, (watcherObject) => {
				return watcherObject.load(body);
			});
		}
	};
	assign$2(app, {
		watch,
		watchers,
		watcherUpdate
	});

	const {
		utility: {
			each,
			assign: assign$1,
		}
	} = app;
	document.querySelector('head');
	const importedCssCount = {};
	const importedCss = {};
	const componentsWithCss = {};
	assign$1(app, {
		componentsWithCss,
		importedCss,
		importedCssCount
	});

	component({
		name: 'autocomplete',
		template: `<input type="text" id="autocomplete-input" class="autocomplete">`
	});
	console.log('autocomplete');

	component({
		name: 'badge',
		template: `<span class="uk-badge"></span>`
	});
	console.log('badge');

	component({
		name: 'breadcrumb',
		template: `<ul class="uk-breadcrumb">
    <li><a href=""></a></li>
    <li><a href=""></a></li>
    <li><span></span></li>
</ul>`
	});
	console.log('breadcrumb');

	component({
		name: 'btn',
		template: `<a class="uk-button uk-button-default" href=""></a>
		<button class="uk-button uk-button-default"></button>
		<button class="uk-button uk-button-default" disabled></button>`
	});
	console.log('button');

	component({
		name: 'card',
		template: `<div class="uk-card uk-card-body">
    <h3 class="uk-card-title"></h3>
	</div>`
	});
	console.log('card');

	component({
		name: 'carousel',
		template: `<div class="carousel">
    {{#items}}
      <a class="carousel-item" href="{{url}}">
        <img src="{{image}}">
      </a>
    {{/}}
	</div>`
	});
	console.log('carousel');

	component({
		name: 'checkbox',
		template: `<input type="checkbox" checked="checked" />`
	});
	console.log('checkbox');

	component({
		name: 'chip',
		template: `<div class="chip">{{data.text}}</div>`,
	});
	console.log('chip');

	component({
		name: 'collapsible',
		template: ` <ul class="collapsible">
		{{#data.items}}
	    <li>
	      <div class="collapsible-header">
					{{#icon}}
						<i class="material-icons">{{name}}</i>
					{{/}}
					{{title}}
				</div>
	      <div class="collapsible-body"><span>{{content}}</span></div>
	    </li>
		{{/}}
  </ul>`
	});
	console.log('collapsible');

	component({
		name: 'collection',
		template: `<ul class="collection {{header? 'with-header' : ''}}">
		{{#data.header}}
      <li class="collection-header"><h4>{{title}}</h4></li>
		{{/}}
		{{#data.items}}
      <li class="collection-item">
				<div>
					{{title}}
					{{#actions}}
						<a href="{{url}}" on-click="['action']" class="secondary-content">
							{{#icon}}
								<i class="material-icons">{{name}}</i>
							{{/}}
						</a>
						{{/}}
				</div>
			</li>
		{{/}}
    </ul>`
	});
	console.log('collection');

	component({
		name: 'dropDown',
		template: `<a class='dropdown-trigger btn' data-target='{{@._guid}}'>Drop Me!</a>
  <ul id='{{@._guid}}' class='dropdown-content'>
	{{#data.items}}
    <li>
			<a href="{{url}}">
				{{#icon}}
					<i class="material-icons">{{name}}</i>
				{{/}}
				{{text}}
			</a>
		</li>
	{{/}}
  </ul>`
	});
	console.log('dropdown');

	component({
		name: 'fabsCard',
		template: `<div class="card {{data.color? data.color : 'blue-grey'}} {{data.darken? data.darken : 'darken-1'}}">
			<div class="card-image">
			<img src="{{data.image}}">
				<span class="card-title">{{data.title}}</span>
				{{#data.actions}}
					<a class="btn-floating halfway-fab waves-effect waves-light {{color}}" on-click="['action']"><i class="material-icons">{{icon}}</i></a>
				{{/}}
			</div>
			<div class="card-content">
				<p>{{data.content}}</p>
			</div>
		</div>`
	});
	console.log('fabsCard');

	component({
		name: 'featureDiscovery',
		template: `<a id="menu" class="waves-effect waves-light btn btn-floating">
		<i class="material-icons">menu</i></a>
  	<div class="tap-target" data-target="menu">
    <div class="tap-target-content">
      <h5>data.title</h5>
      <p>A bunch of text</p>
    </div>
  </div>`
	});
	console.log('featureDiscovery');

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

	component({
		name: 'horizontalCard',
		template: `<div class="col s12 m7">
     <h2 class="header">{{data.title}}</h2>
     <div class="card horizontal">
       <div class="card-image">
         <img src="{{data.image}}">
       </div>
       <div class="card-stacked">
         <div class="card-content">
           <p>{{data.content}}</p>
         </div>
         <div class="card-action">
				 	{{#data.actions}}
          	<a href="{{url}}">{{text}}</a>
					{{/}}
         </div>
       </div>
     </div>
   </div>`
	});
	console.log('horizontalCard');

	component({
		name: 'icon',
		template: `<script src="uikit/dist/js/uikit-icons.min.js"></script>
		<span uk-icon="icon: check"></span>
		<a href="" uk-icon="icon: heart"></a>`
	});
	console.log('icon');

	component({
		name: 'image',
		template: `<img data-src="" width="" height="" alt="" uk-img>`
	});
	console.log('image');

	component({
		name: 'imageCard',
		template: `<div class="card">
		<div class="card-image">
			<img src="{{data.image}}">
			<span class="card-title">{{data.title}}</span>
		</div>
		<div class="card-content">
			<p>{{data.content}}</p>
		</div>
		<div class="card-action">
			{{#data.actions}}
				<a href="{{url}}" on-click="['action']">{{text}}</a>
			{{/}}
		</div>
  </div>`
	});
	console.log('imageCard');

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

	component({
		name: 'panelCard',
		template: `<div class="row">
     <div class="col s12 m5">
       <div class="card-panel {{data.color}}">
         <span class="white-text">{{data.content}}</span>
       </div>
     </div>
   </div>`
	});
	console.log('panelCard');

	component({
		name: 'picker',
		template: `<input type="text" class="datepicker" />`
	});
	console.log('picker');

	component({
		name: 'radioButton',
		template: `<input name="{{data.name}}" type="radio" checked />`
	});
	console.log('radioButton');

	component({
		name: 'range',
		template: `<input type="range" min="{{data.min}}" max="{{data.max}}" value="{{data.value}}" />`
	});
	console.log('range');

	component({
		name: 'revealCard',
		template: `<div class="card">
      <div class="card-image waves-effect waves-block waves-light">
        <img class="activator" src="{{data.url}}">
      </div>
      <div class="card-content">
        <span class="card-title activator grey-text text-darken-4">{{data.title}}
				{{#data.btns}}
					<i class="material-icons right">more_vert</i>
				{{/}}
				</span>
        <p>
					{{#data.links}}
						<a href="{{url}}">This is a link</a>
					{{/}}
				</p>
      </div>
      <div class="card-reveal">
        <span class="card-title grey-text text-darken-4">{{revealTitle}}<i class="material-icons right">close</i></span>
        <p>{{revealContent}}</p>
      </div>
    </div>`
	});
	console.log('revealCard');

	component({
		name: 'select',
		template: `<select>
		{{#data.options}}
      <option value="{{value}}" {{disabled? 'disabled' : ''}} {{selected? 'selected' : ''}}>{{text}}</option>
		{{/}}
    </select>`
	});
	console.log('select');

	component({
		name: 'sideNav',
		template: `<a href="" uk-slidenav-next></a>
		<a href="" uk-slidenav-previous></a>`
	});
	console.log('sideNav');

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

	component({
		name: 'tabs',
		template: `<div>
	<ul class="tabs">
        {{#data.tabs}}
					<li class="tab col s3"><a class="{{active? 'active' : ''}}" href="#{{target}}">{{text}}</a></li>
      	{{/}}
			</ul>
    {{#data.tabs}}
			<div id="{{target}}" class="col s12">{{content}}</div>
		{{/}}
		</div>`
	});
	console.log('tabs');

	component({
		name: 'textInput',
		template: `<input id="email_inline" type="email" class="validate">`
	});
	console.log('textInput');

	const {
		utility: {
			assign
		}
	} = app;
	const view = new Ractive({
		target: 'body',
		data() {
			return {
				components: {
					dynamic: {},
					layout: {},
					main: {},
				},
				notification: [],
				pageTitle: '',
				screenSize: '',
			};
		},
		template: `{{#components.main:key}}{{>getComponent(key)}}{{/}}`,
	});
	const pageTitle = new Ractive({
		target: 'head',
		append: true,
		data() {
			return {
				text() {
					return view.get('pageTitle');
				}
			};
		},
		template: `<title>{{text()}}</title>`,
	});
	assign(app, {
		view,
		pageTitle
	});

})));
