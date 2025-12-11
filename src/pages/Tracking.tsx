import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Loader2, Shirt, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export default function Tracking() {
    const [searchParams] = useSearchParams();
    const [invoice, setInvoice] = useState('');
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState('');

    const [currentStage, setCurrentStage] = useState('');

    const fetchOrder = useCallback(async (invNumber: string) => {
        if (!invNumber.trim()) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('laundry_orders')
                .select('*')
                .eq('invoice_number', invNumber.trim())
                .single();

            if (error) throw error;
            setOrder(data);
            setInvoice(invNumber);
        } catch (error) {
            console.error(error);
            setOrder(null);
            // Only alert if it was a manual search, or handle gracefully
            if (!searchParams.get('inv')) {
                alert('Nomor Invoice tidak ditemukan!');
            }
        } finally {
            setLoading(false);
        }
    }, [searchParams]);

    useEffect(() => {
        const invParam = searchParams.get('inv');
        if (invParam) {
            setInvoice(invParam);
            fetchOrder(invParam);
        }
    }, [searchParams, fetchOrder]);

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        fetchOrder(invoice);
    };

    useEffect(() => {
        if (!order) return;

        const calculateProgress = () => {
            if (order.status === 'ready' || order.status === 'completed') {
                setProgress(100);
                setCurrentStage('Siap Diambil');
                setTimeRemaining('Siap Diambil');
                return;
            }

            const now = new Date().getTime();
            const start = new Date(order.created_at).getTime();
            const target = new Date(order.target_completion_time).getTime();
            const totalDuration = target - start;
            const elapsed = now - start;

            let pct = (elapsed / totalDuration) * 100;

            // Logic: Start at 10%, Cap at 90% for processing
            pct = Math.max(10, Math.min(90, pct));

            setProgress(pct);

            // Determine Stage Text based on percentage
            let stageText = 'Sedang Diproses...';
            if (pct < 25) stageText = 'Pemilahan';
            else if (pct < 50) stageText = 'Proses Pencucian';
            else if (pct < 75) stageText = 'Proses Pengeringan';
            else if (pct < 90) stageText = 'Setrika & Packing';
            else stageText = 'Finishing';

            setCurrentStage(stageText);

            // Time remaining
            const remaining = target - now;
            if (remaining > 0) {
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                setTimeRemaining(`${hours}j ${minutes}m lagi`);
            } else {
                setTimeRemaining('Segera Selesai');
            }
        };

        // Initial calculation with delay for animation
        const timer = setTimeout(() => {
            calculateProgress();
        }, 100);

        const interval = setInterval(calculateProgress, 60000); // Update every minute

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [order]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
            {/* Header */}
            <div className="px-8 py-6 flex items-center justify-between bg-white border-b border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Shirt className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Laundry<span className="text-emerald-500">Pro</span></h1>
                        <p className="text-sm text-slate-500">Cek Status Laundry</p>
                    </div>
                </div>
                <Link to="/admin/login" className="text-base font-medium text-slate-500 hover:text-emerald-600 transition-colors">Login Admin</Link>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10">
                {!order ? (
                    <div className="w-full max-w-lg space-y-10">
                        <div className="text-center space-y-3">
                            <h2 className="text-4xl font-bold text-slate-900">Lacak Laundry</h2>
                            <p className="text-lg text-slate-500">Masukkan nomor nota untuk cek status pesananmu.</p>
                        </div>

                        <form onSubmit={handleTrack} className="relative group">
                            <div className="absolute inset-0 bg-emerald-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative">
                                <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-7 h-7 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="text"
                                    value={invoice}
                                    onChange={(e) => setInvoice(e.target.value)}
                                    placeholder="INV-XXXXXX"
                                    className="w-full bg-white border-2 border-slate-200 rounded-3xl py-6 pl-24 pr-32 text-2xl font-bold text-slate-900 placeholder-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-xl shadow-slate-200/50"
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="absolute right-3 top-3 bottom-3 bg-emerald-500 hover:bg-emerald-600 text-white px-8 rounded-2xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Cek'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="w-full max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <button
                            onClick={() => setOrder(null)}
                            className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors mb-6 font-medium text-lg group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Cek Lainnya
                        </button>

                        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 md:p-10 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />

                            <div className="text-center mb-6 md:mb-10">
                                <div className="inline-block px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-sm md:text-base font-mono font-semibold mb-3 tracking-wide">
                                    {order.invoice_number}
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">Halo, {order.customer_name} 👋</h2>
                                <p className="text-emerald-600 font-semibold text-lg md:text-xl">{order.service_type}</p>
                            </div>

                            {/* Progress Circle */}
                            {/* Progress Circle */}
                            <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto mb-8 md:mb-10">
                                <div className="absolute inset-0 bg-emerald-500/5 rounded-full blur-3xl" />
                                <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 256 256">
                                    <circle
                                        cx="128"
                                        cy="128"
                                        r="110"
                                        stroke="currentColor"
                                        strokeWidth="18"
                                        fill="transparent"
                                        className="text-slate-100"
                                    />
                                    {/* Rotating Dashed Ring for Active Feel */}
                                    <circle
                                        cx="128"
                                        cy="128"
                                        r="124"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        fill="transparent"
                                        strokeDasharray="8 8"
                                        className="text-emerald-200/60 animate-spin-slow origin-center"
                                    />
                                    {/* Ghost Circle for Continuous Animation */}
                                    <circle
                                        cx="128"
                                        cy="128"
                                        r="110"
                                        stroke="currentColor"
                                        strokeWidth="18"
                                        fill="transparent"
                                        style={{
                                            strokeDasharray: 2 * Math.PI * 110,
                                            '--circumference': `${2 * Math.PI * 110}px`,
                                            '--target-offset': `${2 * Math.PI * 110 * (1 - progress / 100)}px`,
                                        } as React.CSSProperties}
                                        className="text-emerald-300/50 animate-fill-up"
                                        strokeLinecap="round"
                                    />
                                    <circle
                                        cx="128"
                                        cy="128"
                                        r="110"
                                        stroke="currentColor"
                                        strokeWidth="18"
                                        fill="transparent"
                                        style={{
                                            strokeDasharray: 2 * Math.PI * 110,
                                            strokeDashoffset: 2 * Math.PI * 110 * (1 - progress / 100),
                                            transition: 'stroke-dashoffset 1.5s ease-out'
                                        }}
                                        className="text-emerald-500 drop-shadow-lg"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-2 text-center">
                                    {progress >= 100 ? (
                                        <div className="w-20 h-20 md:w-24 md:h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 animate-in zoom-in duration-500">
                                            <CheckCircle className="w-10 h-10 md:w-14 md:h-14 text-white" />
                                        </div>
                                    ) : (
                                        <div className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-1">{Math.round(progress)}<span className="text-xl md:text-3xl text-slate-400 font-bold">%</span></div>
                                    )}
                                    <p className="text-base md:text-lg text-slate-500 font-medium mt-1 leading-tight px-2">
                                        {progress >= 100 ? 'Selesai!' : currentStage}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 md:space-y-6">
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 md:p-6 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-emerald-500">
                                            <Clock className="w-5 h-5 md:w-6 md:h-6" />
                                        </div>
                                        <span className="text-slate-600 font-medium text-base md:text-lg">Est. Selesai</span>
                                    </div>
                                    <span className="text-slate-900 font-bold text-base md:text-lg bg-white px-3 py-1 md:px-4 md:py-1.5 rounded-lg shadow-sm border border-slate-100">
                                        {timeRemaining}
                                    </span>
                                </div>

                                <div className="text-center px-2">
                                    <p className="text-slate-500 text-sm md:text-lg leading-relaxed">
                                        {progress >= 100
                                            ? "Laundry kamu sudah siap diambil! Silakan datang ke outlet kami. 🧺✨"
                                            : "Kami sedang merawat pakaianmu dengan hati-hati. Pantau terus ya! 🧼"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
