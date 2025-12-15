import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer } from 'lucide-react';
import { InvoiceReceipt } from './InvoiceReceipt';

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: any;
}

export default function InvoiceModal({ isOpen, onClose, order }: InvoiceModalProps) {
    if (!isOpen || !order) return null;

    const handlePrint = () => {
        window.print();
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Modal Content */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header Toolbar (Non-printable) */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 no-print">
                    <h3 className="font-bold text-slate-700">Preview Struk</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                        >
                            <Printer className="w-4 h-4" /> Cetak
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Area - Optimized for 80mm Thermal Printer */}
                <div className="p-6 bg-slate-200/50 max-h-[80vh] overflow-y-auto custom-scrollbar flex justify-center">
                    <InvoiceReceipt order={order} />
                </div>
            </div>
        </div>,
        document.body
    );
}
