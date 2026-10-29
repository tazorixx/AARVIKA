import test from "node:test";
import assert from "node:assert/strict";
import { normalizeTicketPriority, normalizeTicketStatus, validateTicketCreate, validateTicketUpdate } from "../src/lib/support/tickets";
import { normalizeRating, normalizeReviewStatus, validateReviewUpdate } from "../src/lib/admin/reviews";

test("support validation accepts a normal ticket",()=>{const v=validateTicketCreate({subject:"Order help",message:"Please help with my delivery",priority:"high"});assert.equal(v.valid,true);if(v.valid){assert.equal(v.priority,"high");}});
test("support validation rejects invalid priority",()=>{const v=validateTicketCreate({subject:"Help",message:"Something happened",priority:"urgent"});assert.equal(v.valid,false);});
test("support update validates status and reply",()=>{const v=validateTicketUpdate({status:"in_progress",reply:"We are checking this for you."});assert.equal(v.valid,true);});
test("support normalizers use safe defaults",()=>{assert.equal(normalizeTicketStatus("bad"),"open");assert.equal(normalizeTicketPriority("bad"),"medium");});
test("review helpers keep moderation statuses and ratings bounded",()=>{assert.equal(normalizeReviewStatus("approved"),"approved");assert.equal(normalizeReviewStatus("bad"),"pending");assert.equal(normalizeRating(9),5);assert.equal(normalizeRating(0),1);assert.equal(validateReviewUpdate({status:"approved"}).valid,true);});
