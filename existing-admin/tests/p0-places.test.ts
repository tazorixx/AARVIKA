import assert from "node:assert/strict";
import test from "node:test";

import { cleanPlaceId, cleanSessionToken, parsePlaceAddress } from "../src/lib/places/server";

test("P0 Places validates mobile session tokens and place IDs before proxying", () => {
  assert.equal(cleanSessionToken("abc12345_token"), "abc12345_token");
  assert.equal(cleanSessionToken("bad token"), "");
  assert.equal(cleanPlaceId("ChIJ_example-123"), "ChIJ_example-123");
  assert.equal(cleanPlaceId("bad/place?id"), "");
});

test("P0 Places maps Google address components into the existing Gift4U address contract", () => {
  const parsed = parsePlaceAddress({
    formattedAddress: "Flat 4, 12 MG Road, Pune, Maharashtra 411001, India",
    addressComponents: [
      { longText: "Flat 4", types: ["subpremise"] },
      { longText: "12", types: ["street_number"] },
      { longText: "MG Road", types: ["route"] },
      { longText: "Pune", types: ["locality"] },
      { longText: "Maharashtra", types: ["administrative_area_level_1"] },
      { longText: "411001", types: ["postal_code"] },
    ],
  });

  assert.equal(parsed.addressLine, "Flat 4, 12 MG Road");
  assert.equal(parsed.city, "Pune");
  assert.equal(parsed.state, "Maharashtra");
  assert.equal(parsed.pincode, "411001");
});
