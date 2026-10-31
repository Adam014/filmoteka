<script>
	import ListenGame from '#lib/components/ListenGame.svelte';
	import MovieGuess from '#lib/components/MovieGuess.svelte';
	import { yearOf } from '#lib/format.js';
	import { imageUrl } from '#lib/media.js';

	const describe = (answer) => ({
		heading: [answer.title, yearOf(answer.date)].filter(Boolean).join(', '),
		note: `${answer.track} by ${answer.artist}`,
		image: answer.backdrop_path ? imageUrl(answer.backdrop_path, 'w780') : null,
		href: `/movie/${answer.id}`,
		hrefLabel: 'View film'
	});
</script>

<ListenGame
	game="soundtrack"
	title="Soundtrack"
	lead="Five film themes a day, from easy to legend. Name each one from a second of its music."
	{describe}
>
	{#snippet picker(submit)}
		<MovieGuess onpick={submit} placeholder="Which film is this from?" up />
	{/snippet}
</ListenGame>
