<script>
    import { user } from "../stores/user";
    import { onDestroy, onMount } from "svelte";
    import { supabase } from "../lib/db/supabaseClient"; 

    let currentUser = null; 
    let username;

    // For displaying our stats
    let totalFilmsCount = 0;
    let totalPersonsCount = 0;
    let totalCategoriesCount = 0;
    let releaseDateRange = "";

    // Subscribe to the user store
	const unsubscribe = user.subscribe((value) => {
        currentUser = value;
        username = value?.identities[0]?.identity_data?.display_name;
	});

	onDestroy(() => {
		unsubscribe();
	});

    onMount(async () => {
        try {
            // 1) Total films
            const { count: filmsCount, error: filmsError } = await supabase
                .from("films")
                .select("*", { count: "exact", head: true });
            if (filmsError) throw filmsError;
            totalFilmsCount = filmsCount || 0;

            // 2) Total persons
            const { count: personsCount, error: personsError } = await supabase
                .from("person_detailed")
                .select("*", { count: "exact", head: true });
            if (personsError) throw personsError;
            totalPersonsCount = personsCount || 0;

            // 3) Total distinct categories
            const { data: filmDetailedData, error: filmDetailedError } = await supabase
                .from("film_detailed")
                .select("genres");
            if (filmDetailedError) throw filmDetailedError;

            const genresSet = new Set();
            filmDetailedData.forEach((row) => {
                row.genres?.forEach((genreObj) => {
                    genresSet.add(genreObj.name);
                });
            });
            totalCategoriesCount = genresSet.size;

            // 4) Earliest-latest release (year-year)
            //    We'll do two queries, one for earliest, one for latest.
            const { data: earliest, error: earliestError } = await supabase
                .from("films")
                .select("release_date")
                .order("release_date", { ascending: true })
                .limit(1);
            if (earliestError) throw earliestError;

            const { data: latest, error: latestError } = await supabase
                .from("films")
                .select("release_date")
                .order("release_date", { ascending: false })
                .limit(1);
            if (latestError) throw latestError;

            // Convert these to Date objects and get the 4-digit year
            if (earliest && earliest[0]?.release_date && latest && latest[0]?.release_date) {
                const earliestYear = new Date(earliest[0].release_date).getFullYear();
                const latestYear = new Date(latest[0].release_date).getFullYear();
                releaseDateRange = `${earliestYear}-${latestYear}`;
            } else {
                releaseDateRange = "";
            }
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    });
</script>

<div class="root-container">
    <h1>Welcome {username ? username : "user"}!</h1>

    <div class="cards-container">
        <div class="card">
            <div class="card-title">Total Films</div>
            <div class="card-number">{totalFilmsCount}</div>
        </div>
        <div class="card">
            <div class="card-title">Total Actors/Directors</div>
            <div class="card-number">{totalPersonsCount}</div>
        </div>
        <div class="card">
            <div class="card-title">Total Categories</div>
            <div class="card-number">{totalCategoriesCount}</div>
        </div>
        <div class="card">
            <div class="card-title">Earliest-Latest Release</div>
            <div class="card-number">{releaseDateRange}</div>
        </div>
    </div>

    <div class="button-library">
        <a href="/library">
            <button>--> Go To Library --></button>
        </a>
    </div>
</div>

<style>
    .root-container {
        padding: 80px;
    }

    h1{
        padding: 50px 0px 50px 0px;
        font-size: 4rem;
    }

    .cards-container {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }

    .card {
        padding: 1rem;
        border: 1px solid #ccc;
    }

    .card-title {
        font-size: 1.5rem;
        margin-bottom: 0.25rem;
    }

    .card-number {
        font-size: 3rem;
        font-weight: bold;
    }

    .button-library{
        padding-top: 50px;
    }

    button{
        width: 100%;
        height: 5rem;
        background-color: transparent;
        border: 3px solid #a05cd5;
        color: white;
        font-size: 2rem;
        cursor: pointer;
    }

        
    @media (max-width: 600px) {
        .cards-container {
            grid-template-columns: 1fr;
        }
        button{
            font-size: 1.3rem;
        }
        h1{
            font-size: 2rem;
        }
    }
</style>