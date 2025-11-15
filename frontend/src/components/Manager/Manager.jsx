// src/components/Manager/Manager.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../store/authSlice";
import { motion } from "framer-motion";

// Recharts
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
} from "recharts";

function StatCard({ title, value, sub }) {
  return (
    <motion.div
      className="rounded-2xl p-5 bg-white/50 backdrop-blur shadow-sm ring-1 ring-white/40"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="text-sm text-gray-600">{title}</div>
      <div className="mt-1 text-3xl font-extrabold text-gray-900 tracking-tight">{value}</div>
      {sub ? <div className="text-xs text-gray-500 mt-1">{sub}</div> : null}
    </motion.div>
  );
}

function EmptyState({ title = "Veri yok", desc = "Şu anda gösterecek veri bulunamadı." }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-600 bg-white/60 backdrop-blur">
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-sm mt-1">{desc}</div>
    </div>
  );
}

export default function Manager() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [exams, setExams] = useState([]); // /exams/
  const [examSeries, setExamSeries] = useState([]); // [{id,name,date,avgNet,participants,maxScore}]
  const [latestTop5, setLatestTop5] = useState([]); // [{fullName, classroom, score, total_net}]
  const [metric, setMetric] = useState("avgNet"); // 'avgNet' | 'maxScore'

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/exams/`);
      const list = data?.denemeler ?? [];
      setExams(list);

      if (!list.length) {
        setExamSeries([]);
        setLatestTop5([]);
        return;
      }

      // En yeni > en eski sıralı çekip (backend -date), grafiği kronolojik göstereceğiz.
      const byDateDesc = [...list].sort(
        (a, b) => new Date(b.tarih ?? 0) - new Date(a.tarih ?? 0)
      );

      const requests = byDateDesc.map((ex) =>
        api
          .get(`/results/combined/`, { params: { deneme_id: ex.id } })
          .then((r) => ({ ok: true, exam: ex, payload: r.data }))
          .catch((e) => ({ ok: false, exam: ex, error: e }))
      );

      const settled = await Promise.all(requests);

      const series = [];
      let latestTop = [];

      for (const res of settled) {
        const ex = res.exam;
        if (!res.ok) continue;

        const results = res.payload?.results ?? [];
        const participants = Number(res.payload?.total_students ?? results.length ?? 0);

        const avgNet =
          results.length > 0
            ? results.reduce((acc, r) => acc + Number(r.total_net ?? 0), 0) / results.length
            : 0;

        const maxScore =
          results.length > 0
            ? Math.max(...results.map((r) => Number(r.score ?? r.total_net ?? 0)))
            : 0;

        series.push({
          id: ex.id,
          name: ex.adi,
          date: ex.tarih,
          avgNet: Number(avgNet.toFixed(2)),
          participants,
          maxScore: Number(maxScore.toFixed(2)),
        });

        // En güncel denemenin ilk 5’i
        if (ex.id === byDateDesc[0]?.id) {
          latestTop = results.slice(0, 5).map((r) => ({
            fullName: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim(),
            classroom: r.classroom ?? "",
            score: Number(r.score ?? r.total_net ?? 0).toFixed(2),
            total_net: Number(r.total_net ?? 0).toFixed(2),
          }));
        }
      }

      const chrono = series.sort((a, b) => new Date(a.date ?? 0) - new Date(b.date ?? 0));
      setExamSeries(chrono);
      setLatestTop5(latestTop);
    } catch (e) {
      console.error(e);
      setError("Veriler yüklenirken sorun oluştu.");
      setExamSeries([]);
      setLatestTop5([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalExamCount = useMemo(() => exams.length, [exams]);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-white">
      {/* arkaplan parıltıları */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Deneme Yöneti</h1>
            <p className="text-sm text-slate-600">
              Yüklenen denemelerin genel görünümü ve trendler
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/combined-results"
              className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Birleşik Sonuçlar
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Hata */}
        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4">
            {error}
          </div>
        )}

        {/* KPI’lar */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Toplam Deneme"
            value={totalExamCount}
            sub="Sisteme kaydedilmiş deneme sayısı"
          />
          <StatCard
            title="Son Deneme"
            value={exams[0]?.adi ?? "-"}
            sub={exams[0]?.tarih ? new Date(exams[0].tarih).toLocaleDateString("tr-TR") : ""}
          />
          <StatCard
            title="Grafik Dönemi"
            value={
              examSeries.length
                ? `${new Date(examSeries[0].date ?? 0).toLocaleDateString(
                    "tr-TR"
                  )} – ${new Date(examSeries[examSeries.length - 1].date ?? 0).toLocaleDateString(
                    "tr-TR"
                  )}`
                : "-"
            }
            sub="Kronolojik sıra"
          />
        </section>

        {/* Deneme net trendi (tam genişlik) */}
        <section>
          <motion.div
            className="rounded-2xl p-1 bg-gradient-to-r from-indigo-500/40 via-fuchsia-400/40 to-emerald-400/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="rounded-2xl bg-white/70 backdrop-blur p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Deneme Trend</h2>
                  <p className="text-xs text-slate-600">
                    X: Deneme (adı), Y: Seçilen metrik
                  </p>
                </div>

                {/* metrik seçici */}
                <div className="rounded-xl bg-slate-100 p-1 flex items-center gap-1">
                  <button
                    onClick={() => setMetric("avgNet")}
                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                      metric === "avgNet"
                        ? "bg-white shadow text-slate-900"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Ortalama Net
                  </button>
                  <button
                    onClick={() => setMetric("maxScore")}
                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                      metric === "maxScore"
                        ? "bg-white shadow text-slate-900"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Maks Puan
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
              ) : examSeries.length === 0 ? (
                <EmptyState title="Grafik için veri yok" />
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={examSeries.map((x) => ({
                        name:
                          x.name?.length > 18 ? `${x.name.slice(0, 18)}…` : x.name || "Deneme",
                        date: x.date,
                        avgNet: x.avgNet,
                        maxScore: x.maxScore,
                        participants: x.participants,
                      }))}
                      margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
                    >
                      <defs>
                        <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} height={50} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <RTooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey={metric}
                        fill="url(#metricFill)"
                        stroke="none"
                      />
                      <Line
                        type="monotone"
                        dataKey={metric}
                        stroke="#111827"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </motion.div>
        </section>

        {/* Deneme kartları (hızlı özet) */}
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-slate-900">Deneme Kartları</h3>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : examSeries.length === 0 ? (
            <EmptyState title="Deneme bulunamadı" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {examSeries.map((ex) => (
                <motion.div
                  key={ex.id}
                  className="rounded-2xl bg-white/70 backdrop-blur p-4 ring-1 ring-white/40 shadow-sm hover:shadow transition"
                  whileHover={{ y: -2 }}
                >
                  <div className="text-sm text-slate-500">
                    {ex.date ? new Date(ex.date).toLocaleDateString("tr-TR") : "-"}
                  </div>
                  <div className="text-lg font-semibold text-slate-900 mt-0.5">{ex.name}</div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-xl bg-slate-100 px-3 py-2">
                      <div className="text-[11px] text-slate-500">Ortalama Net</div>
                      <div className="font-semibold">{ex.avgNet}</div>
                    </div>
                    <div className="rounded-xl bg-slate-100 px-3 py-2">
                      <div className="text-[11px] text-slate-500">Maks Puan</div>
                      <div className="font-semibold">{ex.maxScore}</div>
                    </div>
                    <div className="rounded-xl bg-slate-100 px-3 py-2">
                      <div className="text-[11px] text-slate-500">Katılım</div>
                      <div className="font-semibold">{ex.participants}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Son denemeden ilk 5 */}
        <section className="rounded-2xl bg-white/70 backdrop-blur p-5 ring-1 ring-white/40 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Son Deneme – İlk 5</h2>
            <Link to="/combined-results" className="text-sm text-indigo-600 hover:text-indigo-700">
              Tüm listeyi gör
            </Link>
          </div>

          {loading ? (
            <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
          ) : latestTop5.length === 0 ? (
            <EmptyState title="Liste boş" desc="Son denemeye ait sonuç bulunamadı." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2 pr-4">Sıra</th>
                    <th className="py-2 pr-4">Ad Soyad</th>
                    <th className="py-2 pr-4">Sınıf</th>
                    <th className="py-2 pr-4">Puan</th>
                    <th className="py-2 pr-4">Toplam Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {latestTop5.map((r, i) => (
                    <tr key={`${r.fullName}-${i}`} className="hover:bg-slate-50">
                      <td className="py-2 pr-4 font-medium">{i + 1}</td>
                      <td className="py-2 pr-4">{r.fullName || "-"}</td>
                      <td className="py-2 pr-4">{r.classroom || "-"}</td>
                      <td className="py-2 pr-4">{r.score}</td>
                      <td className="py-2 pr-4">{r.total_net}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
