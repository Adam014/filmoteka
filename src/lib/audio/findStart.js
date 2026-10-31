const BLOCK = 0.25;
const MAX_START = 15;
const WINDOW = 20;

/**
 * Picks where to start a clip we know nothing about. The early songs start on the clip's fullest
 * stretch, which is usually the hook, and the hard ones on its quietest stretch that still has
 * something to hear. Falls back to the top of the clip if it can't be read.
 */
export async function findStart(src, tier) {
	try {
		const data = await (await fetch(src)).arrayBuffer();
		const context = new OfflineAudioContext(1, 1, 44100);
		const samples = (await context.decodeAudioData(data)).getChannelData(0);
		const size = Math.floor(BLOCK * 44100);
		const blocks = [];
		for (let at = 0; at + size < samples.length; at += size) {
			let sum = 0;
			for (let index = at; index < at + size; index += 8) sum += samples[index] ** 2;
			blocks.push(Math.sqrt(sum / (size / 8)));
		}
		const windows = blocks
			.slice(0, Math.floor(MAX_START / BLOCK) + 1)
			.map(
				(_, at) => blocks.slice(at, at + WINDOW).reduce((sum, value) => sum + value, 0) / WINDOW
			);
		const peak = Math.max(...windows);
		const audible = windows
			.map((level, at) => ({ level, at }))
			.filter(({ level, at }) => level >= peak * 0.25 && blocks[at] >= peak * 0.15);
		if (!audible.length) return 0;
		const ordered = audible.sort((a, b) => a.level - b.level);
		return (tier >= 3 ? ordered[0] : ordered.at(-1)).at * BLOCK;
	} catch {
		return 0;
	}
}
