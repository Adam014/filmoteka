import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	build: {
		target: 'es2019', // Ensure compatibility
		rollupOptions: {
			output: {
				format: 'esm' // Force ES module output
			}
		}
	},
	optimizeDeps: {
		include: ['lodash'] // Pre-bundle lodash
	}
};

export default config;
