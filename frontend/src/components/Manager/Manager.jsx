// src/components/Manager/Manager.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import MetricCard from '../graphs/MetricCard';
import { PieBlock, MonthlyLine } from '../graphs/MonthlyLine';
import AnswerForm from '../graphs/AnswerForm';
import AnswerTable from '../graphs/AnswerTable';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export default function Manager() {
  const [list, setList] = useState([]);
  const [stats, setStats] = useState(null);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [r, s] = await Promise.all([
        axios.get(`${API_BASE}/api/results/`),
        axios.get(`${API_BASE}/api/results/stats/`),
      ]);
      setList(r.data?.results || r.data || []); // pagination varsa results
      setStats(s.data || null);
    } catch (err) {
      console.error('Veriler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (payload) => {
    try {
      if (editing?.id) {
        await axios.put(`${API_BASE}/api/results/${editing.id}/`, payload);
      } else {
        await axios.post(`${API_BASE}/api/results/`, payload);
      }
      setEditing(null);
      await load();
    } catch (err) {
      console.error('Kaydetme hatası:', err);
      alert('Kayıt kaydedilemedi.');
    }
  };

  const remove = async (id) => {
    if (!id) return;
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`${API_BASE}/api/results/${id}/`);
      await load();
    } catch (err) {
      console.error('Silme hatası:', err);
      alert('Kayıt silinemedi.');
    }
  };

  const bulkSeed = async () => {
    try {
      const items = window.SEED_ITEMS || [];
      if (!items.length) {
        alert('Yüklenecek örnek veri bulunamadı (window.SEED_ITEMS boş).');
        return;
      }
      await axios.post(`${API_BASE}/api/results/bulk_upsert/`, { items });
      await load();
    } catch (err) {
      console.error('Örnek veri yüklenemedi:', err);
      alert('Örnek veri yüklenemedi.');
    }
  };

  const todayCount = list.filter((r) => {
    const created = r?.created_at ? new Date(r.created_at) : null;
    if (!created) return false;
    const today = new Date();
    return created.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 w-56 h-full bg-indigo-600 text-white p-4 space-y-3">
        <div className="text-xl font-semibold">Dashboard</div>
        <nav className="space-y-2">
          <button type="button" className="w-full text-left hover:bg-indigo-500 rounded px-2 py-1">
            Ana Sayfa
          </button>
          <button type="button" className="w-full text-left hover:bg-indigo-500 rounded px-2 py-1">
            Grafikler
          </button>
          <button type="button" className="w-full text-left hover:bg-indigo-500 rounded px-2 py-1">
            Tablolar
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main className="ml-56 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Öğrenci Cevapları</h1>
          <div className="flex gap-2">
            <Link
              to="/combined-results"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors no-underline"
            >
              📊 Birleşik Sonuçlar
            </Link>
            <button
              onClick={bulkSeed}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
            >
              Örnek Veriyi Yükle
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Toplam Kayıt"
            value={stats?.totals?.count ?? '-'}
            color="blue"
            sub="Tüm öğrenci kayıtları"
            loading={loading}
          />
          <MetricCard
            title="Benzersiz Öğrenci"
            value={stats?.totals?.unique_students ?? '-'}
            color="green"
            sub="Farklı öğrenci sayısı"
            loading={loading}
          />
          <MetricCard
            title="Son Ekleme"
            value={list?.[0]?.ad ? `${list[0].ad} ${list[0].soyad}` : '-'}
            color="purple"
            sub="En son eklenen öğrenci"
            loading={loading}
          />
          <MetricCard
            title="Bugün Eklenen"
            value={todayCount}
            color="orange"
            sub="Bugünkü yeni kayıtlar"
            loading={loading}
          />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <MonthlyLine data={stats?.monthly || []} />
          </div>
          <PieBlock title="Cinsiyet Dağılımı" data={stats?.gender || []} labelKey="cinsiyet" />
        </div>

        {/* Form + chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 p-4 bg-white rounded-2xl shadow">
            <div className="font-medium mb-3">{editing ? 'Düzenle' : 'Yeni Kayıt'}</div>
            <AnswerForm editing={editing} onSubmit={save} onCancel={() => setEditing(null)} />
          </div>
          <PieBlock title="Kitapçık Dağılımı" data={stats?.kitapcik_turu || []} labelKey="kitapcik" />
        </div>

        {/* Table */}
        <AnswerTable rows={list} onEdit={setEditing} onDelete={remove} />
      </main>
    </div>
  );
}
