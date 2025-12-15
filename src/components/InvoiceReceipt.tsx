import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface InvoiceReceiptProps {
    order: any;
    className?: string; // Allow custom classes for styling wrapper
}

// ForwardRef is useful if we need to reference the DOM node directly for printing/capturing
export const InvoiceReceipt = React.forwardRef<HTMLDivElement, InvoiceReceiptProps>(({ order, className = '' }, ref) => {
    if (!order) return null;

    // Calculate unit price safely
    const unitPrice = order.weight > 0
        ? ((order.price + (order.discount || 0)) / order.weight)
        : 0;

    return (
        <div ref={ref} className={`printable-content bg-white px-[3mm] py-[4mm] shadow-sm text-slate-900 font-mono text-[12px] leading-tight w-[80mm] ${className}`}>
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
                        <p className="text-[10px] text-slate-500">{order.weight} {order.unit_type || 'kg'} x @{unitPrice.toLocaleString('id-ID')}</p>
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
    );
});
