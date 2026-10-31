import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// Environment variables are only exposed through src/env.js. Keeping Vite's own prefix on
	// something unused guarantees that VITE_* secrets can never be inlined via import.meta.env.
	envPrefix: 'FILMOTEKA_INLINE_',
	plugins: [sveltekit({ adapter: adapter({ runtime: 'bun1.x' }) })]
});
