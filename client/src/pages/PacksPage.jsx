import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../api';

export default function PacksPage() {
  const [packs, setPacks] = useState([]);
  const [trades, setTrades] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', trade_id: '', category_id: '', theme: '', description: '' });

  const load = () => api.getPacks().then(setPacks);

  useEffect(() => {
    load();
    api.getTrades().then(setTrades);
    api.getCategories().then(setCategories);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.createPack({
      ...form,
      trade_id: form.trade_id || null,
      category_id: form.category_id || null,
    });
    setForm({ name: '', trade_id: '', category_id: '', theme: '', description: '' });
    setShowCreate(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this pack? Prompts will be unlinked but not deleted.')) return;
    await api.deletePack(id);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h2>Packs</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          <Plus size={14} /> New Pack
        </button>
      </div>

      {showCreate && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Pack Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Electrician Residential Pack 1"
                />
              </div>
              <div className="form-group">
                <label>Theme</label>
                <input
                  value={form.theme}
                  onChange={e => setForm(f => ({ ...f, theme: e.target.value }))}
                  placeholder="e.g. Modern Homes"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Trade</label>
                <select value={form.trade_id} onChange={e => setForm(f => ({ ...f, trade_id: e.target.value }))}>
                  <option value="">Any Trade</option>
                  {trades.map(t => <option key={t.id} value={t.id}>{t.display_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                  <option value="">Any Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description..."
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary">Create Pack</button>
              <button type="button" className="btn" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {packs.length === 0 ? (
        <div className="empty-state">
          <Package size={48} strokeWidth={1} />
          <p>No packs yet. Create one to start grouping prompts.</p>
        </div>
      ) : (
        <div className="card-grid">
          {packs.map(pack => (
            <div key={pack.id} className="card" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Link to={`/packs/${pack.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>{pack.name}</h3>
                </Link>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(pack.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
              {pack.theme && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>{pack.theme}</div>}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {pack.trade_display_name && <span className="tag">{pack.trade_display_name}</span>}
                {pack.category_display_name && <span className="tag">{pack.category_display_name}</span>}
                <span className={`badge badge-${pack.status}`}>{pack.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: pack.prompt_count === 12 ? 'var(--success)' : 'var(--accent)' }}>
                  {pack.prompt_count}/12
                </div>
                <Link to={`/packs/${pack.id}`} className="btn btn-sm">View</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
