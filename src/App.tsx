import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import WhatsAppPage from './pages/WhatsAppPage';
import NewOrder from './pages/NewOrder';
import OrderList from './pages/OrderList';
import OrderHistory from './pages/History';
import Customers from './pages/Customers';
import Tracking from './pages/Tracking';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Tracking />} />
        <Route path="/track" element={<Tracking />} />

        {/* Admin Auth */}
        <Route path="/admin/login" element={<Login />} />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="new-order" element={<NewOrder />} />
            <Route path="orders" element={<OrderList />} />
            <Route path="history" element={<OrderHistory />} />
            <Route path="customers" element={<Customers />} />
            <Route path="whatsapp" element={<WhatsAppPage />} />
            <Route path="services" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
