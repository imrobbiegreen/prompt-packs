import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, X, Plus } from 'lucide-react';
import { api } from '../api';

export default function PackDetail() {
  const { id } = useParams();
  const [pack, setPack] = useState(null);
  const [availablePrompts, setAvailablePrompts] = useState([]);
  const [showBrowser, setShowBrowser] = useState(false);
  const [search, setSearch] = useState('');
  const [taskFilter, setTaskFilter] = useState('');
  const [tasks, setTasks] = useState([]);

  const load = () => api.getPack(id).then(setPack);

  useEffect(() => {
    load();
    api.getTasks().then(setTasks);
  }, [id]);

  useEffect(() => {
    if (showBrowser) {
      const params = { in_pack: 'false' };
      if (search) params.search = search;
      if (taskFilter) params.task_id = taskFilter;
      api.getPrompts(params).then(setAvailablePrompts);
    }
  }, [showBrowser, search, taskFilter]);

  const handleAdd = async (promptId) => {
    const usedPositions = pack.prompts.map(p => p.position);
    let nextPos = 1;
    while (usedPositions.includes(nextPos) && nextPos <= 12) nextPos++;
    if (nextPos > 12) return;
    await api.addPromptToPack(id, promptId, nextPos);
    load();
    setAvailablePrompts(prev => prev.filter(p => p.id !== promptId));
  };

  const handleRemove = async (promptId) => {
    await api.removePromptFromPack(id, promptId);
    load();
  };

  const handleStatusChange = async (status) => {
    await api.updatePack(id, { status });
    load();
  };

  if (!pack) return <div className="empty-state"><p>Loading...</p></div>;

  const slots = Array.from({ length: 12 }, (_, i) => {
    const prompt = pack.prompts.find(p => p.position === i + 1);
    return { position: i + 1, prompt };
  });

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/packs" className="btn btn-sm"><ArrowLeft size={14} /></Link>
          <div>
            <h2>{pack.name}</h2>
            {pack.theme && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{pack.theme}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={pack.status}
            onChange={e => handleStatusChange(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="draft">Draft</option>
            <option value="complete">Complete</option>
            <option value="published">Published</option>
          </select>
          <button className="btn btn-primary" onClick={() => setShowBrowser(!showBrowser)}>
            <Plus size={14} /> Add Prompts
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
        {pack.prompts.length}/12 slots filled
      </div>

      <div className="pack-slots">
        {slots.map(({ position, prompt }) => (
          <div key={position} className={`pack-slot${prompt ? ' filled' : ''}`}>
            <span className="slot-number">#{position}</span>
            {prompt ? (
              <>
                <span className="slot-remove" onClick={() => handleRemove(prompt.id)}>
                  <X size={14} />
                </span>
                <div className="slot-shot-id">{prompt.shot_id}</div>
                <div className="slot-scene">{prompt.base_scene}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  {prompt.task_display_name}
                </div>
              </>
            ) : (
              <span>Empty</span>
            )}
          </div>
        ))}
      </div>

      {showBrowser && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px' }}>Available Prompts</h3>
            <button className="btn btn-sm" onClick={() => setShowBrowser(false)}><X size={14} /></button>
          </div>

          <div className="filter-bar">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select value={taskFilter} onChange={e => setTaskFilter(e.target.value)}>
              <option value="">All Tasks</option>
              {tasks.map(t => <option key={t.id} value={t.id}>{t.trade_display_name} - {t.display_name}</option>)}
            </select>
          </div>

          <div className="table-wrap" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Shot ID</th>
                  <th>Scene</th>
                  <th>Task</th>
                  <th>Home Type</th>
                </tr>
              </thead>
              <tbody>
                {availablePrompts.map(p => (
                  <tr key={p.id}>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleAdd(p.id)}
                        disabled={pack.prompts.length >= 12}
                      >
                        <Plus size={12} />
                      </button>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{p.shot_id}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.base_scene}</td>
                    <td>{p.task_display_name}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.environment_home_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
