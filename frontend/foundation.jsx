/**
 * vkTUNEos KILLER UI - SESSION 1: FOUNDATION
 * ============================================
 * HTML structure, CSS tokens, Zustand store, API client, Layout components
 */

// ============================================================================
// HTML HEAD STRUCTURE (for final assembly)
// ============================================================================
/*
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>vkTUNEos | AI Music Production Platform</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%2306b6d4' rx='20' width='100' height='100'/><text x='50' y='68' font-size='50' text-anchor='middle' fill='white'>vK</text></svg>">

  <!-- React 18 -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.min.js"></script>

  <!-- Axios -->
  <script src="https://unpkg.com/axios/dist/axios.min.js"></script>

  <!-- Socket.io Client -->
  <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>

  <!-- Zustand -->
  <script src="https://unpkg.com/zustand@4/umd/vanilla.production.js"></script>

  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</head>
*/

// ============================================================================
// CSS DESIGN TOKENS
// ============================================================================
const cssTokens = `
  :root {
    /* Background Colors */
    --bg-void: #0a0a0f;
    --bg-surface: #111118;
    --bg-card: #22222e;
    --bg-elevated: #2a2a38;

    /* Text Colors */
    --text-primary: #f0f0f5;
    --text-secondary: #a0a0b0;
    --text-muted: #606070;

    /* Primary Palette (Cyan) */
    --primary-400: #22d3ee;
    --primary-500: #06b6d4;
    --primary-600: #0891b2;

    /* Accent Palette (Pink) */
    --accent-400: #f472b6;
    --accent-500: #ec4899;
    --accent-600: #db2777;

    /* Semantic Colors */
    --success-500: #22c55e;
    --warning-500: #eab308;
    --error-500: #ef4444;

    /* Borders */
    --border-subtle: rgba(255,255,255,0.08);
    --border-default: rgba(255,255,255,0.12);

    /* Spacing Scale */
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-5: 1.25rem;
    --space-6: 1.5rem;
    --space-8: 2rem;
    --space-10: 2.5rem;
    --space-12: 3rem;
    --space-16: 4rem;

    /* Border Radius */
    --radius-sm: 0.375rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
    --radius-xl: 1rem;
    --radius-2xl: 1.5rem;

    /* Font Families */
    --font-display: 'Space Grotesk', sans-serif;
    --font-body: 'Inter', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;

    /* Shadows */
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.4);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.4);
    --shadow-lg: 0 10px 15px rgba(0,0,0,0.4);
    --shadow-glow-primary: 0 0 30px rgba(6,182,212,0.3);
    --shadow-glow-accent: 0 0 30px rgba(236,72,153,0.3);
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: var(--font-body);
    background: var(--bg-void);
    color: var(--text-primary);
    overflow-x: hidden;
    min-height: 100vh;
  }

  .font-display { font-family: var(--font-display); }
  .font-mono { font-family: var(--font-mono); }

  /* Mesh Background */
  .mesh-bg {
    position: fixed;
    inset: 0;
    z-index: -1;
    background:
      radial-gradient(ellipse 80% 50% at 20% 40%, rgba(6,182,212,0.12), transparent),
      radial-gradient(ellipse 60% 40% at 80% 20%, rgba(236,72,153,0.08), transparent),
      radial-gradient(ellipse 50% 60% at 60% 80%, rgba(34,211,238,0.06), transparent),
      var(--bg-void);
  }

  /* Glass Effect */
  .glass {
    background: rgba(255,255,255,0.03);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--border-subtle);
  }

  .glass:hover {
    border-color: rgba(6,182,212,0.4);
  }

  .glass-solid {
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
  }

  /* Glow Effects */
  .glow-primary { box-shadow: var(--shadow-glow-primary); }
  .glow-accent { box-shadow: var(--shadow-glow-accent); }

  /* Animations */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }

  .animate-fade-up { animation: fadeUp 0.4s ease-out forwards; }
  .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
  .animate-spin { animation: spin 1s linear infinite; }
  .animate-pulse { animation: pulse 2s ease-in-out infinite; }
  .animate-slide-in { animation: slideInRight 0.3s ease-out forwards; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg-surface); }
  ::-webkit-scrollbar-thumb {
    background: var(--bg-elevated);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: var(--text-muted);
  }

  /* Gradient Text */
  .gradient-text {
    background: linear-gradient(135deg, var(--primary-400), var(--accent-500));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Button Base */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    font-weight: 500;
    font-size: 0.875rem;
    border-radius: var(--radius-lg);
    transition: all 0.2s ease;
    cursor: pointer;
    border: none;
    outline: none;
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
    color: white;
  }
  .btn-primary:hover {
    box-shadow: var(--shadow-glow-primary);
    transform: translateY(-1px);
  }

  .btn-secondary {
    background: var(--bg-elevated);
    color: var(--text-primary);
    border: 1px solid var(--border-default);
  }
  .btn-secondary:hover {
    background: var(--bg-card);
    border-color: var(--primary-500);
  }

  .btn-ghost {
    background: transparent;
    color: var(--text-secondary);
  }
  .btn-ghost:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
  }

  .btn-danger {
    background: var(--error-500);
    color: white;
  }
  .btn-danger:hover {
    opacity: 0.9;
  }
`;

