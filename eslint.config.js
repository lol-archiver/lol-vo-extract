/**
 * @file @nuogz/dynamic-eslint-config
 * @author DanoR
 * @version 5.4.1 2025.04.08 17
 * @requires globals
 * @requires @eslint/js
 * @requires @stylistic/eslint-plugin-js
 * @requires eslint-plugin-vue@^10 (optional)
 */


import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import globals from 'globals';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin-js';



const PKG = JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'package.json'), 'utf8'));

/** @type {Set<string>} */
const typesSource = new Set(PKG.typesSource instanceof Array ? PKG.typesSource : []);


/** @type {import('eslint').Linter.Config[]} */
const configs = [
	{
		name: 'ignore-dist',
		ignores: ['dist/**'],
	},
	{
		name: 'rule-base',
		plugins: { stylistic },
		rules: {
			...js.configs.recommended.rules,
			...stylistic.configs['disable-legacy'].rules,

			stylistic$indent: [2, 'tab', { ignoredNodes: ['TemplateLiteral', 'CallExpression>ObjectExpression:not(:first-child)'], ignoreComments: true, SwitchCase: 1 }],
			stylistic$linebreakStyle: [2, 'unix'],
			stylistic$quotes: [2, 'single', { avoidEscape: true, allowTemplateLiterals: true }],
			stylistic$commaDangle: [2, 'only-multiline'],
			semi: [2],
			noUnusedVars: [2, { vars: 'all', args: 'none' }],
			noVar: [2],
			noConsole: [2],
			noShadow: [2, { ignoreOnInitialization: true }],
			noConstantBinaryExpression: [0],
			requireAtomicUpdates: [2, { allowProperties: true }],
		},
	},
];



if(typesSource.has('node')) {
	configs.push({
		name: 'globals-node',
		languageOptions: { globals: globals.nodeBuiltin },
	});
}

if(typesSource.has('browser')) {
	if(!typesSource.has('node')) {
		configs.push({
			name: 'globals-browser',
			ignores: ['**/eslint.config.?(c|m)js'],
			languageOptions: { globals: globals.browser },
		});

		configs.push({
			name: 'globals-node-config',
			files: ['**/eslint.config.?(c|m)js'],
			languageOptions: { globals: globals.nodeBuiltin },
		});
	}
	else {
		const configGlobalsNode = configs.find(config => config.name == 'globals-node');

		configGlobalsNode.ignores = configGlobalsNode.ignores ?? [];
		configGlobalsNode.ignores.push(...[
			'**/*.pure.?(c|m)js',
			'src/**/*.?(c|m)js',
			'!src/**/*.{api,lib,map}.?(c|m)js',
			'!src/**/*.lib/**/*.?(c|m)js'
		]);

		configs.push({
			name: 'globals-browser',
			files: ['src/**/*.?(c|m)js'],
			ignores: [
				'**/*.pure.?(c|m)js',
				'src/**/*.{api,lib,map}.?(c|m)js',
				'src/**/*.lib/**/*.?(c|m)js'
			],
			languageOptions: { globals: globals.browser },
		});
	}
}



if(typesSource.has('extendscript-esnext')) {
	let globalsExtendScript = {};
	try {
		globalsExtendScript = (await import('./globals/extendscript.mjs')).default;
	}
	catch { void 0; }


	if(!typesSource.has('node')) {
		configs.push({
			name: 'globals-extendscript',
			ignores: ['**/eslint.config.?(c|m)js'],
			languageOptions: { globals: globalsExtendScript },
		});

		configs.push({
			name: 'globals-node-config',
			files: ['**/eslint.config.?(c|m)js'],
			languageOptions: { globals: globals.nodeBuiltin },
		});
	}
	else {
		const configGlobalsNode = configs.find(config => config.name == 'globals-node');

		configGlobalsNode.ignores = configGlobalsNode.ignores ?? [];
		configGlobalsNode.ignores.push(...[
			'src-extend/**/*.?(c|m)js',
		]);

		configs.push({
			name: 'globals-extendscript',
			files: ['src-extend/**/*.?(c|m)js'],
			languageOptions: { globals: globalsExtendScript },
		});
	}
}



