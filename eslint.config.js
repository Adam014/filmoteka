import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

export default [
	js.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		rules: {
			// External links and in-app links built from data are intentional here.
			'svelte/no-navigation-without-resolve': 'off',
			// Query strings built for a single fetch are never reactive state.
			'svelte/prefer-svelte-reactivity': 'off'
		}
	},
	{
		files: ['**/*.svelte.js'],
		languageOptions: { parserOptions: { parser: { js: 'espree' } } }
	},
	{
		ignores: ['.svelte-kit/', '.vercel/', 'build/', 'node_modules/']
	}
];
