const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Tilts an element towards the pointer and exposes the position for a soft highlight. */
export function tilt(node, { max = 7 } = {}) {
	if (!finePointer() || reducedMotion()) return;

	let frame = 0;
	const onmove = (event) => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			const box = node.getBoundingClientRect();
			const x = (event.clientX - box.left) / box.width;
			const y = (event.clientY - box.top) / box.height;
			node.style.setProperty('--rx', `${(0.5 - y) * max}deg`);
			node.style.setProperty('--ry', `${(x - 0.5) * max}deg`);
			node.style.setProperty('--gx', `${x * 100}%`);
			node.style.setProperty('--gy', `${y * 100}%`);
		});
	};
	const onleave = () => {
		cancelAnimationFrame(frame);
		node.style.setProperty('--rx', '0deg');
		node.style.setProperty('--ry', '0deg');
	};

	node.addEventListener('pointermove', onmove);
	node.addEventListener('pointerleave', onleave);
	return {
		destroy() {
			cancelAnimationFrame(frame);
			node.removeEventListener('pointermove', onmove);
			node.removeEventListener('pointerleave', onleave);
		}
	};
}

/** Lets a mouse drag a horizontal scroller, with momentum, without breaking clicks on its links. */
export function dragScroll(node) {
	if (!finePointer()) return;

	let startX = 0;
	let startLeft = 0;
	let lastX = 0;
	let velocity = 0;
	let pressed = false;
	let dragged = false;
	let glide = 0;

	const onmove = (event) => {
		if (!pressed) return;
		const distance = event.clientX - startX;
		if (!dragged && Math.abs(distance) < 6) return;
		if (!dragged) {
			dragged = true;
			node.classList.add('dragging');
		}
		velocity = Math.max(-40, Math.min(40, lastX - event.clientX));
		lastX = event.clientX;
		node.scrollLeft = startLeft - distance;
	};

	const onup = () => {
		if (!pressed) return;
		pressed = false;
		window.removeEventListener('pointermove', onmove);
		window.removeEventListener('pointerup', onup);
		if (!dragged) return;

		// Scroll snapping stays off until the glide ends, or it would fight the momentum.
		const step = () => {
			velocity *= 0.92;
			node.scrollLeft += velocity;
			if (Math.abs(velocity) > 0.5) glide = requestAnimationFrame(step);
			else node.classList.remove('dragging');
		};
		if (reducedMotion()) node.classList.remove('dragging');
		else glide = requestAnimationFrame(step);
	};

	const ondown = (event) => {
		if (event.button !== 0 || event.pointerType !== 'mouse') return;
		cancelAnimationFrame(glide);
		node.classList.remove('dragging');
		pressed = true;
		dragged = false;
		startX = lastX = event.clientX;
		startLeft = node.scrollLeft;
		velocity = 0;
		window.addEventListener('pointermove', onmove);
		window.addEventListener('pointerup', onup);
	};

	// A drag that ends on a card must not also open it.
	const onclick = (event) => {
		if (dragged) {
			event.preventDefault();
			event.stopPropagation();
			dragged = false;
		}
	};
	const ondragstart = (event) => event.preventDefault();

	node.addEventListener('pointerdown', ondown);
	node.addEventListener('click', onclick, true);
	node.addEventListener('dragstart', ondragstart);
	return {
		destroy() {
			cancelAnimationFrame(glide);
			window.removeEventListener('pointermove', onmove);
			window.removeEventListener('pointerup', onup);
			node.removeEventListener('pointerdown', ondown);
			node.removeEventListener('click', onclick, true);
			node.removeEventListener('dragstart', ondragstart);
		}
	};
}

/**
 * Children rise into place one after another when the element scrolls into view.
 * Anything already on screen stays put, so server-rendered content never flashes.
 */
export function stagger(node) {
	if (reducedMotion() || node.getBoundingClientRect().top < innerHeight) return;

	[...node.children].forEach((child, index) => {
		/** @type {HTMLElement} */ (child).style.setProperty('--i', String(Math.min(index, 10)));
	});
	node.classList.add('stagger');

	const observer = new IntersectionObserver(
		([entry]) => {
			if (!entry.isIntersecting) return;
			node.classList.add('stagger-in');
			observer.disconnect();
		},
		{ rootMargin: '0px 0px -8% 0px' }
	);
	observer.observe(node);
	return { destroy: () => observer.disconnect() };
}

/** Exposes the pointer position, so hover light can follow it across a list of items. */
export function spotlight(node) {
	if (!finePointer()) return;

	const onmove = (event) => {
		for (const child of node.children) {
			const box = child.getBoundingClientRect();
			child.style.setProperty('--sx', `${event.clientX - box.left}px`);
			child.style.setProperty('--sy', `${event.clientY - box.top}px`);
		}
	};
	node.addEventListener('pointermove', onmove);
	return { destroy: () => node.removeEventListener('pointermove', onmove) };
}

export function focusOnMount(node) {
	node.focus({ preventScroll: true });
}

/** A short tap on phones that support it. */
export function buzz(ms = 10) {
	navigator.vibrate?.(ms);
}

const CONFETTI = ['#ffc53d', '#4cc38a', '#7cc0ff', '#cdb1ff', '#f5f5f6'];

/** A quick burst from the middle of the screen for the moment you win. */
export function celebrate(count = 44) {
	if (reducedMotion()) return;
	for (let index = 0; index < count; index++) {
		const piece = document.createElement('span');
		const angle = Math.random() * Math.PI * 2;
		const reach = 160 + Math.random() * Math.min(innerWidth, innerHeight) * 0.42;
		Object.assign(piece.style, {
			position: 'fixed',
			zIndex: '90',
			top: '45%',
			left: '50%',
			width: '8px',
			height: '14px',
			borderRadius: '2px',
			background: CONFETTI[index % CONFETTI.length],
			pointerEvents: 'none'
		});
		document.body.append(piece);
		piece
			.animate(
				[
					{ transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
					{
						transform: `translate(${Math.cos(angle) * reach}px, ${Math.sin(angle) * reach + 140}px) rotate(${Math.random() * 720}deg)`,
						opacity: 0
					}
				],
				{ duration: 900 + Math.random() * 500, easing: 'cubic-bezier(0.15, 0.7, 0.3, 1)' }
			)
			.finished.finally(() => piece.remove());
	}
}
