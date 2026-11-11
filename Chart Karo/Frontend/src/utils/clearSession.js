export function clearSession() {
  ["user", "token", "accessToken", "refreshToken"].forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0].trim();
    if (!name) return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
  });
}
