import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	build: {
		target: 'es2019', // Ensure compatibility
		commonjsOptions: {
			transformMixedEsModules: true
		},
		rollupOptions: {
			output: {
				format: 'esm' // Force ES module output
			}
		}
	},
	optimizeDeps: {
		include: ['lodash', 'country-to-iso'] // Pre-bundle these dependencies
	}
};

export default config;
