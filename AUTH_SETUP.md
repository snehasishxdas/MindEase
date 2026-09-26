# Account Authentication Setup

## Database migration

Before deploying the account features, run `backend/migrations/001_accounts_and_activity.sql` once against the Supabase PostgreSQL database used by `DATABASE_URL` (for example, in the Supabase SQL Editor). The migration creates account, OTP, and activity tables and adds nullable ownership columns to feature data. Existing anonymous records stay unclaimed and are not exposed to new accounts. MindEase does not use Supabase Auth; accounts and OTP challenges are stored in PostgreSQL, and OTP email is sent through SMTP.

## Environment variables

Configure these in Vercel for Production and Preview, and in the server environment for local Flask development:

- `SESSION_SECRET`: a long random secret used to sign HttpOnly session cookies.
- `OTP_PEPPER`: a separate long random secret used to hash one-time codes; it may be omitted to use `SESSION_SECRET`.
- `SMTP_EMAIL` and `SMTP_PASSWORD`: the sender account and a newly issued mail-provider app password. Do not reuse credentials that were shared in chat.
- `SMTP_HOST` and `SMTP_PORT`: for Gmail, use `smtp.gmail.com` and `587`.
- `ADMIN_EMAIL`: the one administrator email address.
- `ADMIN_PASSWORD_HASH`: a Werkzeug password hash, not the plain password.
- `DATABASE_URL`: the Supabase PostgreSQL connection string used for all persistent application data, including accounts and wellness activity.
- `GROQ_API_KEY`: required for AI support and resilience responses.

Generate secrets locally with:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Set `ADMIN_EMAIL` to `mindease2510@gmail.com`. Generate the admin hash locally after choosing a new password; do not reuse the password previously shared in chat:

```powershell
python -c "from getpass import getpass; from werkzeug.security import generate_password_hash; print(generate_password_hash(getpass('New admin password: ')))"
```

Never put real secrets in `.env.example`, source code, or Git. `SMTP_PASSWORD`, `SESSION_SECRET`, and `ADMIN_PASSWORD_HASH` belong only in environment-variable settings.

## Notifications and access

User registration and each new user sign-in require an email code. Profile edits and account deletion also require email verification. Activity emails contain action names and timestamps only, and users can decline them during registration. SMS is not enabled; a mobile number alone cannot send SMS without a configured SMS provider.

Journal entries are screened with local rules for burnout indicators and possible self-harm language; journal text is not sent to an AI provider. When possible self-harm language is detected, `ADMIN_EMAIL` receives the user's name, email address, and alert category, but not the journal text. The user is shown urgent support resources. This heuristic can miss signals or flag wording by mistake and is not a diagnosis or emergency-monitoring service; admins must follow their established safeguarding process.

Email copy uses fixed MindEase templates rather than runtime AI generation so private wellness content is never sent to an AI provider. Emergency support remains reachable before sign-in. Admin access is separate from user accounts and uses the configured email/password hash.