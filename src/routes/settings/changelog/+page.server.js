import { cached } from '#lib/server/cache.js';
import { githubUrl } from '#lib/server/env.js';

async function fetchCommits() {
	try {
		const response = await fetch(`${githubUrl()}/repos/Adam014/filmoteka/commits?per_page=15`, {
			headers: { accept: 'application/vnd.github+json', 'user-agent': 'filmoteka' },
			signal: AbortSignal.timeout(8000)
		});
		if (!response.ok) return null;
		return await response.json();
	} catch {
		return null;
	}
}

export async function load() {
	const commits = await cached('changelog', 10 * 60 * 1000, fetchCommits);
	return {
		commits:
			commits?.map((commit) => {
				const [title, ...rest] = commit.commit.message.split('\n');
				return {
					sha: commit.sha.slice(0, 7),
					url: commit.html_url,
					title,
					body: rest.join('\n').trim(),
					author: commit.commit.author?.name ?? 'Unknown',
					date: commit.commit.author?.date ?? null
				};
			}) ?? null
	};
}
