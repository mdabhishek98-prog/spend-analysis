# Spend Analysis

An expense tracker that tells you where your money *should* go. Every expense is tagged
**Need**, **Want** or **Saving**, and the app compares your month with the 50 / 30 / 20 rule.

Built with Expo (React Native), Expo Router and TypeScript. All data stays on the phone (AsyncStorage).

## Run on your Android phone

1. Install **Expo Go** from the Play Store.
2. On this Mac:
   ```bash
   npm install
   npx expo start
   ```
3. Scan the QR code from Expo Go (phone and Mac on the same Wi-Fi).




## Build an installable APK

```bash
npx eas-cli@latest build -p android --profile preview
```

## Publish to Google Play

See [store/PLAY_STORE_GUIDE.md](store/PLAY_STORE_GUIDE.md). Store text and graphics are in `store/`.

Privacy policy: https://mdabhishek98-prog.github.io/spend-analysis/privacy.html

## Screens

- **Home**: spent vs income, Needs / Wants / Saved split, safe-to-spend today, recent entries
- **Add**: amount, category (suggests a priority), priority, date, payment mode
- **Insights**: your split vs 50 / 30 / 20, what to do next, where the money went
- **Budgets**: monthly limit plus per-category caps
- **History**: search and filter every entry; tap to edit, long-press to delete

Design mockup: `design/mockup.html`.

## Checks

```bash
npm run typecheck
npx expo lint
```
