<script>
	export let error = 'An unexpected error occurred';
	export let code = 500;
	export let retryFn = null;
</script>

<div class="error-container">
	<div class="cinema-container">
		<div class="screen">
			<div class="projector-light" />

			<div class="error-frame">
				<div class="frame-header">
					<div class="header-title">FILMOTEKA ERROR</div>
					<div class="frame-counter">{code}</div>
				</div>

				<div class="frame-content">
					<div class="clapperboard">
						<div class="clapperboard-top">
							<div class="clapper-stick" />
						</div>
						<div class="clapperboard-bottom">
							<div class="error-info">
								<span class="error-id">CODE: {code}</span>
								<span class="error-take">TAKE: NG</span>
								<span class="error-date">DATE: {new Date().toLocaleDateString('en-US')}</span>
							</div>
						</div>
					</div>

					<div class="error-message-container">
						<div class="error-symbol">
							<div class="error-badge">
								<svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor">
									<path
										d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
									/>
								</svg>
							</div>
						</div>
						<div class="error-text">
							<div class="error-title">Filming Error</div>
							<div class="error-description">{error}</div>
						</div>
					</div>

					<div class="director-notes">
						<div class="notes-header">
							<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
								<path
									d="M17 10H7v2h10v-2zm2-7h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"
								/>
							</svg>
							<span>Director's Notes</span>
						</div>
						<p>
							Failed to complete the scene. A technical issue has occurred. Please try again,
							otherwise we'll have to rewrite the script.
						</p>
					</div>

					<div class="error-actions">
						{#if retryFn}
							<button class="retry-button" on:click={retryFn}>
								<span class="button-icon">
									<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
										<path
											d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
										/>
									</svg>
								</span>
								<span class="button-text">Rewind and Try Again</span>
							</button>
						{/if}

						<a href="/" class="home-button">
							<span class="button-icon">
								<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
									<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
								</svg>
							</span>
							<span class="button-text">Back to Main Menu</span>
						</a>
					</div>
				</div>

				<div class="film-perforations left">
					{#each Array(20) as _, i}
						<div class="perforation" />
					{/each}
				</div>
				<div class="film-perforations right">
					{#each Array(20) as _, i}
						<div class="perforation" />
					{/each}
				</div>
			</div>
		</div>

		<div class="cinema-seats" />
	</div>

	<div class="film-reel left-reel">
		<div class="reel-center" />
		<div class="reel-film" />
	</div>

	<div class="film-reel right-reel">
		<div class="reel-center" />
		<div class="reel-film" />
	</div>

	<div class="spotlight left-light" />
	<div class="spotlight right-light" />
</div>

<style>
	.error-container {
		min-height: 100vh;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		/* background: radial-gradient(circle at 20% 50%, rgba(51, 16, 117, 0.8) 0%, rgba(13, 13, 13, 0.98) 100%); */
		color: #f8f8f8;
		position: relative;
		overflow: hidden;
		padding: 2rem 1rem;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	}

	/* Cinema container styling */
	.cinema-container {
		width: 100%;
		max-width: 1000px;
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		z-index: 5;
	}

	/* Screen styling */
	.screen {
		width: 100%;
		position: relative;
		overflow: visible;
		margin-bottom: 2rem;
		perspective: 1000px;
		perspective-origin: center top;
	}

	.projector-light {
		position: absolute;
		top: -200px;
		left: 50%;
		transform: translateX(-50%);
		width: 500px;
		height: 500px;
		/* background: radial-gradient(
            ellipse at center,
            rgba(255, 255, 255, 0.2) 0%,
            rgba(255, 255, 255, 0) 60%
        ); */
		filter: blur(10px);
		opacity: 0.7;
		pointer-events: none;
		z-index: 1;
	}

	/* Error frame styling */
	.error-frame {
		width: 100%;
		background: rgba(15, 15, 25, 0.95);
		border-radius: 12px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1) inset,
			0 -5px 10px rgba(255, 255, 255, 0.05) inset;
		overflow: hidden;
		position: relative;
		transform: perspective(1000px) rotateX(5deg);
		transform-origin: center top;
		z-index: 4;
	}

	.frame-header {
		background: linear-gradient(90deg, rgba(30, 30, 50, 0.9), rgba(50, 30, 90, 0.9));
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 2px solid rgba(138, 92, 246, 0.3);
	}

	.header-title {
		font-size: 1.2rem;
		font-weight: 600;
		letter-spacing: 1px;
		color: rgba(255, 255, 255, 0.9);
	}

	.frame-counter {
		font-family: 'Courier New', monospace;
		font-size: 1.3rem;
		font-weight: bold;
		color: #8a5cf6;
		background-color: rgba(0, 0, 0, 0.3);
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		border: 1px solid rgba(138, 92, 246, 0.3);
	}

	.frame-content {
		padding: 2.5rem;
		position: relative;
		z-index: 2;
	}

	/* Clapperboard styling */
	.clapperboard {
		width: 280px;
		height: 200px;
		position: relative;
		margin: 0 auto 3rem;
		transform: rotate(-3deg);
		filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.5));
	}

	.clapperboard-top {
		background: #111;
		height: 80px;
		border-radius: 8px 8px 0 0;
		position: relative;
		overflow: hidden;
		border: 2px solid #333;
		border-bottom: none;
		transform-origin: bottom center;
		animation: clap 0.5s ease-in-out 0.7s;
	}

	.clapper-stick {
		height: 100%;
		background: repeating-linear-gradient(-45deg, #fff, #fff 12px, #000 12px, #000 24px);
		width: 100%;
	}

	.clapperboard-top:before {
		content: '';
		position: absolute;
		width: 100%;
		height: 20px;
		background: #222;
		bottom: 0;
		left: 0;
		z-index: 2;
	}

	.clapperboard-bottom {
		background: #222;
		height: 120px;
		border-radius: 0 0 8px 8px;
		border: 2px solid #333;
		padding: 1.5rem 1rem;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.error-info {
		display: flex;
		flex-direction: column;
		color: #fff;
		font-family: 'Courier New', monospace;
		font-size: 1rem;
		line-height: 1.5;
	}

	.error-id,
	.error-take,
	.error-date {
		border-bottom: 1px dashed rgba(255, 255, 255, 0.2);
		padding-bottom: 6px;
		margin-bottom: 6px;
	}

	/* Error message styling */
	.error-message-container {
		background-color: rgba(25, 25, 35, 0.8);
		border-radius: 10px;
		padding: 1.5rem;
		margin-bottom: 2rem;
		display: flex;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(138, 92, 246, 0.2) inset;
		position: relative;
	}

	.error-message-container:before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, #6e40c9, #8a5cf6);
		border-radius: 10px 10px 0 0;
	}

	.error-symbol {
		flex-shrink: 0;
		margin-right: 1.5rem;
	}

	.error-badge {
		width: 60px;
		height: 60px;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #ff4550;
		border: 2px solid rgba(255, 69, 80, 0.3);
	}

	.error-text {
		flex-grow: 1;
	}

	.error-title {
		font-size: 1.4rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
		color: rgba(255, 255, 255, 0.95);
	}

	.error-description {
		font-size: 1.1rem;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.8);
	}

	/* Director notes styling */
	.director-notes {
		background-color: rgba(255, 255, 255, 0.05);
		border-left: 4px solid #8a5cf6;
		padding: 1.25rem 1.5rem;
		margin-bottom: 2.5rem;
		border-radius: 0 8px 8px 0;
		transform: rotate(-0.5deg);
		box-shadow: 2px 3px 10px rgba(0, 0, 0, 0.1);
	}

	.notes-header {
		display: flex;
		align-items: center;
		font-family: 'Courier New', monospace;
		font-size: 1.1rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
		color: rgba(255, 255, 255, 0.9);
	}

	.notes-header svg {
		margin-right: 0.5rem;
		color: #8a5cf6;
	}

	.director-notes p {
		font-family: 'Courier New', monospace;
		font-size: 0.95rem;
		line-height: 1.6;
		margin: 0;
		color: rgba(255, 255, 255, 0.8);
	}

	/* Action buttons */
	.error-actions {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.retry-button,
	.home-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 0.85rem 1.75rem;
		border-radius: 8px;
		font-weight: 600;
		font-size: 1.05rem;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		position: relative;
		overflow: hidden;
	}

	.retry-button {
		background: linear-gradient(135deg, #6e40c9 0%, #8a5cf6 100%);
		color: white;
		border: none;
	}

	.home-button {
		background-color: rgba(255, 255, 255, 0.06);
		color: #f8f8f8;
		border: 2px solid rgba(138, 92, 246, 0.3);
	}

	.retry-button:hover,
	.home-button:hover {
		transform: translateY(-4px);
		box-shadow: 0 7px 14px rgba(0, 0, 0, 0.15);
	}

	.retry-button:hover {
		background: linear-gradient(135deg, #7b4ee0 0%, #9b6df7 100%);
	}

	.home-button:hover {
		background-color: rgba(138, 92, 246, 0.1);
		border-color: rgba(138, 92, 246, 0.5);
	}

	.retry-button:active,
	.home-button:active {
		transform: translateY(-2px);
		box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
	}

	.button-icon {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Film perforations */
	.film-perforations {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 24px;
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		padding: 1rem 0;
		z-index: 1;
	}

	.left {
		left: 0;
	}

	.right {
		right: 0;
	}

	.perforation {
		width: 14px;
		height: 10px;
		background-color: #1a1a2a;
		border-radius: 1px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.5);
	}

	.left .perforation {
		margin-left: 8px;
		border-top-right-radius: 4px;
		border-bottom-right-radius: 4px;
	}

	.right .perforation {
		margin-right: 8px;
		border-top-left-radius: 4px;
		border-bottom-left-radius: 4px;
	}

	/* Film reels */
	.film-reel {
		position: absolute;
		width: 120px;
		height: 120px;
		border-radius: 50%;
		background: radial-gradient(circle at center, #333 0%, #222 60%, #111 100%);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.05) inset;
		z-index: 2;
	}

	.left-reel {
		top: 150px;
		left: -30px;
		transform: rotate(-5deg);
	}

	.right-reel {
		bottom: 150px;
		right: -30px;
		transform: rotate(5deg);
	}

	.reel-center {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 30%;
		height: 30%;
		background-color: #444;
		border-radius: 50%;
		border: 4px solid #333;
		box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.4) inset;
	}

	.reel-center:before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 35%;
		height: 35%;
		background-color: #111;
		border-radius: 50%;
	}

	.reel-film {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: repeating-conic-gradient(
			rgba(0, 0, 0, 0.6) 0deg,
			rgba(50, 50, 50, 0.6) 5deg,
			rgba(0, 0, 0, 0.6) 10deg,
			rgba(0, 0, 0, 0.6) 360deg
		);
		opacity: 0.8;
		mix-blend-mode: overlay;
		pointer-events: none;
	}

	/* Spotlights */
	.spotlight {
		position: absolute;
		width: 350px;
		height: 350px;
		border-radius: 50%;
		background: radial-gradient(
			circle at center,
			rgba(138, 92, 246, 0.15) 0%,
			rgba(138, 92, 246, 0.05) 30%,
			transparent 70%
		);
		filter: blur(20px);
		opacity: 0.8;
		z-index: 1;
		animation: spotlightPulse 6s infinite alternate ease-in-out;
	}

	.left-light {
		top: -100px;
		left: -100px;
		animation-delay: 0s;
	}

	.right-light {
		bottom: -100px;
		right: -100px;
		animation-delay: 2s;
	}

	/* Animations */
	@keyframes clap {
		0% {
			transform: rotateX(0deg);
		}
		50% {
			transform: rotateX(70deg);
		}
		100% {
			transform: rotateX(0deg);
		}
	}

	@keyframes spotlightPulse {
		0% {
			opacity: 0.3;
			transform: scale(0.9) translateY(10px);
		}
		100% {
			opacity: 0.6;
			transform: scale(1.1) translateY(0);
		}
	}

	/* Responsive styles */
	@media (max-width: 1200px) {
		.cinema-container {
			max-width: 900px;
		}
	}

	@media (max-width: 992px) {
		.cinema-container {
			max-width: 90%;
		}

		.film-reel {
			width: 100px;
			height: 100px;
		}

		.left-reel {
			left: -20px;
		}

		.right-reel {
			right: -20px;
		}

		.frame-content {
			padding: 2rem;
		}

		.clapperboard {
			width: 250px;
			height: 180px;
			margin-bottom: 2.5rem;
		}
	}

	@media (max-width: 768px) {
		.cinema-container {
			max-width: 100%;
		}

		.error-container {
			padding: 1.5rem 1rem;
		}

		.frame-content {
			padding: 2rem 1.5rem;
		}

		.error-frame {
			transform: perspective(1000px) rotateX(3deg);
		}

		.clapperboard {
			width: 220px;
			height: 160px;
			margin-bottom: 2rem;
		}

		.film-reel {
			display: none;
		}

		.error-message-container {
			flex-direction: column;
			align-items: center;
			text-align: center;
		}

		.error-symbol {
			margin-right: 0;
			margin-bottom: 1rem;
		}

		.error-badge {
			width: 50px;
			height: 50px;
		}

		.error-badge svg {
			width: 30px;
			height: 30px;
		}

		.error-title {
			font-size: 1.25rem;
		}

		.error-description {
			font-size: 1rem;
		}

		.spotlight {
			width: 250px;
			height: 250px;
		}
	}

	@media (max-width: 576px) {
		.error-container {
			padding: 1rem 0.5rem;
			min-height: calc(100vh - 20px);
		}

		.frame-header {
			padding: 0.75rem 1rem;
		}

		.frame-content {
			padding: 1.5rem 1rem;
		}

		.header-title {
			font-size: 1rem;
		}

		.frame-counter {
			font-size: 1.1rem;
			padding: 0.2rem 0.5rem;
		}

		.clapperboard {
			width: 180px;
			height: 140px;
			margin-bottom: 1.75rem;
		}

		.clapperboard-top {
			height: 60px;
		}

		.clapperboard-bottom {
			height: 80px;
			padding: 1rem 0.75rem;
		}

		.error-info {
			font-size: 0.85rem;
		}

		.error-message-container {
			padding: 1.25rem 1rem;
			margin-bottom: 1.5rem;
		}

		.error-title {
			font-size: 1.1rem;
			margin-bottom: 0.5rem;
		}

		.error-description {
			font-size: 0.95rem;
			line-height: 1.5;
		}

		.director-notes {
			padding: 1rem;
			margin-bottom: 1.5rem;
		}

		.notes-header {
			font-size: 1rem;
			margin-bottom: 0.5rem;
		}

		.director-notes p {
			font-size: 0.85rem;
			line-height: 1.5;
		}

		.error-actions {
			flex-direction: column;
			gap: 1rem;
		}

		.retry-button,
		.home-button {
			width: 100%;
			padding: 0.75rem 1rem;
			font-size: 0.95rem;
		}

		.film-perforations {
			width: 16px;
		}

		.left .perforation,
		.right .perforation {
			width: 10px;
			height: 8px;
		}

		.left .perforation {
			margin-left: 4px;
		}

		.right .perforation {
			margin-right: 4px;
		}

		.cinema-seats {
			height: 30px;
			margin-top: -10px;
		}
	}

	@media (max-width: 375px) {
		.error-container {
			padding: 0.75rem 0.5rem;
		}

		.clapperboard {
			width: 160px;
			height: 120px;
			margin-bottom: 1.5rem;
		}

		.clapperboard-top {
			height: 50px;
		}

		.clapperboard-bottom {
			height: 70px;
			padding: 0.75rem 0.5rem;
		}

		.error-info {
			font-size: 0.8rem;
			line-height: 1.4;
		}

		.error-id,
		.error-take,
		.error-date {
			padding-bottom: 4px;
			margin-bottom: 4px;
		}

		.frame-header {
			padding: 0.6rem 0.75rem;
		}

		.header-title {
			font-size: 0.9rem;
		}

		.frame-counter {
			font-size: 1rem;
			padding: 0.15rem 0.5rem;
		}

		.film-perforations {
			width: 12px;
		}

		.perforation {
			width: 8px;
			height: 6px;
		}

		.left .perforation {
			margin-left: 3px;
		}

		.right .perforation {
			margin-right: 3px;
		}

		.retry-button,
		.home-button {
			padding: 0.6rem 0.75rem;
			font-size: 0.9rem;
		}
	}

	/* Portrait orientation specific adjustments */
	@media (max-height: 700px) and (orientation: landscape) {
		.error-container {
			padding: 1rem 0.5rem;
		}

		.clapperboard {
			width: 180px;
			height: 140px;
			margin-bottom: 1.5rem;
		}

		.screen {
			margin-bottom: 1rem;
		}

		.error-frame {
			transform: perspective(1000px) rotateX(3deg);
		}

		.cinema-seats {
			height: 30px;
		}

		.director-notes {
			margin-bottom: 1.5rem;
		}
	}
</style>
