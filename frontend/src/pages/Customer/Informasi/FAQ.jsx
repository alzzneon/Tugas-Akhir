import Header from "../../../Components/Public/Header";
import Footer from "../../../Components/Public/Footer";

export default function FAQ() {
  const faqItems = [
    { question: "Bagaimana cara menyewa kendaraan?", answer: "Pilih kendaraan, unggah dokumen identitas, dan tunggu verifikasi admin dalam 1x24 jam." },
    { question: "Apakah pengajuan langsung disetujui?", answer: "Admin akan melakukan pengecekan ketersediaan unit dan validitas dokumen terlebih dahulu." },
    { question: "Bagaimana jika jadwal bentrok?", answer: "Sistem secara otomatis menutup jadwal yang sudah dipesan untuk menghindari double-booking." }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full py-20 px-6">
        <h1 className="text-3xl font-bold mb-2 text-slate-900">Pertanyaan Umum</h1>
        <p className="text-slate-500 mb-12">Temukan jawaban cepat untuk pertanyaan Anda seputar layanan RentCare.</p>
        
        <div className="space-y-10">
          {faqItems.map((item, index) => (
            <div key={index} className="border-l-2 border-red-600 pl-6">
              <h2 className="text-lg font-bold text-slate-900 mb-2">{item.question}</h2>
              <p className="text-slate-600 leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}