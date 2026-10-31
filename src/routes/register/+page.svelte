<script>
	import { goto } from '$app/navigation';
	import AuthPage from '#lib/components/AuthPage.svelte';
	import { auth } from '#lib/state/auth.svelte.js';
	import { toast } from '#lib/state/toast.svelte.js';
	import { publicStorageUrl, supabase } from '#lib/supabase.js';
	import { USERNAME_RULE, friendlyAuthError, isGuest } from '#lib/user.js';

	const MAX_AVATAR_BYTES = 4 * 1024 * 1024;

	let email = $state('');
	let password = $state('');
	let username = $state('');
	let avatar = $state(null);
	let error = $state('');
	let busy = $state(false);
	let sentTo = $state('');

	// Guests stay here so they can upgrade to a real account.
	$effect(() => {
		if (auth.ready && auth.user && !isGuest(auth.user)) goto('/profile', { replace: true });
	});

	function pickAvatar(event) {
		const file = event.currentTarget.files?.[0] ?? null;
		error = '';
		if (file && !file.type.startsWith('image/')) {
			error = 'Please choose an image file.';
			event.currentTarget.value = '';
			return;
		}
		if (file && file.size > MAX_AVATAR_BYTES) {
			error = 'Please choose an image smaller than 4 MB.';
			event.currentTarget.value = '';
			return;
		}
		avatar = file;
	}

	async function usernameTaken(name) {
		try {
			const response = await fetch(`/api/username-available?name=${encodeURIComponent(name)}`);
			return !(await response.json()).available;
		} catch {
			return false;
		}
	}

	async function uploadAvatar() {
		if (!avatar) return { url: '', path: null };
		const extension = avatar.name.split('.').pop()?.toLowerCase() || 'png';
		const path = `public/${crypto.randomUUID()}/avatar.${extension}`;
		const { error: uploadError } = await supabase.storage.from('avatars').upload(path, avatar);
		if (uploadError)
			throw new Error("Your picture couldn't be uploaded. Try another or remove it.");
		return { url: publicStorageUrl('avatars', path), path };
	}

	async function signUp(event) {
		event.preventDefault();
		error = '';
		if (!supabase) {
			error = 'Sign-up is unavailable right now.';
			return;
		}

		const name = username.trim();
		if (!USERNAME_RULE.test(name)) {
			error =
				'Usernames need 2–30 characters: letters, numbers, dots, dashes or underscores, starting with a letter or number.';
			return;
		}

		busy = true;
		try {
			if (await usernameTaken(name)) {
				error = 'That username is taken. Please choose another.';
				return;
			}

			const uploaded = await uploadAvatar();
			const { data, error: signUpError } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: { display_name: name, avatar_url: uploaded.url },
					emailRedirectTo: `${location.origin}/login`
				}
			});

			// With confirmation on, an existing address is reported as a user without identities.
			const duplicate = data?.user && data.user.identities?.length === 0;
			if (signUpError || duplicate) {
				if (uploaded.path) await supabase.storage.from('avatars').remove([uploaded.path]);
				error = duplicate
					? 'An account with this email already exists.'
					: friendlyAuthError(signUpError);
				return;
			}

			if (data.session) {
				toast.success('Welcome to Filmoteka');
				await goto('/', { replace: true });
			} else {
				sentTo = email;
			}
		} catch (caught) {
			error = friendlyAuthError(caught);
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Sign up | Filmoteka</title>
</svelte:head>

{#if sentTo}
	<AuthPage
		title="Check your inbox"
		lede="We sent a confirmation link to {sentTo}. Open it to finish signing up."
	>
		<a class="btn btn-block" href="/login">Back to log in</a>
	</AuthPage>
{:else}
	<AuthPage
		title="Create your account"
		lede="Save favorites, follow people and keep your daily challenge streak across devices."
	>
		<form onsubmit={signUp}>
			<div class="field">
				<label for="username">Username</label>
				<input
					id="username"
					class="input"
					type="text"
					bind:value={username}
					autocomplete="username"
					required
				/>
			</div>
			<div class="field">
				<label for="email">Email</label>
				<input
					id="email"
					class="input"
					type="email"
					bind:value={email}
					autocomplete="email"
					required
				/>
			</div>
			<div class="field">
				<label for="password">Password</label>
				<input
					id="password"
					class="input"
					type="password"
					bind:value={password}
					minlength="6"
					autocomplete="new-password"
					required
				/>
				<p class="field-hint">At least 6 characters.</p>
			</div>
			<div class="field">
				<label for="avatar">Profile picture (optional)</label>
				<input id="avatar" class="file" type="file" accept="image/*" onchange={pickAvatar} />
			</div>
			{#if error}<p class="form-error" role="alert">{error}</p>{/if}
			<button class="btn btn-primary btn-block" type="submit" disabled={busy}>
				{busy ? 'Creating your account…' : 'Create account'}
			</button>
		</form>

		{#snippet footer()}
			<p>Already have an account? <a class="link" href="/login">Log in</a></p>
		{/snippet}
	</AuthPage>
{/if}

<style>
	.file {
		width: 100%;
		color: var(--text-muted);
		font-size: 0.9375rem;
	}

	.file::file-selector-button {
		min-height: 40px;
		margin-right: 12px;
		padding: 0 14px;
		background: none;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-md);
		color: var(--text);
		font: inherit;
		cursor: pointer;
	}
</style>
