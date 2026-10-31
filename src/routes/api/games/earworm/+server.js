import { HITS } from '#lib/games/hits.js';
import { earwormPuzzle } from '#lib/server/dailyGames.js';
import { listenRoute } from '#lib/server/listenRoute.js';

// Like Bandle: a wrong song by the right artist is worth knowing.
const sameArtist = (id, round) => HITS.find((hit) => hit.id === id)?.artist === round.answer.artist;

export const { GET, POST } = listenRoute(
	'earworm',
	earwormPuzzle,
	[0.1, 0.5, 2, 8, 15],
	sameArtist
);
