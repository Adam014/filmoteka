/** One song a day from each of these, easiest first. */
export const LISTEN_TIERS = ['Easy', 'Medium', 'Hard', 'Expert', 'Legend'];

/** How many of the songs keep a streak alive. */
export const LISTEN_PASS = 3;

export const passStatus = (score) => (score >= LISTEN_PASS ? 'won' : 'lost');
