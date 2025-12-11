import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Smartphone, Shirt, ShoppingBag, Search, Settings, Users, LogOut, Clock, Menu as MenuIcon, X } from 'lucide-react';
import { useState } from 'react';
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

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const mobileBottomNavItems = [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Home' },
        { path: '/admin/new-order', icon: Shirt, label: 'Baru' },
        { path: '/admin/orders', icon: ShoppingBag, label: 'Aktif' },
        { path: '/admin/history', icon: Clock, label: 'Riwayat' },
    ];

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
            {/* Mobile Top Bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-30 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Shirt className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">Laundry<span className="text-emerald-500">Pro</span></h1>
                    </div>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg"
                >
                    <MenuIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex w-80 bg-white border-r border-slate-200 flex-col relative z-20">
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

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="absolute right-0 top-0 bottom-0 w-3/4 max-w-xs bg-white shadow-2xl p-6 animate-in slide-in-from-right duration-300 flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-slate-900">Menu</h2>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <nav className="flex-1 space-y-2 overflow-y-auto">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${isActive
                                            ? 'bg-emerald-50 text-emerald-600 font-semibold'
                                            : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                                        <span className="text-base">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="pt-6 border-t border-slate-100 mt-4">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                            >
                                <LogOut className="w-5 h-5" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-slate-50/50 relative custom-scrollbar pt-20 pb-24 md:pt-0 md:pb-0">
                <div className="p-6 md:p-14 max-w-7xl mx-auto relative z-10 animate-in fade-in duration-700">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 pb-safe">
                <div className="flex items-center justify-around px-2 py-2">
                    {mobileBottomNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 w-16 ${isActive
                                    ? 'text-emerald-600'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <div className={`p-1.5 rounded-full transition-all ${isActive ? 'bg-emerald-50' : 'bg-transparent'}`}>
                                    <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                                </div>
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 w-16 text-slate-400 hover:text-slate-600"
                    >
                        <div className="p-1.5 rounded-full bg-transparent">
                            <MenuIcon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-medium">Menu</span>
                    </button>
                </div>
            </div>

            <Toaster position="top-center" toastOptions={{ duration: 4000, style: { background: '#333', color: '#fff' } }} />
        </div>
    );
}
