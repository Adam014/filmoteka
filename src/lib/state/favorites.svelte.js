import { goto } from '$app/navigation';
import { page } from '$app/state';
import { favoriteFileName, favoritePayload } from '../favorites-path.js';
import { loginHref } from '../redirects.js';
import { supabase } from '../supabase.js';
import { isGuest } from '../user.js';
import { auth } from './auth.svelte.js';
import { toast } from './toast.svelte.js';

/** File names in the signed-in user's favorites folder. One listing serves every card on screen. */
export const favorites = $state({ names: [], loaded: false });

let loadedFor = null;

/** Keeps the list in step with the session. Safe to call on every auth change. */
export async function syncFavorites() {
	const user = auth.user;
	const email = user && !isGuest(user) ? user.email : null;
	if (email === loadedFor) return;

	loadedFor = email;
	favorites.names = [];
	favorites.loaded = false;
	if (!email || !supabase) return;

	const { data, error } = await supabase.storage.from('favorites').list(email, { limit: 1000 });
	if (loadedFor !== email) return;
	if (error) {
		console.error('Loading favorites failed:', error.message);
		return;
	}
	favorites.names = (data ?? []).map((file) => file.name);
	favorites.loaded = true;
}

export function isFavorite(media) {
	return favorites.names.includes(favoriteFileName(media));
}

export async function toggleFavorite(media) {
	const user = auth.user;
	if (!user) {
		toast.info('Log in to save your favorites.');
		await goto(loginHref(page.url.pathname + page.url.search));
		return;
	}
	if (isGuest(user)) {
		toast.info('Create an account to save your favorites.');
		await goto('/register');
		return;
	}

	const name = favoriteFileName(media);
	const path = `${user.email}/${name}`;
	const wasFavorite = favorites.names.includes(name);

	favorites.names = wasFavorite
		? favorites.names.filter((item) => item !== name)
		: [...favorites.names, name];

	const { error } = wasFavorite
		? await supabase.storage.from('favorites').remove([path])
		: await supabase.storage
				.from('favorites')
				.upload(path, JSON.stringify(favoritePayload(media)), {
					upsert: true,
					contentType: 'application/json'
				});

	if (error) {
		console.error('Updating favorites failed:', error.message);
		favorites.names = wasFavorite
			? [...favorites.names, name]
			: favorites.names.filter((item) => item !== name);
		toast.error("Your favorites couldn't be updated. Please try again.");
		return;
	}

	toast.success(wasFavorite ? `Removed “${media.title}”` : `Saved “${media.title}”`);
}
