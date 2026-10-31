<script>
	import ListenGame from '#lib/components/ListenGame.svelte';
	import MovieGuess from '#lib/components/MovieGuess.svelte';
	import { createMatcher } from '#lib/games/fuzzy.js';
	import { HITS } from '#lib/games/hits.js';

	const matchHit = createMatcher(
		HITS,
		(hit) => hit.title,
		(hit) => hit.artist
	);
	const searchHits = (query) =>
		matchHit(query).map((hit) => ({ id: hit.id, title: hit.title, label: hit.artist }));

	const describe = (answer) => ({
		heading: answer.title,
		note: answer.artist,
		image: answer.artwork
	});
</script>

<ListenGame
	game="earworm"
	title="Earworm"
	lead="Five hits a day, from easy to legend. Name each one from a tenth of a second."
	closeNote="Right artist, though."
	{describe}
>
	{#snippet picker(submit)}
		<MovieGuess
			onpick={submit}
			placeholder="Song or artist"
			label="Guess the song"
			local={searchHits}
			empty="No song here matches that."
			up
		/>
	{/snippet}
</ListenGame>
