import WhatsAppSetup from '../components/WhatsAppSetup';

export default function WhatsAppPage() {
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
        </div>
    );
}
