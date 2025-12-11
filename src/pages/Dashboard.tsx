import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, Users, ShoppingBag, TrendingUp, Clock, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        revenue: 0,
        activeOrders: 0,
        totalOrders: 0,
        completedOrders: 0
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch all orders for stats
            const { data: allOrders, error: statsError } = await supabase
                .from('laundry_orders')
                .select('*');

            if (statsError) throw statsError;

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const monthlyOrders = allOrders.filter(order => {
                const orderDate = new Date(order.created_at);
                return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
            });

            const revenue = monthlyOrders.reduce((sum, order) => sum + (Number(order.price) || 0), 0);
            const activeOrders = allOrders.filter(o => o.status !== 'completed' && o.status !== 'ready').length;
            const completedOrders = allOrders.filter(o => o.status === 'completed' || o.status === 'ready').length;
            const totalOrders = allOrders.length;

            setStats({
                revenue,
                activeOrders,
                totalOrders,
                completedOrders
            });

            // Fetch recent orders
            const { data: recent, error: recentError } = await supabase
                .from('laundry_orders')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (recentError) throw recentError;
            setRecentOrders(recent);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Baru saja';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
        return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            </div>
        );
    }

    const statCards = [
        {
            label: 'Pendapatan Bulan Ini',
            value: formatCurrency(stats.revenue),
            change: `${stats.totalOrders} Pesanan Total`,
            icon: DollarSign,
            color: 'emerald',
            gradient: 'from-emerald-500/10 to-emerald-500/5'
        },
        {
            label: 'Pesanan Aktif',
            value: stats.activeOrders.toString(),
            change: 'Sedang diproses',
            icon: ShoppingBag,
            color: 'blue',
            gradient: 'from-blue-500/10 to-blue-500/5'
        },
        {
            label: 'Total Pesanan',
            value: stats.totalOrders.toString(),
            change: 'Semua waktu',
            icon: Users,
            color: 'violet',
            gradient: 'from-violet-500/10 to-violet-500/5'
        },
        {
            label: 'Tingkat Penyelesaian',
            value: stats.totalOrders > 0 ? `${Math.round((stats.completedOrders / stats.totalOrders) * 100)}%` : '0%',
            change: 'Dari total pesanan',
            icon: TrendingUp,
            color: 'amber',
            gradient: 'from-amber-500/10 to-amber-500/5'
        },
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Selamat datang kembali, berikut ringkasan hari ini.</p>
                </div>
                <Link to="/admin/new-order" className="btn-primary flex items-center gap-3 text-lg px-8 py-3.5">
                    Buat Pesanan Baru <ArrowRight className="w-5 h-5" />
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {statCards.map((stat, index) => (
                    <div key={index} className="glass-card p-8 rounded-2xl group relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${stat.gradient} rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-500`} />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-4 rounded-2xl bg-white border border-slate-100 shadow-sm text-${stat.color}-500 group-hover:scale-110 transition-transform duration-300`}>
                                    <stat.icon className="w-8 h-8" />
                                </div>
                                <span className="text-emerald-600 text-sm font-medium bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                                    {stat.change}
                                </span>
                            </div>
                            <h3 className="text-slate-500 text-base font-medium mb-2">{stat.label}</h3>
                            <p className="text-4xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Orders */}
            <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900">Pesanan Terbaru</h2>
                    <Link to="/admin/orders" className="text-base text-emerald-600 hover:text-emerald-700 font-medium transition-colors flex items-center gap-2">
                        Lihat Semua <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-8 py-5 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">ID Pesanan</th>
                                <th className="px-8 py-5 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">Pelanggan</th>
                                <th className="px-8 py-5 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">Layanan</th>
                                <th className="px-8 py-5 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-8 py-5 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                                <th className="px-8 py-5 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">Waktu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-8 py-5 text-base font-medium text-emerald-600 font-mono">{order.invoice_number}</td>
                                    <td className="px-8 py-5 text-base text-slate-700 font-medium">{order.customer_name}</td>
                                    <td className="px-8 py-5 text-base text-slate-500">{order.service_type}</td>
                                    <td className="px-8 py-5">
                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wide ${order.status === 'ready' || order.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            order.status === 'processing' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                            {order.status === 'processing' ? 'Proses' :
                                                order.status === 'ready' ? 'Siap' :
                                                    order.status === 'completed' ? 'Selesai' : order.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-base font-bold text-slate-900">{formatCurrency(order.price || 0)}</td>
                                    <td className="px-8 py-5 text-sm text-slate-400 flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> {formatTimeAgo(order.created_at)}
                                    </td>
                                </tr>
                            ))}
                            {recentOrders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-8 py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <ShoppingBag className="w-10 h-10 opacity-20" />
                                            <p className="text-lg">Belum ada pesanan.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
