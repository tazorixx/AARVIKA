// Explicit process-only override. Never edits the user's .env.local.
const { runExpo } = require('./start-expo.cjs');
const apiUrl='http://127.0.0.1:3001';
runExpo(['start','--web','--offline','--port','8082'],{EXPO_PUBLIC_APP_ENV:'development',EXPO_PUBLIC_DATA_MODE:'local-api',EXPO_PUBLIC_API_BASE_URL:apiUrl,EXPO_NO_TELEMETRY:'1'});
