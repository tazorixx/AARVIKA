// Process-only shared catalogue preview; no secrets are copied into the mobile app.
const {runExpo}=require('./start-expo.cjs');
runExpo(['start','--web','--offline','--port','8085'],{
  EXPO_PUBLIC_APP_ENV:'development',
  EXPO_PUBLIC_DATA_MODE:'shared-api',
  EXPO_PUBLIC_API_BASE_URL:process.env.AARVIKA_SHARED_API_BASE_URL||'http://127.0.0.1:3100',
  EXPO_PUBLIC_CUSTOMER_AUTH_MODE:'shared',
  EXPO_NO_TELEMETRY:'1',
});
