/* COMPONENTS by ARITY - ARITY.COMPANY */(function(a){"function"==typeof define&&define.amd?define(a):a()})(function(){'use strict';const a=globalThis.$;a.cnsl=function(...a){console.log(...a)};const b={componentMethods:{},config:{},events:{},utility:a};globalThis.app=b;const{utility:{isString:c}}=b,d=a=>{const b=a.name;if(c(b)&&!a)return new Ractive.components[b];return Ractive.components[b]?new Ractive.components[b](a):void(Ractive.components[b]=Ractive.extend(a))};window.Ractive.prototype.data={$:b.utility,getComponent(a){console.log(a);const b=!!this.partials[a];return b||(this.partials[a]=`<${a} />`),a},makePartial(a,b){const c=`partial-${a}`,d=!!this.partials[a];return d?c:(this.partials[c]=b,c)}},b.component=d;const{utility:{findIndex:e,hasValue:f,get:g,isPlainObject:h,findItem:i,assignDeep:j,ensureArray:k,assign:l,each:m,isArray:n,isEmpty:o,sortNewest:p,sortOldest:q,clear:r}}=b,s={async afterIndex(a,b,c,d="id"){const g=e(this.get(a),b,d);f(g)?await this.splice(a,g+1,0,...k(c)):await this.push(a,c)},async assign(a,b){const c=this.get(a);if(f(c))return j(c,b),await this.update(a),c},async beforeIndex(a,b,c,d="id"){const g=e(this.get(a),b,d);f(g)?await this.splice(a,g-1,0,...k(c)):await this.push(a,c)},async clearArray(a){const b=this.get(a);b&&(r(b),await this.update(a))},findItem(a,b,c="id"){const d=i(this.get(a),b,c);if(f(d))return d},getIndex(a,b,c="id"){const d=e(this.get(a),b,c);if(f(d))return d},async mergeItem(a,b,c,d="id"){const e=i(this.get(a),b,d);if(f(e))return j(e,c),await this.update(a),e},async removeIndex(a,b,c="id"){const d=e(this.get(a),b,c);f(d)&&(await this.splice(a,d,1))},async setIndex(a,b,c,d="id",h){const i=h||{},j=e(this.get(a),b,d);if(f(j)){const b=i.pathSuffix?`.${i.pathSuffix}`:"";await this.set(`${a}.${j}${b}`,c)}else"insert"===g("conflict",i)&&(await this[g("conflictMethod",i)||"push"](a,c))},async sortNewest(a,b="id"){const c=this.get(a);p(c,b,!0),await this.update(a)},async sortOldest(a,b="id"){const c=this.get(a);q(c,b,!0),await this.update(a)},async syncCollection(a,b,c="push",d="id"){const e=this.get(a);if(h(e))j(e,b);else{const a=k(b);m(a,a=>{const b=i(e,a[d],d);f(b)?l(b,a):e[c](a)})}await this.update(a)},async toggleIndex(a,b,c,d="id"){let g;const h=n(b);g=h&&!o(b)?b.shift():b;const i=e(this.get(a),g,d);if(f(i)){const b=c?`.${c}`:"";await this.toggle(`${a}.${i}${b}`)}h&&!o(b)&&(await this.toggleIndex(a,b,c,d))},async updateItem(a,b,c,d="id"){const e=i(this.get(a),b,d);if(f(e))return c(e),await this.update(a),e}};l(Ractive.prototype,s);const{utility:{assign:t,cnsl:u,compactMapArray:v,isEmpty:w,eachAsync:x,eachObject:y,eachArray:z,isString:A,isPlainObject:B,hasValue:C,drop:D}}=b;u("Initilizing watchers module.","notify");const E={},F=[];class G{constructor(a,b){b.regex=a,this._={isWatcher:!0},this.callable=b,this.number=F.push(b)-1}start(){C(this.number)||(this.number=F.push(this.callable)-1)}stop(){C(this.number)&&(D(F,this.number),this.number=null)}}const H=(a,b)=>new G(a,b);class I{constructor(a,b,c){this._={isWatcher:!0},this.root=()=>c,this.type=a,E[a]||(E[a]=[]);const d=E[a];this.number=d.push(b)-1}start(){C(this.number)||(this.number=E[this.type].push(this.callable)-1)}stop(){C(this.number)&&(D(F,this.number),this.number=null)}}const J=(a,b,c)=>new I(a,b,c);class K{constructor(a,b){const c=this;c._={isWatcher:!0};const d=[],e=b.prefix?`${b.prefix}.`:"",f=b.suffix?`.${b.suffix}`:"";y(a,(a,b)=>{d.push(J(`${e}${b}${f}`,a,c))}),c.watching=d}start(){z(this.watching,a=>{a.start()})}stop(){z(this.watching,a=>{a.stop()})}}const L=(a,b)=>new K(a,b),M=(a,b)=>{let c;return c=A(a)?J:B(a)?L:H,c(a,b)};M.status=!0,M.start=()=>{M.status=!0},M.stop=()=>{M.status=null};t(b,{watch:M,watchers:E,watcherUpdate:async a=>{if(!M.status||!a)return;const{body:b}=a;if(!b)return;const c=b.type,d=[],e=E[c],f=v(F,a=>{if(a.regex.test(c))return a});w(f)||d.push(...f),e&&d.push(...e),console.log(d),d.length&&x(d,a=>a.load(b))}});const{utility:{each:N,assign:O}}=b,P=document.querySelector("head");O(b,{componentsWithCss:{},importedCss:{},importedCssCount:{}}),d({name:"autocomplete",template:`<input type="text" id="autocomplete-input" class="autocomplete">`}),console.log("autocomplete"),d({name:"badge",template:`<span class="{{data.new? 'new' : ''}} badge {{data.color}}">{{data.text}}</span>`}),console.log("badge"),d({name:"breadcrumb",template:`<nav>
    <div class="nav-wrapper">
      <div class="col s12">
				{{#data.items}}
        	<a href="{{url}}" on-click="['action']" class="breadcrumb">{{title}}</a>
				{{/}}
      </div>
    </div>
  </nav>`}),console.log("breadcrumb"),d({name:"btn",template:`<a class="waves-effect {{data.floating? 'btn-floating' : ''}} {{data.disabled? 'disabled' : ''}} {{data.waves? data.waves : 'waves-light'}} {{data.type? 'btn-'+type : 'btn'}} {{data.tooltip? 'tooltipped' : ''}}"
	data-position="{{data.tooltip.position? data.tooltip.position : '' }}"
	data-tooltip="{{data.tooltip.text? data.tooltip.text : ''}}" on-click="['action']">
    {{#data.icon}}
      <i class="material-icons {{data.icon.direction}}">{{data.icon.name}}</i>
    {{/}}
    {{#data.text}}
      {{data.text}}
    {{/}}
  </a>`}),console.log("button"),d({name:"card",template:`<div class="card {{data.color? data.color : 'blue-grey'}} {{data.darken? data.darken : 'darken-1'}} {{data.size}}">
      <div class="card-content white-text">
        <span class="card-title">{{data.title}}</span>
        <p>{{data.content}}</p>
      </div>
      <div class="card-action">
				{{#data.actions}}
        	<a href="{{url}}" on-click="['action']">{{text}}</a>
				{{/}}
      </div>
    </div>`}),console.log("card"),d({name:"carousel",template:`<div class="carousel">
    {{#items}}
      <a class="carousel-item" href="{{url}}">
        <img src="{{image}}">
      </a>
    {{/}}
	</div>`}),console.log("carousel"),d({name:"checkbox",template:`<input type="checkbox" checked="checked" />`}),console.log("checkbox"),d({name:"chip",template:`<div class="chip">{{data.text}}</div>`}),console.log("chip"),d({name:"collapsible",template:` <ul class="collapsible">
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
  </ul>`}),console.log("collapsible"),d({name:"collection",template:`<ul class="collection {{header? 'with-header' : ''}}">
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
    </ul>`}),console.log("collection"),d({name:"dropDown",template:`<a class='dropdown-trigger btn' data-target='{{@._guid}}'>Drop Me!</a>
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
  </ul>`}),console.log("dropdown"),d({name:"fabsCard",template:`<div class="card {{data.color? data.color : 'blue-grey'}} {{data.darken? data.darken : 'darken-1'}}">
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
		</div>`}),console.log("fabsCard"),d({name:"featureDiscovery",template:`<a id="menu" class="waves-effect waves-light btn btn-floating">
		<i class="material-icons">menu</i></a>
  	<div class="tap-target" data-target="menu">
    <div class="tap-target-content">
      <h5>data.title</h5>
      <p>A bunch of text</p>
    </div>
  </div>`}),console.log("featureDiscovery"),d({name:"flatButton",template:`<a class="btn-floating btn-large waves-effect waves-light {{data.color}}" on-click="['action']">
    {{#data.icon}}
      <i class="material-icons {{data.icon.direction}}">{{data.icon.name}}</i>
    {{/}}
    {{#data.text}}
      {{data.text}}
    {{/}}
  </a>`}),console.log("flatButton"),d({name:"floatingActionButton",template:`<div class="fixed-action-btn">
    <a class="btn-floating btn-large {{data.color}}">
      <i class="large material-icons">{{data.icon}}</i>
    </a>
    <ul>
		{{#data.actions}}
      <li><a class="btn-floating {{color}}"><i class="material-icons">{{icon}}</i></a></li>
		{{/}}
    </ul>
  </div>`}),console.log("floatingActionButton"),d({name:"horizontalCard",template:`<div class="col s12 m7">
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
   </div>`}),console.log("horizontalCard"),d({name:"icon",template:`  <i class="material-icons">{{data.name}}</i>`}),console.log("icon"),d({name:"image",template:`<img class="materialboxed" width="{{width}}" src="{{url}}">`}),console.log("image"),d({name:"imageCard",template:`<div class="card">
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
  </div>`}),console.log("imageCard"),d({name:"modal",template:`<btn data="{{data.btn}}" />
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
  </div>`}),console.log("modal"),d({name:"panelCard",template:`<div class="row">
     <div class="col s12 m5">
       <div class="card-panel {{data.color}}">
         <span class="white-text">{{data.content}}</span>
       </div>
     </div>
   </div>`}),console.log("panelCard"),d({name:"picker",template:`<input type="text" class="datepicker" />`}),console.log("picker"),d({name:"radioButton",template:`<input name="{{data.name}}" type="radio" checked />`}),console.log("radioButton"),d({name:"range",template:`<input type="range" min="{{data.min}}" max="{{data.max}}" value="{{data.value}}" />`}),console.log("range"),d({name:"revealCard",template:`<div class="card">
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
    </div>`}),console.log("revealCard"),d({name:"select",template:`<select>
		{{#data.options}}
      <option value="{{value}}" {{disabled? 'disabled' : ''}} {{selected? 'selected' : ''}}>{{text}}</option>
		{{/}}
    </select>`}),console.log("select"),d({name:"sideNav",template:`<ul id="slide-out" class="sidenav">
	{{#data.items}}
		<li>
			<a href="{{url}}">
			{{#icon}}
				<i class="material-icons">{{icon.name}}</i>
			{{/}}
			{{text}}
			</a>
		</li>
	{{/}}
  </ul>`}),console.log("sideNav"),d({name:"switch",template:`<div class="switch">
  	<label>
      Off
      <input value="{{data.value}}" type="checkbox" {{data.disabled?  'disabled' : ''}}>
      <span class="lever"></span>
      On
    </label>
  </div>`}),console.log("switch"),d({name:"tabs",template:`<div>
	<ul class="tabs">
        {{#data.tabs}}
					<li class="tab col s3"><a class="{{active? 'active' : ''}}" href="#{{target}}">{{text}}</a></li>
      	{{/}}
			</ul>
    {{#data.tabs}}
			<div id="{{target}}" class="col s12">{{content}}</div>
		{{/}}
		</div>`}),console.log("tabs"),d({name:"textInput",template:`<input id="email_inline" type="email" class="validate">`}),console.log("textInput");const{utility:{assign:Q}}=b,R=new Ractive({data(){return{components:{dynamic:{},layout:{},main:{}},notification:[],pageTitle:"",screenSize:""}},template:`<div>RENDERED</div>`}),S=new Ractive({append:!0,data(){return{text(){return R.get("pageTitle")}}},template:`<title>{{text()}}</title>`});Q(b,{async render(){await R.render("body"),await S.render("head")},view:R,pageTitle:S}),b.render()});
