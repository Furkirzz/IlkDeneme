export default function AnswerTable({ rows, onEdit, onDelete }) {
    return (
        <div className="bg-white rounded-2xl shadow">
            <div className="p-4 font-medium">Kayıtlar</div>
            <div className="overflow-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            {['okul_no', 'ogrenci_no', 'ad', 'soyad', 'sinif', 'cinsiyet', 'oturum', 'kitapcik', 'net'].map(h => (
                                <th key={h} className="text-left px-3 py-2 font-semibold capitalize">{h}</th>
                            ))}
                            <th className="px-3 py-2 font-semibold">İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(r => (
                            <tr key={r.id} className="border-t hover:bg-gray-50 transition-colors">
                                <td className="px-3 py-2">{r.okul_no || r.okul_kodu}</td>
                                <td className="px-3 py-2">{r.ogrenci_no}</td>
                                <td className="px-3 py-2 font-medium">{r.ad}</td>
                                <td className="px-3 py-2 font-medium">{r.soyad}</td>
                                <td className="px-3 py-2">{r.sinif}</td>
                                <td className="px-3 py-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        r.cinsiyet === 'Kız' || r.cinsiyet === 'K' 
                                            ? 'bg-pink-100 text-pink-800' 
                                            : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {r.cinsiyet}
                                    </span>
                                </td>
                                <td className="px-3 py-2">
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {r.oturum}
                                    </span>
                                </td>
                                <td className="px-3 py-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        r.kitapcik_turu === 'A' || r.kitapcik === 'A' 
                                            ? 'bg-blue-100 text-blue-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {r.kitapcik_turu || r.kitapcik}
                                    </span>
                                </td>
                                <td className="px-3 py-2">
                                    <span className={`px-3 py-1 rounded-lg font-bold text-sm ${
                                        (r.net || 0) >= 70 ? 'bg-green-100 text-green-800' :
                                        (r.net || 0) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {r.net ? r.net.toFixed(2) : '0.00'}
                                    </span>
                                </td>
                                <td className="px-3 py-2">
                                    <div className="flex gap-2">
                                        <button 
                                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium" 
                                            onClick={() => onEdit(r)}
                                        >
                                            Düzenle
                                        </button>
                                        <button 
                                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium" 
                                            onClick={() => onDelete(r.id)}
                                        >
                                            Sil
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}