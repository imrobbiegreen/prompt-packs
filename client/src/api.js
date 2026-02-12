const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  // Stats
  getStats: () => request('/stats'),

  // Trades & Categories
  getTrades: () => request('/trades'),
  getCategories: () => request('/categories'),

  // Tasks
  getTasks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/tasks${qs ? '?' + qs : ''}`);
  },

  // Prompts
  getPrompts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/prompts${qs ? '?' + qs : ''}`);
  },
  getPrompt: (id) => request(`/prompts/${id}`),
  addTagToPrompt: (id, name) => request(`/prompts/${id}/tags`, { method: 'POST', body: { name } }),
  removeTagFromPrompt: (promptId, tagId) => request(`/prompts/${promptId}/tags/${tagId}`, { method: 'DELETE' }),

  // Packs
  getPacks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/packs${qs ? '?' + qs : ''}`);
  },
  getPack: (id) => request(`/packs/${id}`),
  createPack: (data) => request('/packs', { method: 'POST', body: data }),
  updatePack: (id, data) => request(`/packs/${id}`, { method: 'PUT', body: data }),
  deletePack: (id) => request(`/packs/${id}`, { method: 'DELETE' }),
  addPromptToPack: (packId, promptId, position) =>
    request(`/packs/${packId}/prompts`, { method: 'POST', body: { prompt_id: promptId, position } }),
  removePromptFromPack: (packId, promptId) =>
    request(`/packs/${packId}/prompts/${promptId}`, { method: 'DELETE' }),

  // Tags
  getTags: () => request('/tags'),

  // Import
  importMarkdown: (data) => request('/import', { method: 'POST', body: data }),
};
