import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Smartphone, Shirt, ShoppingBag, Search, Settings, Users, LogOut, Clock } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Layout() {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            toast.success('Logout berhasil');
            navigate('/admin/login');
        } catch (error: any) {
            console.error('Logout error:', error);
            toast.error('Gagal logout');
        }
    };

    const menuItems = [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/new-order', icon: Shirt, label: 'Buat Pesanan' },
        { path: '/admin/orders', icon: ShoppingBag, label: 'Pesanan Aktif' },
        { path: '/admin/history', icon: Clock, label: 'Riwayat' },
        { path: '/admin/customers', icon: Users, label: 'Pelanggan' },
        { path: '/admin/whatsapp', icon: Smartphone, label: 'WhatsApp Gateway' },
        { path: '/admin/services', icon: Settings, label: 'Layanan' },
        { path: '/', icon: Search, label: 'Cek Laundry' },
    ];

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-80 bg-white border-r border-slate-200 flex flex-col relative z-20">
                <div className="p-8">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/10">
                            <Shirt className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">Laundry<span className="text-emerald-500">Pro</span></h1>
                            <p className="text-sm text-slate-500 mt-1.5 font-medium">Management System</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-6 space-y-2 overflow-y-auto custom-scrollbar">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 mb-4 mt-2">Menu Utama</div>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                                    ? 'bg-emerald-50 text-emerald-600 font-semibold'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-emerald-500 rounded-r-full" />
                                )}
                                <Icon className={`w-6 h-6 transition-colors duration-300 ${isActive ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                <span className="relative z-10 text-lg">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-5 transition-all duration-300 group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-400 p-[2px]">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                    <span className="text-sm font-bold text-emerald-600">AD</span>
                                </div>
                            </div>
                            <div className="text-left flex-1 min-w-0">
                                <p className="text-base font-semibold text-slate-900 truncate">Admin User</p>
                                <p className="text-sm text-slate-500 truncate">admin@laundry.com</p>
                            </div>
                            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        </div>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-slate-50/50 relative custom-scrollbar">
                <div className="p-10 md:p-14 max-w-7xl mx-auto relative z-10 animate-in fade-in duration-700">
                    <Outlet />
                </div>
            </main>
            <Toaster position="top-center" toastOptions={{ duration: 4000, style: { background: '#333', color: '#fff' } }} />
        </div>
    );
}
