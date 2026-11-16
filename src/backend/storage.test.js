import assert from "node:assert/strict";
import test from "node:test";
import { detalhesErroStorage } from "./storage.js";

test("provides useful Storage diagnostics without exposing backend secrets", () => {
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_URL = "https://project.example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_test_value";

  try {
    const detalhe = detalhesErroStorage({
      statusCode: 403,
      error: "Unauthorized",
      message:
        "Request to https://project.example.supabase.co failed with sb_secret_test_value",
    });

    assert.match(detalhe, /HTTP 403/);
    assert.match(detalhe, /Unauthorized/);
    assert.doesNotMatch(detalhe, /project\.example/);
    assert.doesNotMatch(detalhe, /sb_secret_test_value/);
  } finally {
    if (originalUrl === undefined) {
      delete process.env.SUPABASE_URL;
    } else {
      process.env.SUPABASE_URL = originalUrl;
    }

    if (originalKey === undefined) {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    } else {
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
    }
  }
});
