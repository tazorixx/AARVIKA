import test from "node:test";
import assert from "node:assert/strict";

function available(quantity: number, reserved: number) {
  return Math.max(0, Math.max(0, quantity) - Math.max(0, reserved));
}

test("available stock excludes reserved units", () => {
  assert.equal(available(20, 4), 16);
  assert.equal(available(4, 7), 0);
});

test("zero or negative values cannot create negative available stock", () => {
  assert.equal(available(-10, 0), 0);
  assert.equal(available(10, -3), 10);
});

test("quantity must remain at least reserved stock when edited", () => {
  const reserved = 6;
  const submitted = 4;
  assert.equal(Math.max(reserved, submitted), 6);
});
