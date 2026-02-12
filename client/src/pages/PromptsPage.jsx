import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../api';

export default function PromptsPage() {
  const [prompts, setPrompts] = useState([]);
  const [trades, setTrades] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ trade_id: '', category_id: '', task_id: '', in_pack: '', search: '' });
  const [selected, setSelected] = useState(null);
  const [packs, setPacks] = useState([]);

  useEffect(() => {
    api.getTrades().then(setTrades);
    api.getCategories().then(setCategories);
    api.getPacks().then(setPacks);
  }, []);

  useEffect(() => {
    const params = {};
    if (filters.trade_id) params.trade_id = filters.trade_id;
    if (filters.category_id) params.category_id = filters.category_id;
    if (filters.task_id) params.task_id = filters.task_id;
    if (filters.in_pack) params.in_pack = filters.in_pack;
    if (filters.search) params.search = filters.search;
    api.getPrompts(params).then(setPrompts);
  }, [filters]);

  useEffect(() => {
    const params = {};
    if (filters.trade_id) params.trade_id = filters.trade_id;
    if (filters.category_id) params.category_id = filters.category_id;
    api.getTasks(params).then(setTasks);
  }, [filters.trade_id, filters.category_id]);

  const handleAddToPack = async (promptId, packId) => {
    const pack = await api.getPack(packId);
    const usedPositions = pack.prompts.map(p => p.position);
    let nextPos = 1;
    while (usedPositions.includes(nextPos) && nextPos <= 12) nextPos++;
    if (nextPos > 12) {
      alert('Pack is full (12 prompts)');
      return;
    }
    await api.addPromptToPack(packId, promptId, nextPos);
    // Refresh
    const params = {};
    if (filters.trade_id) params.trade_id = filters.trade_id;
    if (filters.category_id) params.category_id = filters.category_id;
    if (filters.task_id) params.task_id = filters.task_id;
    if (filters.in_pack) params.in_pack = filters.in_pack;
    if (filters.search) params.search = filters.search;
    api.getPrompts(params).then(setPrompts);
    setSelected(null);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Prompts</h2>
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{prompts.length} prompts</span>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search prompts..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
        />
        <select value={filters.trade_id} onChange={e => setFilters(f => ({ ...f, trade_id: e.target.value, task_id: '' }))}>
          <option value="">All Trades</option>
          {trades.map(t => <option key={t.id} value={t.id}>{t.display_name}</option>)}
        </select>
        <select value={filters.category_id} onChange={e => setFilters(f => ({ ...f, category_id: e.target.value, task_id: '' }))}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
        </select>
        <select value={filters.task_id} onChange={e => setFilters(f => ({ ...f, task_id: e.target.value }))}>
          <option value="">All Tasks</option>
          {tasks.map(t => <option key={t.id} value={t.id}>{t.display_name}</option>)}
        </select>
        <select value={filters.in_pack} onChange={e => setFilters(f => ({ ...f, in_pack: e.target.value }))}>
          <option value="">Pack Status: All</option>
          <option value="true">In a Pack</option>
          <option value="false">Not in Pack</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Shot ID</th>
                <th>Base Scene</th>
                <th>Trade</th>
                <th>Task</th>
                <th>Camera</th>
                <th>Home Type</th>
                <th>Pack</th>
              </tr>
            </thead>
            <tbody>
              {prompts.map(p => (
                <tr
                  key={p.id}
                  className={`prompt-row${p.pack_id ? ' in-pack' : ''}`}
                  onClick={() => setSelected(p)}
                >
                  <td style={{ fontWeight: 600, color: 'var(--accent)', whiteSpace: 'nowrap' }}>{p.shot_id}</td>
                  <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.base_scene}</td>
                  <td>{p.trade_display_name}</td>
                  <td>{p.task_display_name}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.camera_angle}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.environment_home_type}</td>
                  <td>{p.pack_name ? <span className="badge badge-complete">{p.pack_name}</span> : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>--</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>{selected.shot_id}</h3>
              <button className="btn btn-sm" onClick={() => setSelected(null)}><X size={14} /></button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {selected.trade_display_name} / {selected.category_display_name} / {selected.task_display_name}
              </div>
              <p style={{ fontSize: '14px' }}>{selected.base_scene}</p>
            </div>

            {!selected.pack_id && packs.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <label>Add to Pack</label>
                <select onChange={e => e.target.value && handleAddToPack(selected.id, e.target.value)} defaultValue="">
                  <option value="">Select a pack...</option>
                  {packs.filter(pk => pk.prompt_count < 12).map(pk => (
                    <option key={pk.id} value={pk.id}>{pk.name} ({pk.prompt_count}/12)</option>
                  ))}
                </select>
              </div>
            )}

            {selected.pack_name && (
              <div style={{ marginBottom: '16px' }}>
                <span className="badge badge-complete">In pack: {selected.pack_name}</span>
              </div>
            )}

            <pre>{selected.raw_json}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
