<footer>
	<div class="container inner">
		<p>
			Film data and images from
			<a class="link" href="https://www.themoviedb.org" rel="noopener noreferrer" target="_blank">
				TMDB</a
			>. This product uses the TMDB API but is not endorsed or certified by TMDB.
		</p>
		<nav aria-label="Footer">
			<a href="/library">Library</a>
			<a href="/mood">Mood</a>
			<a href="/swipe">Swipe</a>
			<a href="/games">Games</a>
			<a href="/settings/changelog">Changelog</a>
			<a href="https://github.com/Adam014/filmoteka" rel="noopener noreferrer" target="_blank">
				GitHub
			</a>
		</nav>
	</div>
</footer>

<style>
	footer {
		margin-top: clamp(48px, 7vw, 96px);
		border-top: 1px solid var(--line);
		color: var(--text-faint);
		font-size: 0.875rem;
	}

	.inner {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 12px 32px;
		padding-block: 24px;
	}

	p {
		max-width: 68ch;
	}

	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 20px;
	}

	nav a:hover {
		color: var(--text);
	}
</style>
