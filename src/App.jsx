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
const Icon = ({ name, size = 20, color = C.text }) => {
  const p = {
    camera: <><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="3"/><path d="M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/></>,
    blueprint: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/><path d="M13 13h4M13 17h4"/></>,
    compare: <><path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M12 8v8M9 11l3-3 3 3"/></>,
    defect: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    report: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
    palette: <><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></>,
    home: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></>,
    upload: <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
    loader: <><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></>,
    sparkle: <><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    folder: <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></>,
    share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {p[name]}
    </svg>
  );
};

const Spinner = () => (
  <div style={{ animation: "spin 1s linear infinite", display: "inline-flex" }}>
    <Icon name="loader" size={16} color={C.accent} />
  </div>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 10, ...style }}>
    {children}
  </div>
);

const Btn = ({ label, icon, onClick, color = C.accent, textColor = "#000", disabled, fullWidth = true, outline }) => (
  <button onClick={onClick} disabled={disabled} style={{
    width: fullWidth ? "100%" : "auto", padding: "13px 16px", borderRadius: 12,
    background: outline ? "transparent" : (disabled ? C.border : color),
    color: outline ? C.text : (disabled ? C.muted : textColor),
    border: outline ? `1px solid ${C.border}` : "none",
    cursor: disabled ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 13,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
    fontFamily: "'DM Sans', sans-serif", transition: "opacity .15s",
  }}>
    {icon && <Icon name={icon} size={15} color={outline ? C.text : (disabled ? C.muted : textColor)} />}
    {label}
  </button>
);

const Input = ({ label, value, onChange, type = "text", placeholder }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width: "100%", background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 10, padding: "11px 12px", color: C.text, fontSize: 14,
        boxSizing: "border-box", outline: "none", fontFamily: "'DM Sans', sans-serif",
      }} />
  </div>
);

const Badge = ({ label, color = C.accent }) => (
  <span style={{
    background: color + "22", color, border: `1px solid ${color}44`,
    borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700,
    letterSpacing: "0.06em", textTransform: "uppercase",
  }}>{label}</span>
);

const SectionHead = ({ icon, title, sub }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
      <div style={{ background: C.accent + "22", borderRadius: 10, padding: 7, display: "flex" }}>
        <Icon name={icon} size={18} color={C.accent} />
      </div>
      <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: C.text, fontFamily: "'Syne', sans-serif" }}>{title}</h2>
    </div>
    {sub && <p style={{ margin: 0, color: C.muted, fontSize: 12, paddingLeft: 44 }}>{sub}</p>}
  </div>
);

const ResultBlock = ({ text, loading }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginTop: 10, minHeight: 56 }}>
    {loading
      ? <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.muted, fontSize: 13 }}><Spinner /> Analysing with AI…</div>
      : <pre style={{ margin: 0, color: C.text, fontSize: 12, whiteSpace: "pre-wrap", fontFamily: "inherit", lineHeight: 1.65 }}>{text}</pre>}
  </div>
);

