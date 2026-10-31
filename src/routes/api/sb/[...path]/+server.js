import { gatewayDecision, userToken } from '#lib/server/gateway.js';
import { supabaseFallbackKey, supabaseServiceKey, supabaseUrl } from '#lib/server/env.js';

const FORWARDED_REQUEST_HEADERS = [
	'accept',
	'accept-profile',
	'cache-control',
	'content-profile',
	'content-type',
	'prefer',
	'range',
	'x-client-info',
	'x-supabase-api-version',
	'x-upsert'
];
const DROPPED_RESPONSE_HEADERS = ['content-encoding', 'content-length', 'transfer-encoding'];

/** @type {import('./$types').RequestHandler} */
async function handler({ request, params, url }) {
	const baseUrl = supabaseUrl();
	const key = supabaseServiceKey() || supabaseFallbackKey();
	if (!baseUrl || !key) return Response.json({ message: 'Unavailable' }, { status: 503 });

	const token = userToken(request.headers.get('authorization'));
	const decision = gatewayDecision({
		method: request.method,
		path: params.path,
		hasUserToken: Boolean(token),
		contentLength: Number(request.headers.get('content-length') ?? Infinity)
	});
	if (decision === 'forbidden') return Response.json({ message: 'Forbidden' }, { status: 403 });
	if (decision === 'unauthorized') {
		return Response.json({ message: 'Log in first' }, { status: 401 });
	}

	const headers = new Headers({ apikey: key });
	for (const name of FORWARDED_REQUEST_HEADERS) {
		const value = request.headers.get(name);
		if (value) headers.set(name, value);
	}
	if (token) headers.set('authorization', `Bearer ${token}`);
	else if (decision === 'avatar') headers.set('authorization', `Bearer ${key}`);

	const hasBody = !['GET', 'HEAD'].includes(request.method);
	try {
		const response = await fetch(`${baseUrl}/${params.path}${url.search}`, {
			method: request.method,
			headers,
			body: hasBody ? await request.arrayBuffer() : undefined,
			signal: AbortSignal.timeout(20000)
		});

		const responseHeaders = new Headers(response.headers);
		for (const name of DROPPED_RESPONSE_HEADERS) responseHeaders.delete(name);
		const empty = response.status === 204 || request.method === 'HEAD';
		return new Response(empty ? null : await response.arrayBuffer(), {
			status: response.status,
			headers: responseHeaders
		});
	} catch (error) {
		console.error('Supabase gateway:', error.message);
		return Response.json({ message: 'Unavailable' }, { status: 502 });
	}
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
export { handler as HEAD };
