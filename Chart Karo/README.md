# Chat Karo

Real-time chat app: email + social login, contacts, 1-to-1 and group chat with typing / delivered / seen
indicators, live location sharing, light & dark themes. React (Vite) + Express + Socket.io + MongoDB.

The backend also serves the built frontend, so the whole app deploys as **one service on one domain**
(this is what makes login cookies and websockets work reliably, including on Safari/iOS).

## Run locally

```bash
# 1. backend
cd Backend
cp .env.example .env        # fill MONGO_URI, JWT_SECRET, REFRESH_TOKEN_SECRET (set CLIENT_URL=http://localhost:5173, NODE_ENV=development)
npm install
npm run dev                 # http://localhost:3000

# 2. frontend (new terminal)
cd Frontend
npm install
npm run dev                 # http://localhost:5173
```

## Deploy (Render, free tier)

1. **Database** - create a free cluster on [MongoDB Atlas](https://cloud.mongodb.com). Create a database user, then
   *Network Access -> Add IP -> Allow access from anywhere (0.0.0.0/0)*. Copy the connection string (`MONGO_URI`).
2. **Push** this folder to a GitHub repository.
3. **Render** -> *New -> Blueprint* -> pick the repo. It reads `render.yaml` and asks for the secret values:
   - `MONGO_URI` - from step 1
   - `MAIL_USER` / `MAIL_PASSWORD` - for password-reset OTP emails (Gmail: enable 2-step verification, then create an *App password*)
   - social keys are optional - leave them empty and those buttons are hidden automatically
4. After the first deploy, open the service URL. Done. (`CLIENT_URL` / `SERVER_URL` default to Render's URL automatically.)

Manual setup instead of a blueprint: *New -> Web Service*, **Build** `npm run build`, **Start** `npm start`,
health check `/health`, and add the variables from `Backend/.env.example`.

> Free instances sleep after ~15 min idle, so the first request can take ~30 s. Use a paid plan or a keep-alive ping to avoid that.

### Social login callbacks (only if you enable them)
Register these redirect URLs in each provider console (replace the domain):

| Provider | Callback URL |
|---|---|
| Google | `https://YOUR-APP.onrender.com/auth/google/callback` |
| GitHub | `https://YOUR-APP.onrender.com/auth/github/callback` |
| Facebook | `https://YOUR-APP.onrender.com/auth/facebook/callback` |

### Frontend and backend on different domains (not recommended)
Host the frontend on e.g. Vercel and set `VITE_API_URL=https://your-api` at build time. On the backend set
`CLIENT_URL=https://your-frontend`, `COOKIE_SAMESITE=none`. Note Safari/iOS blocks third-party cookies, so login may fail there.

## Notes
- Live location is opt-in, shared only with your contacts, and stops when you leave the page. Browsers require HTTPS for geolocation (Render provides it).
- Required env vars: `MONGO_URI`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET` (server refuses to start without them).
