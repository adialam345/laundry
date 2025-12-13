import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, Clock, Loader2, Search, Phone, Calendar, CheckSquare, Square, Send, Edit, Trash2, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import InvoiceModal from '../components/InvoiceModal';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { getApiUrl } from '../lib/api';
import { useNavigate } from 'react-router-dom';

interface Order {
    id: string;
    invoice_number: string;
    customer_name: string;
    customer_phone: string;
    service_type: string;
    status: string;
    created_at: string;
    target_completion_time: string;
    price: number;
}

export default function OrderList() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
    const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
    const [isBulkSending, setIsBulkSending] = useState(false);
    const ITEMS_PER_PAGE = 10;

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDangerous?: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const fetchOrders = async (pageNumber = 0, isRefresh = false) => {
        try {
            const from = pageNumber * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            let query = supabase
                .from('laundry_orders')
                .select('*');

            if (activeTab === 'today') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                query = query.neq('status', 'completed')
                    .gte('target_completion_time', today.toISOString())
                    .lt('target_completion_time', tomorrow.toISOString());
            } else if (activeTab === 'processing') {
                query = query.eq('status', 'processing');
            } else if (activeTab === 'ready') {
                query = query.eq('status', 'ready');
            } else {
                query = query.neq('status', 'completed');
            }

            const { data, error } = await query
                .order('target_completion_time', { ascending: true })
                .range(from, to);

            if (error) throw error;

            const newOrders = data || [];

            if (isRefresh || pageNumber === 0) {
                setOrders(newOrders);
            } else {
                setOrders(prev => [...prev, ...newOrders]);
            }

            setHasMore(newOrders.length === ITEMS_PER_PAGE);
            setPage(pageNumber);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Gagal memuat pesanan');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setOrders([]);
        setPage(0);
        setHasMore(true);
        setSelectedOrderIds(new Set()); // Reset selection on tab change
        fetchOrders(0, true);
    }, [activeTab]);

    const loadMore = () => {
        if (!loading && hasMore) {
            fetchOrders(page + 1);
        }
    };

    const sentinelRef = useInfiniteScroll(loadMore, loading);

    const toggleSelectOrder = (id: string) => {
        const newSelected = new Set(selectedOrderIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedOrderIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0) {
            setSelectedOrderIds(new Set());
        } else {
            const newSelected = new Set(filteredOrders.map(o => o.id));
            setSelectedOrderIds(newSelected);
        }
    };

    const handleBulkComplete = async () => {
        if (selectedOrderIds.size === 0) return;

        setConfirmModal({
            isOpen: true,
            title: 'Kirim WA Massal',
            message: `Kirim notifikasi WhatsApp ke ${selectedOrderIds.size} pelanggan terpilih?`,
            onConfirm: async () => {
                setIsBulkSending(true);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));

                let successCount = 0;
                let failCount = 0;

                const ordersToProcess = orders.filter(o => selectedOrderIds.has(o.id));

                for (const order of ordersToProcess) {
                    try {
                        // 1. Update Database if not ready
                        if (order.status !== 'ready') {
                            const { error: dbError } = await supabase
                                .from('laundry_orders')
                                .update({ status: 'ready' })
                                .eq('id', order.id);
                            if (dbError) throw dbError;
                        }

                        // 2. Send WhatsApp
                        const message = `Halo Kak ${order.customer_name}! 👋\n\nLaundry kamu dengan nomor nota *${order.invoice_number}* (${order.service_type}) sudah SELESAI dan SIAP DIAMBIL ya! 🧺✨\n\nSilakan datang ke outlet kami. Terima kasih! 🙏`;
                        const phoneNumbers = order.customer_phone.split(/[\/,]+/).map(p => p.trim());

                        let orderSent = false;
                        for (const phone of phoneNumbers) {
                            if (!phone) continue;
                            try {
                                const res = await fetch(getApiUrl('/api/send'), {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ phone, message })
                                });
                                const data = await res.json();
                                if (data.success) orderSent = true;
                            } catch (e) {
                                console.error(`Failed to send to ${phone}`, e);
                            }
                        }

                        if (orderSent) successCount++;
                        else failCount++;

                    } catch (error) {
                        console.error(`Error processing order ${order.invoice_number}:`, error);
                        failCount++;
                    }
                }

                toast.success(`Selesai! Berhasil: ${successCount}, Gagal: ${failCount}`);
                setIsBulkSending(false);
                setSelectedOrderIds(new Set());
                fetchOrders(0, true);
            }
        });
    };


    const handleComplete = async (order: Order) => {
        // If order is already ready, mark as completed (picked up)
        if (order.status === 'ready') {
            setConfirmModal({
                isOpen: true,
                title: 'Konfirmasi Pengambilan',
                message: `Apakah pesanan ${order.invoice_number} sudah diambil oleh pelanggan?`,
                onConfirm: async () => {
                    setSendingId(order.id);
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    try {
                        const { error } = await supabase
                            .from('laundry_orders')
                            .update({ status: 'completed', completed_at: new Date().toISOString() })
                            .eq('id', order.id);

                        if (error) throw error;
                        toast.success('Pesanan selesai dan masuk ke riwayat');
                        fetchOrders(0, true); // Refresh list from start
                    } catch (error: any) {
                        toast.error('Gagal update status: ' + error.message);
                    } finally {
                        setSendingId(null);
                    }
                }
            });
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: 'Selesai & Kirim WA',
            message: `Tandai pesanan ${order.invoice_number} selesai dan kirim notifikasi WhatsApp ke pelanggan?`,
            onConfirm: async () => {
                setSendingId(order.id);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    // 2. Update Database
                    const { error: dbError } = await supabase
                        .from('laundry_orders')
                        .update({ status: 'ready' }) // Don't set completed_at yet
                        .eq('id', order.id);

                    if (dbError) throw dbError;

                    // 3. Send WhatsApp (only if connected)
                    const message = `Halo Kak ${order.customer_name}! 👋\n\nLaundry kamu dengan nomor nota *${order.invoice_number}* (${order.service_type}) sudah SELESAI dan SIAP DIAMBIL ya! 🧺✨\n\nSilakan datang ke outlet kami. Terima kasih! 🙏`;

                    // Split phone numbers by comma or slash
                    const phoneNumbers = order.customer_phone.split(/[\/,]+/).map(p => p.trim());
                    let successCount = 0;
                    let failCount = 0;

                    for (const phone of phoneNumbers) {
                        if (!phone) continue;
                        try {
                            const res = await fetch(getApiUrl('/api/send'), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    phone: phone,
                                    message: message
                                })
                            });

                            const data = await res.json();
                            if (data.success) {
                                successCount++;
                            } else {
                                failCount++;
                                console.error(`Failed to send to ${phone}: ${data.error}`);
                            }
                        } catch (sendError) {
                            failCount++;
                            console.error(`Error sending to ${phone}:`, sendError);
                        }
                    }

                    if (successCount > 0) {
                        toast.success(`Pesanan siap! WA terkirim ke ${successCount} nomor.`);
                    }

                    if (failCount > 0) {
                        toast.error(`Gagal kirim WA ke ${failCount} nomor.`);
                    }

                    fetchOrders(0, true);
                } catch (error: any) {
                    toast.error('Error database: ' + error.message);
                } finally {
                    setSendingId(null);
                }
            }
        });
    };

    const handleEdit = (orderId: string) => {
        navigate(`/admin/orders/edit/${orderId}`);
    };

    const handleDelete = async (order: Order) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Pesanan',
            message: `Apakah Anda yakin ingin menghapus pesanan ${order.invoice_number} milik ${order.customer_name}? Tindakan ini tidak dapat dibatalkan.`,
            isDangerous: true,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    const { error } = await supabase
                        .from('laundry_orders')
                        .delete()
                        .eq('id', order.id);

                    if (error) throw error;
                    toast.success('Pesanan berhasil dihapus');
                    fetchOrders(0, true);
                } catch (error: any) {
                    toast.error('Gagal menghapus pesanan: ' + error.message);
                }
            }
        });
    };

    const handlePrint = (order: Order) => {
        setSelectedInvoiceOrder(order);
    };

    const filteredOrders = orders.filter(order =>
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-container pb-24">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Pesanan Aktif</h1>
                    <p className="page-subtitle">Kelola pesanan laundry yang sedang berjalan.</p>
                </div>
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Cari invoice atau nama..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field !pl-20 w-full md:w-80"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3 overflow-x-auto p-2 scrollbar-hide">
                    {[
                        { id: 'all', label: 'Semua' },
                        { id: 'processing', label: 'Dalam Proses' },
                        { id: 'ready', label: 'Siap Diambil' },
                        { id: 'today', label: 'Target Hari Ini' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-500 ring-offset-2'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-emerald-200'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {filteredOrders.length > 0 && (
                    <button
                        onClick={toggleSelectAll}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors px-4 py-2"
                    >
                        {selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0 ? (
                            <CheckSquare className="w-5 h-5 text-emerald-500" />
                        ) : (
                            <Square className="w-5 h-5" />
                        )}
                        Pilih Semua
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredOrders.map((order) => (
                        <div key={order.id} className={`glass-card p-5 rounded-xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-500 transition-all border ${selectedOrderIds.has(order.id) ? 'border-emerald-500 bg-emerald-50/30' : 'border-transparent'}`}>
                            <div className="flex items-start gap-4 w-full">
                                <button
                                    onClick={() => toggleSelectOrder(order.id)}
                                    className="mt-1 flex-shrink-0 text-slate-400 hover:text-emerald-500 transition-colors"
                                >
                                    {selectedOrderIds.has(order.id) ? (
                                        <CheckSquare className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                        <Square className="w-5 h-5" />
                                    )}
                                </button>

                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${order.status === 'ready'
                                    ? 'bg-emerald-50 text-emerald-600 shadow-emerald-500/10'
                                    : 'bg-blue-50 text-blue-600 shadow-blue-500/10'
                                    }`}>
                                    {order.status === 'ready' ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                        <h3 className="text-base font-bold text-slate-900 truncate">{order.customer_name}</h3>
                                        <span className="text-xs font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-500 whitespace-nowrap">{order.invoice_number}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                                        <span className="text-emerald-600 font-semibold truncate max-w-[200px]">{order.service_type}</span>
                                        <span className="flex items-center gap-1.5 whitespace-nowrap"><Phone className="w-3.5 h-3.5" /> {order.customer_phone}</span>
                                        <span className="flex items-center gap-1.5 whitespace-nowrap"><Calendar className="w-3.5 h-3.5" /> Est: {new Date(order.target_completion_time).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full xl:w-auto flex flex-wrap md:flex-nowrap items-center gap-2 pl-12 xl:pl-0">
                                {/* Print Button */}
                                <button
                                    onClick={() => handlePrint(order)}
                                    className="flex-1 md:flex-none btn-secondary flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 min-w-0"
                                    title="Cetak Struk"
                                >
                                    <Printer className="w-4 h-4" />
                                    <span className="inline">Struk</span>
                                </button>

                                {/* Edit Button */}
                                <button
                                    onClick={() => handleEdit(order.id)}
                                    className="flex-1 md:flex-none btn-secondary flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold border-blue-200 text-blue-700 hover:bg-blue-50 min-w-0"
                                    title="Edit Pesanan"
                                >
                                    <Edit className="w-4 h-4" />
                                    <span className="inline">Edit</span>
                                </button>

                                {/* Delete Button */}
                                <button
                                    onClick={() => handleDelete(order)}
                                    className="flex-1 md:flex-none btn-secondary flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-semibold border-red-200 text-red-700 hover:bg-red-50 min-w-0"
                                    title="Hapus Pesanan"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span className="hidden lg:inline">Hapus</span>
                                </button>

                                {order.status !== 'ready' && order.status !== 'completed' && (
                                    <button
                                        onClick={() => handleComplete(order)}
                                        disabled={sendingId === order.id}
                                        className="flex-1 md:flex-none btn-primary flex items-center justify-center gap-2 py-2 px-5 text-sm font-semibold min-w-[120px]"
                                    >
                                        {sendingId === order.id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span className="hidden sm:inline">Kirim...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
                                                <span className="whitespace-nowrap">Kirim WA</span>
                                            </>
                                        )}
                                    </button>
                                )}

                                {order.status === 'ready' && (
                                    <button
                                        onClick={() => handleComplete(order)}
                                        disabled={sendingId === order.id}
                                        className="flex-1 md:flex-none btn-secondary flex items-center justify-center gap-2 py-2 px-5 text-sm font-semibold border-emerald-200 text-emerald-700 hover:bg-emerald-50 min-w-[120px]"
                                    >
                                        {sendingId === order.id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span className="hidden sm:inline">Proses...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
                                                <span className="whitespace-nowrap">Diambil</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {filteredOrders.length === 0 && !loading && (
                        <div className="text-center py-24">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Tidak ada pesanan ditemukan</h3>
                            <p className="text-lg text-slate-500">Coba kata kunci lain atau buat pesanan baru.</p>
                        </div>
                    )}

                    {/* Infinite Scroll Sentinel */}
                    {hasMore && searchTerm === '' && (
                        <div ref={sentinelRef} className="flex justify-center py-8">
                            {loading && <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />}
                        </div>
                    )}
                </div>
            )}

            {/* Bulk Action Bar */}
            {selectedOrderIds.size > 0 && (
                <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 duration-300 w-[90%] md:w-auto justify-between md:justify-start">
                    <div className="font-semibold text-lg">
                        {selectedOrderIds.size} Pesanan Dipilih
                    </div>
                    <div className="h-8 w-px bg-slate-700" />
                    <button
                        onClick={handleBulkComplete}
                        disabled={isBulkSending}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isBulkSending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                        Kirim WA Terpilih
                    </button>
                    <button
                        onClick={() => setSelectedOrderIds(new Set())}
                        disabled={isBulkSending}
                        className="text-slate-400 hover:text-white transition-colors font-medium"
                    >
                        Batal
                    </button>
                </div>
            )}

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                isDangerous={confirmModal.isDangerous}
            />
            {/* Invoice Modal */}
            <InvoiceModal
                isOpen={!!selectedInvoiceOrder}
                onClose={() => setSelectedInvoiceOrder(null)}
                order={selectedInvoiceOrder}
            />
        </div>
    );
}
