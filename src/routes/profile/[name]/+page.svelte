<script>
    import { supabase } from '../../../lib/db/supabaseClient';
    import Loader from '../../../components/Loader.svelte';
    import MovieCard from '../../../components/MovieCard.svelte';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { formatDate } from "../../../lib/utils.js";

    let profileUser = null;
    let favoriteMovies = [];
    let loading = true;

    let params;
    $: $page, params = $page.params;

    onMount(async () => {
        loading = true;
        const displayName = params.name;

        try {
            // Fetch all users
            const { data, error } = await supabase.auth.admin.listUsers();
            if (error) {
                console.error('Error fetching users:', error);
                loading = false;
                return;
            }

            // Access the 'users' array and find the user by display name
            const users = data?.users || [];
            profileUser = users.find(user => user.user_metadata?.display_name === displayName);

            if (!profileUser) {
                console.error('User not found');
                loading = false;
                return;
            }

            // Fetch favorite movies for the profile user
            const { data: files, error: listError } = await supabase.storage
                .from('favorites')
                .list(profileUser.email);

            if (listError) {
                console.error('Error listing favorites:', listError);
                loading = false;
                return;
            }

            if (files.length > 0) {
                const moviePromises = files.map(async (file) => {
                    const { data: fileData, error: downloadError } = await supabase.storage
                        .from('favorites')
                        .download(`${profileUser.email}/${file.name}`);

                    if (downloadError) {
                        console.error(`Error fetching file ${file.name}:`, downloadError);
                        return null;
                    }

                    if (fileData) {
                        const text = await fileData.text();
                        try {
                            const parsedMovie = JSON.parse(text);
                            return parsedMovie; // Ensure this matches what MovieCard expects
                        } catch (parseError) {
                            console.error(`Error parsing JSON for ${file.name}:`, parseError);
                            return null;
                        }
                    }
                });

                favoriteMovies = (await Promise.all(moviePromises)).filter(Boolean);
            } else {
                console.log('No favorite movies found.');
            }
        } catch (err) {
            console.error('Error in onMount:', err);
        } finally {
            loading = false;
        }
    });
</script>

<svelte:head>
    <title>Profile | {profileUser?.user_metadata?.display_name || 'User'}</title>
</svelte:head>

{#if loading}
    <Loader />
{:else if profileUser}
    <div class="container">
        <div class="profile-container">
            <h1>Profile</h1>
            <div>
                {#if profileUser.user_metadata?.avatar_url}
                    <img
                        src={profileUser.user_metadata.avatar_url}
                        alt="Profile Picture"
                        class="profile-picture"
                    />
                {:else}
                    <span class="placeholder-icon">👤</span>
                {/if}
                <div class="profile-details">
                    <p>Email: <b>{profileUser.email}</b></p>
                    <p>Username: <b>{profileUser.user_metadata.display_name || 'Not set'}</b></p>
                    <p>Created at: <b>{formatDate(profileUser?.created_at)}</b></p>
                    <p>Last sign in: <b>{formatDate(profileUser?.last_sign_in_at)}</b></p>
                </div>
            </div>
        </div>
        <div class="favorites-container">
            {#if favoriteMovies.length > 0}
                <h2>Favorite Movies ({favoriteMovies.length})</h2>
                <div class="favorite-movies">
                    {#each favoriteMovies as movie (movie.id)}
                        <MovieCard movie={movie.data} />
                    {/each}
                </div>
            {:else}
                <p>No favorite movies found.</p>
            {/if}
        </div>
    </div>
{:else}
    <p>User not found.</p>
{/if}

<style>
    .container {
        display: flex;
        flex-direction: row;
        padding: 2rem 3rem;
        gap: 2rem;
    }

    .profile-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        background-color: #222;
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        max-width: 300px;
        text-align: center;
        color: #eee;
    }

    .profile-container h1 {
        font-size: 2.5rem;
        color: #fff;
        margin-bottom: 1.5rem;
    }

    .favorites-container {
        width: 90%;
        background-color: #222;
        height: auto;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .favorite-movies {
        display: flex;
        flex-wrap: wrap;
    }

    .profile-picture {
        width: 150px;
        height: 150px;
        border-radius: 50%;
        object-fit: cover;
        border: 4px solid #7a1cac;
        margin-bottom: 1.5rem;
        transition: transform 0.3s ease;
    }

    .profile-details {
        font-size: 1rem;
        line-height: 1.6;
        width: 100%;
    }

    .profile-details p {
        margin: 0.5rem 0;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
    }

    .profile-details p b {
        text-decoration: underline;
        margin-left: 0.5rem;
        white-space: nowrap;
    }

    .placeholder-icon {
        font-size: 6rem;
        color: #555;
        margin-bottom: 1.5rem;
    }

    h2 {
        font-size: 1.8rem;
    }

    p {
        font-size: 1rem;
    }

    @media (max-width: 1024px) {
        .container {
            flex-direction: column;
            align-items: center;
            padding: 2rem 1rem;
        }

        .profile-container,
        .favorites-container {
            max-width: 90%;
            width: 100%;
            text-align: center;
        }

        .profile-picture {
            width: 150px;
            height: 150px;
        }

        h1,
        h2 {
            font-size: 2rem;
        }

        p {
            font-size: 0.9rem;
        }
    }

    @media (max-width: 768px) {
        .container {
            padding: 1rem;
        }

        .favorite-movies {
            justify-content: center;
        }

        .profile-container {
            padding: 1.5rem;
        }

        .profile-container h1 {
            font-size: 2rem;
        }

        .profile-picture {
            width: 120px;
            height: 120px;
        }

        .profile-details {
            font-size: 0.9rem;
        }

        h1,
        h2 {
            font-size: 1.8rem;
        }

        p {
            font-size: 0.85rem;
        }
    }

    @media (max-width: 480px) {
        .profile-picture {
            width: 100px;
            height: 100px;
        }

        h1,
        h2 {
            font-size: 1.5rem;
        }

        p {
            font-size: 0.8rem;
        }

        .favorite-movies {
            gap: 0.5rem;
        }
    }
</style>
