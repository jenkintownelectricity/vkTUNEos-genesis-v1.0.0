/**
 * vkTUNEos KILLER UI - SESSION 4: PAGES 1-5
 * ==========================================
 * Dashboard, Music Studio, Voice Lab, Video Studio, Coordinates
 */

// ============================================================================
// PAGE 1: DASHBOARD
// ============================================================================
const DashboardPage = ({ api, store }) => {
  const [stats, setStats] = React.useState(null);
  const [activity, setActivity] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Mock data for demo
      setStats({
        totalTracks: 1247,
        voiceModels: 23,
        workflows: 8,
        apiCalls: '45.2K',
        storageUsed: '12.4 GB',
        creditsRemaining: 8500
      });

      setActivity([
        { id: 1, type: 'music', action: 'Generated track', title: 'Summer Vibes', time: '2 min ago', status: 'completed' },
        { id: 2, type: 'voice', action: 'Cloned voice', title: 'Sarah Voice Model', time: '15 min ago', status: 'completed' },
        { id: 3, type: 'video', action: 'Exported video', title: 'Music Video v2', time: '1 hour ago', status: 'completed' },
        { id: 4, type: 'workflow', action: 'Ran workflow', title: 'Auto-Master Pipeline', time: '2 hours ago', status: 'completed' },
        { id: 5, type: 'music', action: 'Generating track', title: 'Night Drive Beat', time: 'In progress', status: 'running' }
      ]);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
    setLoading(false);
  };

  const statCards = [
    { label: 'Total Tracks', value: stats?.totalTracks || 0, icon: 'music', color: 'primary' },
    { label: 'Voice Models', value: stats?.voiceModels || 0, icon: 'mic', color: 'accent' },
    { label: 'Workflows', value: stats?.workflows || 0, icon: 'workflow', color: 'success' },
    { label: 'API Calls', value: stats?.apiCalls || 0, icon: 'activity', color: 'warning' }
  ];

  const quickActions = [
    { label: 'Generate Music', icon: 'music', page: 'music', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
    { label: 'Clone Voice', icon: 'mic', page: 'voice', gradient: 'linear-gradient(135deg, #ec4899, #db2777)' },
    { label: 'Create Video', icon: 'video', page: 'video', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
    { label: 'Run Workflow', icon: 'workflow', page: 'workflows', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' }
  ];

  const getActivityIcon = (type) => {
    const icons = {
      music: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
      voice: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>,
      video: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>,
      workflow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="8" height="4" x="3" y="3" rx="1"/><path d="M7 7v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7"/></svg>
    };
    return icons[type] || icons.music;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Welcome back! Here's what's happening.</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loading ? 'animate-spin' : ''}>
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className="p-5 rounded-xl transition-all hover:scale-[1.02]"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
                {loading ? (
                  <div className="w-16 h-8 rounded animate-pulse" style={{ background: 'var(--bg-elevated)' }} />
                ) : (
                  <p className="text-2xl font-display font-bold">{stat.value.toLocaleString?.() || stat.value}</p>
                )}
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(236,72,153,0.1))' }}
              >
                {getActivityIcon(stat.icon)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-display font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickActions.map((action, i) => (
          <button
            key={i}
            onClick={() => store?.setPage?.(action.page)}
            className="p-5 rounded-xl text-left transition-all hover:scale-[1.02]"
            style={{ background: action.gradient }}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.2)' }}>
              {getActivityIcon(action.icon)}
            </div>
            <p className="font-semibold text-white">{action.label}</p>
          </button>
        ))}
      </div>

      {/* Activity Feed */}
      <h2 className="text-lg font-display font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Activity</h2>
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg animate-pulse" style={{ background: 'var(--bg-elevated)' }} />
                <div className="flex-1">
                  <div className="w-32 h-4 rounded animate-pulse mb-2" style={{ background: 'var(--bg-elevated)' }} />
                  <div className="w-24 h-3 rounded animate-pulse" style={{ background: 'var(--bg-elevated)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          activity.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 transition-colors"
              style={{ borderBottom: i < activity.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--bg-elevated)', color: 'var(--primary-400)' }}
              >
                {getActivityIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {item.action}: <span style={{ color: 'var(--primary-400)' }}>{item.title}</span>
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.time}</p>
              </div>
              <span
                className="px-2.5 py-1 text-xs font-medium rounded-full"
                style={{
                  background: item.status === 'completed' ? 'rgba(34,197,94,0.15)' : 'rgba(6,182,212,0.15)',
                  color: item.status === 'completed' ? 'var(--success-500)' : 'var(--primary-400)'
                }}
              >
                {item.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// PAGE 2: MUSIC STUDIO
// ============================================================================
const MusicStudioPage = ({ api, store }) => {
  const [prompt, setPrompt] = React.useState('');
  const [duration, setDuration] = React.useState(30);
  const [tempo, setTempo] = React.useState(120);
  const [key, setKey] = React.useState({ value: 'C', label: 'C Major' });
  const [generating, setGenerating] = React.useState(false);
  const [generatedTrack, setGeneratedTrack] = React.useState(null);
  const [stems, setStems] = React.useState({
    vocals: { volume: 100, muted: false },
    drums: { volume: 100, muted: false },
    bass: { volume: 100, muted: false },
    melody: { volume: 100, muted: false },
    other: { volume: 100, muted: false }
  });

  const keyOptions = [
    { value: 'C', label: 'C Major' }, { value: 'Cm', label: 'C Minor' },
    { value: 'D', label: 'D Major' }, { value: 'Dm', label: 'D Minor' },
    { value: 'E', label: 'E Major' }, { value: 'Em', label: 'E Minor' },
    { value: 'F', label: 'F Major' }, { value: 'Fm', label: 'F Minor' },
    { value: 'G', label: 'G Major' }, { value: 'Gm', label: 'G Minor' },
    { value: 'A', label: 'A Major' }, { value: 'Am', label: 'A Minor' },
    { value: 'B', label: 'B Major' }, { value: 'Bm', label: 'B Minor' }
  ];

  const exportFormats = ['WAV', 'MP3', 'FLAC', 'Stems (ZIP)'];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3000));

    setGeneratedTrack({
      id: Date.now(),
      title: prompt.slice(0, 30),
      duration: duration,
      tempo: tempo,
      key: key.label,
      createdAt: new Date().toISOString()
    });

    setGenerating(false);
  };

  const handleStemVolume = (stem, value) => {
    setStems(prev => ({ ...prev, [stem]: { ...prev[stem], volume: value } }));
  };

  const toggleStemMute = (stem) => {
    setStems(prev => ({ ...prev, [stem]: { ...prev[stem], muted: !prev[stem].muted } }));
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>Music Studio</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Generate, edit, and export AI-powered music</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Form */}
        <div className="lg:col-span-2">
          <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Generate Music</h2>

            {/* Prompt Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the music you want to create... e.g., 'Upbeat summer pop track with catchy synths and energetic drums'"
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Parameters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Duration: {duration}s
                </label>
                <input
                  type="range"
                  min="15"
                  max="180"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, var(--primary-500) 0%, var(--primary-500) ${((duration - 15) / 165) * 100}%, var(--bg-elevated) ${((duration - 15) / 165) * 100}%, var(--bg-elevated) 100%)` }}
                />
              </div>

              {/* Tempo */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Tempo: {tempo} BPM
                </label>
                <input
                  type="range"
                  min="60"
                  max="200"
                  value={tempo}
                  onChange={(e) => setTempo(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, var(--primary-500) 0%, var(--primary-500) ${((tempo - 60) / 140) * 100}%, var(--bg-elevated) ${((tempo - 60) / 140) * 100}%, var(--bg-elevated) 100%)` }}
                />
              </div>

              {/* Key */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Key</label>
                <select
                  value={key.value}
                  onChange={(e) => setKey(keyOptions.find(k => k.value === e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                >
                  {keyOptions.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                </select>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || generating}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))' }}
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                  </svg>
                  Generate Music
                </span>
              )}
            </button>
          </div>

          {/* Generated Track */}
          {generatedTrack && (
            <div className="mt-6 rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Generated Track</h2>
              <div className="flex items-center gap-4 p-4 rounded-xl mb-4" style={{ background: 'var(--bg-elevated)' }}>
                <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{generatedTrack.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{generatedTrack.duration}s • {generatedTrack.tempo} BPM • {generatedTrack.key}</p>
                </div>
              </div>

              {/* Waveform Placeholder */}
              <div className="h-16 rounded-lg mb-4 flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 50 }, (_, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full"
                      style={{
                        height: `${Math.random() * 40 + 10}px`,
                        background: i < 25 ? 'linear-gradient(to top, var(--primary-500), var(--accent-500))' : 'rgba(255,255,255,0.2)'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Export Dropdown */}
              <div className="flex gap-3">
                {exportFormats.map(format => (
                  <button
                    key={format}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary-500)'; e.currentTarget.style.color = 'var(--primary-400)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stem Mixer */}
        <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Stem Mixer</h2>

          <div className="space-y-6">
            {Object.entries(stems).map(([stem, { volume, muted }]) => (
              <div key={stem}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium capitalize" style={{ color: muted ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    {stem}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{volume}%</span>
                    <button
                      onClick={() => toggleStemMute(stem)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ background: muted ? 'var(--error-500)' : 'var(--bg-elevated)' }}
                    >
                      {muted ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/>
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={muted ? 0 : volume}
                  onChange={(e) => handleStemVolume(stem, Number(e.target.value))}
                  disabled={muted}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-50"
                  style={{ background: `linear-gradient(to right, var(--primary-500) 0%, var(--primary-500) ${muted ? 0 : volume}%, var(--bg-elevated) ${muted ? 0 : volume}%, var(--bg-elevated) 100%)` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PAGE 3: VOICE LAB
// ============================================================================
const VoiceLabPage = ({ api, store }) => {
  const [activeTab, setActiveTab] = React.useState('clone');
  const [uploadedFile, setUploadedFile] = React.useState(null);
  const [voiceName, setVoiceName] = React.useState('');
  const [training, setTraining] = React.useState(false);
  const [voiceModels, setVoiceModels] = React.useState([
    { id: 1, name: 'Sarah - Pop', type: 'custom', samples: 12, status: 'ready' },
    { id: 2, name: 'Deep Voice', type: 'custom', samples: 8, status: 'ready' },
    { id: 3, name: 'Narrator Pro', type: 'marketplace', rating: 4.8, downloads: '12K' }
  ]);
  const [marketplaceVoices] = React.useState([
    { id: 101, name: 'Epic Narrator', creator: 'VoiceStudio', rating: 4.9, downloads: '45K', price: 'Free' },
    { id: 102, name: 'Warm Female', creator: 'AudioLab', rating: 4.7, downloads: '32K', price: '$9.99' },
    { id: 103, name: 'Dramatic Male', creator: 'SoundCraft', rating: 4.8, downloads: '28K', price: '$14.99' },
    { id: 104, name: 'Whisper ASMR', creator: 'RelaxAudio', rating: 4.6, downloads: '18K', price: 'Free' }
  ]);

  const tabs = [
    { id: 'clone', label: 'Clone Voice', icon: 'mic' },
    { id: 'library', label: 'My Library', icon: 'folder' },
    { id: 'marketplace', label: 'Marketplace', icon: 'grid' }
  ];

  const handleFileUpload = (files) => {
    if (files.length > 0) setUploadedFile(files[0]);
  };

  const handleTrain = async () => {
    if (!uploadedFile || !voiceName.trim()) return;
    setTraining(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setVoiceModels(prev => [...prev, { id: Date.now(), name: voiceName, type: 'custom', samples: 1, status: 'ready' }]);
    setUploadedFile(null);
    setVoiceName('');
    setTraining(false);
    setActiveTab('library');
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>Voice Lab</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Clone, manage, and discover voice models</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-card)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.id ? 'linear-gradient(135deg, var(--primary-500), var(--accent-500))' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Clone Tab */}
      {activeTab === 'clone' && (
        <div className="max-w-2xl rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Clone a Voice</h2>

          {/* Voice Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Voice Name</label>
            <input
              type="text"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder="Enter a name for this voice model"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Audio Sample</label>
            <div
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
              style={{ borderColor: uploadedFile ? 'var(--success-500)' : 'var(--border-subtle)', background: 'var(--bg-elevated)' }}
              onClick={() => document.getElementById('voice-upload').click()}
            >
              <input
                id="voice-upload"
                type="file"
                accept="audio/*"
                onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                className="hidden"
              />
              {uploadedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--success-500)' }}>
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                  <span style={{ color: 'var(--text-primary)' }}>{uploadedFile.name}</span>
                </div>
              ) : (
                <>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Click or drag audio file</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>MP3, WAV, M4A (min 30s recommended)</p>
                </>
              )}
            </div>
          </div>

          {/* Train Button */}
          <button
            onClick={handleTrain}
            disabled={!uploadedFile || !voiceName.trim() || training}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))' }}
          >
            {training ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Training Voice Model...
              </span>
            ) : 'Train Voice Model'}
          </button>
        </div>
      )}

      {/* Library Tab */}
      {activeTab === 'library' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {voiceModels.filter(v => v.type === 'custom').map(voice => (
            <div
              key={voice.id}
              className="p-5 rounded-xl transition-all hover:scale-[1.02]"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  </svg>
                </div>
                <span className="px-2.5 py-1 text-xs font-medium rounded-full" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--success-500)' }}>
                  {voice.status}
                </span>
              </div>
              <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{voice.name}</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{voice.samples} samples</p>
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  Use
                </button>
                <button className="py-2 px-3 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Marketplace Tab */}
      {activeTab === 'marketplace' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {marketplaceVoices.map(voice => (
            <div
              key={voice.id}
              className="p-5 rounded-xl transition-all hover:scale-[1.02]"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="w-full aspect-square rounded-xl mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(236,72,153,0.2))' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--primary-400)' }}>
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                </svg>
              </div>
              <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{voice.name}</h3>
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>by {voice.creator}</p>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm" style={{ color: 'var(--warning-500)' }}>★ {voice.rating}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{voice.downloads} downloads</span>
              </div>
              <button
                className="w-full py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: voice.price === 'Free' ? 'var(--bg-elevated)' : 'linear-gradient(135deg, var(--primary-500), var(--accent-500))', color: voice.price === 'Free' ? 'var(--text-secondary)' : 'white' }}
              >
                {voice.price === 'Free' ? 'Download Free' : voice.price}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// PAGE 4: VIDEO STUDIO
// ============================================================================
const VideoStudioPage = ({ api, store }) => {
  const [prompt, setPrompt] = React.useState('');
  const [generating, setGenerating] = React.useState(false);
  const [captionText, setCaptionText] = React.useState('');
  const [selectedPlatform, setSelectedPlatform] = React.useState('youtube');
  const [tracks] = React.useState([
    { id: 1, name: 'Video', clips: [{ id: 'c1', start: 0, duration: 30, color: '#06b6d4' }] },
    { id: 2, name: 'Audio', clips: [{ id: 'c2', start: 5, duration: 25, color: '#ec4899' }] },
    { id: 3, name: 'Captions', clips: [{ id: 'c3', start: 0, duration: 30, color: '#22c55e' }] }
  ]);

  const platforms = [
    { id: 'youtube', name: 'YouTube', aspect: '16:9' },
    { id: 'tiktok', name: 'TikTok', aspect: '9:16' },
    { id: 'instagram', name: 'Instagram', aspect: '1:1' },
    { id: 'twitter', name: 'Twitter', aspect: '16:9' }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setGenerating(false);
  };

  const handleGenerateCaptions = async () => {
    setCaptionText('Generating captions...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setCaptionText('00:00:00,000 --> 00:00:05,000\nWelcome to this amazing video\n\n00:00:05,000 --> 00:00:10,000\nCreated with vkTUNEos AI');
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>Video Studio</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Create, edit, and export AI-powered videos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'black', aspectRatio: '16/9' }}>
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>No video loaded</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Timeline</h3>
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <span>00:00</span>
                <span>/</span>
                <span>00:30</span>
              </div>
            </div>

            {/* Track Rows */}
            <div className="space-y-2">
              {tracks.map(track => (
                <div key={track.id} className="flex items-center gap-3">
                  <div className="w-20 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{track.name}</div>
                  <div className="flex-1 h-10 rounded-lg relative" style={{ background: 'var(--bg-elevated)' }}>
                    {track.clips.map(clip => (
                      <div
                        key={clip.id}
                        className="absolute h-8 top-1 rounded cursor-move"
                        style={{
                          left: `${(clip.start / 30) * 100}%`,
                          width: `${(clip.duration / 30) * 100}%`,
                          background: clip.color
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Playhead */}
            <div className="mt-4 h-2 rounded-full relative" style={{ background: 'var(--bg-elevated)' }}>
              <div className="absolute h-full rounded-full" style={{ width: '50%', background: 'linear-gradient(90deg, var(--primary-500), var(--accent-500))' }} />
              <div className="absolute w-3 h-3 rounded-full bg-white top-1/2 -translate-y-1/2" style={{ left: '50%', transform: 'translateX(-50%) translateY(-50%)' }} />
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          {/* Generator Form */}
          <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Generate Video</h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the video you want to create..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-4"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || generating}
              className="w-full py-2.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))' }}
            >
              {generating ? 'Generating...' : 'Generate Video'}
            </button>
          </div>

          {/* Caption Generator */}
          <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Captions</h3>
            <button
              onClick={handleGenerateCaptions}
              className="w-full py-2.5 rounded-xl font-medium mb-4 transition-all"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
            >
              Auto-Generate Captions
            </button>
            {captionText && (
              <textarea
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-xs font-mono outline-none resize-none"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
              />
            )}
          </div>

          {/* Export */}
          <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Export</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {platforms.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlatform(p.id)}
                  className="p-3 rounded-lg text-center transition-all"
                  style={{
                    background: selectedPlatform === p.id ? 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(236,72,153,0.1))' : 'var(--bg-elevated)',
                    border: `1px solid ${selectedPlatform === p.id ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                    color: selectedPlatform === p.id ? 'var(--primary-400)' : 'var(--text-secondary)'
                  }}
                >
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs opacity-60">{p.aspect}</div>
                </button>
              ))}
            </div>
            <button
              className="w-full py-2.5 rounded-xl font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))' }}
            >
              Export Video
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PAGE 5: COORDINATES
// ============================================================================
const CoordinatesPage = ({ api, store }) => {
  const [selectedNode, setSelectedNode] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState('all');
  const [assets, setAssets] = React.useState([
    { id: 1, name: 'ElevenLabs', category: 'VoiceCloning', domain: 'Model', status: 'Validated', value: 9.2 },
    { id: 2, name: 'Phoenix', category: 'StemSeparation', domain: 'Model', status: 'Validated', value: 9.0 },
    { id: 3, name: 'Suno', category: 'MusicGeneration', domain: 'Tool', status: 'Proposed', value: 8.5 },
    { id: 4, name: 'KitsAI', category: 'VoiceCloning', domain: 'Model', status: 'Draft', value: 8.5 },
    { id: 5, name: 'LANDR', category: 'AudioProduction', domain: 'Tool', status: 'Validated', value: 8.0 },
    { id: 6, name: 'Udio', category: 'MusicGeneration', domain: 'Tool', status: 'Validated', value: 8.8 }
  ]);

  const treeData = [
    {
      id: 'cat-1', name: 'VoiceCloning', type: 'category', count: 12,
      children: [
        { id: 'dom-1', name: 'Models', type: 'domain', count: 8 },
        { id: 'dom-2', name: 'Tools', type: 'domain', count: 4 }
      ]
    },
    {
      id: 'cat-2', name: 'MusicGeneration', type: 'category', count: 15,
      children: [
        { id: 'dom-3', name: 'Models', type: 'domain', count: 6 },
        { id: 'dom-4', name: 'Platforms', type: 'domain', count: 9 }
      ]
    },
    {
      id: 'cat-3', name: 'StemSeparation', type: 'category', count: 5,
      children: [
        { id: 'dom-5', name: 'Models', type: 'domain', count: 3 },
        { id: 'dom-6', name: 'APIs', type: 'domain', count: 2 }
      ]
    },
    {
      id: 'cat-4', name: 'AudioProduction', type: 'category', count: 8
    }
  ];

  const categories = ['all', 'VoiceCloning', 'MusicGeneration', 'StemSeparation', 'AudioProduction'];

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || asset.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status) => {
    const colors = {
      Validated: { bg: 'rgba(34,197,94,0.15)', text: 'var(--success-500)' },
      Proposed: { bg: 'rgba(234,179,8,0.15)', text: 'var(--warning-500)' },
      Draft: { bg: 'rgba(160,160,176,0.15)', text: 'var(--text-muted)' }
    };
    return colors[status] || colors.Draft;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>Coordinates</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Browse and manage the AI Music Coordinate System</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tree Sidebar */}
        <div className="lg:col-span-1 rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Categories</h3>
          <TreeView data={treeData} selectedId={selectedNode?.id} onSelect={setSelectedNode} />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search coordinates..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
                  style={{
                    background: filterCategory === cat ? 'linear-gradient(135deg, var(--primary-500), var(--accent-500))' : 'var(--bg-card)',
                    color: filterCategory === cat ? 'white' : 'var(--text-secondary)',
                    border: `1px solid ${filterCategory === cat ? 'transparent' : 'var(--border-subtle)'}`
                  }}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Asset Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredAssets.map(asset => (
              <div
                key={asset.id}
                onClick={() => setSelectedNode(asset)}
                className="p-5 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${selectedNode?.id === asset.id ? 'var(--primary-500)' : 'var(--border-subtle)'}`
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(236,72,153,0.1))' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--primary-400)' }}>
                      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/>
                    </svg>
                  </div>
                  <span
                    className="px-2.5 py-1 text-xs font-medium rounded-full"
                    style={{ background: getStatusColor(asset.status).bg, color: getStatusColor(asset.status).text }}
                  >
                    {asset.status}
                  </span>
                </div>
                <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{asset.name}</h3>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{asset.category} / {asset.domain}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Fidelity Score</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--primary-400)' }}>{asset.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedNode && selectedNode.name && (
        <div className="fixed right-0 top-16 bottom-0 w-80 p-6 overflow-y-auto" style={{ background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Details</h3>
            <button onClick={() => setSelectedNode(null)} className="p-2 rounded-lg" style={{ color: 'var(--text-muted)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Name</label>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedNode.name}</p>
            </div>
            {selectedNode.category && (
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Category</label>
                <p style={{ color: 'var(--text-secondary)' }}>{selectedNode.category}</p>
              </div>
            )}
            {selectedNode.domain && (
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Domain</label>
                <p style={{ color: 'var(--text-secondary)' }}>{selectedNode.domain}</p>
              </div>
            )}
            {selectedNode.value && (
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Fidelity Score</label>
                <p className="text-2xl font-display font-bold" style={{ color: 'var(--primary-400)' }}>{selectedNode.value}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Simple TreeView component for CoordinatesPage
const TreeView = ({ data, selectedId, onSelect }) => {
  const [expanded, setExpanded] = React.useState(new Set(['cat-1', 'cat-2']));

  const toggleExpand = (id) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpanded(newExpanded);
  };

  const renderNode = (node, level = 0) => {
    const hasChildren = node.children?.length > 0;
    const isExpanded = expanded.has(node.id);
    const isSelected = selectedId === node.id;

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all"
          style={{
            marginLeft: `${level * 12}px`,
            background: isSelected ? 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(236,72,153,0.1))' : 'transparent',
            borderLeft: isSelected ? '2px solid var(--primary-500)' : '2px solid transparent'
          }}
          onClick={() => onSelect(node)}
        >
          {hasChildren ? (
            <button onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }} className="p-0.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ color: 'var(--text-muted)', transform: isExpanded ? 'rotate(90deg)' : '', transition: 'transform 0.2s' }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          ) : <span className="w-5"/>}
          <span className="flex-1 text-sm truncate" style={{ color: isSelected ? 'var(--primary-400)' : 'var(--text-primary)' }}>{node.name}</span>
          {node.count !== undefined && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>{node.count}</span>}
        </div>
        {hasChildren && isExpanded && <div>{node.children.map(c => renderNode(c, level + 1))}</div>}
      </div>
    );
  };

  return <div className="space-y-1">{data.map(n => renderNode(n))}</div>;
};

// ============================================================================
// EXPORTS
// ============================================================================
console.log('vkTUNEos Pages 1-5 loaded successfully!');
console.log('Pages: DashboardPage, MusicStudioPage, VoiceLabPage, VideoStudioPage, CoordinatesPage');

window.vkTUNEosPages1 = {
  DashboardPage,
  MusicStudioPage,
  VoiceLabPage,
  VideoStudioPage,
  CoordinatesPage
};
