# Publishing Spend Analysis to Google Play

Everything inside the project is ready: icons, splash screen, `eas.json`, privacy policy,
store text (`store/listing.md`), icon and feature graphic, and screenshots.
These steps need your own accounts, so you do them.

## Step 1 · Create your accounts (one time)

1. **Google Play Console**: go to https://play.google.com/console/signup
   - Choose **Personal** (or **Organization** if you have a registered business and a D-U-N-S number).
   - Pay the one-time **US$25** fee and complete identity verification. Approval takes 1 to 3 days.
2. **Expo**: sign up free at https://expo.dev/signup

## Step 2 · Build the Play Store file (.aab)

In Terminal:

```bash
cd ~/Desktop/spend-analysis
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile production
```

- On the first build it asks to create the project on Expo: answer **Yes**.
- It asks to generate a new Android keystore: answer **Yes**. Expo stores it safely; don't lose access to your Expo account.
- About 10 to 20 minutes later you get a link. Download the `.aab` file.

Optional: to test on your own phone first, build an installable APK with
`npx eas-cli@latest build -p android --profile preview` and open the link on your phone.

## Step 3 · Create the app in Play Console

1. **Create app** → name `Spend Analysis`, language English (India), **App**, **Free**, accept the declarations.
2. Open **Policy → App content** and fill each form using the table in `store/listing.md`
   (privacy policy URL, ads: no, data safety: no data collected, content rating, target audience 18+, financial features: none).
3. Open **Grow → Store presence → Main store listing**:
   - Paste the name, short description and full description from `store/listing.md`
   - Upload `store/icon-512.png`, `store/feature-graphic.png` and every file in `store/screenshots/`
   - Category: **Finance**. Add your support email.

## Step 4 · Closed test (required for new personal accounts)

1. **Test and release → Testing → Closed testing → Create track**.
2. Add a tester list with **at least 12 Gmail addresses** (friends and family).
3. **Create release** → upload the `.aab` → release notes: `First release` → **Review and roll out**.
4. Share the opt-in link with testers. They must **stay opted in for 14 days in a row**.

## Step 5 · Go live

After 14 days: **Dashboard → Apply for production**. Answer the short questions about your test.
Google reviews it (usually 1 to 7 days), then you promote the release to **Production**.

## Releasing updates later

```bash
npx eas-cli@latest build -p android --profile production
npx eas-cli@latest submit -p android --latest
```

`submit` needs a Google service-account key the first time: see
https://docs.expo.dev/submit/android/ . Version numbers go up automatically.
