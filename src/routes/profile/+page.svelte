<script>
    import { goto } from "$app/navigation";
    import { user } from "../../stores/user";
    import { onMount } from "svelte";
    import toast from "svelte-french-toast";

    let currentUser;

    // Reactive subscription to user store
    $: if (currentUser !== undefined) {
        if (currentUser) {
            goto(`/profile/${currentUser.user_metadata.display_name}`);
        } else {
            goto("?page=1");
        }
    }

    // Subscribe to user store on mount
    onMount(() => {
        const unsubscribe = user.subscribe((value) => {
            currentUser = value;
        });

        return () => unsubscribe();
    });
</script>
