import { normalizeList } from '#lib/media.js';
import { resolveRegion } from '#lib/region.js';
import { featuredMovies, onlyUpcoming, popularActors } from '#lib/server/catalog.js';
import { gameTiles } from '#lib/server/games.js';
import { tmdbList } from '#lib/server/tmdb.js';
import { listPublicUsers } from '#lib/server/users.js';

export async function load({ url, request, cookies }) {
	const query = url.searchParams.get('region');
	const region = resolveRegion({
		query,
		cookie: cookies.get('region'),
		geo: request.headers.get('x-vercel-ip-country'),
		acceptLanguage: request.headers.get('accept-language')
	});
	if (query) {
		cookies.set('region', region, {
			path: '/',
			maxAge: 60 * 60 * 24 * 365,
			sameSite: 'lax',
			httpOnly: true
		});
	}

	const [trendingRaw, nowPlaying, upcoming, topMovies, topSeries, actors, users, games] =
		await Promise.all([
			tmdbList('/trending/movie/week'),
			tmdbList('/movie/now_playing', { region }),
			tmdbList('/movie/upcoming', { region }),
			tmdbList('/movie/top_rated'),
			tmdbList('/tv/top_rated'),
			popularActors(),
			listPublicUsers(),
			gameTiles()
		]);

	const trending = normalizeList(trendingRaw);

	return {
		region,
		games,
		featured: await featuredMovies(trending),
		trending,
		nowPlaying: normalizeList(nowPlaying),
		upcoming: onlyUpcoming(normalizeList(upcoming)),
		topMovies: normalizeList(topMovies),
		topSeries: normalizeList(topSeries, 'tv'),
		actors: actors.map((person) => ({
			id: person.id,
			name: person.name,
			profile_path: person.profile_path ?? null
		})),
		users: users.slice(0, 24).map(({ id, name, avatar }) => ({ id, name, avatar }))
	};
}
