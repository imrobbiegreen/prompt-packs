import { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { api } from '../api';

export default function ImportPage() {
  const [trades, setTrades] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ trade: '', category: '', task_name: '', task_display_name: '', markdown: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getTrades().then(setTrades);
    api.getCategories().then(setCategories);
  }, []);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(f => ({ ...f, markdown: ev.target.result }));
    };
    reader.readAsText(file);

    // Auto-fill task name from filename
    const name = file.name.replace(/_prompts\.md$/, '').replace(/\.md$/, '').replace(/^\d+_/, '');
    setForm(f => ({
      ...f,
      task_name: name,
      task_display_name: name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setError(null);

    try {
      const res = await api.importMarkdown({
        markdown: form.markdown,
        trade: form.trade,
        category: form.category,
        task_name: form.task_name,
        task_display_name: form.task_display_name,
      });
      setResult(res);
      setForm({ trade: '', category: '', task_name: '', task_display_name: '', markdown: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Import Prompts</h2>
      </div>

      <div className="card" style={{ maxWidth: '700px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
          Import prompts from a markdown file containing JSON code blocks. Each <code>```json</code> block
          will be parsed as a separate prompt using the standard schema.
        </p>

        {result && (
          <div className="message message-success">
            Imported {result.imported} new prompts ({result.total_in_file} found in file)
          </div>
        )}

        {error && (
          <div className="message message-error">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Markdown File</label>
            <input type="file" accept=".md,.txt" onChange={handleFile} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Trade *</label>
              <input
                required
                list="trade-options"
                value={form.trade}
                onChange={e => setForm(f => ({ ...f, trade: e.target.value }))}
                placeholder="e.g. electrician, plumbing, hvac"
              />
              <datalist id="trade-options">
                {trades.map(t => <option key={t.id} value={t.name} />)}
              </datalist>
            </div>
            <div className="form-group">
              <label>Category *</label>
              <input
                required
                list="category-options"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="e.g. residential, commercial"
              />
              <datalist id="category-options">
                {categories.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Task Name (slug) *</label>
              <input
                required
                value={form.task_name}
                onChange={e => setForm(f => ({ ...f, task_name: e.target.value }))}
                placeholder="e.g. gfci_outlet_installation"
              />
            </div>
            <div className="form-group">
              <label>Task Display Name</label>
              <input
                value={form.task_display_name}
                onChange={e => setForm(f => ({ ...f, task_display_name: e.target.value }))}
                placeholder="e.g. GFCI Outlet Installation"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Or paste markdown directly</label>
            <textarea
              rows={10}
              value={form.markdown}
              onChange={e => setForm(f => ({ ...f, markdown: e.target.value }))}
              placeholder="Paste markdown with ```json blocks here..."
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={!form.markdown || !form.trade || !form.category || !form.task_name}>
            <Upload size={14} /> Import Prompts
          </button>
        </form>
      </div>
    </div>
  );
}
