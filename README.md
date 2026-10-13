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

Tip: on the empty Home screen, tap **Load sample data** to explore with two months of entries.
Clear it later from the bottom of **History**.

## Build an installable APK

```bash
npx eas-cli@latest build -p android --profile preview
```

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
