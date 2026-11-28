import { test } from "node:test";
import assert from "node:assert/strict";
import { ownsFile } from "@/lib/account/fileAccess";

const ann = { id: "u_ann", email: "ann@example.com" };
const bob = { id: "u_bob", email: "bob@example.com" };

test("the account a file is kept under owns it", () => {
  assert.equal(ownsFile(ann, { userId: "u_ann", userEmail: "ann@example.com" }), true);
  assert.equal(ownsFile(bob, { userId: "u_ann", userEmail: "ann@example.com" }), false);
});

test("an id wins over a matching email", () => {
  // the file is Ann's by id, even if Bob's email were on it
  assert.equal(ownsFile(bob, { userId: "u_ann", userEmail: "bob@example.com" }), false);
});

test("an older file without an id belongs to the account with its email, in any case", () => {
  assert.equal(ownsFile(ann, { userId: null, userEmail: "ANN@example.com" }), true);
  assert.equal(ownsFile(bob, { userId: null, userEmail: "ann@example.com" }), false);
});

test("a file with neither is nobody's (admins only), and signed-out visitors own nothing", () => {
  assert.equal(ownsFile(ann, { userId: null, userEmail: null }), false);
  assert.equal(ownsFile(null, { userId: "u_ann" }), false);
});
