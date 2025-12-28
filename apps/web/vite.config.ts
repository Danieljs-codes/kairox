import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import createSvgSpritePlugin from 'vite-plugin-svg-sprite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		tsconfigPaths(),
		tanstackRouter({
			routeToken: 'layout',
			indexToken: 'page',
		}),
		react({
			babel: {
				plugins: ['babel-plugin-react-compiler'],
			},
		}),
		createSvgSpritePlugin({
			exportType: 'react',
			include: '**/components/icons/*.svg',
		}),
	],
	server: {
		port: 3001,
		host: true,
	},
});
