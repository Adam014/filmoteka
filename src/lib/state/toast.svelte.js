let nextId = 1;

export const toasts = $state({ items: [] });

function push(kind, message, duration = 4000) {
	if (toasts.items.some((item) => item.message === message)) return;
	const id = nextId++;
	toasts.items.push({ id, kind, message });
	setTimeout(() => dismiss(id), duration);
}

export function dismiss(id) {
	toasts.items = toasts.items.filter((item) => item.id !== id);
}

export const toast = {
	success: (message) => push('success', message),
	error: (message) => push('error', message, 6000),
	info: (message) => push('info', message)
};