// ============================================================================
// ZUSTAND STORE (Vanilla JS implementation for browser)
// ============================================================================
const createStore = (initialState) => {
  let state = initialState;
  const listeners = new Set();

  const getState = () => state;

  const setState = (partial) => {
    const nextState = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...nextState };
    listeners.forEach((listener) => listener(state));

    // Persist to localStorage
    try {
      localStorage.setItem('vktuneos-store', JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to persist state:', e);
    }
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  // Hydrate from localStorage
  try {
    const persisted = localStorage.getItem('vktuneos-store');
    if (persisted) {
      state = { ...state, ...JSON.parse(persisted) };
    }
  } catch (e) {
    console.warn('Failed to hydrate state:', e);
  }

  return { getState, setState, subscribe };
};

// Store instance
const useStore = createStore({
  // Auth
  user: null,
  token: null,

  // Tenant
  currentTenant: null,
  tenants: [],

  // UI State
  sidebarCollapsed: false,
  currentPage: 'dashboard',
  searchQuery: '',

  // Audio State
  currentTrack: null,
  isPlaying: false,
  volume: 0.8,
  stems: {
    vocals: { volume: 1, muted: false },
    drums: { volume: 1, muted: false },
    bass: { volume: 1, muted: false },
    melody: { volume: 1, muted: false },
    other: { volume: 1, muted: false }
  },

  // Notifications
  notifications: [],

  // Modal State
  activeModal: null,
  modalData: null,

  // Theme
  theme: 'dark'
});

// Store Actions
const storeActions = {
  // Auth
  setAuth: (user, token) => useStore.setState({ user, token }),
  logout: () => {
    useStore.setState({ user: null, token: null, currentTenant: null });
    localStorage.removeItem('vktuneos-store');
  },

  // Tenant
  setTenant: (tenant) => useStore.setState({ currentTenant: tenant }),
  setTenants: (tenants) => useStore.setState({ tenants }),

  // UI
  toggleSidebar: () => useStore.setState((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setPage: (page) => useStore.setState({ currentPage: page }),
  setSearchQuery: (query) => useStore.setState({ searchQuery: query }),

  // Audio
  setCurrentTrack: (track) => useStore.setState({ currentTrack: track }),
  setPlaying: (playing) => useStore.setState({ isPlaying: playing }),
  setVolume: (volume) => useStore.setState({ volume }),
  setStemVolume: (stem, volume) => useStore.setState((s) => ({
    stems: { ...s.stems, [stem]: { ...s.stems[stem], volume } }
  })),
  toggleStemMute: (stem) => useStore.setState((s) => ({
    stems: { ...s.stems, [stem]: { ...s.stems[stem], muted: !s.stems[stem].muted } }
  })),

  // Notifications
  addNotification: (notification) => useStore.setState((s) => ({
    notifications: [
      { id: Date.now(), timestamp: new Date().toISOString(), ...notification },
      ...s.notifications.slice(0, 49)
    ]
  })),
  clearNotifications: () => useStore.setState({ notifications: [] }),
  markNotificationRead: (id) => useStore.setState((s) => ({
    notifications: s.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    )
  })),

  // Modal
  openModal: (modal, data = null) => useStore.setState({ activeModal: modal, modalData: data }),
  closeModal: () => useStore.setState({ activeModal: null, modalData: null })
};

// React hook for store
const useStoreHook = () => {
  const [state, setState] = React.useState(useStore.getState());

  React.useEffect(() => {
    return useStore.subscribe(setState);
  }, []);

  return { ...state, ...storeActions };
};

// ============================================================================
// API CLIENT (Axios-based)
// ============================================================================
const API_BASE_URL = window.location.origin;

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for auth
apiClient.interceptors.request.use((config) => {
  const state = useStore.getState();

  if (state.token) {
    config.headers.Authorization = `Bearer ${state.token}`;
  }

  if (state.currentTenant?.id) {
    config.headers['X-Tenant-ID'] = state.currentTenant.id;
  }

  return config;
}, (error) => Promise.reject(error));

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      storeActions.logout();
    }
    return Promise.reject(error);
  }
);

