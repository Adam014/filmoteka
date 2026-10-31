<script>
	import { toast } from '../state/toast.svelte.js';
	import Icon from './Icon.svelte';

	let { text, primary = false } = $props();
	let copied = $state(false);

	async function share() {
		try {
			if (navigator.share && matchMedia('(pointer: coarse)').matches) {
				await navigator.share({ text });
				return;
			}
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 1800);
		} catch (error) {
			if (error.name !== 'AbortError') toast.error("Sharing didn't work in this browser.");
		}
	}
</script>

<button class="btn" class:btn-primary={primary} type="button" onclick={share}>
	{#if copied}<Icon name="check" size={18} />{/if}
	{copied ? 'Copied' : 'Share'}
</button>
