// Gate di autenticazione server-side per le pagine amministrative (admin.html, preventivi-manager.html).
// Le credenziali NON stanno qui: vanno impostate come variabili d'ambiente su Netlify
// (Site settings > Environment variables): ADMIN_USER, ADMIN_PASS.
// Senza quelle due variabili configurate, l'accesso resta bloccato di default (fail-closed).

export default async (request, context) => {
  const user = Netlify.env.get("ADMIN_USER");
  const pass = Netlify.env.get("ADMIN_PASS");

  if (!user || !pass) {
    return new Response("Area riservata non configurata: contattare l'amministratore.", {
      status: 503,
    });
  }

  const authHeader = request.headers.get("authorization") || "";
  const expected = "Basic " + btoa(`${user}:${pass}`);

  if (authHeader !== expected) {
    return new Response("Autenticazione richiesta.", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Area riservata SKAPPA"',
      },
    });
  }

  return context.next();
};
