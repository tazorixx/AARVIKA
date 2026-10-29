import { readFileSync } from "node:fs";
import { after, afterEach, before, test } from "node:test";
import assert from "node:assert/strict";
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { DEMO_PROJECT_ID } from "../src/lib/isolated";

let testEnv: RulesTestEnvironment;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: DEMO_PROJECT_ID,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
});

after(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

test('customers cannot read raw canonical SKU reservations or internal Furniture inquiries',async()=>{
  await testEnv.withSecurityRulesDisabled(async context=>{
    await setDoc(doc(context.firestore(),'skus/demo-private'),{productId:'demo',reserved:2,sold:1});
    await setDoc(doc(context.firestore(),'furniture_inquiries/demo-private'),{demo:true,internalNote:'Synthetic internal review'});
  });
  const db=testEnv.authenticatedContext('demo-customer').firestore();
  await assertFails(getDoc(doc(db,'skus/demo-private')));
  await assertFails(getDoc(doc(db,'furniture_inquiries/demo-private')));
});

test('admin clients cannot bypass the trusted API for canonical SKU or inquiry writes',async()=>{
  const db=testEnv.authenticatedContext('demo-admin',{role:'SUPER_ADMIN'}).firestore();
  await assertFails(setDoc(doc(db,'skus/forbidden'),{quantity:999}));
  await assertFails(setDoc(doc(db,'furniture_inquiries/forbidden'),{status:'demo-quote'}));
});

test("anonymous users cannot read a draft product", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "products/draft-1"), { status: "draft", title: "Draft" });
  });

  await assertFails(getDoc(doc(testEnv.unauthenticatedContext().firestore(), "products/draft-1")));
});

test("authenticated customers cannot create products", async () => {
  const db = testEnv.authenticatedContext("customer-1").firestore();
  await assertFails(setDoc(doc(db, "products/customer-write"), { status: "live", title: "Nope" }));
});

test("SUPPORT cannot modify catalog directly from the client", async () => {
  const db = testEnv.authenticatedContext("support-1", { role: "SUPPORT" }).firestore();
  await assertFails(setDoc(doc(db, "products/support-write"), { status: "live", title: "Nope" }));
});

test("even CATALOG_MANAGER cannot bypass the trusted API boundary", async () => {
  const db = testEnv.authenticatedContext("catalog-1", { role: "CATALOG_MANAGER" }).firestore();
  await assertFails(setDoc(doc(db, "products/catalog-write"), { status: "live", title: "Nope" }));
  assert.equal(true, true);
});

test("live products are publicly readable", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "products/live-1"), { status: "live", title: "Live" });
  });

  await assertSucceeds(getDoc(doc(testEnv.unauthenticatedContext().firestore(), "products/live-1")));
});
