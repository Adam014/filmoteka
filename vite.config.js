import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	build: {
		target: 'es2019', // or 'es2020' if you need slightly more modern features
		rollupOptions: {
			output: {
				format: 'esm' // Ensure ES module output
			}
		}
	},
	optimizeDeps: {
		include: ['lodash'] // Pre-bundle lodash for compatibility
	}
};

export default config;
