import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';

interface Order {
    id: string;
    invoice_number: string;
    customer_name: string;
    customer_phone: string;
    service_type: string;
    status: string;
    price: number;
    created_at: string;
    target_completion_time: string;
}

export default function InvoicePrint() {
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        if (!id) return;
        try {
            const { data, error } = await supabase
                .from('laundry_orders')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setOrder(data);
            // Delay print slightly to ensure render
            // setTimeout(() => window.print(), 1000);
        } catch (error) {
            console.error('Error fetching order:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50">
                <p className="text-slate-500">Invoice tidak ditemukan</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center print:bg-white print:p-0">
            {/* Toolbar - Hidden when printing */}
            <div className="w-full max-w-md flex items-center justify-between mb-8 print:hidden">
                <button
                    onClick={() => window.close()}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Kembali
                </button>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
                >
                    <Printer className="w-5 h-5" />
                    Cetak Struk
                </button>
            </div>

            {/* Receipt Preview */}
            <div className="bg-white w-full max-w-[80mm] min-h-[100mm] p-6 shadow-2xl print:shadow-none print:w-full print:max-w-none print:p-0 font-mono text-sm leading-tight text-slate-900 mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="font-bold text-xl mb-1 uppercase tracking-wider">Laundry Antarixa</h1>
                    <p className="text-[10px] text-slate-500 mb-1">Jl. Raya Laundry No. 88, Kota Bersih</p>
                    <p className="text-[10px] text-slate-500">WA: 0812-3456-7890</p>
                </div>

                <div className="border-b border-dashed border-slate-300 pb-3 mb-3">
                    <div className="flex justify-between mb-1">
                        <span className="text-slate-500">No. Nota</span>
                        <span className="font-bold">{order.invoice_number}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                        <span className="text-slate-500">Tanggal</span>
                        <span>{new Date(order.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                        <span className="text-slate-500">Pelanggan</span>
                        <span className="font-bold uppercase">{order.customer_name.substring(0, 15)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Status</span>
                        <span className="uppercase">{order.status === 'processing' ? 'Proses' : order.status === 'ready' ? 'Siap' : 'Selesai'}</span>
                    </div>
                </div>

                {/* Items */}
                <div className="mb-6">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                            <p className="font-bold mb-0.5">{order.service_type}</p>
                            {/* Note: Weight is not currently stored in orders table, showing total only */}
                        </div>
                        <div className="text-right whitespace-nowrap font-bold">
                            Rp {order.price.toLocaleString('id-ID')}
                        </div>
                    </div>
                </div>

                {/* Footer Totals */}
                <div className="border-t border-dashed border-slate-300 pt-3 mb-6">
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>TOTAL</span>
                        <span>Rp {order.price.toLocaleString('id-ID')}</span>
                    </div>
                </div>

                <div className="text-center text-[10px] text-slate-500 space-y-1">
                    <p>Estimasi Selesai:</p>
                    <p className="font-bold text-xs text-slate-700 mb-2">
                        {new Date(order.target_completion_time).toLocaleString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                    <p className="italic">"Terima kasih atas kepercayaan Anda"</p>
                    <p>Harap simpan struk ini pengambilan barang.</p>
                    <p className="border-t border-slate-200 mt-2 pt-2">Simpan bukti pembayaran ini</p>
                </div>
            </div>
        </div>
    );
}
