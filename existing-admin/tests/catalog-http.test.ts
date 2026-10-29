import test from 'node:test';
import assert from 'node:assert/strict';
import {errorResponse} from '../src/lib/catalog/http';
test('authoring and SKU validation messages cannot be misclassified as authentication failures',()=>{
 assert.equal(errorResponse(new Error('Unsupported authoring contract version.')).status,400);
 assert.equal(errorResponse(new Error('SKU code already used: token-gift')).status,400);
 assert.equal(errorResponse(new Error('Missing bearer token.')).status,401);
 assert.equal(errorResponse(Object.assign(new Error('Invalid ID token'),{code:'auth/argument-error'})).status,401);
 assert.equal(errorResponse(new Error('Forbidden')).status,403);
 assert.equal(errorResponse(new Error('Not found.')).status,404);
});
