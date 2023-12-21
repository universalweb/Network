import babelParser from '@babel/eslint-parser';
import globals from 'globals';
import jsdoc from 'eslint-plugin-jsdoc';
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
const globalsArray = [globals.browser, globals.commonjs, globals.node, globals.serviceworker, globals.worker];
globalsArray.forEach(addGlobals);
Object.assign(globalsObject, customGlobals);
export default [{
	ignores: ['node_modules/*', '.eslintignore', '**/*.mjs'],
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
		jsdoc
	},
	rules: {
		'no-setter-return': 'error',
		'no-dupe-else-if': 'error',
		'no-import-assign': 'error',
		'object-curly-newline': [
			'error',
			{
				ObjectExpression: {
					multiline: true,
					minProperties: 1
				},
				ObjectPattern: {
					multiline: true,
					minProperties: 2
				},
				ImportDeclaration: {
					multiline: true,
					minProperties: 4
				},
				ExportDeclaration: {
					multiline: true,
					minProperties: 4
				}
			}
		],
		'object-property-newline': [
			'error',
			{
				allowMultiplePropertiesPerLine: false,
				allowAllPropertiesOnSameLine: false
			}
		],
		'no-return-await': 'error',
		'no-cond-assign': [
			'error',
			'always'
		],
		'no-constant-condition': 'error',
		'no-control-regex': 'off',
		'no-debugger': 'error',
		'no-dupe-args': 'error',
		'no-dupe-keys': 'error',
		'no-duplicate-case': 'error',
		'no-empty': 'error',
		'no-empty-character-class': 'error',
		'no-ex-assign': 'error',
		'no-extra-boolean-cast': 'error',
		'no-extra-parens': 'off',
		'no-extra-semi': 'error',
		'no-func-assign': 'error',
		'no-inner-declarations': [
			'error',
			'functions'
		],
		'no-invalid-regexp': 'error',
		'no-irregular-whitespace': 'error',
		'no-negated-in-lhs': 'error',
		'no-obj-calls': 'error',
		'no-prototype-builtins': 'error',
		'no-regex-spaces': 'error',
		'no-sparse-arrays': 'error',
		'no-unexpected-multiline': 'error',
		'no-unreachable': 'error',
		'use-isnan': 'error',
		'valid-typeof': 'error',
		'accessor-pairs': 'error',
		'array-callback-return': 'error',
		'block-scoped-var': 'error',
		complexity: 'off',
		curly: [
			'error',
			'all'
		],
		'default-case': 'error',
		'dot-location': [
			'error',
			'property'
		],
		'dot-notation': 'error',
		eqeqeq: [
			'error',
			'smart'
		],
		'guard-for-in': 'error',
		'no-alert': 'error',
		'no-caller': 'error',
		'no-case-declarations': 'error',
		'no-div-regex': 'error',
		'no-empty-function': 'off',
		'no-empty-pattern': 'error',
		'no-eq-null': 'off',
		'no-eval': 'error',
		'no-extend-native': 'error',
		'no-extra-bind': 'error',
		'no-extra-label': 'error',
		'no-fallthrough': 'error',
		'no-floating-decimal': 'error',
		'no-implicit-coercion': 'error',
		'no-implicit-globals': 'error',
		'no-implied-eval': 'error',
		'no-invalid-this': 'off',
		'no-iterator': 'error',
		'no-labels': 'error',
		'no-lone-blocks': 'error',
		'no-loop-func': 'error',
		'no-magic-numbers': 'off',
		'no-multi-spaces': 'error',
		'no-multi-str': 'error',
		'no-native-reassign': 'error',
		'no-new': 'error',
		'no-new-func': 'error',
		'no-new-wrappers': 'error',
		'no-octal': 'error',
		'no-octal-escape': 'error',
		'no-proto': 'error',
		'no-redeclare': [
			'error',
			{
				builtinGlobals: true
			}
		],
		'no-return-assign': [
			'error',
			'always'
		],
		'no-script-url': 'error',
		'no-self-compare': 'error',
		'no-sequences': 'error',
		'no-throw-literal': 'error',
		'no-unmodified-loop-condition': 'error',
		'no-unused-expressions': [
			'error',
			{
				allowShortCircuit: true,
				allowTernary: true
			}
		],
		'no-unused-labels': 'error',
		'no-useless-call': 'error',
		'no-useless-concat': 'error',
		'no-void': 'error',
		'no-with': 'error',
		radix: 'error',
		'vars-on-top': 'error',
		yoda: 'off',
		'init-declarations': 'off',
		'no-catch-shadow': 'error',
		'no-delete-var': 'error',
		'no-label-var': 'error',
		'no-restricted-globals': 'error',
		'no-shadow': [
			'error',
			{
				builtinGlobals: true,
				hoist: 'all'
			}
		],
		'no-shadow-restricted-names': 'error',
		'no-undef': 'error',
		'no-undef-init': 'error',
		'no-undefined': 'off',
		'no-unused-vars': 'off',
		'no-use-before-define': 'error',
		'callback-return': 'off',
		'handle-callback-err': 'error',
		'no-mixed-requires': 'error',
		'no-new-require': 'error',
		'no-path-concat': 'error',
		'no-process-env': 'off',
		'no-process-exit': 'error',
		'no-restricted-modules': 'off',
		'no-sync': 'off',
		'array-bracket-spacing': [
			'error',
			'never'
		],
		'block-spacing': [
			'error',
			'always'
		],
		'brace-style': 'error',
		camelcase: 'off',
		'comma-spacing': [
			'error',
			{
				before: false,
				after: true
			}
		],
		'comma-style': [
			'error',
			'last'
		],
		'computed-property-spacing': [
			'error',
			'never'
		],
		'consistent-this': 'off',
		'eol-last': 'error',
		'func-style': 'off',
		'id-blacklist': 'off',
		'id-length': [
			'error',
			{
				min: 1
			}
		],
		'id-match': 'off',
		indent: [
			'error',
			'tab',
			{
				SwitchCase: 1,
				ObjectExpression: 1,
				ImportDeclaration: 1
			}
		],
		'switch-colon-spacing': ['error', {
			after: true,
			before: false
		}],
		'key-spacing': [
			'error',
			{
				beforeColon: false,
				afterColon: true,
				mode: 'strict'
			}
		],
		'keyword-spacing': [
			'error',
			{
				before: true,
				after: true
			}
		],
		'linebreak-style': [
			'error',
			'unix'
		],
		'lines-around-comment': [
			'error',
			{
				beforeBlockComment: false,
				afterBlockComment: false,
				beforeLineComment: false,
				afterLineComment: false
			}
		],
		'max-depth': 'off',
		'max-len': [
			'error',
			{
				code: 150,
				tabWidth: 2,
				ignoreComments: true,
				ignoreUrls: true,
				ignoreTemplateLiterals: true,
				ignoreRegExpLiterals: true,
				ignoreTrailingComments: true,
				ignoreStrings: true
			}
		],
		'max-nested-callbacks': [
			'error',
			3
		],
		'max-params': 'off',
		'max-statements': 'off',
		'max-statements-per-line': 'off',
		'new-cap': 'error',
		'new-parens': 'error',
		'newline-before-return': 'off',
		'newline-per-chained-call': [
			'error',
			{
				ignoreChainWithDepth: 3
			}
		],
		'no-array-constructor': 'error',
		'no-bitwise': 'error',
		'no-continue': 'off',
		'no-inline-comments': 'error',
		'no-lonely-if': 'error',
		'no-mixed-spaces-and-tabs': [
			'error'
		],
		'no-multiple-empty-lines': [
			'error',
			{
				max: 0,
				maxEOF: 1
			}
		],
		'no-negated-condition': 'error',
		'no-nested-ternary': 'error',
		'no-new-object': 'error',
		'no-restricted-syntax': 'off',
		'no-spaced-func': 'error',
		'no-ternary': 'off',
		'no-trailing-spaces': 'error',
		'no-underscore-dangle': [
			'error',
			{
				allow: [
					'__dirname',
					'__filename'
				]
			}
		],
		'no-unneeded-ternary': 'error',
		'no-constant-binary-expression': 'error',
		'no-whitespace-before-property': 'error',
		'object-curly-spacing': [
			'error',
			'always'
		],
		'one-var-declaration-per-line': [
			'error',
			'always'
		],
		'operator-assignment': 'off',
		'operator-linebreak': [
			'error',
			'after'
		],
		'padded-blocks': [
			'error',
			'never'
		],
		'quote-props': [
			'error',
			'as-needed'
		],
		semi: [
			'error',
			'always'
		],
		'semi-spacing': 'off',
		'sort-vars': 'off',
		'space-before-blocks': [
			'error',
			'always'
		],
		'space-before-function-paren': [
			'error',
			{
				anonymous: 'never',
				named: 'never',
				asyncArrow: 'always'
			}
		],
		'space-in-parens': [
			'error',
			'never'
		],
		'space-infix-ops': [
			'error',
			{
				int32Hint: false
			}
		],
		'space-unary-ops': [
			'error',
			{
				words: true,
				nonwords: false
			}
		],
		'line-comment-position': [
			'error',
			{
				position: 'above'
			}
		],
		'spaced-comment': [
			'error',
			'always',
			{
				line: {
					markers: [
						'/'
					],
					exceptions: [
						'-',
						'+'
					]
				},
				block: {
					markers: [
						'!'
					],
					exceptions: [
						'*'
					],
					balanced: true
				}
			}
		],
		'multiline-comment-style': 'off',
		'unicode-bom': 'off',
		'wrap-regex': 'error',
		'arrow-parens': [
			'error',
			'always'
		],
		'arrow-spacing': [
			'error',
			{
				before: true,
				after: true
			}
		],
		'constructor-super': 'error',
		'generator-star-spacing': [
			'error',
			{
				before: false,
				after: true
			}
		],
		'no-class-assign': 'error',
		'no-confusing-arrow': 'error',
		'no-const-assign': 'error',
		'no-dupe-class-members': 'error',
		'no-duplicate-imports': 'error',
		'no-new-symbol': 'error',
		'no-restricted-imports': 'off',
		'no-this-before-super': 'error',
		'no-useless-computed-key': 'error',
		'no-useless-constructor': 'error',
		'no-useless-rename': 'error',
		'no-var': 'error',
		'object-shorthand': 'error',
		'prefer-arrow-callback': 'error',
		'prefer-const': 'error',
		'prefer-reflect': 'off',
		'prefer-rest-params': 'error',
		'prefer-spread': 'error',
		'prefer-template': 'error',
		'require-yield': 'error',
		'sort-keys': 'off',
		'sort-imports': ['error', {
			ignoreCase: false,
			ignoreDeclarationSort: false,
			ignoreMemberSort: false,
			memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
			allowSeparatedGroups: false
		}],
		'template-curly-spacing': [
			'error',
			'never'
		],
		'yield-star-spacing': [
			'error',
			'after'
		],
		'no-template-curly-in-string': 'off',
		'no-else-return': 'off',
		'no-useless-escape': 'error',
		'consistent-return': 'off',
		'no-await-in-loop': 'off',
		'no-plusplus': 'off',
		'global-require': 'off',
		'no-global-assign': 'error',
		'arrow-body-style': [
			'error',
			'always'
		],
		'no-param-reassign': [
			'error',
			{
				props: false
			}
		],
		'one-var': [
			'error',
			'never'
		],
		'no-console': 'off',
		'wrap-iife': [
			'error',
			'any'
		],
		'comma-dangle': [
			'error',
			{
				arrays: 'ignore',
				objects: 'ignore',
				imports: 'ignore',
				exports: 'ignore',
				functions: 'ignore'
			}
		],
		'func-names': 'off',
		quotes: [
			'error',
			'single',
			{
				allowTemplateLiterals: true
			}
		],
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
		'jsdoc/valid-types': 1
	}
}];
