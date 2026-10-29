/* Read-only export of public merchandising media references. No credentials are printed. */
const fs = require('node:fs');
const path = require('node:path');
const {parse} = require('dotenv');
const {cert, initializeApp, deleteApp} = require('firebase-admin/app');
const {getFirestore} = require('firebase-admin/firestore');

async function main() {
  const source = process.env.AARVIKA_SHARED_ENV_FILE;
  if (!source || !path.isAbsolute(source)) throw Error('Set AARVIKA_SHARED_ENV_FILE to the existing private environment file.');
  const settings = parse(fs.readFileSync(source));
  if (settings.FIREBASE_PROJECT_ID !== 'gift4u-4210f') throw Error('Unexpected Firebase project.');
  const app = initializeApp({projectId: settings.FIREBASE_PROJECT_ID, credential: cert({
    projectId: settings.FIREBASE_PROJECT_ID,
    clientEmail: settings.FIREBASE_CLIENT_EMAIL,
    privateKey: settings.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  })}, 'aarvika-public-media-export');
  try {
    const db = getFirestore(app);
    const pages = ['wedding','birthday','anniversary','personalised','hampers','clothing','stationery','furniture'];
    const output = [];
    for (const page of pages) {
      const ref = db.collection('merchandising_pages').doc(page);
      const [config, items] = await Promise.all([ref.get(),ref.collection('items').get()]);
      const hero = config.data()?.hero || {};
      for (const purpose of ['desktopImage','mobileImage']) if (hero[purpose]) output.push({department:page,record:`merchandising_pages/${page}`,purpose,url:hero[purpose],imageKitId:null});
      for (const item of items.docs) {
        const value = item.data();
        if (value.image) output.push({department:page,record:`merchandising_pages/${page}/items/${item.id}`,name:value.name||'',type:value.type||'',purpose:'itemImage',url:value.image,imageKitId:value.imageKitId||null});
      }
    }
    console.log(JSON.stringify(output,null,2));
  } finally { await deleteApp(app); }
}
main().catch(error => {console.error(`Read-only media export failed (${error.name || 'error'}).`);process.exitCode=1;});
