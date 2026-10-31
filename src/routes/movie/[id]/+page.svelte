<script>
	import MediaDetail from '#lib/components/MediaDetail.svelte';

	let { data } = $props();
</script>

{#key data.movie.id}
	<MediaDetail item={data.movie} />
{/key}
