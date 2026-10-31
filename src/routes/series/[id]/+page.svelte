<script>
	import MediaDetail from '#lib/components/MediaDetail.svelte';

	let { data } = $props();
</script>

{#key data.series.id}
	<MediaDetail item={data.series} />
{/key}
