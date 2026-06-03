# 07 — Deployment (Going Public)

This document covers taking the platform from a local machine to the public internet.
Read through the whole document before starting — the steps have dependencies.

---

## Prerequisites

Before deploying, confirm:
- [ ] The platform works correctly on localhost
- [ ] All environment variables are documented
- [ ] The HR password has been changed from the default
- [ ] A domain name has been registered (or a subdomain decided on)
- [ ] POPIA compliance has been considered (see bottom of this document)

---

## The Three Things to Deploy

```
1. Database    → Supabase or Neon (managed PostgreSQL)
2. Backend API → Railway or Render (Node.js hosting)
3. Frontend    → Vercel (Next.js hosting)
```

Deploy in this order: Database first, then API, then Frontend.

---

## 1. Deploy the Database

**Recommended: Supabase**
1. Create a free account at https://supabase.com
2. Create a new project — choose the nearest region
3. Once created, go to Settings → Database → Connection String
4. Copy the **URI** format connection string
5. Replace `[YOUR-PASSWORD]` with the database password you set during creation

The connection string looks like:
```
postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
```

**Apply the schema:**
```bash
# In apps/api/ — with DATABASE_URL set to the Supabase URL
npx prisma migrate deploy
npx prisma db seed
```

---

## 2. Deploy the Backend API

**Recommended: Railway**
1. Create an account at https://railway.app
2. Create a new project → Deploy from GitHub repo
3. Select the `apps/api` folder as the root directory
4. Set environment variables in Railway's dashboard:

```
DATABASE_URL          = (Supabase connection string from Step 1)
JWT_SECRET            = (generate: openssl rand -base64 32)
JWT_EXPIRY            = 7d
NODE_ENV              = production
PORT                  = 4000
```

5. Railway will detect the NestJS app and deploy it
6. Note the Railway-assigned URL (e.g. `https://api-yourproject.railway.app`)

**Important:** Set `CORS_ORIGIN` in the NestJS app to your frontend's domain:
```typescript
// apps/api/src/main.ts
app.enableCors({
  origin: 'https://your-frontend-domain.vercel.app',
  credentials: true,
})
```

---

## 3. Deploy the Frontend

**Recommended: Vercel**
1. Create an account at https://vercel.com
2. Import your GitHub repository
3. Set the **Root Directory** to `apps/web`
4. Set environment variables in Vercel's dashboard:

```
NEXTAUTH_URL          = https://your-domain.vercel.app  (your actual frontend URL)
NEXTAUTH_SECRET       = (generate: openssl rand -base64 32)
NEXT_PUBLIC_API_URL   = https://api-yourproject.railway.app  (from Step 2)
```

5. Deploy. Vercel automatically redeploys on every git push.

---

## Custom Domain

**On Vercel:**
1. Go to your project → Settings → Domains
2. Add your domain (e.g. `platform.school.co.za`)
3. Follow Vercel's DNS instructions (add a CNAME record at your domain registrar)
4. Update `NEXTAUTH_URL` to your custom domain

**South African domain registrars:** domains.co.za, afrihost.com, xneelo.co.za

---

## Environment Variable Summary

All values marked `GENERATE` should be random strings. Use:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

| Variable | Where | Value |
|----------|-------|-------|
| `DATABASE_URL` | Backend | Supabase/Neon connection string |
| `JWT_SECRET` | Backend | GENERATE (32+ chars) |
| `JWT_EXPIRY` | Backend | `7d` |
| `NODE_ENV` | Backend | `production` |
| `NEXTAUTH_URL` | Frontend | Your actual domain with https:// |
| `NEXTAUTH_SECRET` | Frontend | GENERATE (32+ chars, different from JWT_SECRET) |
| `NEXT_PUBLIC_API_URL` | Frontend | Your Railway/Render API URL |

---

## Free Tier Limitations to Know

| Service | Free Tier Limit | Impact |
|---------|----------------|--------|
| Railway | $5/month free credits | API may sleep after inactivity |
| Render | Free tier sleeps after 15min inactivity | Slow first request |
| Supabase | 500MB storage, 2 projects | Fine for one school |
| Vercel | Unlimited deploys, bandwidth limits | Fine for staff-only use |

**Recommendation:** Once learner logins are active (1 000+ potential users), upgrade the
backend to a paid plan ($5–10/month) to eliminate cold starts.

---

## Data Backup

The free tier of Supabase does not include automated backups. Set up a manual backup
schedule from day one:

```bash
# Run this monthly (or weekly for active production):
pg_dump "postgresql://..." > backup_$(date +%Y%m%d).sql
```

Store backups in a secure location separate from the hosting provider (e.g. an encrypted
external drive or secure cloud storage).

---

## Security Checklist Before Going Public

- [ ] All passwords changed from defaults (principal, HR password, JWT secrets)
- [ ] `NEXTAUTH_SECRET` is a strong random value (not the same as JWT_SECRET)
- [ ] HTTPS is active on all URLs (automatic on Vercel/Railway)
- [ ] CORS is configured to only allow your frontend's domain
- [ ] The Screeners page: consider replacing the sessionStorage gate with a
      server-side verification on every screener data request
- [ ] The HR page: consider moving the password check to the backend (a dedicated
      endpoint that validates the HR password server-side)
- [ ] Database password is strong and not reused elsewhere
- [ ] No `console.log` statements printing sensitive data remain in production code

---

## POPIA Compliance (South African Schools)

The Protection of Personal Information Act (POPIA) applies to all processing of personal
information in South Africa. The platform holds:
- Learner biographical data (names, dates of birth, ID numbers)
- Learner assessment and screening results
- Staff HR records

**Before going public with learner data, confirm:**

1. **Lawful basis:** The school has a lawful basis for processing learner data
   (typically the educational relationship and SASA obligations)
2. **Privacy notice:** A privacy notice is made available to parents/guardians
   explaining what data is collected, why, and how it is protected
3. **Parental consent:** For learners under 18, parental/guardian consent for
   digital data processing is documented
4. **Data minimisation:** Only necessary data is collected (the platform holds
   what LURITS and CAPS reporting require — this is appropriate)
5. **Access controls:** Role-based access ensures staff only see what they need
   (this is built in)
6. **Data subject rights:** Learners (and parents on their behalf) have the right
   to access, correct, or request deletion of their data
7. **Breach notification:** A plan exists for notifying the Information Regulator
   within 72 hours if a data breach occurs
8. **Data processing agreement:** If using international hosting (Supabase/Vercel
   servers outside South Africa), a data processing agreement with the hosting
   provider is in place

The Information Regulator of South Africa: https://www.justice.gov.za/inforeg/

---

## Ongoing Maintenance

Once deployed, the platform requires:

| Task | Frequency | Who |
|------|-----------|-----|
| Database backup | Weekly | Administrator |
| Dependency updates (`npm audit`) | Monthly | Developer |
| Password rotation (JWT secrets) | Annually | Developer |
| Academic year rollover (new year, new classes) | Annually | Administrator |
| New learner import | Start of each year | Administrator |
| Staff account management | As staff join/leave | Principal |
