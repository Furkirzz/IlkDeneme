import React, { useState, useEffect, useMemo } from "react";
import {
  FiAward,
  FiUser,
  FiBookOpen,
  FiTarget,
  FiRefreshCw,
  FiDownload,
} from "react-icons/fi";
import { api } from "../store/authSlice";

const CombinedResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [denemeler, setDenemeler] = useState([]);
  const [selectedDeneme, setSelectedDeneme] = useState("");
  const [denemeInfo, setDenemeInfo] = useState(null);
  const [averageType, setAverageType] = useState("toplam");

  const API_BASE = "http://localhost:8001";

  // Deneme listesini çek
  const loadDenemeler = async () => {
    try {
      const response = await api.get(`${API_BASE}/api/denemeler/`);
      const list = response?.data?.denemeler ?? [];
      setDenemeler(list);
      if (!selectedDeneme && list.length > 0) {
        setSelectedDeneme(String(list[0].id));
      }
    } catch (error) {
      console.error("Denemeler loading error:", error);
    }
  };

  // Sonuçları çek (puan'a göre sıralama)
  const loadCombinedResults = async (denemeIdParam) => {
    try {
      setLoading(true);
      const denemeId = denemeIdParam ?? selectedDeneme;
      let url = `${API_BASE}/api/results/combined/`;
      if (denemeId) url += `?deneme_id=${denemeId}`;

      const response = await api.get(url);
      const fetched = response?.data?.results ?? [];

      // PUAN varsa puana göre, yoksa toplam_net'e göre sırala
      const sorted = [...fetched].sort((a, b) => {
        const ap = Number(a.puan ?? a.toplam_net ?? 0);
        const bp = Number(b.puan ?? b.toplam_net ?? 0);
        return bp - ap;
      });

      setResults(sorted);
      setTotalStudents(response?.data?.total_students ?? sorted.length ?? 0);
      setDenemeInfo(response?.data?.deneme_sinavi ?? null);
    } catch (error) {
      console.error("Combined results loading error:", error);
      setResults([]);
      setTotalStudents(0);
      setDenemeInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDenemeler();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedDeneme) {
      loadCombinedResults(selectedDeneme);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeneme]);

  const handleDenemeChange = (denemeId) => {
    setSelectedDeneme(denemeId);
  };

  // Ortalama hesaplama
  const averageValue = useMemo(() => {
    if (results.length === 0) return "0.00";
    const sum = (key) => results.reduce((acc, r) => acc + Number(r[key] ?? 0), 0);
    let val = 0;

    switch (averageType) {
      case "turkce":
        val = sum("turkce_net") / results.length;
        break;
      case "tarih":
        val = sum("tarih_net") / results.length;
        break;
      case "din":
        val = sum("din_net") / results.length;
        break;
      case "ingilizce":
        val = sum("ingilizce_net") / results.length;
        break;
      case "matematik":
        val = sum("matematik_net") / results.length;
        break;
      case "fen":
        val = sum("fen_net") / results.length;
        break;
      default:
        val = sum("toplam_net") / results.length;
        break;
    }
    return val.toFixed(2);
  }, [results, averageType]);

  // Ders ortalamaları
  const dersOrtalamalari = useMemo(() => {
    if (results.length === 0) return {};
    const sum = (key) => results.reduce((acc, r) => acc + Number(r[key] ?? 0), 0);
    return {
      turkce: (sum("turkce_net") / results.length).toFixed(2),
      tarih: (sum("tarih_net") / results.length).toFixed(2),
      din: (sum("din_net") / results.length).toFixed(2),
      ingilizce: (sum("ingilizce_net") / results.length).toFixed(2),
      matematik: (sum("matematik_net") / results.length).toFixed(2),
      fen: (sum("fen_net") / results.length).toFixed(2),
      toplam: (sum("toplam_net") / results.length).toFixed(2),
    };
  }, [results]);

  // Ders bazında doğru/yanlış/boş ortalamaları
  const dersToplamIstatistikleri = useMemo(() => {
    if (results.length === 0) return {};
    const n = results.length;
    const avg = (key) => Math.round(results.reduce((acc, r) => acc + Number(r[key] ?? 0), 0) / n);
    const fields = (pfx) => ({
      dogru: avg(`${pfx}_dogru`),
      yanlis: avg(`${pfx}_yanlis`),
      bos: avg(`${pfx}_bos`),
    });
    const toplam = (() => {
      const keys = ["turkce", "tarih", "din", "ingilizce", "matematik", "fen"];
      const sumOf = (suffix) =>
        Math.round(
          results.reduce(
            (acc, r) =>
              acc +
              keys.reduce((kacc, k) => kacc + Number(r[`${k}_${suffix}`] ?? 0), 0),
            0
          ) / n
        );
      return { dogru: sumOf("dogru"), yanlis: sumOf("yanlis"), bos: sumOf("bos") };
    })();

    return {
      turkce: fields("turkce"),
      tarih: fields("tarih"),
      din: fields("din"),
      ingilizce: fields("ingilizce"),
      matematik: fields("matematik"),
      fen: fields("fen"),
      toplam,
    };
  }, [results]);

  const calculateTotalStats = (s) => {
    const totalDogru =
      (s.turkce_dogru ?? 0) +
      (s.tarih_dogru ?? 0) +
      (s.din_dogru ?? 0) +
      (s.ingilizce_dogru ?? 0) +
      (s.matematik_dogru ?? 0) +
      (s.fen_dogru ?? 0);
    const totalYanlis =
      (s.turkce_yanlis ?? 0) +
      (s.tarih_yanlis ?? 0) +
      (s.din_yanlis ?? 0) +
      (s.ingilizce_yanlis ?? 0) +
      (s.matematik_yanlis ?? 0) +
      (s.fen_yanlis ?? 0);
    const totalBos =
      (s.turkce_bos ?? 0) +
      (s.tarih_bos ?? 0) +
      (s.din_bos ?? 0) +
      (s.ingilizce_bos ?? 0) +
      (s.matematik_bos ?? 0) +
      (s.fen_bos ?? 0);
    return { totalDogru, totalYanlis, totalBos };
  };

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return "bg-yellow-500 text-white";
    if (rank === 2) return "bg-gray-400 text-white";
    if (rank === 3) return "bg-amber-600 text-white";
    if (rank <= 10) return "bg-green-100 text-green-800";
    if (rank <= 50) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  const getScoreColor = (score) => {
    if (score >= 15) return "text-green-600 font-bold";
    if (score >= 10) return "text-blue-600 font-semibold";
    if (score >= 5) return "text-orange-600";
    return "text-red-600";
  };

  // CSV (Excel) indirme — PUAN eklendi
  const handleDownloadCsv = () => {
    if (!results.length) return;

    const headers = [
      "Sıra",
      "Okul Kodu",
      "Öğrenci No",
      "Ad",
      "Soyad",
      "Sınıf",
      "Türkçe Net",
      "Tarih Net",
      "Din Net",
      "İngilizce Net",
      "Matematik Net",
      "Fen Net",
      "Toplam Net",
      "Puan",
      "Türkçe D/Y/B",
      "Tarih D/Y/B",
      "Din D/Y/B",
      "İngilizce D/Y/B",
      "Matematik D/Y/B",
      "Fen D/Y/B",
      "Toplam D/Y/B",
    ];

    const rows = results.map((s) => {
      const { totalDogru, totalYanlis, totalBos } = calculateTotalStats(s);
      const safe = (v) => (v ?? "").toString().replace(/;/g, ",");
      return [
        safe(s.genel_siralama),
        safe(s.okul_kodu),
        safe(s.ogrenci_no),
        safe(s.ad),
        safe(s.soyad),
        safe(s.sinif),
        Number(s.turkce_net ?? 0).toFixed(2),
        Number(s.tarih_net ?? 0).toFixed(2),
        Number(s.din_net ?? 0).toFixed(2),
        Number(s.ingilizce_net ?? 0).toFixed(2),
        Number(s.matematik_net ?? 0).toFixed(2),
        Number(s.fen_net ?? 0).toFixed(2),
        Number(s.toplam_net ?? 0).toFixed(2),
        Number(s.puan ?? s.toplam_net ?? 0).toFixed(2),
        `${s.turkce_dogru ?? 0}/${s.turkce_yanlis ?? 0}/${s.turkce_bos ?? 0}`,
        `${s.tarih_dogru ?? 0}/${s.tarih_yanlis ?? 0}/${s.tarih_bos ?? 0}`,
        `${s.din_dogru ?? 0}/${s.din_yanlis ?? 0}/${s.din_bos ?? 0}`,
        `${s.ingilizce_dogru ?? 0}/${s.ingilizce_yanlis ?? 0}/${s.ingilizce_bos ?? 0}`,
        `${s.matematik_dogru ?? 0}/${s.matematik_yanlis ?? 0}/${s.matematik_bos ?? 0}`,
        `${s.fen_dogru ?? 0}/${s.fen_yanlis ?? 0}/${s.fen_bos ?? 0}`,
        `${totalDogru}/${totalYanlis}/${totalBos}`,
      ].join(";");
    });

    const csv = [headers.join(";"), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ad = denemeInfo?.adi ? denemeInfo.adi.replace(/\s+/g, "_") : "deneme";
    a.download = `sonuclar_${ad}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Sonuçlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <FiAward className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Genel Sonuçlar</h1>
                <p className="text-gray-600">
                  {denemeInfo
                    ? `${denemeInfo.adi} - Birleştirilmiş 1. ve 2. Oturum Sonuçları`
                    : "Birleştirilmiş 1. ve 2. Oturum Sonuçları"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {/* Deneme Seçimi */}
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Deneme Seçin</label>
                <select
                  value={selectedDeneme}
                  onChange={(e) => handleDenemeChange(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm min-w-48"
                >
                  <option value="">Deneme Seçin</option>
                  {denemeler.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.adi} ({d.tarih ? new Date(d.tarih).toLocaleDateString("tr-TR") : "Tarih yok"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Ortalama Türü */}
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Ortalama Türü</label>
                <select
                  value={averageType}
                  onChange={(e) => setAverageType(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="toplam">Genel Ortalama</option>
                  <option value="turkce">Türkçe</option>
                  <option value="tarih">Tarih</option>
                  <option value="din">Din</option>
                  <option value="ingilizce">İngilizce</option>
                  <option value="matematik">Matematik</option>
                  <option value="fen">Fen</option>
                </select>
              </div>

              <button
                onClick={() => loadCombinedResults()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Yenile"
              >
                <FiRefreshCw className="w-4 h-4 mr-2" />
                Yenile
              </button>
              <button
                onClick={handleDownloadCsv}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                disabled={!results.length}
                title="Excel (CSV) indir"
              >
                <FiDownload className="w-4 h-4 mr-2" />
                Excel İndir
              </button>
            </div>
          </div>
        </div>

        {/* Boş durum */}
        {results.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center text-gray-600">
            Bu denemeye ait sonuç bulunamadı.
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Toplam Öğrenci</p>
                    <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                  </div>
                  <FiUser className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">En Yüksek Puan</p>
                    <p className="text-2xl font-bold text-green-600">
                      {Number(results[0]?.puan ?? results[0]?.toplam_net ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <FiTarget className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      {averageType === "toplam"
                        ? "Genel Ortalama"
                        : averageType === "turkce"
                        ? "Türkçe Ort."
                        : averageType === "tarih"
                        ? "Tarih Ort."
                        : averageType === "din"
                        ? "Din Ort."
                        : averageType === "ingilizce"
                        ? "İngilizce Ort."
                        : averageType === "matematik"
                        ? "Matematik Ort."
                        : "Fen Ort."}
                    </p>
                    <p className="text-2xl font-bold text-orange-600">{averageValue}</p>
                  </div>
                  <FiBookOpen className="w-8 h-8 text-orange-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">70+ Net</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {results.filter((r) => Number(r.toplam_net ?? 0) >= 70).length}
                    </p>
                  </div>
                  <FiAward className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Ders Ortalamaları */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ders Ortalamaları</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {Object.entries(dersOrtalamalari).map(([ders, ort]) => {
                  const ist = dersToplamIstatistikleri[ders];
                  return (
                    <div key={ders} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1 capitalize">
                        {ders === "toplam" ? "Toplam" : ders}
                      </div>
                      <div className="text-lg font-bold text-blue-600 mb-1">{ort}</div>
                      <div className="text-xs text-gray-500">
                        {ist ? `${ist.dogru}D ${ist.yanlis}Y ${ist.bos}B` : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Öğrenci Sıralaması</h2>
                <p className="text-gray-600">PUAN'a göre sıralanmış sonuçlar</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sıra
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İsim
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sınıf
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Türkçe
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarih
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Din
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İngilizce
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Matematik
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fen
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Toplam
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Puan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((s) => {
                      const key = `${s.ogrenci_no}_${s.okul_kodu}`;
                      const { totalDogru, totalYanlis, totalBos } = calculateTotalStats(s);
                      return (
                        <tr key={key} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getRankBadgeColor(
                                s.genel_siralama
                              )}`}
                            >
                              {s.genel_siralama}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                  {(s.ad ?? "?").charAt(0)}
                                  {(s.soyad ?? "?").charAt(0)}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {s.ad} {s.soyad}
                                </div>
                                <div className="text-sm text-gray-500">No: {s.ogrenci_no}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {s.sinif}
                            </span>
                          </td>

                          {/* Ders netleri */}
                          {[
                            ["turkce", s.turkce_net, s.turkce_dogru, s.turkce_yanlis, s.turkce_bos],
                            ["tarih", s.tarih_net, s.tarih_dogru, s.tarih_yanlis, s.tarih_bos],
                            ["din", s.din_net, s.din_dogru, s.din_yanlis, s.din_bos],
                            ["ingilizce", s.ingilizce_net, s.ingilizce_dogru, s.ingilizce_yanlis, s.ingilizce_bos],
                            ["matematik", s.matematik_net, s.matematik_dogru, s.matematik_yanlis, s.matematik_bos],
                            ["fen", s.fen_net, s.fen_dogru, s.fen_yanlis, s.fen_bos],
                          ].map(([name, net, d, y, b]) => (
                            <td key={name} className="px-4 py-4 text-center">
                              <div className="text-sm">
                                <div className={`font-semibold ${getScoreColor(Number(net ?? 0))}`}>
                                  {Number(net ?? 0).toFixed(1)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {d ?? 0}D {y ?? 0}Y {b ?? 0}B
                                </div>
                              </div>
                            </td>
                          ))}

                          {/* Toplam Net */}
                          <td className="px-4 py-4 text-center">
                            <div className="text-sm">
                              <div
                                className={`text-lg font-bold ${
                                  s.toplam_net >= 70
                                    ? "text-green-600"
                                    : s.toplam_net >= 50
                                    ? "text-blue-600"
                                    : s.toplam_net >= 30
                                    ? "text-orange-600"
                                    : "text-red-600"
                                }`}
                              >
                                {Number(s.toplam_net ?? 0).toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {totalDogru}D {totalYanlis}Y {totalBos}B
                              </div>
                            </div>
                          </td>

                          {/* PUAN */}
                          <td className="px-4 py-4 text-center">
                            <div className="text-sm">
                              <div
                                className={`text-lg font-bold ${
                                  (s.puan ?? 0) >= 350
                                    ? "text-green-600"
                                    : (s.puan ?? 0) >= 250
                                    ? "text-blue-600"
                                    : (s.puan ?? 0) >= 150
                                    ? "text-orange-600"
                                    : "text-red-600"
                                }`}
                              >
                                {Number(s.puan ?? s.toplam_net ?? 0).toFixed(2)}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CombinedResults;
