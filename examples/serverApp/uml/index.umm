import { UML } from '../../UML/index.js';
import { encode } from '#utilities/serialize';
// EXPERIMENTAL MARKUP NONE FUNCTIONAL
// UMLS Universal Markup Language Script (Generate Markup CLient Side) SCRIPT & MARKUP
// UMM Universal Markup Language Module (Generate Markup Module) MODULE & MARKUP
// UMLSS Universal Markup Language Server Script (Generate Markup Server Side) SERVER SIDE SCRIPT & MARKUP
// UML Universal Markup Language Served As a Binary
export const doctype = 'html';
export const lang = 'en';
// export const title = 'UML Module';
// export const meta = [];
// export const doc = {
// 	DEFAULT type: 'html',
// 	DEFAULT lang: 'en',
// 	title: 'UML Module',
// 	meta: [],
//  style: [],
//  script: [],
// 	head: []
// };
export const head = {
	title: 'UML Module',
	meta: [
		{
			charset: 'UTF-8'
		},
		{
			name: 'viewport',
			content: 'width=device-width, initial-scale=1.0'
		},
		{
			description: 'UMM Universal Markup Module'
		}
	],
	style: [
		// SHORT HAND 'style.css',
		{
		// DEFAULT type: 'text/css',
		// DEFAULT rel: 'stylesheet',
			href: 'style.css'
		}
	],
};
export const body = [
	'div.className',
	[
		'div.className2',
		[
			'div#idName', {
				attribute: 'value'
			}
		]
	]
];
// LOAD AFTER BODY TAG
export const footer = {
	script: ['script.js']
};
/*
	TEXT BASED UML SHORTHAND
	FORMAT EXAMPLE
	['div.className',
		['div.className2',
			['div#idName', {
					attribute: 'value'
				}
			]
		]
	];
	EXPERIMENTAL ALT SYNTAX  -> INVALID JS/JSON OBJECT SYNTAX
	[div.className,
		[div.className2,
			[div#idName, {
					attribute: 'value'
				}
			]
		]
	];
	EXPERIMENTAL ALT SYNTAX  -> INVALID JS/JSON OBJECT SYNTAX
	[div.className,
		[div.className2,
			[div#idName, attribute='value' ATTR2='value', 'TEXT']
		]
	];
	EXPERIMENTAL ALT SYNTAX  -> INVALID JS/JSON OBJECT SYNTAX
	div.className[
		div.className2[
			div#idName attribute='value' ATTR2='value' ['TEXT']
		]
	];
	EXPERIMENTAL LISP LIKE ALTERNATIVE SYNTAX (MORE PRONE TO SYNTAX ISSUES)
	div.className( div.className2( div#idName[attribute='value'] ))
	div.className(
		div.className2(
			div#idName[attribute='value' data-example='example']('TEXT')
		)
	)
	EXPERIMENTAL LISP LIKE ALTERNATIVE SHORT SYNTAX (MORE PRONE TO SYNTAX ISSUES)
	div.className( div.className2( div#idName attribute='value' data-example='example'('TEXT') ))
	div.className(
		div.className2(
			div#idName attribute='value' data-example='example' ('TEXT')
		)
	)
*/
// UML EXAMPLE ['div.className',['div.className2',['div#idName',{attribute: 'value'}]]]
// HTML EXAMPLE <div class="className"><div class="className2"><div id="idName" attribute="value"></div></div></div>
// export const data = await UML(doctype, lang, head, body});
// await data.save(`${import.meta.url}../resources/index.uml`);
