/* eslint-disable @typescript-eslint/no-require-imports -- Read-only live catalogue inventory. */
const fs = require('node:fs');
const path = require('node:path');
const {parse} = require('dotenv');
const {cert, initializeApp} = require('firebase-admin/app');
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
  })}, 'aarvika-read-only-check');
  const db = getFirestore(app);
  const names = ['products', 'skus', 'categories', 'collections', 'recipients', 'occasions', 'homepage_sections', 'merchandising_pages', 'taxonomy_page_merchandising'];
  const counts = await Promise.all(names.map(async name => [name, (await db.collection(name).count().get()).data().count]));
  for (const [name, count] of counts) console.log(`${name}: ${count}`);
  const wedding = await db.collection('merchandising_pages').doc('wedding').get();
  const weddingItems = await db.collection('merchandising_pages').doc('wedding').collection('items').count().get();
  console.log(`wedding page: ${wedding.exists ? 1 : 0}; wedding items: ${weddingItems.data().count}`);
  const weddingRows = await db.collection('merchandising_pages').doc('wedding').collection('items').get();
  const byType = {}, missingRelations = {event: 0, category: 0}, withImages = {count: 0}, imageHosts={};
  for (const row of weddingRows.docs) {
    const item = row.data();
    byType[item.type || 'unknown'] = (byType[item.type || 'unknown'] || 0) + 1;
    if (item.image) {withImages.count++;try{const host=new URL(item.image).hostname;imageHosts[host]=(imageHosts[host]||0)+1;}catch{imageHosts.invalid=(imageHosts.invalid||0)+1;}}
    if (item.type === 'event' && item.relatedId && !(await db.collection('occasions').doc(item.relatedId).get()).exists) missingRelations.event++;
    if (item.type === 'category' && item.relatedId && !(await db.collection('categories').doc(item.relatedId).get()).exists) missingRelations.category++;
  }
  console.log(`wedding types: ${JSON.stringify(byType)}; image references: ${withImages.count}; image hosts: ${JSON.stringify(imageHosts)}; broken linked IDs: ${JSON.stringify(missingRelations)}`);
}
main().catch(error => {console.error(`Shared catalogue read failed (${error.name || 'error'}).`); process.exitCode = 1;});
