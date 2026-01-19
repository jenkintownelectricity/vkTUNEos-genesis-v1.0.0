/**
 * vkTUNEos KILLER UI - SESSION 5: PAGES 6-9
 * ==========================================
 * Workflows, Tenants, Audit Log, Killer Features
 */

// ============================================================================
// PAGE 6: WORKFLOWS
// ============================================================================
const WorkflowsPage = ({ api, store }) => {
  const [workflows, setWorkflows] = React.useState([
    { id: 1, name: 'Auto-Master Pipeline', nodes: 5, lastRun: '2 hours ago', status: 'completed' },
    { id: 2, name: 'Voice Clone + Convert', nodes: 3, lastRun: '1 day ago', status: 'completed' },
    { id: 3, name: 'Stem Separation Flow', nodes: 4, lastRun: 'Never', status: 'draft' }
  ]);

  const [selectedWorkflow, setSelectedWorkflow] = React.useState(null);
  const [nodes, setNodes] = React.useState([
    { id: 'n1', type: 'input', label: 'Audio Input', x: 50, y: 80 },
    { id: 'n2', type: 'ai', label: 'AI Enhance', x: 220, y: 50 },
    { id: 'n3', type: 'process', label: 'Stem Split', x: 220, y: 150 },
    { id: 'n4', type: 'process', label: 'Mix & Master', x: 390, y: 100 },
    { id: 'n5', type: 'output', label: 'Export', x: 560, y: 100 }
  ]);
  const [connections] = React.useState([
    { from: 'n1', to: 'n2' },
    { from: 'n1', to: 'n3' },
    { from: 'n2', to: 'n4' },
    { from: 'n3', to: 'n4' },
    { from: 'n4', to: 'n5' }
  ]);
  const [running, setRunning] = React.useState(false);

  const nodePalette = [
    { type: 'input', label: 'Audio Input', icon: 'upload', color: 'var(--success-500)' },
    { type: 'ai', label: 'AI Process', icon: 'sparkles', color: 'var(--warning-500)' },
    { type: 'process', label: 'Transform', icon: 'settings', color: 'var(--primary-500)' },
    { type: 'output', label: 'Output', icon: 'download', color: 'var(--accent-500)' }
  ];

  const handleRunWorkflow = async () => {
    setRunning(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setRunning(false);
    // Update last run time
    if (selectedWorkflow) {
      setWorkflows(prev => prev.map(w =>
        w.id === selectedWorkflow.id ? { ...w, lastRun: 'Just now', status: 'completed' } : w
      ));
    }
  };

  const handleSaveWorkflow = () => {
    alert('Workflow saved successfully!');
  };

  const nodeIcons = {
    upload: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>,
    sparkles: <><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>Workflows</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Create and manage automation pipelines</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSaveWorkflow}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
          >
            Save
          </button>
          <button
            onClick={handleRunWorkflow}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))' }}
          >
            {running ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            )}
            {running ? 'Running...' : 'Run Workflow'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Node Palette */}
        <div className="lg:col-span-1 rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Nodes</h3>
          <div className="space-y-2">
            {nodePalette.map(node => (
              <div
                key={node.type}
                className="flex items-center gap-3 p-3 rounded-lg cursor-grab transition-all"
                style={{ background: 'var(--bg-elevated)' }}
                draggable
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${node.color}20` }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={node.color} strokeWidth="2">
                    {nodeIcons[node.icon]}
                  </svg>
                </div>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{node.label}</span>
              </div>
            ))}
          </div>

          {/* Saved Workflows */}
          <h3 className="font-semibold mt-6 mb-4" style={{ color: 'var(--text-primary)' }}>Saved Workflows</h3>
          <div className="space-y-2">
            {workflows.map(wf => (
              <div
                key={wf.id}
                onClick={() => setSelectedWorkflow(wf)}
                className="p-3 rounded-lg cursor-pointer transition-all"
                style={{
                  background: selectedWorkflow?.id === wf.id ? 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(236,72,153,0.1))' : 'var(--bg-elevated)',
                  border: `1px solid ${selectedWorkflow?.id === wf.id ? 'var(--primary-500)' : 'transparent'}`
                }}
              >
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{wf.name}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{wf.nodes} nodes • {wf.lastRun}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="lg:col-span-4 rounded-xl relative overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', minHeight: '500px' }}>
          {/* Grid Background */}
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.3 }}>
            <defs>
              <pattern id="workflowGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="var(--text-muted)" />
              </pattern>
              <linearGradient id="connGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--primary-500)" />
                <stop offset="100%" stopColor="var(--accent-500)" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#workflowGrid)" />

            {/* Connections */}
            {connections.map((conn, i) => {
              const from = nodes.find(n => n.id === conn.from);
              const to = nodes.find(n => n.id === conn.to);
              if (!from || !to) return null;
              const fx = from.x + 100, fy = from.y + 35, tx = to.x, ty = to.y + 35;
              const mx = (fx + tx) / 2;
              return (
                <path
                  key={i}
                  d={`M ${fx} ${fy} C ${mx} ${fy}, ${mx} ${ty}, ${tx} ${ty}`}
                  fill="none"
                  stroke="url(#connGradient)"
                  strokeWidth="2"
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const palette = nodePalette.find(p => p.type === node.type) || nodePalette[2];
            return (
              <div
                key={node.id}
                className="absolute rounded-xl p-3 cursor-move"
                style={{
                  left: node.x,
                  top: node.y,
                  width: '100px',
                  background: 'var(--bg-card)',
                  border: `2px solid ${palette.color}40`
                }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${palette.color}20` }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={palette.color} strokeWidth="2">
                    {nodeIcons[palette.icon]}
                  </svg>
                </div>
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{node.label}</p>
                {/* Connection Points */}
                <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full" style={{ background: 'var(--bg-card)', border: `2px solid ${palette.color}` }} />
                <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full" style={{ background: 'var(--bg-card)', border: `2px solid ${palette.color}` }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PAGE 7: TENANTS
// ============================================================================
const TenantsPage = ({ api, store }) => {
  const [tenants, setTenants] = React.useState([
    { id: 1, name: 'Demo Music Studio', slug: 'demo-studio', tier: 'premium', email: 'demo@vktuneos.com', createdAt: '2024-01-15', status: 'active' },
    { id: 2, name: 'Indie Records', slug: 'indie-records', tier: 'free', email: 'hello@indierecords.com', createdAt: '2024-02-20', status: 'active' },
    { id: 3, name: 'Pro Audio Labs', slug: 'pro-audio', tier: 'enterprise', email: 'admin@proaudio.io', createdAt: '2024-03-10', status: 'active' }
  ]);

  const [showModal, setShowModal] = React.useState(false);
  const [editingTenant, setEditingTenant] = React.useState(null);
  const [formData, setFormData] = React.useState({ name: '', slug: '', tier: 'free', email: '' });

  const tiers = [
    { value: 'free', label: 'Free', color: 'var(--text-muted)' },
    { value: 'premium', label: 'Premium', color: 'var(--primary-400)' },
    { value: 'enterprise', label: 'Enterprise', color: 'var(--warning-500)' }
  ];

  const handleOpenCreate = () => {
    setEditingTenant(null);
    setFormData({ name: '', slug: '', tier: 'free', email: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (tenant) => {
    setEditingTenant(tenant);
    setFormData({ name: tenant.name, slug: tenant.slug, tier: tenant.tier, email: tenant.email });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.email.trim()) return;

    if (editingTenant) {
      setTenants(prev => prev.map(t =>
        t.id === editingTenant.id ? { ...t, ...formData } : t
      ));
    } else {
      setTenants(prev => [...prev, {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'active'
      }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this tenant?')) {
      setTenants(prev => prev.filter(t => t.id !== id));
    }
  };

  const getTierBadge = (tier) => {
    const t = tiers.find(x => x.value === tier) || tiers[0];
    return (
      <span className="px-2.5 py-1 text-xs font-medium rounded-full capitalize"
        style={{ background: `${t.color}20`, color: t.color }}>
        {t.label}
      </span>
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>Tenants</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage multi-tenant organizations</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
          style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5v14"/>
          </svg>
          Create Tenant
        </button>
      </div>

      {/* Tenant Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--bg-elevated)' }}>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Slug</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Tier</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Created</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant, i) => (
              <tr
                key={tenant.id}
                style={{ borderTop: '1px solid var(--border-subtle)' }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center font-semibold"
                      style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))', color: 'white' }}>
                      {tenant.name[0]}
                    </div>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{tenant.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{tenant.slug}</td>
                <td className="px-4 py-4">{getTierBadge(tenant.tier)}</td>
                <td className="px-4 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{tenant.email}</td>
                <td className="px-4 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>{tenant.createdAt}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(tenant)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(tenant.id)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--error-500)' }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
          <div
            className="relative w-full max-w-md rounded-2xl p-6"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
              {editingTenant ? 'Edit Tenant' : 'Create Tenant'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Organization name"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  placeholder="org-slug"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none font-mono"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@example.com"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Tier</label>
                <select
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                >
                  {tiers.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))' }}
              >
                {editingTenant ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// PAGE 8: AUDIT LOG
// ============================================================================
const AuditLogPage = ({ api, store }) => {
  const [events, setEvents] = React.useState([
    { id: 1, action: 'music.generate', actor: 'demo@vktuneos.com', resource: 'track_001', status: 'success', timestamp: '2024-01-19T10:30:00Z', details: 'Generated 30s track' },
    { id: 2, action: 'voice.clone', actor: 'demo@vktuneos.com', resource: 'voice_sarah', status: 'success', timestamp: '2024-01-19T10:15:00Z', details: 'Created voice model' },
    { id: 3, action: 'workflow.execute', actor: 'system', resource: 'workflow_001', status: 'success', timestamp: '2024-01-19T09:45:00Z', details: 'Auto-Master Pipeline' },
    { id: 4, action: 'tenant.create', actor: 'admin@vktuneos.com', resource: 'tenant_indie', status: 'success', timestamp: '2024-01-19T09:00:00Z', details: 'Created Indie Records' },
    { id: 5, action: 'api.request', actor: 'api_key_xxx', resource: '/api/v1/music', status: 'error', timestamp: '2024-01-19T08:30:00Z', details: 'Rate limit exceeded' },
    { id: 6, action: 'video.export', actor: 'demo@vktuneos.com', resource: 'video_001', status: 'success', timestamp: '2024-01-18T16:20:00Z', details: 'Exported to YouTube format' }
  ]);

  const [filterAction, setFilterAction] = React.useState('all');
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  const actions = ['all', 'music.generate', 'voice.clone', 'workflow.execute', 'tenant.create', 'api.request', 'video.export'];
  const statuses = ['all', 'success', 'error', 'warning'];

  const filteredEvents = events.filter(e => {
    const matchesAction = filterAction === 'all' || e.action === filterAction;
    const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchesAction && matchesStatus;
  });

  const handleExport = () => {
    const csv = 'Action,Actor,Resource,Status,Timestamp,Details\n' +
      filteredEvents.map(e => `${e.action},${e.actor},${e.resource},${e.status},${e.timestamp},"${e.details}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-log.csv';
    a.click();
  };

  const getStatusBadge = (status) => {
    const colors = {
      success: { bg: 'rgba(34,197,94,0.15)', text: 'var(--success-500)' },
      error: { bg: 'rgba(239,68,68,0.15)', text: 'var(--error-500)' },
      warning: { bg: 'rgba(234,179,8,0.15)', text: 'var(--warning-500)' }
    };
    const c = colors[status] || colors.success;
    return (
      <span className="px-2.5 py-1 text-xs font-medium rounded-full capitalize"
        style={{ background: c.bg, color: c.text }}>
        {status}
      </span>
    );
  };

  const formatTimestamp = (ts) => {
    const d = new Date(ts);
    return d.toLocaleString();
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>Audit Log</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Track all system activities and changes</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-4 py-2 rounded-xl text-sm outline-none cursor-pointer"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
        >
          {actions.map(a => <option key={a} value={a}>{a === 'all' ? 'All Actions' : a}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-xl text-sm outline-none cursor-pointer"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
        >
          {statuses.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>)}
        </select>
      </div>

      {/* Event List */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        {filteredEvents.map((event, i) => (
          <div
            key={event.id}
            className="flex items-center gap-4 px-4 py-4 transition-colors"
            style={{ borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: event.status === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
              {event.status === 'success' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success-500)" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--error-500)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm" style={{ color: 'var(--primary-400)' }}>{event.action}</span>
                {getStatusBadge(event.status)}
              </div>
              <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{event.details}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                by {event.actor} • {formatTimestamp(event.timestamp)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{event.resource}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Showing {filteredEvents.length} events
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// PAGE 9: KILLER FEATURES
// ============================================================================
const KillerFeaturesPage = ({ api, store }) => {
  const [activeTab, setActiveTab] = React.useState('collaborator');
  const [chatMessages, setChatMessages] = React.useState([
    { role: 'assistant', content: "Hello! I'm your AI music collaborator. I can help you generate ideas, refine your tracks, and suggest creative directions. What would you like to create today?" }
  ]);
  const [copyrightFile, setCopyrightFile] = React.useState(null);
  const [copyrightResult, setCopyrightResult] = React.useState(null);
  const [scanningCopyright, setScanningCopyright] = React.useState(false);
  const [moodValue, setMoodValue] = React.useState({ x: 0.5, y: 0.5 });
  const [contributors] = React.useState([
    { id: 1, name: 'Original Artist', role: 'Composer', share: 40, status: 'confirmed' },
    { id: 2, name: 'Feature Artist', role: 'Vocals', share: 25, status: 'confirmed' },
    { id: 3, name: 'Producer', role: 'Production', share: 20, status: 'pending' },
    { id: 4, name: 'Mix Engineer', role: 'Mixing', share: 15, status: 'confirmed' }
  ]);

  const tabs = [
    { id: 'collaborator', label: 'AI Collaborator', icon: 'sparkles' },
    { id: 'copyright', label: 'Copyright Shield', icon: 'shield' },
    { id: 'mood', label: 'Mood Pad', icon: 'grid' },
    { id: 'rights', label: 'Remix Rights', icon: 'users' }
  ];

  const handleSendMessage = (msg) => {
    setChatMessages(prev => [
      ...prev,
      { role: 'user', content: msg },
      { role: 'assistant', content: `Great idea! Based on "${msg}", I suggest exploring a ${moodValue.x > 0.5 ? 'high-energy' : 'chill'} ${moodValue.y > 0.5 ? 'uplifting' : 'melancholic'} sound. Want me to generate some samples?` }
    ]);
  };

  const handleCopyrightScan = async () => {
    if (!copyrightFile) return;
    setScanningCopyright(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    setCopyrightResult({
      status: 'clear',
      confidence: 98.5,
      matches: [
        { source: 'Public Domain Library', similarity: 12, risk: 'none' },
        { source: 'Creative Commons Pool', similarity: 8, risk: 'none' }
      ]
    });
    setScanningCopyright(false);
  };

  const handleMoodGenerate = () => {
    const energy = moodValue.x > 0.5 ? 'energetic' : 'calm';
    const valence = moodValue.y > 0.5 ? 'happy' : 'melancholic';
    alert(`Generating ${energy}, ${valence} track...`);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>Killer Features</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Advanced AI-powered music creation tools</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 rounded-xl w-fit overflow-x-auto" style={{ background: 'var(--bg-card)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
            style={{
              background: activeTab === tab.id ? 'linear-gradient(135deg, var(--primary-500), var(--accent-500))' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* AI Collaborator */}
      {activeTab === 'collaborator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl overflow-hidden flex flex-col" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', height: '500px' }}>
            <div className="p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>AI Music Collaborator</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Chat with AI to brainstorm and create</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                    style={{ background: msg.role === 'user' ? 'linear-gradient(135deg, var(--primary-500), var(--accent-500))' : 'var(--bg-elevated)', color: msg.role === 'user' ? 'white' : 'var(--text-primary)' }}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 flex gap-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <input
                type="text"
                placeholder="Describe what you want to create..."
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                onKeyPress={(e) => { if (e.key === 'Enter' && e.target.value) { handleSendMessage(e.target.value); e.target.value = ''; } }}
              />
              <button className="p-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))', color: 'white' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>

          <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Suggestions</h3>
            <div className="grid grid-cols-2 gap-3">
              {['Generate melody ideas', 'Suggest chord progressions', 'Create drum patterns', 'Write lyrics'].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => handleSendMessage(suggestion)}
                  className="p-4 rounded-xl text-left transition-all"
                  style={{ background: 'var(--bg-elevated)' }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-500)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{suggestion}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Copyright Shield */}
      {activeTab === 'copyright' && (
        <div className="max-w-2xl">
          <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Copyright Shield</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Scan your audio for potential copyright issues before publishing.
            </p>

            <div
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-6"
              style={{ borderColor: copyrightFile ? 'var(--success-500)' : 'var(--border-subtle)', background: 'var(--bg-elevated)' }}
              onClick={() => document.getElementById('copyright-upload').click()}
            >
              <input id="copyright-upload" type="file" accept="audio/*" onChange={(e) => setCopyrightFile(e.target.files[0])} className="hidden" />
              {copyrightFile ? (
                <div className="flex items-center justify-center gap-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success-500)" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>
                  <span style={{ color: 'var(--text-primary)' }}>{copyrightFile.name}</span>
                </div>
              ) : (
                <>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Upload audio to scan</p>
                </>
              )}
            </div>

            <button
              onClick={handleCopyrightScan}
              disabled={!copyrightFile || scanningCopyright}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))' }}
            >
              {scanningCopyright ? 'Scanning...' : 'Scan for Copyright'}
            </button>

            {copyrightResult && (
              <div className="mt-6 p-4 rounded-xl" style={{ background: copyrightResult.status === 'clear' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={copyrightResult.status === 'clear' ? 'var(--success-500)' : 'var(--error-500)'} strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <div>
                    <p className="font-semibold" style={{ color: copyrightResult.status === 'clear' ? 'var(--success-500)' : 'var(--error-500)' }}>
                      {copyrightResult.status === 'clear' ? 'All Clear!' : 'Issues Found'}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {copyrightResult.confidence}% confidence
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {copyrightResult.matches.map((match, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span style={{ color: 'var(--text-secondary)' }}>{match.source}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{match.similarity}% similarity</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mood Pad */}
      {activeTab === 'mood' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Mood Pad</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Click anywhere to set the mood for your track</p>

            <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-4" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2), rgba(236,72,153,0.2))' }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = 1 - (e.clientY - rect.top) / rect.height;
                setMoodValue({ x, y });
              }}>
              {/* Grid */}
              <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '10% 10%' }} />
              {/* Labels */}
              <span className="absolute top-2 right-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Happy</span>
              <span className="absolute bottom-2 left-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Sad</span>
              <span className="absolute bottom-2 right-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Energetic</span>
              <span className="absolute top-2 left-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Calm</span>
              {/* Position Indicator */}
              <div className="absolute w-6 h-6 rounded-full border-3 border-white shadow-lg"
                style={{ left: `${moodValue.x * 100}%`, bottom: `${moodValue.y * 100}%`, transform: 'translate(-50%, 50%)', background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))' }} />
            </div>

            <div className="flex justify-between text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              <span>Energy: {(moodValue.x * 100).toFixed(0)}%</span>
              <span>Valence: {(moodValue.y * 100).toFixed(0)}%</span>
            </div>

            <button
              onClick={handleMoodGenerate}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))' }}
            >
              Generate from Mood
            </button>
          </div>

          <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Mood Analysis</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Current Mood</p>
                <p className="text-2xl font-display font-bold gradient-text" style={{ background: 'linear-gradient(135deg, var(--primary-400), var(--accent-500))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {moodValue.x > 0.5 && moodValue.y > 0.5 ? 'Euphoric' :
                   moodValue.x > 0.5 && moodValue.y <= 0.5 ? 'Intense' :
                   moodValue.x <= 0.5 && moodValue.y > 0.5 ? 'Peaceful' : 'Melancholic'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Suggested BPM</p>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{Math.round(80 + moodValue.x * 80)} BPM</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Suggested Key</p>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{moodValue.y > 0.5 ? 'C Major' : 'A Minor'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remix Rights */}
      {activeTab === 'rights' && (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="p-6" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Remix Rights Management</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Track and manage contributor splits for your projects</p>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Contributor</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Share</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {contributors.map((c, i) => (
                <tr key={c.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm"
                        style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))', color: 'white' }}>
                        {c.name[0]}
                      </div>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{c.role}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                        <div className="h-full rounded-full" style={{ width: `${c.share}%`, background: 'linear-gradient(90deg, var(--primary-500), var(--accent-500))' }} />
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--primary-400)' }}>{c.share}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full capitalize"
                      style={{
                        background: c.status === 'confirmed' ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
                        color: c.status === 'confirmed' ? 'var(--success-500)' : 'var(--warning-500)'
                      }}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 flex justify-between items-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total: 100%</span>
            <button className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
              Add Contributor
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================
console.log('vkTUNEos Pages 6-9 loaded successfully!');
console.log('Pages: WorkflowsPage, TenantsPage, AuditLogPage, KillerFeaturesPage');

window.vkTUNEosPages2 = {
  WorkflowsPage,
  TenantsPage,
  AuditLogPage,
  KillerFeaturesPage
};
