import { gameTiles } from '#lib/server/games.js';

export async function load() {
	return { games: await gameTiles() };
}
