import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, RefreshCw, CheckCircle, XCircle, Loader2, Phone, Link2, LogOut, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';
import { getApiUrl } from '../lib/api';

interface StatusResponse {
  connected: boolean;
  status: string;
  qrCode: string | null;
  pairingCode: string | null;
  message: string;
}

export default function WhatsAppSetup() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pairingLoading, setPairingLoading] = useState(false);
  const [error, setError] = useState('');
  const [usePairingCode, setUsePairingCode] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDangerous?: boolean;
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const fetchStatus = async () => {
    try {
      const res = await fetch(getApiUrl('/api/status'));
      const data = await res.json();
      setStatus(data);
      setError('');
    } catch {
      setError('Tidak dapat terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handlePairing = async () => {
    if (!phoneNumber.trim()) {
      setError('Masukkan nomor HP Anda');
      return;
    }

    setPairingLoading(true);
    setError('');

    try {
      const res = await fetch(getApiUrl('/api/pair'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber.replace(/[^0-9]/g, '') })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
      }
    } catch {
      setError('Gagal memulai pairing');
    } finally {
      setPairingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (status?.connected) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
          <CheckCircle className="w-12 h-12 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">WhatsApp Terhubung</h2>
        <p className="text-slate-500 max-w-md mx-auto mb-8">
          Sistem siap mengirim notifikasi otomatis ke pelanggan melalui WhatsApp Gateway.
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => {
              setConfirmModal({
                isOpen: true,
                title: 'Reset Koneksi',
                message: 'Apakah Anda yakin ingin mereset koneksi WhatsApp? Anda perlu scan QR code ulang.',
                onConfirm: async () => {
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  setLoading(true);
                  try {
                    await fetch(getApiUrl('/api/reset'), { method: 'POST' });
                    toast.success('Koneksi direset');
                  } catch (e) {
                    console.error(e);
                    toast.error('Gagal reset koneksi');
                  } finally {
                    setLoading(false);
                  }
                },
                isDangerous: true,
                confirmText: 'Reset'
              });
            }}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors text-sm font-medium flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Reset Koneksi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Smartphone className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Hubungkan WhatsApp</h2>
        <p className="text-slate-500 text-sm">Pilih metode untuk menautkan perangkat</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="flex p-1 bg-slate-100 rounded-xl mb-8 border border-slate-200">
        <button
          onClick={() => setUsePairingCode(false)}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${!usePairingCode
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          Scan QR Code
        </button>
        <button
          onClick={() => setUsePairingCode(true)}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${usePairingCode
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          Kode Pairing
        </button>
      </div>

      {!usePairingCode ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          {status?.qrCode ? (
            <div className="bg-white p-4 rounded-2xl mx-auto w-fit shadow-xl shadow-slate-200/50 border border-slate-100">
              <QRCodeSVG value={status.qrCode} size={240} level="M" />
            </div>
          ) : status?.status === 'connecting' || status?.status === 'reconnecting' ? (
            <div className="flex flex-col items-center py-12">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">
                {status?.status === 'reconnecting' ? 'Menghubungkan kembali...' : 'Menyiapkan QR Code...'}
              </p>
            </div>
          ) : status?.status === 'failed' || status?.status === 'logged_out' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-slate-600 font-medium mb-6">
                {status?.status === 'logged_out'
                  ? 'Sesi berakhir atau keluar.'
                  : 'Koneksi gagal.'}
              </p>
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await fetch(getApiUrl('/api/reset'), { method: 'POST' });
                      await new Promise(r => setTimeout(r, 2000));
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="btn-primary w-full justify-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Reset Koneksi
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-12">
              <RefreshCw className="w-10 h-10 text-slate-400 mb-4 animate-spin-slow" />
              <p className="text-slate-500">Menunggu QR code...</p>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h3 className="text-slate-900 font-medium mb-4 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" /> Cara Scan
            </h3>
            <ol className="text-slate-600 text-sm space-y-3">
              <li className="flex items-start gap-3">
                <span className="bg-slate-200 text-slate-600 w-5 h-5 rounded flex items-center justify-center text-xs font-mono flex-shrink-0 mt-0.5">1</span>
                Buka WhatsApp di HP Anda
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-slate-200 text-slate-600 w-5 h-5 rounded flex items-center justify-center text-xs font-mono flex-shrink-0 mt-0.5">2</span>
                Buka Menu (Android) atau Pengaturan (iOS)
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-slate-200 text-slate-600 w-5 h-5 rounded flex items-center justify-center text-xs font-mono flex-shrink-0 mt-0.5">3</span>
                Pilih "Perangkat Tertaut" &gt; "Tautkan Perangkat"
              </li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
          {status?.pairingCode ? (
            <div className="text-center">
              <p className="text-slate-500 text-sm mb-4">Masukkan kode ini di WhatsApp:</p>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
                <p className="text-4xl font-mono font-bold text-emerald-400 tracking-[0.2em] relative z-10">
                  {status.pairingCode}
                </p>
              </div>
              <p className="text-slate-500 text-xs flex items-center justify-center gap-1.5">
                <Clock className="w-3 h-3" /> Kode kadaluarsa dalam 60 detik
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-2">
                  Nomor WhatsApp Anda
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="628123456789"
                    className="input-field !pl-16"
                  />
                </div>
                <p className="text-slate-500 text-xs mt-2 pl-1">
                  Gunakan kode negara tanpa + (contoh: 628123456789)
                </p>
              </div>

              <button
                onClick={handlePairing}
                disabled={pairingLoading}
                className="btn-primary w-full justify-center py-3"
              >
                {pairingLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Meminta Kode...
                  </>
                ) : (
                  <>
                    <Link2 className="w-5 h-5 mr-2" /> Dapatkan Kode Pairing
                  </>
                )}
              </button>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h3 className="text-slate-900 font-medium mb-4 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" /> Cara Pairing
            </h3>
            <ol className="text-slate-600 text-sm space-y-3">
              <li className="flex items-start gap-3">
                <span className="bg-slate-200 text-slate-600 w-5 h-5 rounded flex items-center justify-center text-xs font-mono flex-shrink-0 mt-0.5">1</span>
                Buka WhatsApp &gt; Perangkat Tertaut
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-slate-200 text-slate-600 w-5 h-5 rounded flex items-center justify-center text-xs font-mono flex-shrink-0 mt-0.5">2</span>
                Ketuk "Tautkan Perangkat" &gt; "Tautkan dengan nomor telepon saja"
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-slate-200 text-slate-600 w-5 h-5 rounded flex items-center justify-center text-xs font-mono flex-shrink-0 mt-0.5">3</span>
                Masukkan 8 digit kode pairing di atas
              </li>
            </ol>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isDangerous={confirmModal.isDangerous}
        confirmText={confirmModal.confirmText}
      />
    </div>
  );
}
