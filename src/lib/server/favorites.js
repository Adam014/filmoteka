import { normalizeMedia } from '../media.js';
import { adminDb } from './supabase.js';

/** Reads the favorites of any user. Files live under the owner's e-mail, so this stays on the server. */
export async function readFavorites(email) {
	const admin = adminDb();
	if (!admin || !email) return [];

	const { data: files, error } = await admin.storage
		.from('favorites')
		.list(email, { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });
	if (error) {
		console.error('Listing favorites failed:', error.message);
		return [];
	}

	const items = await Promise.all(
		(files ?? [])
			.filter((file) => file.name.endsWith('.json'))
			.map(async (file) => {
				const { data, error: downloadError } = await admin.storage
					.from('favorites')
					.download(`${email}/${file.name}`);
				if (downloadError) return null;
				try {
					const saved = JSON.parse(await data.text());
					const media = normalizeMedia(saved.data ?? saved);
					return media && { ...media, fileName: file.name };
				} catch {
					return null;
				}
			})
	);
	return items.filter(Boolean);
}
