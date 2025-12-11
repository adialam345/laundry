import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
    isLoading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal',
    isDangerous = false,
    isLoading = false
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-full ${isDangerous ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
                    <p className="text-slate-500 leading-relaxed mb-6">{message}</p>

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-5 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`px-5 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isDangerous
                                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                                : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                                }`}
                        >
                            {isLoading ? 'Memproses...' : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
