export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <h1 className="text-2xl font-black text-slate-900 mb-4">Privacy Policy</h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Paytm VentureAI collects only the data necessary to provide merchant intelligence services.
          Your business data is encrypted at rest and never shared with third parties without consent.
          Bank account numbers are masked and stored using Fernet symmetric encryption.
          This is a demo application built for hackathon purposes.
        </p>
      </div>
    </div>
  );
}
