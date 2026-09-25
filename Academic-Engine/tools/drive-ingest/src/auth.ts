import http from 'http';
import { exec } from 'child_process';
import { getConfig, updateEnvVariables } from './config';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const REDIRECT_PORT = parseInt(process.env.OAUTH_PORT || '8085', 10);
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/oauth2callback`;

/**
 * Returns a valid OAuth access token, automatically refreshing it if needed.
 * If no refresh token exists, triggers the local interactive auth flow.
 */
export async function getValidAccessToken(): Promise<string> {
  let config = getConfig();

  if (!config.googleClientId || !config.googleClientSecret) {
    throw new Error(
      `Faltan credenciales en tu archivo .env.local!\n` +
      `Por favor define GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET antes de continuar.`
    );
  }

  if (!config.googleRefreshToken) {
    await runInteractiveAuth();
    config = getConfig();
  }

  // Refresh access token via native fetch (bypassing gaxios bug)
  const bodyParams = new URLSearchParams({
    client_id: config.googleClientId,
    client_secret: config.googleClientSecret,
    refresh_token: config.googleRefreshToken,
    grant_type: 'refresh_token'
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: bodyParams.toString()
  });

  const data = await res.json() as any;
  if (!data.access_token) {
    if (data.error === 'invalid_grant') {
      console.warn('[OAuth 2.0] El refresh token expiró o fue revocado. Reautenticando...');
      await runInteractiveAuth();
      return getValidAccessToken();
    }
    throw new Error(`Error al refrescar token de Google: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

/**
 * Runs ephemeral local webserver to authenticate user in browser and save refresh token.
 */
export async function runInteractiveAuth(): Promise<string> {
  const config = getConfig();

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', config.googleClientId);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES.join(' '));
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  console.log('\n[OAuth 2.0] Iniciando asistente de autenticación en navegador...');
  console.log(`[OAuth 2.0] Servidor local escuchando en http://localhost:${REDIRECT_PORT}`);

  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        if (!req.url) return;
        const parsedUrl = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);

        if (parsedUrl.pathname === '/oauth2callback') {
          const code = parsedUrl.searchParams.get('code');
          const error = parsedUrl.searchParams.get('error');

          if (error) {
            console.error(`[OAuth 2.0] Error recibido de Google: ${error}`);
            if (!res.headersSent) {
              res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(`<h2>❌ Error de autenticación: ${error}</h2><p>Puedes cerrar esta ventana.</p>`);
            }
            server.close();
            return reject(new Error(`OAuth error: ${error}`));
          }

          if (code) {
            console.log('[OAuth 2.0] Código recibido. Obteniendo tokens...');
            const bodyParams = new URLSearchParams({
              code,
              client_id: config.googleClientId,
              client_secret: config.googleClientSecret,
              redirect_uri: REDIRECT_URI,
              grant_type: 'authorization_code'
            });

            const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: bodyParams.toString()
            });

            const tokens = await tokenRes.json() as any;

            if (tokens.error) {
              throw new Error(`Google OAuth error: ${tokens.error} - ${tokens.error_description || ''}`);
            }

            if (tokens.refresh_token) {
              updateEnvVariables({ GOOGLE_REFRESH_TOKEN: tokens.refresh_token });
              console.log('[OAuth 2.0] ✓ GOOGLE_REFRESH_TOKEN guardado con éxito en .env.local!');
            }

            if (!res.headersSent) {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(`
                <html>
                  <body style="font-family: -apple-system, sans-serif; text-align: center; padding-top: 50px;">
                    <h1 style="color: #10b981;">✓ Autenticación Exitosa con Google Drive</h1>
                    <p>Las credenciales se han guardado de forma segura en tu configuración.</p>
                    <p>Ya puedes cerrar esta ventana y regresar a la terminal.</p>
                  </body>
                </html>
              `);
            }

            server.close();
            resolve(tokens.access_token);
          }
        }
      } catch (err: any) {
        console.error('[OAuth 2.0] Error:', err.message || err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end(`Error: ${err}`);
        }
        server.close();
        reject(err);
      }
    });

    server.listen(REDIRECT_PORT, () => {
      const urlStr = authUrl.toString();
      console.log(`[OAuth 2.0] Si el navegador no se abre automáticamente, entra a este enlace:\n`);
      console.log(`🔗 ${urlStr}\n`);

      exec(`open "${urlStr}"`, (err) => {
        if (err) {
          console.log('[OAuth 2.0] Abre el enlace arriba en tu navegador.');
        }
      });
    });

    server.on('error', (err) => {
      reject(new Error(`No se pudo iniciar el servidor local en el puerto ${REDIRECT_PORT}: ${err.message}`));
    });
  });
}
