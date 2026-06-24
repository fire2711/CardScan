# CardScan — Setup & Deployment Guide

Everything you need to go from these files → live app on the App Store.

---

## What you have

```
cardscanner/
  app/          ← The React Native mobile app (Expo)
  backend/      ← The Node.js server (runs on Railway)
```

---

## Step 1 — Get your API keys (15 mins)

You need 2 keys to start (3rd is optional):

### Google Vision API (reads text off card photos)
1. Go to https://console.cloud.google.com
2. Create a new project called "CardScan"
3. Go to "APIs & Services" → "Enable APIs" → search "Cloud Vision API" → Enable
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy the key — this is your `GOOGLE_VISION_API_KEY`
6. First 1,000 requests/month are FREE. After that ~$1.50 per 1,000.

### TCGAPI.dev (live prices for Magic, Sports cards)
1. Go to https://tcgapi.dev and sign up (free)
2. Go to your Dashboard and copy your API key
3. This is your `TCGAPI_KEY`
4. Free tier: 100 requests/day. Paid: $9/mo for 2,500/day.

### Pokémon TCG API (optional but recommended)
1. Go to https://dev.pokemontcg.io and sign up
2. Copy your API key — this is `POKEMON_TCG_API_KEY`
3. Without this key you still get 1,000 free requests/day. With it: unlimited.

---

## Step 2 — Deploy the backend to Railway (10 mins)

Railway hosts your server so the app can call it from anywhere.

1. Go to https://railway.app and sign up (free)
2. Click "New Project" → "Deploy from GitHub repo"
   - If you haven't already, push your code to GitHub:
     ```bash
     cd cardscanner/backend
     git init
     git add .
     git commit -m "Initial backend"
     # create a repo on github.com, then:
     git remote add origin https://github.com/YOURNAME/cardscan-backend.git
     git push -u origin main
     ```
3. Select your repo in Railway → it auto-detects Node.js and deploys
4. Go to your project → "Variables" tab → add these:
   ```
   GOOGLE_VISION_API_KEY = (your key from Step 1)
   TCGAPI_KEY = (your key from Step 1)
   POKEMON_TCG_API_KEY = (your key from Step 1)
   ```
5. Click "Settings" → "Domains" → "Generate Domain"
6. Copy your domain — it'll look like: `cardscan-backend-production.up.railway.app`

---

## Step 3 — Connect the app to your backend (2 mins)

Open `app/screens/ScanScreen.js` and find this line near the top:

```js
const BACKEND_URL = 'https://YOUR-BACKEND-URL.railway.app';
```

Replace it with your actual Railway URL from Step 2:

```js
const BACKEND_URL = 'https://cardscan-backend-production.up.railway.app';
```

---

## Step 4 — Run the app on your phone (10 mins)

1. Install Node.js from https://nodejs.org (LTS version)
2. Open Terminal (Mac) or Command Prompt (Windows)
3. Install Expo:
   ```bash
   npm install -g expo-cli eas-cli
   ```
4. Install app dependencies:
   ```bash
   cd cardscanner/app
   npm install
   ```
5. Start the app:
   ```bash
   npx expo start
   ```
6. Install the **Expo Go** app on your phone (App Store / Google Play)
7. Scan the QR code shown in your terminal → the app opens on your phone

Test it — take a photo of a card and make sure prices come back. Fix any issues before submitting to the stores.

---

## Step 5 — Submit to the App Store (iOS)

### One-time setup
1. Go to https://developer.apple.com and pay $99/year for an account
2. Open `app/app.json` and change `com.yourname.cardscan` to something unique like `com.johndoe.cardscan`

### Build and submit
```bash
cd cardscanner/app
eas build --platform ios --profile production
```
- EAS builds in the cloud — you don't need a Mac
- When it finishes, it gives you a download link

Then submit:
```bash
eas submit --platform ios
```
- This uploads to App Store Connect automatically
- Sign in with your Apple ID when prompted

### In App Store Connect (https://appstoreconnect.apple.com)
1. Set your app price: go to "Pricing and Availability" → set price to $2.99 (or whatever you choose)
2. Fill in app description, screenshots (take them from Expo Go on your phone)
3. Submit for review — Apple reviews take 1-3 days

---

## Step 6 — Submit to Google Play (Android)

1. Pay the $25 one-time fee at https://play.google.com/console
2. Build:
   ```bash
   eas build --platform android --profile production
   ```
3. Submit:
   ```bash
   eas submit --platform android
   ```
4. In Play Console: set price, add screenshots, submit for review (usually 1-3 days)

---

## Costs summary

| What | Cost |
|---|---|
| Railway backend | Free (500 hours/mo) → $5/mo when you grow |
| Google Vision OCR | Free up to 1,000 scans/mo, then ~$1.50/1,000 |
| TCGAPI.dev | Free (100/day) → $9/mo for 2,500/day |
| Pokémon TCG API | Free |
| Apple Developer | $99/year |
| Google Play | $25 one-time |
| **Total to launch** | **~$124** |

---

## Revenue

At $2.99/download (Apple takes 30%, you keep 70%):
- 100 downloads → ~$209
- 500 downloads → ~$1,045
- 1,000 downloads → ~$2,090

---

## Growing the app

Post a demo video on:
- Reddit: r/PokemonTCG, r/mtg, r/baseballcards, r/tradingcards
- TikTok: show yourself scanning a card and seeing the price pop up
- YouTube Shorts: same idea

The niche communities love utility apps. A single viral post can drive hundreds of downloads overnight.

---

## Troubleshooting

**"Could not read any text from the card"**
→ Google Vision couldn't OCR the image. Make sure the card name is in focus and the photo is well-lit.

**"Card not found in database"**
→ The OCR read the name but the price API doesn't have it. Common for very new cards or very old/obscure ones.

**App crashes on startup**
→ Make sure you ran `npm install` in the `app/` folder.

**Backend returns 500**
→ Check Railway logs (Dashboard → your service → "Logs") and make sure all env vars are set correctly.
