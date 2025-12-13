import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, Search, Calendar, FileText, DollarSign, Loader2, Filter } from 'lucide-react';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import CustomSelect from '../components/CustomSelect';
import InvoiceModal from '../components/InvoiceModal';

interface Order {
    id: string;
    invoice_number: string;
    customer_name: string;
    customer_phone: string;
    service_type: string;
    status: string;
    created_at: string;
    completed_at: string;
    price: number;
    weight: number;
    unit_type: string;
}

export default function OrderHistory() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // Filter States
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString());
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

    const ITEMS_PER_PAGE = 10;

    const months = [
        { value: '0', label: 'Januari' },
        { value: '1', label: 'Februari' },
        { value: '2', label: 'Maret' },
        { value: '3', label: 'April' },
        { value: '4', label: 'Mei' },
        { value: '5', label: 'Juni' },
        { value: '6', label: 'Juli' },
        { value: '7', label: 'Agustus' },
        { value: '8', label: 'September' },
        { value: '9', label: 'Oktober' },
        { value: '10', label: 'November' },
        { value: '11', label: 'Desember' },
    ];

    // Generate years dynamically (e.g., current year - 2 to current year + 1)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 4 }, (_, i) => (currentYear - 2 + i).toString());

    const fetchHistory = async (pageNumber = 0) => {
        try {
            setLoading(true);
            const from = pageNumber * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            let query = supabase
                .from('laundry_orders')
                .select('*')
                .eq('status', 'completed')
                .order('completed_at', { ascending: false });

            // Apply Date Filters
            if (selectedMonth !== 'all' && selectedYear !== 'all') {
                const start = new Date(parseInt(selectedYear), parseInt(selectedMonth), 1);
                const end = new Date(parseInt(selectedYear), parseInt(selectedMonth) + 1, 0, 23, 59, 59); // End of month

                query = query
                    .gte('completed_at', start.toISOString())
                    .lte('completed_at', end.toISOString());
            } else if (selectedYear !== 'all') {
                const start = new Date(parseInt(selectedYear), 0, 1);
                const end = new Date(parseInt(selectedYear), 11, 31, 23, 59, 59);
                query = query
                    .gte('completed_at', start.toISOString())
                    .lte('completed_at', end.toISOString());
            }

            const { data, error } = await query.range(from, to);

            if (error) throw error;

            const newOrders = data || [];

            if (pageNumber === 0) {
                setOrders(newOrders);
            } else {
                setOrders(prev => [...prev, ...newOrders]);
            }

            setHasMore(newOrders.length === ITEMS_PER_PAGE);
            setPage(pageNumber);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    // Reset and fetch when filters change
    useEffect(() => {
        setPage(0);
        setOrders([]);
        fetchHistory(0);
    }, [selectedMonth, selectedYear]);

    const loadMore = () => {
        if (!loading && hasMore) {
            fetchHistory(page + 1);
        }
    };

    const sentinelRef = useInfiniteScroll(loadMore, loading);

    const filteredOrders = orders.filter(order =>
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="page-header flex-col md:flex-row gap-4 md:gap-0">
                <div>
                    <h1 className="page-title">Riwayat Pesanan</h1>
                    <p className="page-subtitle">Daftar pesanan yang telah selesai dan diambil.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    {/* Filters */}
                    <div className="flex gap-3">
                        <CustomSelect
                            value={selectedMonth}
                            onChange={setSelectedMonth}
                            options={[
                                { value: 'all', label: 'Semua Bulan' },
                                ...months
                            ]}
                            icon={Calendar}
                            className="w-44"
                        />

                        <CustomSelect
                            value={selectedYear}
                            onChange={setSelectedYear}
                            options={[
                                { value: 'all', label: 'Semua Tahun' },
                                ...years.map(y => ({ value: y, label: y }))
                            ]}
                            icon={Filter}
                            className="w-40"
                        />
                    </div>

                    {/* Search */}
                    <div className="relative group flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari invoice..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                    </div>
                </div>
            </div>

            {loading && page === 0 ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                </div>
            ) : (
                <div className="glass-panel rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-left">
                                    <th className="py-4 px-6 font-semibold text-slate-600">Invoice</th>
                                    <th className="py-4 px-6 font-semibold text-slate-600">Pelanggan</th>
                                    <th className="py-4 px-6 font-semibold text-slate-600">Layanan</th>
                                    <th className="py-4 px-6 font-semibold text-slate-600">Total</th>
                                    <th className="py-4 px-6 font-semibold text-slate-600">Selesai Pada</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredOrders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                        onClick={() => setSelectedInvoiceOrder(order)}
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <span className="font-mono font-medium text-slate-700">{order.invoice_number}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className="font-bold text-slate-900">{order.customer_name}</p>
                                                <p className="text-sm text-slate-500">{order.customer_phone}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                {order.service_type}
                                            </span>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {order.weight} {order.unit_type}
                                            </p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-1 text-emerald-600 font-bold">
                                                <DollarSign className="w-4 h-4" />
                                                Rp {order.price.toLocaleString('id-ID')}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(order.completed_at).toLocaleString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredOrders.length === 0 && !loading && (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Belum ada riwayat</h3>
                            <p className="text-slate-500">
                                {selectedMonth !== 'all'
                                    ? `Tidak ada pesanan selesai di bulan ${months[parseInt(selectedMonth)].label} ${selectedYear}`
                                    : 'Pesanan yang sudah selesai akan muncul di sini.'}
                            </p>
                        </div>
                    )}

                    {/* Infinite Scroll Sentinel */}
                    {hasMore && searchTerm === '' && (
                        <div ref={sentinelRef} className="flex justify-center py-6 border-t border-slate-100">
                            {loading && <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />}
                        </div>
                    )}
                </div>
            )}

            {/* Invoice Modal */}
            <InvoiceModal
                isOpen={!!selectedInvoiceOrder}
                onClose={() => setSelectedInvoiceOrder(null)}
                order={selectedInvoiceOrder}
            />
        </div>
    );
}
