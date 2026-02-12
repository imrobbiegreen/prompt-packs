import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Package, Image, BarChart3, Upload } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import PromptsPage from './pages/PromptsPage';
import PacksPage from './pages/PacksPage';
import PackDetail from './pages/PackDetail';
import ImportPage from './pages/ImportPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="sidebar">
          <div className="sidebar-header">
            <h1>Prompt Packs</h1>
          </div>
          <ul className="nav-links">
            <li>
              <NavLink to="/" end>
                <BarChart3 size={18} />
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/prompts">
                <Image size={18} />
                <span>Prompts</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/packs">
                <Package size={18} />
                <span>Packs</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/import">
                <Upload size={18} />
                <span>Import</span>
              </NavLink>
            </li>
          </ul>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/prompts" element={<PromptsPage />} />
            <Route path="/packs" element={<PacksPage />} />
            <Route path="/packs/:id" element={<PackDetail />} />
            <Route path="/import" element={<ImportPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
