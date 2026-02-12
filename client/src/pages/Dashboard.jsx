import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.getStats().then(setStats);
  }, []);

  if (!stats) return <div className="empty-state"><p>Loading...</p></div>;

  const { totals, byTrade, packsByStatus } = stats;

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{totals.total_prompts}</div>
          <div className="stat-label">Total Prompts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totals.total_tasks}</div>
          <div className="stat-label">Task Types</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totals.total_packs}</div>
          <div className="stat-label">Packs Created</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totals.prompts_in_packs}</div>
          <div className="stat-label">Prompts in Packs</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totals.prompts_available}</div>
          <div className="stat-label">Available Prompts</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Prompts by Trade</h3>
          <table>
            <thead>
              <tr>
                <th>Trade</th>
                <th>Category</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {byTrade.map((row, i) => (
                <tr key={i}>
                  <td>{row.trade}</td>
                  <td>{row.category}</td>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link to="/prompts" className="btn" style={{ textDecoration: 'none', justifyContent: 'center' }}>
              Browse All Prompts
            </Link>
            <Link to="/packs" className="btn btn-primary" style={{ textDecoration: 'none', justifyContent: 'center' }}>
              Manage Packs
            </Link>
            <Link to="/import" className="btn" style={{ textDecoration: 'none', justifyContent: 'center' }}>
              Import New Prompts
            </Link>
          </div>
          {packsByStatus.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Packs by Status</h4>
              {packsByStatus.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px' }}>
                  <span className={`badge badge-${s.status}`}>{s.status}</span>
                  <span>{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
