import babelParser from '@babel/eslint-parser';
import globals from 'globals';
import jsdoc from 'eslint-plugin-jsdoc';
import stylisticJs from '@stylistic/eslint-plugin';
const globalsObject = {};
const customGlobals = {
	globalThis: 'readonly',
	window: 'readonly',
	top: 'readonly',
	$: 'off',
	Client: 'off',
	client: 'off',
	clients: 'off',
	status: 'off'
};
function addGlobals(keysObject) {
	const keys = Object.keys(keysObject);
	keys.forEach((key, value) => {
		globalsObject[key.trim()] = 'readonly';
	});
}
const globalsArray = [
	globals.browser,
	globals.commonjs,
	globals.node,
	globals.serviceworker,
	globals.worker
];
globalsArray.forEach(addGlobals);
Object.assign(globalsObject, customGlobals);
export default [
	{
		ignores: [
			'node_modules/*',
			'.eslintignore',
			'**/*.mjs'
		],
		files: ['**/*.js'],
		languageOptions: {
			parser: babelParser,
			parserOptions: {
				requireConfigFile: true,
			},
			sourceType: 'module',
			ecmaVersion: 'latest',
			globals: globalsObject,
		},
		plugins: {
			jsdoc,
			'@stylistic': stylisticJs
		},
		rules: {
			'@stylistic/array-bracket-newline': [
				'error',
				{
					multiline: true,
					minItems: 2
				}
			],
			'@stylistic/array-bracket-spacing': [
				'error',
				'never'
			],
			'@stylistic/array-element-newline': [
				'error',
				{
					multiline: true,
					minItems: 2
				}
			],
			'@stylistic/arrow-parens': [
				'error',
				'always'
			],
			'@stylistic/block-spacing': [
				'error',
				'always'
			],
			'@stylistic/brace-style': 'error',
			'@stylistic/comma-dangle': [
				'error',
				{
					arrays: 'ignore',
					exports: 'ignore',
					functions: 'ignore',
					imports: 'ignore',
					objects: 'ignore'
				}
			],
			'@stylistic/comma-spacing': [
				'error',
				{
					after: true,
					before: false
				}
			],
			'@stylistic/comma-style': [
				'error',
				'last'
			],
			'@stylistic/computed-property-spacing': 'error',
			'@stylistic/dot-location': [
				'error',
				'property'
			],
			'@stylistic/eol-last': 'error',
			'@stylistic/function-call-argument-newline': [
				'error',
				'consistent'
			],
			'@stylistic/function-call-spacing': 'error',
			'@stylistic/function-paren-newline': 'error',
			'@stylistic/generator-star-spacing': [
				'error',
				{
					after: true,
					before: false
				}
			],
			'@stylistic/implicit-arrow-linebreak': [
				'error',
				'beside'
			],
			'@stylistic/indent': [
				'error',
				'tab',
				{
					ImportDeclaration: 1,
					ObjectExpression: 1,
					SwitchCase: 1
				}
			],
			'@stylistic/jsx-quotes': [
				'error',
				'prefer-double'
			],
			'@stylistic/key-spacing': [
				'error',
				{
					afterColon: true,
					beforeColon: false,
					mode: 'strict'
				}
			],
			'@stylistic/keyword-spacing': [
				'error',
				{
					after: true,
					before: true
				}
			],
			'@stylistic/linebreak-style': [
				'error',
				'unix'
			],
			'@stylistic/lines-around-comment': [
				'error',
				{
					afterBlockComment: false,
					afterLineComment: false,
					beforeBlockComment: false,
					beforeLineComment: false
				}
			],
			'@stylistic/lines-between-class-members': [
				'error',
				'never'
			],
			'@stylistic/max-len': [
				'error',
				{
					code: 150,
					ignoreComments: true,
					ignoreRegExpLiterals: true,
					ignoreStrings: true,
					ignoreTemplateLiterals: true,
					ignoreTrailingComments: true,
					ignoreUrls: true,
					tabWidth: 2
				}
			],
			'@stylistic/max-statements-per-line': [
				'error',
				{
					max: 1
				}
			],
			'@stylistic/multiline-ternary': [
				'error',
				'never'
			],
			'@stylistic/new-parens': 'error',
			'@stylistic/newline-per-chained-call': [
				'error',
				{
					ignoreChainWithDepth: 3
				}
			],
			'@stylistic/no-confusing-arrow': 'error',
			'@stylistic/no-extra-parens': [
				'error',
				'all',
				{
					conditionalAssign: false,
					enforceForSequenceExpressions: false,
					nestedBinaryExpressions: false,
					returnAssign: false,
					ternaryOperandBinaryExpressions: false
				}
			],
			'@stylistic/no-extra-semi': 'error',
			'@stylistic/no-floating-decimal': 'error',
			'@stylistic/no-mixed-operators': 'error',
			'@stylistic/no-mixed-spaces-and-tabs': ['error'],
			'@stylistic/no-multi-spaces': 'error',
			'@stylistic/no-multiple-empty-lines': [
				'error',
				{
					max: 0,
					maxEOF: 1
				}
			],
			'@stylistic/no-tabs': 'off',
			'@stylistic/no-trailing-spaces': 'error',
			'@stylistic/no-whitespace-before-property': 'error',
			'@stylistic/object-curly-newline': [
				'error',
				{
					ExportDeclaration: {
						minProperties: 4,
						multiline: true
					},
					ImportDeclaration: {
						minProperties: 4,
						multiline: true
					},
					ObjectExpression: {
						minProperties: 1,
						multiline: true
					},
					ObjectPattern: {
						minProperties: 2,
						multiline: true
					}
				}
			],
			'@stylistic/object-curly-spacing': [
				'error',
				'always'
			],
			'@stylistic/object-property-newline': [
				'error',
				{
					allowAllPropertiesOnSameLine: false,
					allowMultiplePropertiesPerLine: false
				}
			],
			'@stylistic/one-var-declaration-per-line': [
				'error',
				'always'
			],
			'@stylistic/operator-linebreak': [
				'error',
				'after'
			],
			'@stylistic/padded-blocks': [
				'error',
				'never'
			],
			'@stylistic/padding-line-between-statements': 'off',
			'@stylistic/quote-props': [
				'error',
				'as-needed'
			],
			'@stylistic/quotes': [
				'error',
				'single',
				{
					allowTemplateLiterals: true
				}
			],
			'@stylistic/rest-spread-spacing': [
				'error',
				'never'
			],
			'@stylistic/semi': [
				'error',
				'always'
			],
			'@stylistic/semi-spacing': 'error',
			'@stylistic/space-before-blocks': [
				'error',
				'always'
			],
			'@stylistic/space-before-function-paren': [
				'error',
				{
					anonymous: 'never',
					asyncArrow: 'always',
					named: 'never'
				}
			],
			'@stylistic/space-in-parens': [
				'error',
				'never'
			],
			'@stylistic/space-infix-ops': [
				'error',
				{
					int32Hint: false
				}
			],
			'@stylistic/space-unary-ops': [
				'error',
				{
					nonwords: false,
					words: true
				}
			],
			'@stylistic/spaced-comment': [
				'error',
				'always',
				{
					block: {
						balanced: true,
						exceptions: ['*'],
						markers: ['!']
					},
					line: {
						exceptions: [
							'-',
							'+'
						],
						markers: ['/']
					}
				}
			],
			'@stylistic/switch-colon-spacing': [
				'error',
				{
					after: true,
					before: false
				}
			],
			'@stylistic/template-curly-spacing': [
				'error',
				'never'
			],
			'@stylistic/template-tag-spacing': [
				'error',
				'always'
			],
			'@stylistic/wrap-iife': [
				'error',
				'any'
			],
			'@stylistic/wrap-regex': 'error',
			'@stylistic/yield-star-spacing': [
				'error',
				'after'
			],
			'accessor-pairs': 'error',
			'array-callback-return': 'error',
			'arrow-body-style': [
				'error',
				'always'
			],
			'arrow-spacing': [
				'error',
				{
					after: true,
					before: true
				}
			],
			'block-scoped-var': 'error',
			'callback-return': 'off',
			camelcase: 'off',
			complexity: 'off',
			'consistent-return': 'off',
			'consistent-this': 'off',
			'constructor-super': 'error',
			curly: [
				'error',
				'all'
			],
			'default-case': 'error',
			'dot-notation': 'error',
			eqeqeq: [
				'error',
				'smart'
			],
			'func-names': 'off',
			'func-style': 'off',
			'global-require': 'off',
			'guard-for-in': 'error',
			'handle-callback-err': 'error',
			'id-blacklist': 'off',
			'id-length': [
				'error',
				{
					min: 1
				}
			],
			'id-match': 'off',
			'init-declarations': 'off',
			'jsdoc/check-access': 1,
			'jsdoc/check-alignment': 1,
			'jsdoc/check-examples': 'off',
			'jsdoc/check-indentation': 1,
			'jsdoc/check-line-alignment': 1,
			'jsdoc/check-param-names': 1,
			'jsdoc/check-property-names': 1,
			'jsdoc/check-syntax': 1,
			'jsdoc/check-tag-names': 0,
			'jsdoc/check-types': 0,
			'jsdoc/check-values': 0,
			'jsdoc/empty-tags': 1,
			'jsdoc/implements-on-classes': 0,
			'jsdoc/match-description': 1,
			'jsdoc/multiline-blocks': 0,
			'jsdoc/no-bad-blocks': 1,
			'jsdoc/no-defaults': 0,
			'jsdoc/no-missing-syntax': 0,
			'jsdoc/no-multi-asterisks': 0,
			'jsdoc/no-restricted-syntax': 0,
			'jsdoc/no-types': 0,
			'jsdoc/no-undefined-types': 0,
			'jsdoc/require-asterisk-prefix': 1,
			'jsdoc/require-description': 1,
			'jsdoc/require-description-complete-sentence': 1,
			'jsdoc/require-example': 0,
			'jsdoc/require-file-overview': 0,
			'jsdoc/require-hyphen-before-param-description': 1,
			'jsdoc/require-jsdoc': 0,
			'jsdoc/require-param': 0,
			'jsdoc/require-param-description': 1,
			'jsdoc/require-param-name': 1,
			'jsdoc/require-param-type': 1,
			'jsdoc/require-property': 0,
			'jsdoc/require-property-description': 1,
			'jsdoc/require-property-name': 1,
			'jsdoc/require-property-type': 1,
			'jsdoc/require-returns': 1,
			'jsdoc/require-returns-check': 1,
			'jsdoc/require-returns-description': 1,
			'jsdoc/require-returns-type': 1,
			'jsdoc/require-throws': 0,
			'jsdoc/require-yields': 0,
			'jsdoc/require-yields-check': 0,
			'jsdoc/tag-lines': 0,
			'jsdoc/valid-types': 1,
			'line-comment-position': [
				'error',
				{
					position: 'above'
				}
			],
			'max-depth': 'off',
			'max-nested-callbacks': [
				'error',
				3
			],
			'max-params': 'off',
			'max-statements': 'off',
			'multiline-comment-style': 'off',
			'new-cap': 'error',
			'newline-before-return': 'off',
			'no-alert': 'error',
			'no-array-constructor': 'error',
			'no-await-in-loop': 'off',
			'no-bitwise': 'error',
			'no-caller': 'error',
			'no-case-declarations': 'error',
			'no-catch-shadow': 'error',
			'no-class-assign': 'error',
			'no-cond-assign': [
				'error',
				'always'
			],
			'no-console': 'off',
			'no-const-assign': 'error',
			'no-constant-binary-expression': 'error',
			'no-constant-condition': 'error',
			'no-continue': 'off',
			'no-control-regex': 'off',
			'no-debugger': 'error',
			'no-delete-var': 'error',
			'no-div-regex': 'error',
			'no-dupe-args': 'error',
			'no-dupe-class-members': 'error',
			'no-dupe-else-if': 'error',
			'no-dupe-keys': 'error',
			'no-duplicate-case': 'error',
			'no-duplicate-imports': 'error',
			'no-else-return': 'off',
			'no-empty': 'error',
			'no-empty-character-class': 'error',
			'no-empty-function': 'off',
			'no-empty-pattern': 'error',
			'no-eq-null': 'off',
			'no-eval': 'error',
			'no-ex-assign': 'error',
			'no-extend-native': 'error',
			'no-extra-bind': 'error',
			'no-extra-boolean-cast': 'error',
			'no-extra-label': 'error',
			'no-fallthrough': 'error',
			'no-func-assign': 'error',
			'no-global-assign': 'error',
			'no-implicit-coercion': 'error',
			'no-implicit-globals': 'error',
			'no-implied-eval': 'error',
			'no-import-assign': 'error',
			'no-inline-comments': 'error',
			'no-inner-declarations': [
				'error',
				'functions'
			],
			'no-invalid-regexp': 'error',
			'no-invalid-this': 'off',
			'no-irregular-whitespace': 'error',
			'no-iterator': 'error',
			'no-label-var': 'error',
			'no-labels': 'error',
			'no-lone-blocks': 'error',
			'no-lonely-if': 'error',
			'no-loop-func': 'error',
			'no-magic-numbers': 'off',
			'no-mixed-requires': 'error',
			'no-multi-str': 'error',
			'no-native-reassign': 'error',
			'no-negated-condition': 'error',
			'no-negated-in-lhs': 'error',
			'no-nested-ternary': 'error',
			'no-new': 'error',
			'no-new-func': 'error',
			'no-new-object': 'error',
			'no-new-require': 'error',
			'no-new-symbol': 'error',
			'no-new-wrappers': 'error',
			'no-obj-calls': 'error',
			'no-octal': 'error',
			'no-octal-escape': 'error',
			'no-param-reassign': [
				'error',
				{
					props: false
				}
			],
			'no-path-concat': 'error',
			'no-plusplus': 'off',
			'no-process-env': 'off',
			'no-process-exit': 'error',
			'no-proto': 'error',
			'no-prototype-builtins': 'error',
			'no-redeclare': [
				'error',
				{
					builtinGlobals: true
				}
			],
			'no-regex-spaces': 'error',
			'no-restricted-globals': 'error',
			'no-restricted-imports': 'off',
			'no-restricted-modules': 'off',
			'no-restricted-syntax': 'off',
			'no-return-assign': [
				'error',
				'always'
			],
			'no-return-await': 'error',
			'no-script-url': 'error',
			'no-self-compare': 'error',
			'no-sequences': 'error',
			'no-setter-return': 'error',
			'no-shadow': [
				'error',
				{
					builtinGlobals: true,
					hoist: 'all'
				}
			],
			'no-shadow-restricted-names': 'error',
			'no-spaced-func': 'error',
			'no-sparse-arrays': 'error',
			'no-sync': 'off',
			'no-template-curly-in-string': 'off',
			'no-ternary': 'off',
			'no-this-before-super': 'error',
			'no-throw-literal': 'error',
			'no-undef': 'error',
			'no-undef-init': 'error',
			'no-undefined': 'off',
			'no-underscore-dangle': [
				'error',
				{
					allow: [
						'__dirname',
						'__filename'
					]
				}
			],
			'no-unexpected-multiline': 'error',
			'no-unmodified-loop-condition': 'error',
			'no-unneeded-ternary': 'error',
			'no-unreachable': 'error',
			'no-unused-expressions': [
				'error',
				{
					allowShortCircuit: true,
					allowTernary: true
				}
			],
			'no-unused-labels': 'error',
			'no-unused-vars': 'off',
			'no-use-before-define': 'error',
			'no-useless-call': 'error',
			'no-useless-computed-key': 'error',
			'no-useless-concat': 'error',
			'no-useless-constructor': 'error',
			'no-useless-escape': 'error',
			'no-useless-rename': 'error',
			'no-var': 'error',
			'no-void': 'error',
			'no-with': 'error',
			'object-shorthand': 'error',
			'one-var': [
				'error',
				'never'
			],
			'operator-assignment': 'off',
			'prefer-arrow-callback': 'error',
			'prefer-const': 'error',
			'prefer-reflect': 'off',
			'prefer-rest-params': 'error',
			'prefer-spread': 'error',
			'prefer-template': 'error',
			radix: 'error',
			'require-yield': 'error',
			semi: [
				'error',
				'always'
			],
			'sort-imports': [
				'error',
				{
					allowSeparatedGroups: false,
					ignoreCase: false,
					ignoreDeclarationSort: false,
					ignoreMemberSort: false,
					memberSyntaxSortOrder: [
						'none',
						'all',
						'multiple',
						'single'
					]
				}
			],
			'sort-keys': 'off',
			'sort-vars': 'off',
			'unicode-bom': 'off',
			'use-isnan': 'error',
			'valid-typeof': 'error',
			'vars-on-top': 'error',
			yoda: 'off'
		}
	}
];
