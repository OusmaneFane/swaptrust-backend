/**
 * MySQL 8 (caching_sha2_password) : sans TLS, le client doit pouvoir récupérer la clé RSA
 * du serveur, sinon erreur « RSA public key is not available client side » + pool timeout.
 */
export function mysqlConnectionUrl(url: string): string {
  if (!/^mysql:\/\//i.test(url)) return url;
  if (/[?&]allowPublicKeyRetrieval=/i.test(url)) return url;
  return url.includes('?') ? `${url}&allowPublicKeyRetrieval=true` : `${url}?allowPublicKeyRetrieval=true`;
}
