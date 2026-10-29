import test from "node:test";
import assert from "node:assert/strict";
import { MAX_BULK_ITEMS, bulkProductPatch, validateBulkIds, validateBulkQuantity } from "../src/lib/admin/bulk";
test("bulk ids are deduplicated and capped",()=>{assert.deepEqual(validateBulkIds(["a","a","b"]),{ok:true,ids:["a","b"]});assert.equal(validateBulkIds([]).ok,false);assert.equal(validateBulkIds(Array.from({length:MAX_BULK_ITEMS+1},(_,i)=>String(i))).ok,false);});
test("bulk actions map safely",()=>{assert.deepEqual(bulkProductPatch("publish"),{status:"live"});assert.deepEqual(bulkProductPatch("feature"),{featured:true});assert.equal(bulkProductPatch("delete"),null);});
test("bulk quantity accepts only whole non-negative values",()=>{assert.deepEqual(validateBulkQuantity(10),{ok:true,quantity:10});assert.equal(validateBulkQuantity(-1).ok,false);assert.equal(validateBulkQuantity(1.5).ok,false);});
