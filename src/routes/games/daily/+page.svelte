<script>
	import { supabase } from '$lib/db/supabaseClient';
	import { onMount } from 'svelte';

	let dailyChallenges = [];
	const colors = ['#a05cd5', '#2e073f', '#ad49e1', '#7a1cac', '#1a1a1a'];

	// Fetch all challenges
	async function fetchChallenges() {
		const { data, error } = await supabase
			.from('daily_challenge')
			.select('day, poster_path')
			.order('day', { ascending: true });

		if (error) {
			console.error('Error fetching challenges:', error);
			return [];
		}

		// Assign colors cyclically to the challenges
		return data.map((challenge, index) => ({
			...challenge,
			color: colors[index % colors?.length],
		}));
	}

	// Always populate challenges on load
	onMount(async () => {
		dailyChallenges = await fetchChallenges();
	});
</script>

<div class="daily-grid">
	{#each dailyChallenges as challenge}
		<a href={`/games/daily/day-${challenge.day}`}>
			<div
				class="daily-card"
				style="background-color: {challenge.color}"
			>
				<span class="day-number">{challenge.day}</span>
			</div>
		</a>
	{/each}
</div>

<style>
	.daily-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		padding: 20px;
		background-color: #1a1a1a;
		justify-content: flex-start;
	}

	.daily-grid a {
		text-decoration: none;
	}

	.daily-card {
		width: 8rem;
		height: 120px;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 12px;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
		color: #fff;
		font-size: 1.5rem;
		font-weight: bold;
		cursor: pointer;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.daily-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
	}

	.day-number {
		text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.6);
	}
</style>
