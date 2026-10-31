<script>
	const PATHS = {
		search: ['m21 21-4.34-4.34', 'M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z'],
		bell: [
			'M10.27 21a2 2 0 0 0 3.46 0',
			'M3.26 15.33A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.67C19.41 13.96 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.41 5.96-2.74 7.33'
		],
		close: ['M18 6 6 18', 'm6 6 12 12'],
		check: ['M20 6 9 17l-5-5'],
		play: ['M6 3.5v17a.5.5 0 0 0 .77.42l13.4-8.5a.5.5 0 0 0 0-.84L6.77 3.08A.5.5 0 0 0 6 3.5Z'],
		star: [
			'M11.52 2.3a.53.53 0 0 1 .95 0l2.31 4.68a2.12 2.12 0 0 0 1.6 1.16l5.17.76a.53.53 0 0 1 .3.9l-3.74 3.64a2.12 2.12 0 0 0-.61 1.88l.88 5.14a.53.53 0 0 1-.77.56l-4.62-2.43a2.12 2.12 0 0 0-1.97 0l-4.62 2.43a.53.53 0 0 1-.77-.56l.88-5.14a2.12 2.12 0 0 0-.61-1.88L1.86 9.8a.53.53 0 0 1 .29-.9l5.17-.76a2.12 2.12 0 0 0 1.6-1.16Z'
		],
		shuffle: [
			'm18 14 4 4-4 4',
			'm18 2 4 4-4 4',
			'M2 18h1.97a4 4 0 0 0 3.3-1.7l5.46-8.6a4 4 0 0 1 3.3-1.7H22',
			'M2 6h1.97a4 4 0 0 1 3.6 2.2',
			'M22 18h-6.04a4 4 0 0 1-3.3-1.8l-.36-.45'
		],
		menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
		chevron: ['m6 9 6 6 6-6'],
		left: ['m15 18-6-6 6-6'],
		right: ['m9 18 6-6-6-6'],
		arrow: ['M5 12h14', 'm12 5 7 7-7 7'],
		external: [
			'M15 3h6v6',
			'M10 14 21 3',
			'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'
		],
		logout: ['m16 17 5-5-5-5', 'M21 12H9', 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'],
		user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z'],
		settings: [
			'M20 7h-9',
			'M14 17H5',
			'M20 17a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
			'M10 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'
		]
	};

	let { name, size = 20, filled = false, label = undefined, class: className = '' } = $props();
</script>

<svg
	class={className}
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill={filled ? 'currentColor' : 'none'}
	stroke="currentColor"
	stroke-width="1.75"
	stroke-linecap="round"
	stroke-linejoin="round"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
>
	{#each PATHS[name] as d (d)}
		<path {d} />
	{/each}
</svg>
