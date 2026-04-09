import { useState, useEffect, useRef, useCallback } from "react";

const SUPABASE_URL  = "https://ahhfmealtjcnmhtfcrhf.supabase.co";
const SUPABASE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoaGZtZWFsdGpjbm1odGZjcmhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzQ1MDIsImV4cCI6MjA5MTI1MDUwMn0.Y9S6pLn5OEpAQBFK-lMePsBmQTjbj_NPgH-HzonAff8";

const sb = {
  headers: (token) => ({
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${token || SUPABASE_KEY}`,
    "Prefer": "return=representation",
  }),
  async signUp(email, password, fullName) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
      body: JSON.stringify({ email, password, data: { full_name: fullName } }),
    });
    return r.json();
  },
  async signIn(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
      body: JSON.stringify({ email, password }),
    });
    return r.json();
  },
  async signOut(token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}` },
    });
  },
  async select(table, query = "", token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}&order=created_at.desc`, {
      headers: this.headers(token),
    });
    return r.json();
  },
  async insert(table, data, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: this.headers(token),
      body: JSON.stringify(data),
    });
    return r.json();
  },
  async update(table, id, data, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH",
      headers: this.headers(token),
      body: JSON.stringify(data),
    });
    return r.json();
  },
  async uploadFile(bucket, path, file, token) {
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
      method: "POST",
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token || SUPABASE_KEY}` },
      body: file,
    });
    const data = await r.json();
    if (data.Key) return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
    throw new Error(data.error || "Upload failed");
  },
};

async function callAI(prompt, imageBase64 = null) {
  const content = imageBase64
    ? [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
        { type: "text", text: prompt },
      ]
    : prompt;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "No response";
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

const C = {
  bg: "#0D0F12", surface: "#141820", card: "#1A2030", border: "#252D3D",
  accent: "#F5A623", green: "#22C55E", red: "#EF4444", blue: "#3B82F6",
  text: "#E8EDF5", muted: "#6B7A99", tag: "#1E2A40",
};
