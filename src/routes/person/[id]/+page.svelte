<script>
    export let data;

    const person = data.person;
</script>

<svelte:head>
	<title>{person?.name} | Filmoteka</title>
</svelte:head>

<div class="container">
    <div class="person-title-container">
        <img src={'https://image.tmdb.org/t/p/w300' + person?.profile_path} alt={person?.name} />
        <div class="person-info">
            <h1>{person?.name} | {person?.imdb_id}</h1>
            <h3>{person?.birthday ? "born at " + new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(person.birthday)) + " in " + person?.place_of_birth : 'N/A'}</h3>
            <h3>{person?.deathday ? "died at " + new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(person.deathday)) : ""}</h3>
            <h3>{person?.known_for_department}</h3>
            <p>Gender: 
                {#if person?.gender === 1}
                  Female
                {:else if person?.gender === 2}
                  Male
                {:else if person?.gender === 3}
                  Non-binary
                {:else}
                  Not set / not specified
                {/if}
              </p>
        </div>
    </div>
    <p class="person-biography">{person?.biography}</p>

</div>

<style>
    .container{
        padding: 20px 0px 20px 40px;
    }

    .person-title-container{
        display: flex;
        justify-content: left;
    }
    .person-info{
        padding: 15px;
    }

    .person-biography{
        width: 80%;
        padding-top: 40px;
    }

    @media screen and (max-width: 800px) {
        .person-title-container{
            display: grid;
        }
        .person-title-container img{
            width: 100%;
            
        }
    }
</style>