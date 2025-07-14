import { plugin } from 'bun';

plugin({
	name: 'sveltekit-env',

	setup(build) {
		build.module('$app/environment', () => {
			return {
				exports: {
					dev: false
				},
				loader: 'object'
			};
		});
		build.module('$env/dynamic/private', () => {
			return {
				exports: {
					env: {
						DATABASE_URL: 'http://localhost:5432'
					}
				},
				loader: 'object'
			};
		});
	}
});
