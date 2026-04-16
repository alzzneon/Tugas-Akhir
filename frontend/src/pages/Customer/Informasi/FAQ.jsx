import Header from "../../../Components/Public/Header";
import Footer from "../../../Components/Public/Footer";

export default function FAQ() {
  const faqItems = [
    {
      question: "Bagaimana cara menyewa kendaraan di RentCare?",
      answer:
        "Pilih kendaraan yang tersedia, isi data pengajuan penyewaan, lalu tunggu proses verifikasi dan persetujuan dari admin.",
    },
    {
      question: "Apakah pengajuan sewa langsung disetujui?",
      answer:
        "Tidak. Sistem RentCare menggunakan alur pengajuan terlebih dahulu, kemudian admin akan memprosesnya.",
    },
    {
      question: "Apakah saya bisa menyewa kendaraan yang sama pada tanggal yang bentrok?",
      answer:
        "Tidak bisa. Sistem harus menolak pengajuan apabila kendaraan yang sama sudah dipakai atau diajukan pada rentang tanggal yang sama.",
    },
    {
      question: "Apa yang terjadi jika kendaraan terlambat dikembalikan?",
      answer:
        "Pelanggan dapat dikenakan denda keterlambatan sesuai kebijakan yang berlaku.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <section className="bg-red-500 text-white py-16 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">FAQ</h1>
          <p className="text-lg leading-relaxed">
            Berikut adalah pertanyaan yang sering diajukan oleh pelanggan
            RentCare.
          </p>
        </div>
      </section>

      <main className="flex-1 py-12 px-6 md:px-12">
        <div className="max-w-5xl mx-auto space-y-4">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {item.question}
              </h2>
              <p className="text-gray-700 leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}