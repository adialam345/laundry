import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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
                    <div className="printable-content bg-white px-[3mm] py-[4mm] shadow-sm text-slate-900 font-mono text-[12px] leading-tight w-[80mm]">
                        {/* Receipt Header */}
                        <div className="text-center mb-4">
                            <h1 className="font-bold text-lg mb-1 uppercase tracking-wider">Laundry Antarixa</h1>
                            <p className="text-[10px] text-slate-600 mb-1">Jl. Raya Laundry No. 88</p>
                            <p className="text-[10px] text-slate-600">WA: 0812-3456-7890</p>
                        </div>

                        {/* Order Info */}
                        <div className="border-b border-dashed border-slate-400 pb-2 mb-2 space-y-1">
                            <div className="flex justify-between">
                                <span className="text-slate-600">Invoice</span>
                                <span className="font-bold">{order.invoice_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Tanggal</span>
                                <span>{new Date(order.created_at || new Date()).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Pelanggan</span>
                                <span className="font-bold uppercase truncate max-w-[120px] text-right">{order.customer_name}</span>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="mb-4">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex-1 pr-2">
                                    <p className="font-bold mb-0.5">{order.service_type}</p>
                                    {order.weight > 1 && <p className="text-[10px] text-slate-500">{order.weight} {order.unit_type} x @{((order.price + (order.discount || 0)) / order.weight).toLocaleString('id-ID')}</p>}
                                </div>
                                <div className="text-right whitespace-nowrap font-bold">
                                    {((order.price + (order.discount || 0))).toLocaleString('id-ID')}
                                </div>
                            </div>
                        </div>

                        {/* Footer Totals */}
                        <div className="border-t border-dashed border-slate-400 pt-2 mb-4 space-y-1">
                            {(order.discount || 0) > 0 && (
                                <>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-600">Subtotal</span>
                                        <span>{((order.price + (order.discount || 0))).toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-600">Diskon</span>
                                        <span>-{(order.discount || 0).toLocaleString('id-ID')}</span>
                                    </div>
                                </>
                            )}
                            <div className="flex justify-between items-center text-base font-bold pt-1">
                                <span>TOTAL</span>
                                <span>Rp {order.price?.toLocaleString('id-ID')}</span>
                            </div>
                        </div>

                        {/* QR Code & Footer Note */}
                        <div className="text-center pb-4 flex flex-col items-center">
                            <div className="mb-3 p-1 bg-white border border-slate-200">
                                <QRCodeSVG
                                    value={`${window.location.origin}/track?inv=${order.invoice_number}`}
                                    size={80}
                                    level="M"
                                />
                            </div>
                            <p className="text-[9px] text-slate-500 mb-2">Scan untuk Cek Status</p>

                            <p className="text-[10px] text-slate-600 space-y-1">
                                Estimasi Selesai:
                            </p>
                            <p className="font-bold text-xs text-slate-800 mb-2">
                                {order.target_completion_time ? new Date(order.target_completion_time).toLocaleString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) : '-'}
                            </p>
                            <p className="text-[10px] italic mt-2">"Terima Kasih"</p>
                            <p>.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
