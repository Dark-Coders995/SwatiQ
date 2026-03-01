import './App.css'
import { NavLink, Route, Routes, Navigate, useNavigate } from 'react-router-dom'
import { DashboardPage } from './pages/DashboardPage'
import { InventoryPage } from './pages/InventoryPage'
import { Button } from './components/Button'

function App() {
  const navigate = useNavigate()

  return (
    <div className="app-root">
      <div className="app-shell">
        <header className="app-header">
          <div className="app-title-group">
            <div className="app-title">Pharmacy CRM</div>
            <div className="app-subtitle">Manage inventory, sales, and purchase orders</div>
          </div>

          <div className="app-nav">
            <NavLink to="/dashboard" className={({ isActive }) => `app-nav-button ${isActive ? 'is-active' : ''}`}>
              Dashboard
            </NavLink>
            <NavLink to="/inventory" className={({ isActive }) => `app-nav-button ${isActive ? 'is-active' : ''}`}>
              Inventory
            </NavLink>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary">Export</Button>
            <Button variant="primary" onClick={() => navigate('/inventory?add=1')}>
              Add Medicine
            </Button>
          </div>
        </header>

        <main className="app-main-card">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
