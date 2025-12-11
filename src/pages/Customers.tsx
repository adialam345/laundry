import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, User, Phone, Calendar, Loader2, Edit, Trash2, X, Save } from 'lucide-react';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

export default function Customers() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const ITEMS_PER_PAGE = 10;

    const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({ name: '', phone: '62' });
    const [isSaving, setIsSaving] = useState(false);

    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        customerId: string | null;
        customerName: string;
    }>({
        isOpen: false,
        customerId: null,
        customerName: '',
    });

    useEffect(() => {
        fetchCustomers(0);
    }, []);

    const fetchCustomers = async (pageNumber = 0) => {
        try {
            const from = pageNumber * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            const newCustomers = data || [];

            if (pageNumber === 0) {
                setCustomers(newCustomers);
            } else {
                setCustomers(prev => [...prev, ...newCustomers]);
            }

            setHasMore(newCustomers.length === ITEMS_PER_PAGE);
            setPage(pageNumber);
        } catch (error) {
            console.error('Error fetching customers:', error);
            toast.error('Gagal memuat data pelanggan');
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            fetchCustomers(page + 1);
        }
    };

    const sentinelRef = useInfiniteScroll(loadMore, loading);

    const handleEditClick = (customer: any) => {
        setEditingCustomer(customer);
        setEditForm({ name: customer.name, phone: customer.phone });
    };

    const handleUpdateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCustomer) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('customers')
                .update({ name: editForm.name, phone: editForm.phone })
                .eq('id', editingCustomer.id);

            if (error) throw error;

            setCustomers(customers.map(c =>
                c.id === editingCustomer.id ? { ...c, name: editForm.name, phone: editForm.phone } : c
            ));

            toast.success('Data pelanggan berhasil diperbarui');
            setEditingCustomer(null);
        } catch (error: any) {
            console.error('Error updating customer:', error);
            toast.error('Gagal update pelanggan: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (customer: any) => {
        setDeleteModal({
            isOpen: true,
            customerId: customer.id,
            customerName: customer.name,
        });
    };

    const confirmDelete = async () => {
        if (!deleteModal.customerId) return;

        try {
            const { error, count } = await supabase
                .from('customers')
                .delete({ count: 'exact' })
                .eq('id', deleteModal.customerId);

            if (error) throw error;

            if (count === 0) {
                throw new Error('Gagal menghapus pelanggan. Mungkin karena izin akses atau data tidak ditemukan.');
            }

            setCustomers(customers.filter(c => c.id !== deleteModal.customerId));
            toast.success('Pelanggan berhasil dihapus');
        } catch (error: any) {
            console.error('Error deleting customer:', error);
            toast.error(error.message || 'Gagal hapus pelanggan');
        } finally {
            setDeleteModal({ isOpen: false, customerId: null, customerName: '' });
        }
    };

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
    );

    if (loading && page === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Pelanggan</h1>
                    <p className="page-subtitle">Daftar pelanggan yang pernah melakukan order.</p>
                </div>
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Cari nama atau nomor HP..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field !pl-20 w-full md:w-80"
                    />
                </div>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-8 py-5 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">Nama Pelanggan</th>
                                <th className="px-8 py-5 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">Nomor WhatsApp</th>
                                <th className="px-8 py-5 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">Terdaftar Sejak</th>
                                <th className="px-8 py-5 text-right text-sm font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <span className="text-base font-medium text-slate-900">{customer.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3 text-base text-slate-600">
                                            <Phone className="w-4 h-4 text-slate-400" />
                                            {customer.phone}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3 text-base text-slate-500">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            {new Date(customer.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric', month: 'long', year: 'numeric'
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditClick(customer)}
                                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(customer)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <User className="w-10 h-10 opacity-20" />
                                            <p className="text-lg">Tidak ada pelanggan ditemukan.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Infinite Scroll Sentinel */}
                {hasMore && searchTerm === '' && (
                    <div ref={sentinelRef} className="flex justify-center py-6 border-t border-slate-100">
                        {loading && <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900">Edit Pelanggan</h3>
                            <button onClick={() => setEditingCustomer(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateCustomer} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Nama Pelanggan</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="input-field w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Nomor WhatsApp</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.phone}
                                    onChange={e => {
                                        let val = e.target.value.replace(/\D/g, '');
                                        if (val.startsWith('0')) {
                                            val = '62' + val.substring(1);
                                        } else if (!val.startsWith('62') && val.length > 0) {
                                            val = '62' + val;
                                        }
                                        setEditForm({ ...editForm, phone: val });
                                    }}
                                    className="input-field w-full"
                                    placeholder="Contoh: 628123456789"
                                />
                            </div>
                            <div className="pt-4 flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setEditingCustomer(null)}
                                    className="px-5 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="btn-primary px-5 py-2.5 flex items-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, customerId: null, customerName: '' })}
                onConfirm={confirmDelete}
                title="Hapus Pelanggan"
                message={`Apakah Anda yakin ingin menghapus pelanggan "${deleteModal.customerName}"? Tindakan ini tidak dapat dibatalkan.`}
                isDangerous={true}
                confirmText="Hapus"
            />
        </div>
    );
}
