<script>
	export let data;
	import { formatDate } from '../../../lib/utils';

	const commits = data?.commits.data;
</script>

<svelte:head>
	<title>Settings | Changelog</title>
</svelte:head>

<div class="changelog-container">
	<h2>Filmoteka Changelog</h2>
	<div class="changelog">
		<div class="released">
			<h3>Released</h3>
			{#each commits as commit, index}
				<a href={commit.html_url} target="”_blank”">
					<div class="commit-card" key={index}>
						<div class="commit-image">
							<img src={commit.committer.avatar_url} alt="committer" />
						</div>
						<div class="commit-comment">
							<h5>Commiter: {commit.commit.author.name}</h5>
							<p class="commit-message">{commit.commit.message}</p>
							<p class="commit-date">{formatDate(commit.commit.committer.date)}</p>
						</div>
					</div>
				</a>
			{/each}
		</div>
		<div class="upcoming">
			<h3>Upcoming</h3>
			<div class="upcoming-card-container">
				<div class="completed-card">&#10004; Add Top 10 Actors to root</div>
				<div class="completed-card">&#10004; Add Account settings</div>
				<div class="completed-card">&#10004; Add users profiles to root</div>
				<div class="upcoming-card">❔ Add a new feed, more like twitter</div>
				<div class="upcoming-card">❔ Add movies you might like to /profile</div>
				<div class="completed-card">&#10004; Add you can add users as friends</div>
				<div class="completed-card">&#10004; Fix notifications, that it works across devices</div>
				<div class="upcoming-card">❔ Add options to review films</div>
				<div class="upcoming-card">❔ Implement series</div>
				<div class="upcoming-card">❔ Implement games</div>
				<div class="completed-card">
					&#10004; Bring back when we dont have the film in db, fetch the data, dont save it
					anywhere
				</div>
				<div class="completed-card">&#10004; Implement more top eveyrthing to root from TMDB</div>
				<div class="completed-card">&#10004; Implement top movies to root</div>
				<div class="upcoming-card">
					❔ Sync everything with TMDB, try to use everything from tmdb
				</div>
				<div class="completed-card">
					&#10004; Add localization so on root the region changes with the localization of the user
				</div>
				<div class="completed-card">&#10004; Be able to login only anon</div>
				<div class="completed-card">&#10004; Add notification button to navbar</div>
				<div class="completed-card">&#10004; Implementing unfollow button to Following</div>
				<div class="upcoming-card">❔ Implement series into library</div>
				<div class="upcoming-card">❔ Improve anon mode</div>
				<div class="completed-card">&#10004; Hide anons from user list</div>
			</div>
		</div>
	</div>
</div>

<style>
	.commit-comment {
		padding-top: 4px;
	}

	.upcoming-card-container {
		display: grid;
		grid-template-columns: repeat(3, 2fr);
		gap: 1rem;
		padding-top: 10px;
	}

	.upcoming-card,
	.completed-card {
		padding: 15px;
		height: auto;
		background-color: #f9cb43;
		color: black;
		border-radius: 15px;
	}

	.completed-card {
		background-color: #a0c878;
	}

	.changelog-container {
		padding-bottom: 30px;
	}

	a {
		text-decoration: none;
		color: white;
	}

	.commit-message {
		width: 100%;
		text-wrap: wrap;
	}

	.commit-date {
		font-weight: lighter;
		font-size: 0.9rem;
	}

	h2,
	h3 {
		padding-left: 3rem;
		font-size: 2.5rem;
	}

	h2 {
		text-decoration: underline;
	}

	h3 {
		font-size: 1.8rem;
		text-align: left;
		padding-left: 0;
	}

	.commit-card {
		width: 90%;
		height: auto;
		padding: 15px;
		margin: 10px 10px 10px 0;
		background-color: #222;
		display: flex;
		border-radius: 10px;
	}

	.commit-image img {
		height: 4rem;
		width: 4rem;
		border-radius: 30%;
	}

	.commit-image {
		padding: 0 30px;
		display: flex;
		align-items: center;
	}

	.changelog {
		display: flex;
		justify-content: space-between;
		width: 90%;
		padding-left: 3rem;
	}

	.released,
	.upcoming {
		width: 50%;
		padding-top: 1rem;
		display: grid;
		justify-content: center;
	}

	.upcoming {
		display: block;
		padding-left: 20px;
	}

	@media screen and (max-width: 1024px) {
		.upcoming-card-container {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media screen and (max-width: 768px) {
		.upcoming-card-container {
			grid-template-columns: repeat(1, 1fr);
		}

		.changelog {
			display: grid;
			justify-content: center;
		}

		.released {
			width: 95%;
		}

		.upcoming {
			width: 87%;
		}

		h2 {
			font-size: 1.7rem;
			padding: 30px;
		}
	}
</style>
