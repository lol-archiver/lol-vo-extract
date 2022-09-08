const PKG = require('./package.json');
const typesSource = PKG.typesSource instanceof Array ? PKG.typesSource : [];


const parseKey = (raw, target) => {
	const key = raw.split(/(?=[A-Z])/).join('-').toLowerCase();

	if(key != raw) {
		target[key] = target[raw]; delete target[raw];
	}
};
const parseKeys = rc => {
	Object.keys(rc.rules).forEach(key => parseKey(key, rc.rules));

	return rc;
};


const rcSources = [];

if(typesSource.includes('browser')) {
	const rcBrower = {
		files: ['src/**/*.js'],
		excludedFiles: [],
		env: { es2022: true, node: false, browser: true },
	};
	rcSources.push(rcBrower);

	if(typesSource.includes('node-browser-share')) {
		rcBrower.env.node = true;
		rcBrower.excludedFiles.push('src/**/*.web.js', 'src/**/*.web/**/*.js');

		rcSources.push({
			files: ['src/**/*.web.js', 'src/**/*.web/**/*.js'],
			excludedFiles: [],
			env: { es2022: true, node: false, browser: true },
		});
	}
}

if(typesSource.includes('vue')) {
	rcSources.push({
		files: ['src/**/*.vue'],
		excludedFiles: [],
		env: { es2022: true, node: false, browser: true },
		extends: ['plugin:vue/vue3-recommended'],
		parserOptions: { ecmaVersion: 2022 },
		rules: {
			indent: [0],

			'vue/html-indent': [2, 'tab'],
			'vue/script-indent': [2, 'tab', { baseIndent: 1 }],
			'vue/max-attributes-per-line': [0],
			'vue/mustache-interpolation-spacing': [0],
			'vue/singleline-html-element-content-newline': [0],
			'vue/no-v-html': [0],
			'vue/require-v-for-key': [0],
			'vue/html-self-closing': [1, { html: { void: 'always' }, }],
			'vue/first-attribute-linebreak': [0],
			'vue/multi-word-component-names': [0],
		},
		globals: {
			defineProps: 'readonly',
			defineEmits: 'readonly',
			defineExpose: 'readonly',
			withDefaults: 'readonly',
		},
	});
}

if(typesSource.includes('node-mixin')) {
	rcSources.forEach(rcSource =>
		rcSource.excludedFiles.push(...['src/**/*.{api,lib,map}.js', 'src/**/*.lib/**/*.js'])
	);
}


const rcNode = parseKeys({
	root: true,
	ignorePatterns: ['dist'],
	env: { es2022: true, node: true },
	extends: ['eslint:recommended'],
	parserOptions: { sourceType: 'module' },
	rules: {
		indent: [2, 'tab', { ignoreComments: true, SwitchCase: 1 }],
		linebreakStyle: [2],
		quotes: [2, 'single', { allowTemplateLiterals: true }],
		semi: [2],
		noUnusedVars: [2, { vars: 'all', args: 'none' }],
		noVar: [2],
		noConsole: [2],
		requireAtomicUpdates: [1, { allowProperties: true }],
	},
	overrides: rcSources
});



module.exports = rcNode;
