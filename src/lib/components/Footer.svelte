<footer>
	<div class="container inner">
		<p>
			Film data and images from
			<a class="link" href="https://www.themoviedb.org" rel="noopener noreferrer" target="_blank">
				TMDB</a
			>. This product uses the TMDB API but is not endorsed or certified by TMDB.
		</p>
		<nav aria-label="Footer">
			<a href="/settings/changelog">Changelog</a>
			<a href="https://github.com/Adam014/filmoteka" rel="noopener noreferrer" target="_blank">
				GitHub
			</a>
		</nav>
	</div>
</footer>

<style>
	footer {
		margin-top: auto;
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
		gap: 20px;
	}

	nav a:hover {
		color: var(--text);
	}
</style>
