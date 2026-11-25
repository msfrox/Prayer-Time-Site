// pray.sakina.lk: static files first (exact paths, as GitHub Pages serves them); only a path with no file comes here.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/')) url.pathname += 'index.html';
    else if (!/\.[a-z0-9]+$/i.test(url.pathname)) url.pathname += '.html';
    else return new Response('Not found', { status: 404 });
    return env.ASSETS.fetch(new Request(url, request));
  },
};
