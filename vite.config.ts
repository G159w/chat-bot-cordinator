import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import Icons from 'unplugin-icons/vite';
import { defineConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';

export default defineConfig({
	optimizeDeps: {
		exclude: ['~icons']
	},
	plugins: [tailwindcss(), sveltekit(), devtoolsJson(), Icons({ compiler: 'svelte' })]
});
