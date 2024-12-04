import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores'; // To track the current route
import toast from 'svelte-french-toast';

// Create a writable store for the user
export const user = writable(null);

// Watch the page and user store
if (browser) {
    page.subscribe(($page) => {
        const isProfileRoute = $page.url?.pathname.startsWith('/profile/');
        
        user.subscribe((currentUser) => {
            // If on a /profile/ route and the user is not logged in, redirect with a toast
            if (isProfileRoute && !currentUser) {
                toast.error('You must be logged in to view profile pages.');
                goto('/?page=1');
            }
        });
    });
}
