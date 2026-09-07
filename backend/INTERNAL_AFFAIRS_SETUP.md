# Internal Affairs deployment setup

The Internal Affairs module is isolated from the public site data. It connects to the `Internal_Affairs` MongoDB database using the existing `MONGO_URI`; MongoDB credentials must be allowed to create and use its collections.

Before the first backend start, provision these deployment secrets in `backend/.env` or the hosting provider's secret manager:

```env
IA_JWT_SECRET=use-a-unique-long-random-secret-here
IA_INITIAL_ADMIN_EMAIL=admin@example.com
IA_INITIAL_ADMIN_PASSWORD=use-a-unique-password-of-at-least-12-characters
IA_INITIAL_ADMIN_NAME=Internal Affairs Administrator
IA_INITIAL_ADMIN_ORGANISATION=Your Organisation
IA_INITIAL_ADMIN_RANK=Your IA Rank
```

The initial administrator is created only when that email does not yet exist. No password is stored in source control. Once provisioned, sign in at `/internal-affairs` with the protected IA login form and create the remaining accounts from **Admin Panel**.

For local development, start the API from `backend` and make sure the frontend has `VITE_API_URL` set to its `/api` base URL. The normal production backend start automatically connects both the existing application database and `Internal_Affairs`.
