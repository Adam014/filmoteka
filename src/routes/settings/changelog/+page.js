import { getCommits } from '../../../lib/utils.js';

export async function load() {
	const data = await getCommits();
	return { commits: { data } };
}
