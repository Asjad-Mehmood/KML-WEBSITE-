import { test } from "node:test";
import assert from "node:assert/strict";
import { corsHeaders, trustedOrigin } from "@/lib/http/cors";

test("the site's own addresses may send cookies", () => {
  for (const o of [
    "https://www.surveyxdigital.com",
    "https://surveyxdigital.com",
    "https://admin.surveyxdigital.com",
    "https://www.exceltokml.com",
    "http://localhost:3000",
    "http://127.0.0.1:53817",
  ]) {
    assert.equal(trustedOrigin(o), true, o);
    const h = corsHeaders(o);
    assert.equal(h["Access-Control-Allow-Origin"], o);
    assert.equal(h["Access-Control-Allow-Credentials"], "true");
  }
});

test("any other origin gets an answer without credentials", () => {
  for (const o of [
    "https://evil.example",
    "https://surveyxdigital.com.evil.example",
    "https://evilsurveyxdigital.com",
    "http://www.surveyxdigital.com", // not https
    "null", // file:// pages and sandboxed frames
    "https://www.surveyxdigital.com/path",
    "",
  ]) {
    assert.equal(trustedOrigin(o), false, o);
    const h = corsHeaders(o);
    assert.equal(h["Access-Control-Allow-Origin"], "*", o);
    assert.equal(h["Access-Control-Allow-Credentials"], undefined, o);
  }
  assert.equal(trustedOrigin(null), false);
});

test("this deployment's own Vercel address and CORS_ORIGINS are trusted", () => {
  process.env.VERCEL_URL = "kml-website-abc123.vercel.app";
  process.env.CORS_ORIGINS = "https://partner.example.com/";
  try {
    assert.equal(trustedOrigin("https://kml-website-abc123.vercel.app"), true);
    assert.equal(trustedOrigin("https://partner.example.com"), true);
    assert.equal(trustedOrigin("https://someone-else.vercel.app"), false);
  } finally {
    delete process.env.VERCEL_URL;
    delete process.env.CORS_ORIGINS;
  }
});

test("every answer varies by origin", () => {
  assert.equal(corsHeaders("https://evil.example").Vary, "Origin");
});
