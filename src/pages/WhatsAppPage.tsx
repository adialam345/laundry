import { useState } from 'react';
import WhatsAppSetup from '../components/WhatsAppSetup';
import { Smartphone, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

export default function WhatsAppPage() {
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

    const handleResetWhatsapp = async () => {
        setConfirmModal({
            isOpen: true,
            title: 'Reset WhatsApp',
            message: 'Apakah Anda yakin ingin mereset koneksi WhatsApp? Ini akan menghapus sesi saat ini dan Anda perlu memindai ulang QR Code.',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                const toastId = toast.loading('Mereset koneksi WhatsApp...');
                try {
                    const response = await fetch('http://localhost:3000/api/reset', {
                        method: 'POST',
                    });
                    const data = await response.json();

                    if (data.success) {
                        toast.success('Koneksi WhatsApp berhasil direset', { id: toastId });
                        // Optionally trigger a refresh in WhatsAppSetup if needed, 
                        // but since it polls, it should pick up the change.
                    } else {
                        throw new Error(data.error || 'Gagal mereset');
                    }
                } catch (error: any) {
                    toast.error('Gagal mereset: ' + error.message, { id: toastId });
                }
            }
        });
    };

    return (
        <div className="page-container max-w-5xl">
            <div className="page-header">
                <div>
                    <h1 className="page-title">WhatsApp Gateway</h1>
                    <p className="page-subtitle">Hubungkan WhatsApp untuk mengirim notifikasi otomatis.</p>
                </div>
            </div>

            <div className="glass-panel p-0 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <WhatsAppSetup />
            </div>

            <div className="mt-12 border-t border-slate-200 pt-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                            <Smartphone className="w-7 h-7 text-emerald-600" />
                            Pengaturan Lanjutan
                        </h2>
                        <p className="text-slate-500 mt-1">Kelola koneksi dan sesi WhatsApp.</p>
                    </div>
                </div>

                <div className="glass-card p-8 rounded-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Reset Sesi WhatsApp</h3>
                            <p className="text-slate-500 mt-1">Gunakan ini jika WhatsApp mengalami masalah koneksi atau ingin mengganti nomor.</p>
                        </div>
                        <button
                            onClick={handleResetWhatsapp}
                            className="px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-semibold transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Reset Koneksi & Hapus Auth
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                isDangerous={true}
                confirmText="Hapus & Reset"
            />
        </div>
    );
}
