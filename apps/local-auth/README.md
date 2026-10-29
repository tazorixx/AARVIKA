# Local email-code sign-in

This is a loopback-only development preview. It generates six-digit codes in memory and shows the code to the requesting app as a **local test inbox preview**. No email is sent. Its unsigned custom tokens work only with Firebase Authentication Emulator and the `demo-aarvika-local` project. Do not use this service for staging or production.

Start the Firebase Auth emulator with `firebase emulators:start --only auth --project demo-aarvika-local` from this folder, then run `node src/index.ts` from this folder. The mobile app uses `http://127.0.0.1:3002` on web/iOS simulator and `http://10.0.2.2:3002` in Android emulator.