const UploadZone = ({ label, accept, onFile, preview }) => {
  const ref = useRef();
  return (
    <div onClick={() => ref.current.click()} style={{
      border: `2px dashed ${C.border}`, borderRadius: 12,
      padding: preview ? 0 : "24px 16px", textAlign: "center",
      cursor: "pointer", overflow: "hidden", background: C.surface,
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
    >
      <input ref={ref} type="file" accept={accept} style={{ display: "none" }}
        onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
      {preview
        ? <img src={preview} alt="preview" style={{ width: "100%", display: "block", maxHeight: 160, objectFit: "cover" }} />
        : <><Icon name="upload" size={24} color={C.muted} /><p style={{ margin: "6px 0 0", color: C.muted, fontSize: 12 }}>{label}</p></>}
    </div>
  );
};

const Toast = ({ msg, type }) => (
  msg ? <div style={{
    position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)",
    background: type === "error" ? C.red : C.green, color: "#fff",
    padding: "10px 18px", borderRadius: 20, fontSize: 13, fontWeight: 700,
    zIndex: 9999, whiteSpace: "nowrap", boxShadow: "0 4px 20px #0006",
    animation: "fadeUp .2s ease",
  }}>{msg}</div> : nullconst AuthScreen = ({ onAuth }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true); setError("");
    try {
      if (mode === "signup") {
        const res = await sb.signUp(email, password, name);
        if (res.error) throw new Error(res.error.message || res.msg);
        setMode("login");
        setError("Account created! Please log in.");
      } else {
        const res = await sb.signIn(email, password);
        if (res.error) throw new Error(res.error.message || res.msg || "Login failed");
        onAuth({ token: res.access_token, user: res.user, name: res.user?.user_metadata?.full_name || email });
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;700&display=swap'); * { box-sizing: border-box; } @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} } @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} } input::placeholder { color: #6B7A99; }`}</style>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🏗️</div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: C.text, fontFamily: "'Syne', sans-serif" }}>SiteInspect</h1>
        <p style={{ margin: "6px 0 0", color: C.muted, fontSize: 14 }}>Construction Inspection Platform</p>
      </div>
      <Card>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["login", "signup"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "9px", borderRadius: 9,
              background: mode === m ? C.accent : C.surface,
              color: mode === m ? "#000" : C.muted,
              border: `1px solid ${mode === m ? C.accent : C.border}`,
              cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
            }}>{m === "login" ? "Log In" : "Sign Up"}</button>
          ))}
        </div>
        {mode === "signup" && <Input label="Full Name" value={name} onChange={setName} placeholder="Reuben Mwangi" />}
        <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="engineer@site.com" />
        <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
        {error && <p style={{ margin: "0 0 10px", fontSize: 12, color: error.includes("created") ? C.green : C.red }}>{error}</p>}
        <Btn label={loading ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
          icon={loading ? "loader" : "check"} onClick={submit} disabled={loading} />
      </Card>
      <p style={{ textAlign: "center", color: C.muted, fontSize: 11, marginTop: 16 }}>For Engineers · Supervisors · Project Managers</p>
    </div>
  );
};

