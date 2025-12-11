import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Save, Loader2, Settings as SettingsIcon, Edit2, X, Clock, Tag, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

interface Service {
    id: string;
    name: string;
    price_per_unit: number;
    unit_type: 'kg' | 'pcs';
    duration_hours: number;
    description: string;
}

export default function Settings() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentService, setCurrentService] = useState<Partial<Service>>({
        name: '',
        unit_type: 'kg',
        description: ''
    });

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const { data, error } = await supabase
                .from('laundry_services')
                .select('*')
                .order('name');

            if (error) throw error;
            setServices(data || []);
        } catch (error: any) {
            console.error('Error fetching services:', error);
            if (error.code === 'PGRST205') {
                toast.error('Tabel "laundry_services" belum dibuat.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (currentService.id) {
                const { error } = await supabase
                    .from('laundry_services')
                    .update(currentService)
                    .eq('id', currentService.id);
                if (error) throw error;
                toast.success('Layanan berhasil diperbarui');
            } else {
                const { error } = await supabase
                    .from('laundry_services')
                    .insert(currentService);
                if (error) throw error;
                toast.success('Layanan baru ditambahkan');
            }

            await fetchServices();
            setIsEditing(false);
            resetForm();
        } catch (error: any) {
            toast.error('Gagal menyimpan: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Layanan',
            message: 'Apakah Anda yakin ingin menghapus layanan ini? Tindakan ini tidak dapat dibatalkan.',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    const { error } = await supabase
                        .from('laundry_services')
                        .delete()
                        .eq('id', id);

                    if (error) throw error;
                    toast.success('Layanan dihapus');
                    fetchServices();
                } catch (error: any) {
                    toast.error('Gagal menghapus: ' + error.message);
                }
            }
        });
    };

    const resetForm = () => {
        setCurrentService({
            name: '',
            unit_type: 'kg',
            description: ''
        });
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Daftar Layanan</h1>
                    <p className="page-subtitle">Kelola jenis layanan dan harga laundry.</p>
                </div>
                <button
                    onClick={() => { setIsEditing(true); resetForm(); }}
                    className="btn-primary flex items-center gap-2 text-lg px-6 py-3"
                >
                    <Plus className="w-5 h-5" /> Tambah Layanan
                </button>
            </div>

            {isEditing && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="glass-panel bg-white w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 p-8">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                {currentService.id ? <Edit2 className="w-6 h-6 text-emerald-500" /> : <Plus className="w-6 h-6 text-emerald-500" />}
                                {currentService.id ? 'Edit Layanan' : 'Tambah Layanan Baru'}
                            </h2>
                            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-7 h-7" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-base font-semibold text-slate-700 flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-slate-400" /> Nama Layanan
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={currentService.name}
                                    onChange={e => setCurrentService({ ...currentService, name: e.target.value })}
                                    className="input-field"
                                    placeholder="Contoh: Cuci Komplit Regular"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-base font-semibold text-slate-700">Harga per Unit (Rp)</label>
                                    <input
                                        required
                                        type="number"
                                        value={currentService.price_per_unit ?? ''}
                                        onChange={e => setCurrentService({ ...currentService, price_per_unit: e.target.value === '' ? undefined : Number(e.target.value) })}
                                        className="input-field"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-base font-semibold text-slate-700">Satuan</label>
                                    <select
                                        value={currentService.unit_type}
                                        onChange={e => setCurrentService({ ...currentService, unit_type: e.target.value as 'kg' | 'pcs' })}
                                        className="input-field"
                                    >
                                        <option value="kg">Per Kg</option>
                                        <option value="pcs">Per Pcs</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-base font-semibold text-slate-700 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" /> Durasi Estimasi (Jam)
                                </label>
                                <input
                                    required
                                    type="number"
                                    value={currentService.duration_hours ?? ''}
                                    onChange={e => setCurrentService({ ...currentService, duration_hours: e.target.value === '' ? undefined : Number(e.target.value) })}
                                    className="input-field"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-base font-semibold text-slate-700 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-400" /> Deskripsi
                                </label>
                                <textarea
                                    value={currentService.description}
                                    onChange={e => setCurrentService({ ...currentService, description: e.target.value })}
                                    className="input-field h-28 resize-none text-base"
                                    placeholder="Deskripsi layanan..."
                                />
                            </div>

                            <div className="flex gap-4 pt-6 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3.5 rounded-xl transition-colors font-semibold text-lg"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 btn-primary py-3.5 flex items-center justify-center gap-2 text-lg font-bold"
                                >
                                    <Save className="w-5 h-5" /> Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service) => (
                        <div key={service.id} className="glass-card p-8 rounded-2xl group relative animate-in fade-in slide-in-from-bottom-4 duration-500">


                            <div className="flex items-start justify-between mb-6">
                                <div className="p-4 bg-emerald-50 rounded-2xl group-hover:bg-emerald-100 transition-colors">
                                    <SettingsIcon className="w-8 h-8 text-emerald-600" />
                                </div>
                                <span className="bg-slate-100 border border-slate-200 text-slate-500 text-sm px-3 py-1.5 rounded-lg font-mono flex items-center gap-1.5 font-medium">
                                    <Clock className="w-4 h-4" />
                                    {service.duration_hours} Jam
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">{service.name}</h3>
                            <p className="text-slate-500 text-base mb-8 h-12 line-clamp-2 leading-relaxed">{service.description}</p>

                            <div className="flex items-end justify-between border-t border-slate-100 pt-5">
                                <div>
                                    <p className="text-sm text-slate-400 mb-1 font-medium">Harga Layanan</p>
                                    <p className="text-emerald-600 font-bold text-2xl">
                                        Rp {service.price_per_unit.toLocaleString('id-ID')}
                                        <span className="text-slate-400 text-base font-normal"> / {service.unit_type}</span>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setCurrentService(service); setIsEditing(true); }}
                                        className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                                        title="Edit Layanan"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(service.id)}
                                        className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                                        title="Hapus Layanan"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                isDangerous={true}
                confirmText="Hapus"
            />
        </div>
    );
}
