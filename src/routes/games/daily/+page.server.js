import { todaysPosterDay } from '#lib/server/games.js';
import { error, redirect } from '@sveltejs/kit';

/** There is one poster a day, so this address always leads to today's. */
export async function load() {
	const day = await todaysPosterDay();
	if (!day) error(503, 'The game is unavailable right now.');
	redirect(307, `/games/daily/day-${day}`);
}