if(typesSource.has('vue')) {
	const vue = (await import('eslint-plugin-vue')).default;

	const [, configVueBase, configVueEssential, configVueRecommendedStrongly, configVueRecommended] = vue.configs['flat/recommended'];

	configs.push({
		name: 'rule-vue',
		files: ['**/*.vue'],
		plugins: configVueBase.plugins,
		languageOptions: Object.assign({ globals: globals.browser }, configVueBase.languageOptions),
		processor: configVueBase.processor,
		rules: {
			...configVueBase.rules,
			...configVueEssential.rules,
			...configVueRecommendedStrongly.rules,
			...configVueRecommended.rules,

			stylistic$indent: [0],
			vue$htmlIndent: [2, 'tab'],
			vue$scriptIndent: [2, 'tab', { baseIndent: 0, ignores: ['ConditionalExpression'] }],
			vue$htmlSelfClosing: [1, { html: { void: 'always' } }],
			vue$maxAttributesPerLine: [0],
			vue$mustacheInterpolationSpacing: [0],
			vue$singlelineHtmlElementContentNewline: [0],
			vue$noVHtml: [0],
			vue$firstAttributeLinebreak: [0],
			vue$htmlClosingBracketNewline: [0],
			vue$multiWordComponentNames: [0],
		},
	});
}



const typesNodeConfig = [...typesSource.values()].filter(typeSource => typeSource.endsWith('@node-config'));
if(typesNodeConfig.length) {
	const configGlobalsBrowser = configs.find(config => config.name == 'globals-browser');


	let configGlobalsNodeConfig = configs.find(config => config.name == 'globals-node-config');
	if(!configGlobalsNodeConfig) {
		configs.push(configGlobalsNodeConfig = {
			name: 'globals-node-config',
			files: ['**/eslint.config.?(c|m)js'],
			languageOptions: { globals: globals.nodeBuiltin },
		});
	}


	if(configGlobalsBrowser) { configGlobalsBrowser.ignores = configGlobalsBrowser.ignores ?? []; }

	for(const typeNodeConfig of typesNodeConfig) {
		const [typePackage] = typeNodeConfig.split('@');

		configGlobalsNodeConfig.files.push(`**/${typePackage}.config.?(c|m)js`);

		configGlobalsBrowser?.ignores.push(`**/${typePackage}.config.?(c|m)js`);
	}
}



if(typesSource.has('userscript')) {
	configs.push({
		name: 'globals-node-userscript',
		files: ['*.?(c|m)js', 'lib/*.?(c|m)js'],
		languageOptions: { globals: globals.nodeBuiltin },
	});

	configs.push({
		name: 'globals-greasemonkey-userscript',
		ignores: ['**/eslint.config.?(c|m)js'],
		languageOptions: { globals: globals.greasemonkey },
	});

	for(const config of configs) {
		if(config.ignores?.includes('**/eslint.config.?(c|m)js')) {
			config.ignores.push('*.?(c|m)js', 'lib/*.?(c|m)js');
		}
	}
}


// debug configs
// console.debug(JSON.stringify(configs.map(({ name, files, ignores }) => ({ name, files, ignores })), null, '\t'));



for(const config of configs) {
	const rules = config.rules;
	if(typeof rules != 'object') { continue; }

	for(const key of Object.keys(rules)) {
		const [plugin, keyCamel] = key.includes('$') ? key.split('$') : [null, key];
		const keyKebab = `${plugin ? `${plugin}/` : ''}${keyCamel.split(/(?=[A-Z])/).join('-').toLowerCase()}`;

		if(keyKebab != key) {
			rules[keyKebab] = rules[key];

			delete rules[key];
		}
	}
}



export default configs;