const ProjectScreen = ({ auth, onSelect }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [client, setClient] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 2500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sb.select("projects", "select=*", auth.token);
      setProjects(Array.isArray(data) ? data : []);
    } catch { setProjects([]); }
    setLoading(false);
  }, [auth.token]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await sb.insert("projects", {
        name, location, client_name: client,
        created_by: auth.user.id, status: "active",
      }, auth.token);
      showToast("Project created!");
      setCreating(false); setName(""); setLocation(""); setClient("");
      load();
    } catch { showToast("Failed to create project", "error"); }
    setSaving(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "24px 16px 40px", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;700&display=swap'); * { box-sizing: border-box; } @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} } @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} } input::placeholder { color: #6B7A99; }`}</style>
      <Toast {...toast} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Welcome back</p>
          <h2 style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 900, color: C.text, fontFamily: "'Syne', sans-serif" }}>{auth.name}</h2>
        </div>
        <button onClick={() => sb.signOut(auth.token).then(() => window.location.reload())}
          style={{ background: C.tag, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px", cursor: "pointer" }}>
          <Icon name="logout" size={18} color={C.muted} />
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 13, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Projects {!loading && `(${projects.length})`}</h3>
        <button onClick={() => setCreating(!creating)} style={{
          background: C.accent, border: "none", borderRadius: 20, padding: "6px 14px",
          cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          fontSize: 12, fontWeight: 700, color: "#000",
        }}>
          <Icon name="plus" size={14} color="#000" /> New Project
        </button>
      </div>
      {creating && (
        <Card style={{ marginBottom: 16, border: `1px solid ${C.accent}44` }}>
          <Input label="Project Name *" value={name} onChange={setName} placeholder="Westlands Apartments Block A" />
          <Input label="Location" value={location} onChange={setLocation} placeholder="Nairobi, Kenya" />
          <Input label="Client Name" value={client} onChange={setClient} placeholder="Acacia Developers Ltd" />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn label="Cancel" onClick={() => setCreating(false)} color={C.border} textColor={C.text} outline />
            <Btn label={saving ? "Saving…" : "Create Project"} icon="check" onClick={create} disabled={saving || !name.trim()} />
          </div>
        </Card>
      )}
      {loading
        ? <div style={{ textAlign: "center", padding: 40, color: C.muted }}><Spinner /><p style={{ marginTop: 10, fontSize: 13 }}>Loading…</p></div>
        : projects.length === 0
          ? <Card style={{ textAlign: "center", padding: "32px 16px" }}>
              <Icon name="folder" size={36} color={C.muted} />
              <p style={{ color: C.muted, fontSize: 13, margin: "10px 0 0" }}>No projects yet. Create your first above.</p>
            </Card>
          : projects.map(p => (
              <Card key={p.id} style={{ cursor: "pointer" }} onClick={() => onSelect(p)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 4 }}>{p.name}</div>
                    {p.location && <div style={{ fontSize: 12, color: C.muted }}>{p.location}</div>}
                    {p.client_name && <div style={{ fontSize: 12, color: C.muted }}>{p.client_name}</div>}
                  </div>
                  <Badge label={p.status} color={p.status === "active" ? C.green : C.muted} />
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: C.muted }}>Created {new Date(p.created_at).toLocaleDateString("en-KE")}</div>
              </Card>
            ))
      }
    </div>
  );
};

