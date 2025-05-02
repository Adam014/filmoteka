import { getCommits } from '../../../lib/utils.js';

export async function load() {
	try {
		const data = await getCommits();

		if (!data) {
			throw new Error('Failed to load changelog data');
		}

		return { commits: { data } };
	} catch (error) {
		return {
			status: 500,
			error: error.message || 'Failed to load changelog data'
		};
	}
}
