import test from "node:test";
import assert from "node:assert/strict";
import { normalizeReviewStatus, normalizeRating, validateReviewUpdate } from "../src/lib/admin/reviews";
import { normalizeHomepageSection, validateHomepageInput } from "../src/lib/admin/homepage";

test("review status normalization is safe", () => {
  assert.equal(normalizeReviewStatus("approved"), "approved");
  assert.equal(normalizeReviewStatus("anything-else"), "pending");
  assert.equal(normalizeRating(9), 5);
  assert.equal(normalizeRating(0), 1);
});

test("review updates reject unknown statuses", () => {
  assert.equal(validateReviewUpdate({ status: "approved" }).valid, true);
  assert.equal(validateReviewUpdate({ status: "hidden" }).valid, false);
});

test("homepage section input validates and normalizes defaults", () => {
  assert.equal(validateHomepageInput({ type: "hero", title: "Welcome" }).valid, true);
  assert.equal(validateHomepageInput({ type: "unknown" }).valid, false);
  const section = normalizeHomepageSection("abc", { type: "banner", title: "Sale", isActive: false });
  assert.equal(section.id, "abc");
  assert.equal(section.title, "Sale");
  assert.equal(section.isActive, false);
});

test("homepage title and subtitle limits are enforced", () => {
  assert.equal(validateHomepageInput({ title: "x".repeat(121) }).valid, false);
  assert.equal(validateHomepageInput({ subtitle: "x".repeat(241) }).valid, false);
});

test('typed homepage sources preserve selection and reject unsafe routes or unbounded lists',()=>{
  const section=normalizeHomepageSection('products',{type:'products',productIds:['one','two'],selection:'featured',limit:6,sourceId:'stationery-root'});
  assert.equal(section.type,'products');assert.deepEqual(section.productIds,['one','two']);assert.equal(section.limit,6);
  assert.equal(validateHomepageInput({type:'categories',linkUrl:'/categories'}).valid,true);
  for(const linkUrl of ['https://invalid.example','//invalid.example','/\\invalid','/bad\u0000'])assert.equal(validateHomepageInput({linkUrl}).valid,false);
  assert.equal(validateHomepageInput({limit:100}).valid,false);
  assert.equal(validateHomepageInput({productIds:new Array(101).fill('p')}).valid,false);
});