// API Functions
const api = {
  // Health
  health: () => apiClient.get('/health'),

  // Stats
  getStatsOverview: () => apiClient.get('/api/v1/stats/overview'),

  // Activity
  getRecentActivity: () => apiClient.get('/api/v1/activity/recent'),

  // Music
  generateMusic: (data) => apiClient.post('/api/v1/music/generate', data),
  getMusicStatus: (id) => apiClient.get(`/api/v1/music/status/${id}`),

  // Voice
  cloneVoice: (data) => apiClient.post('/api/v1/voice/clone', data),
  convertVoice: (data) => apiClient.post('/api/v1/voice/convert', data),
  getVoiceModels: () => apiClient.get('/api/v1/voice/models'),

  // Stems
  separateStems: (data) => apiClient.post('/api/v1/stems/separate', data),

  // Video
  generateVideo: (data) => apiClient.post('/api/v1/video/generate', data),
  lipSync: (data) => apiClient.post('/api/v1/video/lipsync', data),
  generateCaptions: (data) => apiClient.post('/api/v1/captions/generate', data),
  exportVideo: (data) => apiClient.post('/api/v1/video/export', data),

  // Coordinates
  getCoordinates: (params) => apiClient.get('/api/v1/coordinates', { params }),
  getCoordinateTree: () => apiClient.get('/api/v1/coordinates/tree'),
  createCoordinate: (data) => apiClient.post('/api/v1/coordinates', data),
  updateCoordinate: (id, data) => apiClient.put(`/api/v1/coordinates/${id}`, data),
  deleteCoordinate: (id) => apiClient.delete(`/api/v1/coordinates/${id}`),

  // Assets
  getAssets: (params) => apiClient.get('/api/v1/assets', { params }),
  getAsset: (id) => apiClient.get(`/api/v1/assets/${id}`),

  // Workflows
  getWorkflows: () => apiClient.get('/api/v1/workflows'),
  createWorkflow: (data) => apiClient.post('/api/v1/workflows', data),
  executeWorkflow: (id) => apiClient.post(`/api/v1/workflows/${id}/execute`),

  // Tenants
  getTenants: () => apiClient.get('/api/v1/tenants'),
  createTenant: (data) => apiClient.post('/api/v1/tenants', data),
  updateTenant: (id, data) => apiClient.put(`/api/v1/tenants/${id}`, data),
  deleteTenant: (id) => apiClient.delete(`/api/v1/tenants/${id}`),

  // Audit
  getAuditLogs: (params) => apiClient.get('/api/v1/audit', { params }),

  // Killer Features
  chatWithCollaborator: (data) => apiClient.post('/api/v1/collaborator/chat', data),
  scanCopyright: (data) => apiClient.post('/api/v1/copyright/scan', data),
  getProjectRights: (projectId) => apiClient.get(`/api/v1/projects/${projectId}/rights`),

  // Usage
  getUsage: () => apiClient.get('/api/v1/usage'),

  // Schema
  getSchema: () => apiClient.get('/api/v1/schema')
};

