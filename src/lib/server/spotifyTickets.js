const MINUTE = 60 * 1000;
const tickets = new Map();

/** Carries a local login from the IP address Spotify returns to back over to `localhost`. */
export function issueTicket(tokens) {
	const ticket = crypto.randomUUID();
	tickets.set(ticket, { tokens, expires: Date.now() + MINUTE });
	return ticket;
}

/** A ticket works once. */
export function redeemTicket(ticket) {
	const entry = tickets.get(ticket);
	tickets.delete(ticket);
	return entry && entry.expires > Date.now() ? entry.tokens : null;
}