const InspectionApp = ({ auth, project, onBack }) => {
  const [tab, setTab] = useState("home");
  const [photos, setPhotos] = useState([]);
  const [defects, setDefects] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [toast, setToast] = useState({ msg: "", type: "" });
  const [inspectionId, setInspectionId] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 2500);
  };

  useEffect(() => {
    const initInspection = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const existing = await sb.select("inspections",
          `project_id=eq.${project.id}&date=eq.${today}&inspector_id=eq.${auth.user.id}&select=id`, auth.token);
        if (Array.isArray(existing) && existing.length > 0) {
          setInspectionId(existing[0].id);
        } else {
          const created = await sb.insert("inspections", {
            project_id: project.id, inspector_id: auth.user.id,
            date: today, weather: "Not recorded", workers_count: 0,
          }, auth.token);
          if (Array.isArray(created) && created[0]) setInspectionId(created[0].id);
        }
      } catch (e) { console.error("Inspection init:", e); }
    };
    initInspection();
  }, [project.id, auth]);

  const tabs = [
    { id: "home", icon: "home", label: "Home" },
    { id: "photos", icon: "camera", label: "Photos" },
    { id: "drawings", icon: "blueprint", label: "Drawings" },
    { id: "compare", icon: "compare", label: "Compare" },
    { id: "defects", icon: "defect", label: "Defects" },
    { id: "report", icon: "report", label: "Report" },
    { id: "finishes", icon: "palette", label: "Finishes" },
  ];

  const PhotoScreen = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState("");
    const [locationNote, setLocationNote] = useState("");

    const handleUploadAndAnalyse = async () => {
      if (!file) return;
      setLoading(true);
      try {
        const b64 = await fileToBase64(file);
        const aiResult = await callAI("You are a construction site inspection AI. Analyse this site photo. Identify: 1) Construction stage 2) Safety hazards 3) Workmanship quality 4) Materials present 5) Immediate concerns. Be concise with bullet points.", b64);
        setAnalysis(aiResult);
        const path = `${project.id}/${Date.now()}_${file.name}`;
        let publicUrl = preview;
        try { publicUrl = await sb.uploadFile("site-photos", path, file, auth.token); } catch {}
        if (inspectionId) {
          const saved = await sb.insert("site_photos", {
            inspection_id: inspectionId, project_id: project.id,
            storage_path: path, public_url: publicUrl,
            ai_analysis: aiResult, location_note: locationNote,
            uploaded_by: auth.user.id,
          }, auth.token);
          if (Array.isArray(saved) && saved[0]) setPhotos(p => [...p, { ...saved[0], preview: publicUrl, analysis: aiResult }]);
        }
        showToast("Photo saved!");
      } catch { showToast("Failed to save photo", "error"); }
      setLoading(false);
    };

    return (
      <div>
        <SectionHead icon="camera" title="Site Photos" sub="Upload, analyse & save to project" />
        <UploadZone label="Tap to upload site photo" accept="image/*"
          onFile={f => { setFile(f); setPreview(URL.createObjectURL(f)); setAnalysis(""); }} preview={preview} />
        {preview && (
          <>
            <Input label="Location / Element (optional)" value={locationNote} onChange={setLocationNote} placeholder="e.g. Column B4, North wall" />
            <Btn label={loading ? "Saving…" : "Analyse & Save"} icon={loading ? "loader" : "sparkle"} onClick={handleUploadAndAnalyse} disabled={loading} />
          </>
        )}
        {(loading || analysis) && <ResultBlock text={analysis} loading={loading} />}
        {photos.length > 0 && (
          <>
            <h4 style={{ margin: "16px 0 8px", fontSize: 12, color: C.muted, textTransform: "uppercase" }}>Saved This Session ({photos.length})</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {photos.map((p, i) => (
                <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
                  <img src={p.preview || p.public_url} alt="" style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} />
                  <div style={{ padding: "5px 8px", background: C.card }}><Badge label="Saved" color={C.green} /></div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const DefectScreen = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState("");
    const [severity, setSeverity] = useState(null);
    const [locationNote, setLocationNote] = useState("");
    const sevColor = { Critical: C.red, High: "#F97316", Medium: C.accent, Low: C.green };

    const detect = async () => {
      if (!file) return;
      setLoading(true); setResult(""); setSeverity(null);
      try {
        const b64 = await fileToBase64(file);
        const res = await callAI(`You are a construction defect detection expert.\nSEVERITY: [Critical/High/Medium/Low]\nDEFECTS FOUND:\n• list each\nROOT CAUSES:\n• list\nIMMEDIATE ACTION:\n• list\nLONG-TERM FIX:\n• list\nSAFETY RISK: Yes/No`, b64);
        const sevMatch = res.match(/SEVERITY:\s*(Critical|High|Medium|Low)/i);
        const detectedSev = sevMatch?.[1] || "Medium";
        setSeverity(detectedSev); setResult(res);
        const path = `${project.id}/defects/${Date.now()}_${file.name}`;
        let publicUrl = preview;
        try { publicUrl = await sb.uploadFile("site-photos", path, file, auth.token); } catch {}
        if (inspectionId) {
          const saved = await sb.insert("defects", {
            inspection_id: inspectionId, project_id: project.id,
            severity: detectedSev, description: res.split("\n")[2] || "See AI analysis",
            ai_analysis: res, location_note: locationNote, status: "open", created_by: auth.user.id,
          }, auth.token);
          if (Array.isArray(saved) && saved[0]) setDefects(d => [...d, { ...saved[0], preview: publicUrl }]);
        }
        showToast(`${detectedSev} defect logged!`, detectedSev === "Critical" ? "error" : "success");
      } catch { setResult("Detection failed. Try again."); }
      setLoading(false);
    };

    return (
      <div>
        <SectionHead icon="defect" title="Defect Detection" sub="AI scans & logs defects to database" />
        <UploadZone label="Upload photo to scan" accept="image/*"
          onFile={f => { setFile(f); setPreview(URL.createObjectURL(f)); setResult(""); setSeverity(null); }} preview={preview} />
        {preview && (
          <>
            <Input label="Location" value={locationNote} onChange={setLocationNote} placeholder="e.g. Ground floor, Column A2" />
            <Btn label={loading ? "Scanning…" : "Detect & Log Defect"} icon={loading ? "loader" : "defect"} color={C.red} textColor={C.text} onClick={detect} disabled={loading} />
          </>
        )}
        {severity && (
          <div style={{ marginTop: 10, padding: "9px 14px", borderRadius: 10, background: (sevColor[severity]||C.accent)+"22", border:`1px solid ${(sevColor[severity]||C.accent)}44`, display:"flex", alignItems:"center", gap:8 }}>
            <Icon name="defect" size={16} color={sevColor[severity]} />
            <span style={{ color: sevColor[severity], fontWeight: 800, fontSize: 13 }}>{severity} Severity — Logged</span>
          </div>
        )}
        {(loading || result) && <ResultBlock text={result} loading={loading} />}
        {defects.length > 0 && (
          <>
            <h4 style={{ margin: "16px 0 8px", fontSize: 12, color: C.muted, textTransform: "uppercase" }}>Session Defects ({defects.length})</h4>
            {defects.map((d, i) => (
              <Card key={i} style={{ display: "flex", gap: 10, padding: "10px 12px" }}>
                {d.preview && <img src={d.preview} alt="" style={{ width: 46, height: 46, objectFit: "cover", borderRadius: 7 }} />}
                <div><Badge label={d.severity} color={sevColor[d.severity]||C.muted} /><div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{d.location_note||"No location"}</div></div>
              </Card>
            ))}
          </>
        )}
      </div>
    );
  };

  const ReportScreen = () => {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState("");
    const [saved, setSaved] = useState(false);
    const [weather, setWeather] = useState("Sunny");
    const [workers, setWorkers] = useState("0");

    const generate = async () => {
      setLoading(true); setReport(""); setSaved(false);
      try {
        const res = await callAI(`Generate a professional construction site daily inspection report:
Project: ${project.name} | Date: ${new Date().toLocaleDateString("en-KE")} | Inspector: ${auth.name} | Weather: ${weather} | Workers: ${workers} | Photos: ${photos.length} | Defects: ${defects.length}
Include: Executive Summary, Work Progress, Quality Observations, Safety Status, Defects, Resources, Tomorrow Plan, Sign-off.`);
        setReport(res);
        if (inspectionId) {
          await sb.update("inspections", inspectionId, { weather, workers_count: parseInt(workers)||0 }, auth.token);
          await sb.insert("reports", { inspection_id: inspectionId, project_id: project.id, content: res, report_date: new Date().toISOString().split("T")[0], generated_by: auth.user.id }, auth.token);
          setSaved(true);
          showToast("Report saved!");
        }
      } catch { setReport("Report generation failed."); }
      setLoading(false);
    };

    return (
      <div>
        <SectionHead icon="report" title="Daily Report" sub="AI-generated & saved to project records" />
        <Card>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex:1, background:C.tag, borderRadius:8, padding:"8px", textAlign:"center" }}><div style={{ fontSize:20, fontWeight:900, color:C.accent }}>{photos.length}</div><div style={{ fontSize:10, color:C.muted }}>Photos</div></div>
            <div style={{ flex:1, background:C.tag, borderRadius:8, padding:"8px", textAlign:"center" }}><div style={{ fontSize:20, fontWeight:900, color:C.red }}>{defects.length}</div><div style={{ fontSize:10, color:C.muted }}>Defects</div></div>
          </div>
          <Input label="Weather" value={weather} onChange={setWeather} placeholder="Sunny / Cloudy / Rainy" />
          <Input label="Workers on Site" value={workers} onChange={setWorkers} placeholder="0" />
        </Card>
        <Btn label={loading ? "Generating…" : "Generate & Save Repo
);
