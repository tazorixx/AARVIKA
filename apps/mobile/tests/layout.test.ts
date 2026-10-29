import test from 'node:test';
import assert from 'node:assert/strict';
import { gridGeometry, productColumns } from '../src/domain/layout.ts';
test('phone shortcut and product columns fit without fractional wrap overflow', () => { for (const width of [296, 366, 810, 936]) { const grid = gridGeometry(width, width < 600 ? 4 : 8); assert.ok(Math.abs(grid.itemWidth * grid.columns + grid.gap * (grid.columns - 1) - width) < 0.001); } });
test('product grids adapt to tablet and large text instead of forcing narrow cards', () => { assert.equal(productColumns(296), 2); assert.equal(productColumns(810), 3); assert.equal(productColumns(936), 4); assert.equal(productColumns(296, 1.6), 1); });