// ============================================================================
// ICON COMPONENTS (Lucide React style)
// ============================================================================
const Icon = ({ name, size = 20, className = '' }) => {
  const iconPaths = {
    home: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>,
    music: <><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>,
    mic: <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></>,
    video: <><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></>,
    layers: <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
    workflow: <><rect width="8" height="4" x="3" y="3" rx="1"/><rect width="8" height="4" x="13" y="17" rx="1"/><rect width="8" height="4" x="3" y="17" rx="1"/><path d="M7 7v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7"/><path d="M7 17v-3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
    menu: <><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></>,
    chevronLeft: <path d="m15 18-6-6 6-6"/>,
    chevronRight: <path d="m9 18 6-6-6-6"/>,
    chevronDown: <path d="m6 9 6 6 6-6"/>,
    x: <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
    plus: <><path d="M5 12h14"/><path d="M12 5v14"/></>,
    check: <path d="M20 6 9 17l-5-5"/>,
    sparkles: <><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></>,
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    database: <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></>,
    refresh: <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></>,
    play: <polygon points="5 3 19 12 5 21 5 3"/>,
    pause: <><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></>,
    volume2: <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></>,
    volumeX: <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></>,
    folder: <><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></>,
    file: <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></>,
    filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>,
    messageSquare: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
    grid: <><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></>,
    list: <><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></>,
    activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
    trendingUp: <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
    alertCircle: <><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></>
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {iconPaths[name] || iconPaths.home}
    </svg>
  );
};

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================
const Sidebar = ({ collapsed, onToggle, currentPage, onPageChange }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'music', label: 'Music Studio', icon: 'music' },
    { id: 'voice', label: 'Voice Lab', icon: 'mic' },
    { id: 'video', label: 'Video Studio', icon: 'video' },
    { id: 'coordinates', label: 'Coordinates', icon: 'database' },
    { id: 'workflows', label: 'Workflows', icon: 'workflow' },
    { id: 'tenants', label: 'Tenants', icon: 'users' },
    { id: 'audit', label: 'Audit Log', icon: 'shield' },
    { id: 'killer', label: 'Killer Features', icon: 'sparkles' }
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-20' : 'w-64'
      }`}
      style={{
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)'
      }}
    >
      {/* Logo */}
      <div
        className="h-16 flex items-center justify-between px-4"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-lg"
            style={{
              background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
              color: 'white'
            }}
          >
            vK
          </div>
          {!collapsed && (
            <div>
              <div className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                vkTUNEos
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Music Kernel v1.0
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-3 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-left ${
                collapsed ? 'justify-center' : ''
              }`}
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(236,72,153,0.1))'
                  : 'transparent',
                color: isActive ? 'var(--primary-400)' : 'var(--text-secondary)',
                border: isActive ? '1px solid rgba(6,182,212,0.3)' : '1px solid transparent'
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
              title={collapsed ? item.label : ''}
            >
              <Icon name={item.icon} size={20} />
              {!collapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div
        className="absolute bottom-0 left-0 right-0 p-3"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <button
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors w-full ${
            collapsed ? 'justify-center' : ''
          }`}
          style={{ color: 'var(--text-secondary)' }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--bg-elevated)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <Icon name="settings" size={20} />
          {!collapsed && <span className="font-medium text-sm">Settings</span>}
        </button>
      </div>
    </aside>
  );
};

// ============================================================================
// HEADER COMPONENT
// ============================================================================
const Header = ({ searchQuery, onSearchChange, notifications, onNotificationClick, user }) => {
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header
      className="h-16 flex items-center justify-between px-6"
      style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)'
      }}
    >
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Icon
          name="search"
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          placeholder="Search assets, projects, workflows..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary-500)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
        />
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-xs font-mono"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-muted)'
          }}
        >
          ⌘K
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl transition-colors"
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <Icon name="bell" size={20} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                style={{
                  background: 'var(--accent-500)',
                  color: 'white'
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div
              className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto rounded-xl shadow-lg animate-fade-up"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div
                className="p-4 font-semibold flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ background: 'var(--accent-500)', color: 'white' }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="p-6 text-center" style={{ color: 'var(--text-muted)' }}>
                  No notifications yet
                </div>
              ) : (
                notifications.slice(0, 10).map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => onNotificationClick(notif.id)}
                    className="p-4 cursor-pointer transition-colors"
                    style={{
                      background: notif.read ? 'transparent' : 'rgba(6,182,212,0.05)',
                      borderBottom: '1px solid var(--border-subtle)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseOut={(e) => e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(6,182,212,0.05)'}
                  >
                    <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {notif.title}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {notif.message}
                    </div>
                    <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                      {new Date(notif.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-2 rounded-xl transition-colors"
            style={{ background: 'var(--bg-card)' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold"
              style={{
                background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
                color: 'white'
              }}
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {user?.name || 'User'}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {user?.role || 'Creator'}
              </div>
            </div>
            <Icon name="chevronDown" size={16} style={{ color: 'var(--text-muted)' }} />
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div
              className="absolute right-0 top-14 w-48 rounded-xl shadow-lg animate-fade-up overflow-hidden"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <button
                className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                style={{ color: 'var(--text-secondary)' }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <Icon name="user" size={18} />
                <span className="text-sm">Profile</span>
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                style={{ color: 'var(--text-secondary)' }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <Icon name="settings" size={18} />
                <span className="text-sm">Settings</span>
              </button>
              <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                  style={{ color: 'var(--error-500)' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Icon name="logout" size={18} />
                  <span className="text-sm">Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// ============================================================================
// PAGE CONTAINER COMPONENT
// ============================================================================
const PageContainer = ({ children, sidebarCollapsed }) => {
  return (
    <main
      className="min-h-screen transition-all duration-300"
      style={{
        marginLeft: sidebarCollapsed ? '80px' : '256px',
        paddingTop: '64px'
      }}
    >
      <div className="p-6">
        {children}
      </div>
    </main>
  );
};

// ============================================================================
// MODAL COMPONENT
// ============================================================================
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl'
  };

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      />

      {/* Modal Content */}
      <div
        className={`relative w-full ${sizeClasses[size]} animate-fade-up rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col`}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <h2 className="text-lg font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--bg-elevated)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PAGE HEADER COMPONENT
// ============================================================================
const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// LAYOUT WRAPPER
// ============================================================================
const Layout = ({ children }) => {
  const store = useStoreHook();

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-void)' }}>
      {/* Mesh Background */}
      <div className="mesh-bg" />

      {/* Sidebar */}
      <Sidebar
        collapsed={store.sidebarCollapsed}
        onToggle={store.toggleSidebar}
        currentPage={store.currentPage}
        onPageChange={store.setPage}
      />

      {/* Header */}
      <div
        className="fixed top-0 right-0 z-40 transition-all duration-300"
        style={{ left: store.sidebarCollapsed ? '80px' : '256px' }}
      >
        <Header
          searchQuery={store.searchQuery}
          onSearchChange={store.setSearchQuery}
          notifications={store.notifications}
          onNotificationClick={store.markNotificationRead}
          user={store.user}
        />
      </div>

      {/* Page Content */}
      <PageContainer sidebarCollapsed={store.sidebarCollapsed}>
        {children}
      </PageContainer>

      {/* Modal */}
      <Modal
        isOpen={!!store.activeModal}
        onClose={store.closeModal}
        title={store.modalData?.title || 'Modal'}
        size={store.modalData?.size || 'md'}
      >
        {store.modalData?.content}
      </Modal>
    </div>
  );
};

// ============================================================================
// EXPORTS (for use in other session files)
// ============================================================================
// When combining, these will be available globally:
// - cssTokens (string)
// - useStore (store object)
// - storeActions (object)
// - useStoreHook (React hook)
// - api (API client)
// - apiClient (axios instance)
// - Icon (component)
// - Sidebar (component)
// - Header (component)
// - PageContainer (component)
// - Modal (component)
// - PageHeader (component)
// - Layout (component)

console.log('vkTUNEos Foundation loaded successfully!');
console.log('Store initialized:', useStore.getState());

// Make globally available
window.vkTUNEos = {
  cssTokens,
  useStore,
  storeActions,
  useStoreHook,
  api,
  apiClient,
  Icon,
  Sidebar,
  Header,
  PageContainer,
  Modal,
  PageHeader,
  Layout
};
