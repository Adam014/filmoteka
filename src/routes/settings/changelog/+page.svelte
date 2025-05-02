<script>
	export let data;
	import { formatDate } from '../../../lib/utils';
	import ErrorPage from '../../../components/ErrorPage.svelte';

	const commits = data?.commits?.data;
	const error = data?.error;
	const errorStatus = data?.status;

	function retryLoad() {
		window.location.reload();
	}
</script>

<svelte:head>
	<title>Settings | Changelog</title>
</svelte:head>

{#if error}
	<ErrorPage error={error} code={errorStatus} retryFn={retryLoad} />
{:else}
	<div class="changelog-container">
		<div class="changelog-header">
			<h2>Filmoteka Changelog</h2>
			<div class="header-decoration"></div>
		</div>

		<div class="changelog">
			<section class="released">
				<div class="section-header">
					<h3>Released Changes</h3>
					<div class="section-divider"></div>
				</div>
				<div class="commits-list">
					{#each commits as commit, index}
						<a href={commit.html_url} target="_blank" rel="noopener noreferrer">
							<div class="commit-card" key={index}>
								<div class="commit-image">
									<img src={commit.committer.avatar_url} alt={`${commit.commit.author.name}'s avatar`} />
								</div>
								<div class="commit-content">
									<div class="commit-title">
										<h4>{commit.commit.message.split('\n')[0]}</h4>
									</div>
									{#if commit.commit.message.split('\n').length > 1}
										<div class="commit-description">
											<p>{commit.commit.message.split('\n').slice(1).join('\n')}</p>
										</div>
									{/if}
									<div class="commit-meta">
										<span class="commit-author">
											<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" class="icon">
												<path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zm.847-8.145a2.502 2.502 0 1 0-1.694 0C5.471 8.261 4 9.775 4 11c0 .395.145.995 1 .995h6c.855 0 1-.6 1-.995 0-1.225-1.471-2.74-3.153-3.145z" />
											</svg>
											{commit.commit.author.name}
										</span>
										<span class="commit-date">
											<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" class="icon">
												<path d="M4.5 0a.5.5 0 0 0-.5.5v.5h-2A1.5 1.5 0 0 0 .5 2.5v12A1.5 1.5 0 0 0 2 16h12a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 14 1h-2V.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5V1h-4V.5a.5.5 0 0 0-.5-.5h-1zM2 2h12v1.5H2V2zm0 3h12v9H2V5z" />
											</svg>
											{formatDate(commit.commit.committer.date)}
										</span>
										<span class="commit-sha">
											<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" class="icon">
												<path d="M7.5 5.5a2 2 0 0 0-4 0V7H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1.5V5.5a2 2 0 0 0-4 0V7h-1V5.5zm2.5 1.5v-1.5a.5.5 0 0 0-1 0V7h1zm-5-1.5A.5.5 0 0 1 6 5V7H5V5.5z" />
											</svg>
											{commit.sha.slice(0, 7)}
										</span>
									</div>
								</div>
							</div>
						</a>
					{/each}
				</div>
			</section>

			<section class="upcoming">
				<div class="section-header">
					<h3>Upcoming Features</h3>
					<div class="section-divider"></div>
				</div>
				<div class="upcoming-card-container">
					<div class="completed-card">
						<div class="status-icon completed">✓</div>
						<span>Add Top 10 Actors to root</span>
					</div>
					<div class="completed-card">
						<div class="status-icon completed">✓</div>
						<span>Add Account settings</span>
					</div>
					<div class="completed-card">
						<div class="status-icon completed">✓</div>
						<span>Add users profiles to root</span>
					</div>
					<div class="upcoming-card">
						<div class="status-icon pending">⦾</div>
						<span>Add a new feed, more like twitter</span>
					</div>
					<div class="upcoming-card">
						<div class="status-icon pending">⦾</div>
						<span>Add movies you might like to /profile</span>
					</div>
					<div class="completed-card">
						<div class="status-icon completed">✓</div>
						<span>Add you can add users as friends</span>
					</div>
					<div class="completed-card">
						<div class="status-icon completed">✓</div>
						<span>Fix notifications, that it works across devices</span>
					</div>
					<div class="upcoming-card">
						<div class="status-icon pending">⦾</div>
						<span>Add options to review films</span>
					</div>
					<div class="upcoming-card">
						<div class="status-icon pending">⦾</div>
						<span>Implement series</span>
					</div>
					<div class="upcoming-card">
						<div class="status-icon pending">⦾</div>
						<span>Implement games</span>
					</div>
					<div class="completed-card">
						<div class="status-icon completed">✓</div>
						<span>Bring back when we dont have the film in db, fetch the data, dont save it anywhere</span>
					</div>
					<div class="completed-card">
						<div class="status-icon completed">✓</div>
						<span>Implement more top eveyrthing to root from TMDB</span>
					</div>
					<div class="completed-card">
						<div class="status-icon completed">✓</div>
						<span>Implement top movies to root</span>
					</div>
					<div class="completed-card">
						<div class="status-icon completed">✓</div>
						<span>Add localization so on root the region changes with the localization of the user</span>
					</div>
					<div class="completed-card">
						<div class="status-icon completed">✓</div>
						<span>Be able to login only anon</span>
					</div>
					<div class="completed-card">
						<div class="status-icon completed">✓</div>
						<span>Add notification button to navbar</span>
					</div>
					<div class="completed-card">
						<div class="status-icon completed">✓</div>
						<span>Implementing unfollow button to Following</span>
					</div>
					<div class="upcoming-card">
						<div class="status-icon pending">⦾</div>
						<span>Improve anon mode</span>
					</div>
					<div class="upcoming-card">
						<div class="status-icon pending">⦾</div>
						<span>Graphic redesign</span>
					</div>
					<div class="completed-card">
						<div class="status-icon completed">✓</div>
						<span>Hide anons from user list</span>
					</div>
				</div>
			</section>
		</div>
	</div>
{/if}

<style>
	.changelog-container {
		max-width: 100%;
		width: 100%;
		margin: 0 auto;
		padding: 2rem 2.5rem 4rem;
		color: #e1e4e8;
		box-sizing: border-box;
	}

	.changelog-header {
		margin-bottom: 2.5rem;
		position: relative;
	}

	.changelog-header h2 {
		font-size: 2.5rem;
		font-weight: 600;
		margin: 0;
		padding: 0 0 0.5rem 0;
		color: #f8f8f8;
	}

	.header-decoration {
		height: 4px;
		width: 120px;
		background: linear-gradient(90deg, #6e40c9 0%, #8a5cf6 100%);
		border-radius: 2px;
		margin-top: 0.5rem;
	}

	.section-header {
		margin-bottom: 1.5rem;
		position: relative;
	}

	.section-header h3 {
		font-size: 1.75rem;
		font-weight: 500;
		margin: 0;
		padding: 0 0 0.5rem 0;
		color: #f8f8f8;
	}

	.section-divider {
		height: 3px;
		width: 80px;
		background: linear-gradient(90deg, #6e40c9 0%, #8a5cf6 50%, transparent 100%);
		border-radius: 2px;
	}

	.changelog {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 2.5rem;
	}

	.released, .upcoming {
		width: 100%;
	}

	/* Commit cards styling */
	.commit-card {
		background-color: #1e1e2e;
		border: 1px solid #30363d;
		border-radius: 6px;
		padding: 1.25rem;
		margin-bottom: 1rem;
		display: flex;
		transition: all 0.2s ease;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
		width: 100%;
		box-sizing: border-box;
	}

	.commit-card:hover {
		background-color: #252537;
		border-color: #8a5cf6;
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
	}

	.commit-image {
		margin-right: 1rem;
		flex-shrink: 0;
	}

	.commit-image img {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		border: 2px solid #30363d;
	}

	.commit-content {
		flex-grow: 1;
		min-width: 0; /* Prevent flex items from overflowing */
	}

	.commit-title h4 {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		color: #f8f8f8;
		word-break: break-word;
	}

	.commit-description {
		margin-bottom: 0.75rem;
		font-size: 0.9rem;
		color: #8b949e;
	}

	.commit-description p {
		margin: 0;
		white-space: pre-line;
		word-break: break-word;
	}

	.commit-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		font-size: 0.85rem;
		color: #8b949e;
	}

	.commit-author, .commit-date, .commit-sha {
		display: flex;
		align-items: center;
	}

	.icon {
		margin-right: 0.35rem;
	}

	/* Feature cards styling */
	.upcoming-card-container {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 1rem;
	}

	.upcoming-card, .completed-card {
		background-color: #1e1e2e;
		border: 1px solid #30363d;
		border-radius: 6px;
		padding: 1.25rem;
		display: flex;
		align-items: flex-start;
		transition: all 0.2s ease;
		height: 100%;
		box-sizing: border-box;
	}

	.upcoming-card:hover, .completed-card:hover {
		background-color: #252537;
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
	}

	.completed-card {
		border-left: 3px solid #238636;
	}

	.upcoming-card {
		border-left: 3px solid #da7622;
	}

	.status-icon {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 0.75rem;
		font-weight: bold;
		flex-shrink: 0;
	}

	.status-icon.completed {
		background-color: rgba(35, 134, 54, 0.15);
		color: #238636;
	}

	.status-icon.pending {
		background-color: rgba(218, 118, 34, 0.15);
		color: #da7622;
	}

	a {
		text-decoration: none;
		color: inherit;
		display: block;
		width: 100%;
	}

	/* Responsive adjustments */
	@media (min-width: 1440px) {
		.changelog-container {
			max-width: 90%;
		}
	}

	@media (min-width: 1200px) and (max-width: 1439px) {
		.changelog-container {
			max-width: 95%;
		}
	}

	@media (max-width: 1200px) {
		.changelog {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 992px) {
		.upcoming-card-container {
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		}
		
		.changelog-container {
			padding: 2rem 1.5rem 3rem;
		}
	}

	@media (max-width: 768px) {
		.upcoming-card-container {
			grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		}

		.changelog-header h2 {
			font-size: 2rem;
		}

		.section-header h3 {
			font-size: 1.5rem;
		}
		
		.changelog-container {
			padding: 1.5rem 1rem 2.5rem;
		}
	}

	@media (max-width: 576px) {
		.changelog-container {
			padding: 1rem 0.75rem 2rem;
		}

		.upcoming-card-container {
			grid-template-columns: 1fr;
		}

		.commit-meta {
			flex-direction: column;
			gap: 0.5rem;
		}
		
		.commit-card {
			padding: 1rem;
		}
		
		.changelog-header h2 {
			font-size: 1.75rem;
		}
		
		.header-decoration {
			width: 80px;
		}
	}
</style>
