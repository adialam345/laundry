import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Save, Loader2, Calculator, Scale, User, Phone, CheckCircle2, Clock, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface Service {
    id: string;
    name: string;
    price_per_unit: number;
    unit_type: 'kg' | 'pcs';
    duration_hours: number;
}

interface Order {
    id: string;
    invoice_number: string;
    customer_name: string;
    customer_phone: string;
    service_type: string;
    status: string;
    price: number;
    target_completion_time: string;
}

export default function EditOrder() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(false);
    const [loadingOrder, setLoadingOrder] = useState(true);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [originalOrder, setOriginalOrder] = useState<Order | null>(null);

    const [formData, setFormData] = useState({
        customer_name: '',
        customer_phone: '62',
        weight: 1,
        price: 0,
        status: 'processing'
    });

    useEffect(() => {
        fetchServices();
        fetchOrder();
    }, [id]);

    useEffect(() => {
        if (selectedService) {
            const calculatedPrice = selectedService.price_per_unit * formData.weight;
            setFormData(prev => ({ ...prev, price: calculatedPrice }));
        }
    }, [selectedService, formData.weight]);

    const fetchOrder = async () => {
        if (!id) return;

        try {
            const { data, error } = await supabase
                .from('laundry_orders')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (data) {
                setOriginalOrder(data);
                setFormData({
                    customer_name: data.customer_name,
                    customer_phone: data.customer_phone,
                    weight: 1, // We'll calculate this from price
                    price: data.price,
                    status: data.status
                });
            }
        } catch (error: any) {
            console.error('Error fetching order:', error);
            toast.error('Gagal memuat data pesanan');
            navigate('/admin/orders');
        } finally {
            setLoadingOrder(false);
        }
    };

    const fetchServices = async () => {
        try {
            const { data, error } = await supabase
                .from('laundry_services')
                .select('*')
                .order('name');

            if (error) throw error;

            if (data && data.length > 0) {
                setServices(data);
            }
        } catch (error: any) {
            console.error('Error fetching services:', error);
        }
    };

    // Set selected service when order is loaded
    useEffect(() => {
        if (originalOrder && services.length > 0) {
            const service = services.find(s => s.name === originalOrder.service_type);
            if (service) {
                setSelectedService(service);
                // Calculate weight from price
                const weight = originalOrder.price / service.price_per_unit;
                setFormData(prev => ({ ...prev, weight }));
            }
        }
    }, [originalOrder, services]);

    const handleNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, customer_name: value }));

        if (value.length > 1) {
            try {
                const { data } = await supabase
                    .from('customers')
                    .select('*')
                    .ilike('name', `%${value}%`)
                    .limit(5);

                if (data) {
                    setSuggestions(data);
                    setShowSuggestions(true);
                }
            } catch (error) {
                console.error('Error searching customers:', error);
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const selectCustomer = (customer: any) => {
        setFormData(prev => ({
            ...prev,
            customer_name: customer.name,
            customer_phone: customer.phone
        }));
        setShowSuggestions(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedService || !id) return;

        setLoading(true);

        try {
            // 1. Update Customer
            const { error: customerError } = await supabase
                .from('customers')
                .upsert({
                    name: formData.customer_name,
                    phone: formData.customer_phone
                }, { onConflict: 'phone' });

            if (customerError) {
                console.error('Error updating customer:', customerError);
            }

            // 2. Update Order
            const targetTime = new Date();
            targetTime.setHours(targetTime.getHours() + selectedService.duration_hours);

            const { error } = await supabase
                .from('laundry_orders')
                .update({
                    customer_name: formData.customer_name,
                    customer_phone: formData.customer_phone,
                    service_type: selectedService.name,
                    target_completion_time: targetTime.toISOString(),
                    status: formData.status,
                    price: formData.price
                })
                .eq('id', id);

            if (error) throw error;

            toast.success('Pesanan berhasil diupdate!');
            navigate('/admin/orders');
        } catch (error: any) {
            console.error('Error updating order:', error);
            toast.error('Gagal mengupdate pesanan: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loadingOrder) {
        return (
            <div className="page-container flex justify-center items-center min-h-screen">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="page-container max-w-5xl">
            <div className="page-header">
                <div>
                    <button
                        onClick={() => navigate('/admin/orders')}
                        className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Kembali ke Daftar Pesanan
                    </button>
                    <h1 className="page-title">Edit Pesanan</h1>
                    <p className="page-subtitle">Update data pesanan {originalOrder?.invoice_number}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-10 space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                {/* Customer Section */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                        <User className="w-6 h-6 text-emerald-500" />
                        Data Pelanggan
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3 relative">
                            <label className="text-base font-semibold text-slate-700">Nama Pelanggan</label>
                            <div className="relative">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                                <input
                                    required
                                    type="text"
                                    value={formData.customer_name}
                                    onChange={handleNameChange}
                                    onFocus={() => formData.customer_name.length > 1 && setShowSuggestions(true)}
                                    className="input-field !pl-20"
                                    placeholder="Contoh: Budi Santoso"
                                    autoComplete="off"
                                />
                            </div>
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-xl mt-2 shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                                    {suggestions.map((customer) => (
                                        <button
                                            key={customer.id}
                                            type="button"
                                            onClick={() => selectCustomer(customer)}
                                            className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                                        >
                                            <div className="font-semibold text-lg text-slate-900">{customer.name}</div>
                                            <div className="text-sm text-slate-500">{customer.phone}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {showSuggestions && (
                                <div
                                    className="fixed inset-0 z-0"
                                    onClick={() => setShowSuggestions(false)}
                                    style={{ pointerEvents: 'auto', background: 'transparent' }}
                                />
                            )}
                        </div>

                        <div className="space-y-3">
                            <label className="text-base font-semibold text-slate-700">Nomor WhatsApp</label>
                            <div className="relative">
                                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                                <input
                                    required
                                    type="tel"
                                    value={formData.customer_phone}
                                    onChange={e => {
                                        let val = e.target.value.replace(/\D/g, '');
                                        if (val.startsWith('0')) {
                                            val = '62' + val.substring(1);
                                        } else if (!val.startsWith('62') && val.length > 0) {
                                            val = '62' + val;
                                        }
                                        setFormData({ ...formData, customer_phone: val });
                                    }}
                                    className="input-field !pl-20"
                                    placeholder="Contoh: 628123456789"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full h-px bg-slate-200" />

                {/* Service Section */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        Pilih Layanan
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                        {services.map((service) => (
                            <button
                                key={service.id}
                                type="button"
                                onClick={() => setSelectedService(service)}
                                className={`p-6 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden group ${selectedService?.id === service.id
                                    ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500'
                                    : 'bg-white border-slate-200 hover:border-emerald-500/50 hover:bg-slate-50'
                                    }`}
                            >
                                <div className="relative z-10">
                                    <div className={`font-bold text-lg mb-2 transition-colors ${selectedService?.id === service.id ? 'text-emerald-700' : 'text-slate-900'}`}>
                                        {service.name}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm text-slate-500 flex items-center gap-2">
                                            <Calculator className="w-4 h-4" />
                                            Rp {service.price_per_unit.toLocaleString('id-ID')} / {service.unit_type}
                                        </div>
                                        <div className="text-sm text-slate-500 flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            Estimasi: {service.duration_hours} Jam
                                        </div>
                                    </div>
                                </div>
                                {selectedService?.id === service.id && (
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-full h-px bg-slate-200" />

                {/* Status Section */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        Status Pesanan
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { value: 'processing', label: 'Dalam Proses', color: 'blue' },
                            { value: 'ready', label: 'Siap Diambil', color: 'emerald' },
                            { value: 'completed', label: 'Selesai', color: 'slate' }
                        ].map((status) => (
                            <button
                                key={status.value}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, status: status.value }))}
                                className={`p-4 rounded-xl border-2 font-semibold transition-all ${formData.status === status.value
                                    ? `border-${status.color}-500 bg-${status.color}-50 text-${status.color}-700`
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                    }`}
                            >
                                {status.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-full h-px bg-slate-200" />

                {/* Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                        <label className="text-base font-semibold text-slate-700">
                            Berat / Jumlah ({selectedService?.unit_type || 'kg'})
                        </label>
                        <div className="relative">
                            <Scale className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                            <input
                                required
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={formData.weight}
                                onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })}
                                className="input-field !pl-20 text-xl font-semibold"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-base font-semibold text-slate-700">Total Harga</label>
                        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 flex items-center justify-between group hover:border-emerald-500/30 transition-colors">
                            <span className="text-slate-500 text-base font-medium">Total</span>
                            <span className="text-emerald-600 font-bold text-2xl">
                                Rp {formData.price.toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="pt-6 flex gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/orders')}
                        className="btn-secondary flex-1 flex items-center justify-center gap-3 py-5 text-xl font-bold"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex-1 flex items-center justify-center gap-3 py-5 text-xl font-bold shadow-xl shadow-emerald-500/20"
                    >
                        {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Save className="w-7 h-7" />}
                        Update Pesanan
                    </button>
                </div>
            </form>
        </div>
    );
}
