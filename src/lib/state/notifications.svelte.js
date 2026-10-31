import { supabase } from '../supabase.js';

const REFRESH_MS = 60 * 1000;

export const notifications = $state({ items: [] });

let timer = null;
let currentUserId = null;

async function refresh() {
	const userId = currentUserId;
	if (!userId) return;

	const { data, error } = await supabase
		.from('notifications')
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.limit(50);

	if (currentUserId !== userId) return;
	if (error) {
		console.error('Loading notifications failed:', error.message);
		return;
	}
	notifications.items = data ?? [];
}

function refreshWhenVisible() {
	if (document.visibilityState === 'visible') refresh();
}

/** Loads notifications for the signed-in user and keeps them fresh while the tab is in use. */
export function syncNotifications(user) {
	const userId = user?.id ?? null;
	if (userId === currentUserId) return;

	currentUserId = userId;
	notifications.items = [];
	clearInterval(timer);
	document.removeEventListener('visibilitychange', refreshWhenVisible);
	if (!userId || !supabase) return;

	refresh();
	timer = setInterval(refreshWhenVisible, REFRESH_MS);
	document.addEventListener('visibilitychange', refreshWhenVisible);
}

export function unreadCount() {
	return notifications.items.filter((item) => !item.read).length;
}

export async function markRead(id) {
	const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
	if (error) return false;
	notifications.items = notifications.items.map((item) =>
		item.id === id ? { ...item, read: true } : item
	);
	return true;
}

export async function markAllRead() {
	const { error } = await supabase
		.from('notifications')
		.update({ read: true })
		.eq('user_id', currentUserId)
		.eq('read', false);
	if (error) return false;
	notifications.items = notifications.items.map((item) => ({ ...item, read: true }));
	return true;
}
