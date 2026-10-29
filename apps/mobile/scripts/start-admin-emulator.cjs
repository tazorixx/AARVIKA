// Process-only opt-in. The user's fixture .env.local is unchanged.
const {runExpo}=require('./start-expo.cjs');
runExpo(['start','--web','--offline','--port','8084'],{EXPO_PUBLIC_APP_ENV:'development',EXPO_PUBLIC_DATA_MODE:'admin-emulator',EXPO_PUBLIC_API_BASE_URL:'http://127.0.0.1:3100',EXPO_NO_TELEMETRY:'1'});
