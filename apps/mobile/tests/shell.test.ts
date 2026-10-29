import test from 'node:test';
import assert from 'node:assert/strict';
import { departments, reservedDepartment } from '../src/domain/departments.ts';
test('eight unique confirmed departments; reserved department never published', () => { assert.equal(departments.length, 8); assert.equal(new Set(departments.map(x => x.id)).size, 8); assert.ok(departments.every(x => x.active)); assert.equal(reservedDepartment.active, false); });
