import { useMemo, useState } from "react";
import Header from "../../Components/Public/Header";
import Footer from "../../Components/Public/Footer";

function rupiah(n) {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `Rp ${n}`;
  }
}

export default function Motor() {
  const [q, setQ] = useState("");

  // TODO: ganti dari API
  const bikes = useMemo(
    () => [
      {
        id: 1,
        name: "Honda Vario 160",
        brand: "Honda",
        transmission: "Automatic",
        cc: 160,
        rate: 90000,
        image:
          "https://images.unsplash.com/photo-1524593119773-0e0c4b4d0a2f?auto=format&fit=crop&w=1200&q=60",
        isActive: true,
      },
      {
        id: 2,
        name: "Yamaha NMAX",
        brand: "Yamaha",
        transmission: "Automatic",
        cc: 155,
        rate: 110000,
        image:
          "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&w=1200&q=60",
        isActive: true,
      },
      {
        id: 3,
        name: "Honda Supra X",
        brand: "Honda",
        transmission: "Manual",
        cc: 125,
        rate: 70000,
        image:
          "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=60",
        isActive: false,
      },
    ],
    []
  );

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    return bikes.filter((v) => {
      if (!key) return true;
      return (
        v.name.toLowerCase().includes(key) ||
        v.brand.toLowerCase().includes(key) ||
        v.transmission.toLowerCase().includes(key)
      );
    });
  }, [bikes, q]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Page Header */}
      <section className="bg-white border-b border-gray-200 px-12 py-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">Daftar Motor</h1>
          <p className="text-gray-600 mt-2">
            Pilih motor favoritmu untuk perjalanan yang praktis & irit.
          </p>

          {/* Search */}
          <div className="mt-6">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari motor (nama/brand/transmisi)..."
              className="w-full md:w-[520px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
        </div>
      </section>

      {/* List */}
      <main className="px-12 py-10 flex-1">
        <div className="max-w-7xl mx-auto">
          {filtered.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-600">
              Tidak ada motor yang cocok dengan pencarianmu.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filtered.map((v) => (
                <div
                  key={v.id}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
                >
                  <div className="h-44 bg-gray-100">
                    <img
                      src={v.image}
                      alt={v.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {v.name}
                        </h3>
                        <p className="text-sm text-gray-600">{v.brand}</p>
                      </div>

                      <span
                        className={`text-xs px-2 py-1 rounded-full border ${
                          v.isActive
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {v.isActive ? "Tersedia" : "Tidak tersedia"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2">
                        <div className="text-gray-500">Transmisi</div>
                        <div className="font-medium text-gray-900">
                          {v.transmission}
                        </div>
                      </div>
                      <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2">
                        <div className="text-gray-500">CC</div>
                        <div className="font-medium text-gray-900">
                          {v.cc} cc
                        </div>
                      </div>
                      <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2">
                        <div className="text-gray-500">Harga/Hari</div>
                        <div className="font-medium text-gray-900">
                          {rupiah(v.rate)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-3">
                      <button
                        className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
                        onClick={() => alert(`Detail motor: ${v.name}`)}
                      >
                        Detail
                      </button>

                      <button
                        className="flex-1 rounded-xl bg-red-500 text-white px-4 py-2.5 text-sm font-semibold hover:bg-red-600 disabled:opacity-60"
                        disabled={!v.isActive}
                        onClick={() => alert(`Sewa motor: ${v.name}`)}
                      >
                        Sewa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
