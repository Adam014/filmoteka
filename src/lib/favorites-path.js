/** Movies keep their historic `<id>.json` name. Series get a prefix, as ids overlap across types. */
export function favoriteFileName(media) {
	if (media.fileName) return media.fileName;
	return media.type === 'tv' ? `tv-${media.id}.json` : `${media.id}.json`;
}

export function favoritePayload(media) {
	const data = { ...media, media_type: media.type };
	delete data.fileName;
	return { id: media.id, data };
}
