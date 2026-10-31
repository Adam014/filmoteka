import { soundtrackPuzzle } from '#lib/server/dailyGames.js';
import { listenRoute } from '#lib/server/listenRoute.js';

export const { GET, POST } = listenRoute('soundtrack', soundtrackPuzzle, [1, 2, 4, 8, 12, 15]);
