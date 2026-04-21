export default function VehicleCard({
  item,
  imageBase = "http://localhost:8000/storage/",
  placeholder = "/placeholder-car.jpg",
  onActionClick,
}) {
  const isActive = Boolean(item?.is_active);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm transition hover:shadow-md hover:border-red-200">
      <div className="h-52 bg-gray-100 overflow-hidden">
        <img
          src={item?.image ? imageBase + item.image : placeholder}
          alt={item?.name || "vehicle"}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900 text-xl">
              {item?.name || "-"}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {item?.vehicle_brand_name || "-"}
              {item?.transmission_name ? ` • ${item.transmission_name}` : ""}
            </p>
          </div>

          <span
            className={`text-xs px-3 py-1 rounded-full border whitespace-nowrap ${
              isActive
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-gray-100 text-gray-600 border-gray-200"
            }`}
          >
            {isActive ? "Tersedia" : "Tidak tersedia"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2">
            <div className="text-gray-500">Transmisi</div>
            <div className="font-medium text-gray-900">
              {item?.transmission_name || "-"}
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2">
            <div className="text-gray-500">Tahun</div>
            <div className="font-medium text-gray-900">{item?.year || "-"}</div>
          </div>

          <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2">
            <div className="text-gray-500">Harga/Hari</div>
            <div className="font-medium text-gray-900">
              Rp {Number(item?.daily_rate || 0).toLocaleString("id-ID")}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={onActionClick}
            className="w-full rounded-xl bg-red-500 text-white px-4 py-3 text-sm font-semibold hover:bg-red-600 disabled:opacity-60"
            disabled={!isActive}
          >
            Buat Pesanan
          </button>
        </div>
      </div>
    </div>
  );
}