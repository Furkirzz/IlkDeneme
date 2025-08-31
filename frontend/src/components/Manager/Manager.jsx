import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from 'axios';
import MetricCard from '../graphs/MetricCard';
import { PieBlock, MonthlyLine } from '../graphs/MonthlyLine';
import AnswerForm from '../graphs/AnswerForm';
import AnswerTable from '../graphs/AnswerTable';


export default function Manager() {
    const [list, setList] = useState([]);
    const [stats, setStats] = useState(null);
    const [editing, setEditing] = useState(null);

    const load = async () => {
        const [r, s] = await Promise.all([
            api.get('http://localhost:8001/api/results/'),
            api.get('http://localhost:8001/api/results/stats/')
        ]);
        setList(r.data.results || r.data); // pagination varsa results
        setStats(s.data);
        console.log()
    };

    useEffect(() => { load(); }, []);

    const save = async (payload) => {
        if (editing) {
            await api.put(`http://localhost:8001/api/results/${editing.id} /`, payload);
        } else {
            await api.post('http://localhost:8001/api/results/', payload);
        }
        setEditing(null);
        await load();
    };

    const remove = async (id) => {
        await api.delete(`http://localhost:8001/api/results/${id} /`);
        await load();
    };

    const bulkSeed = async () => {
        // Sizin verdiğiniz JSON’u tek tıkla yüklemek için:
        const items = window.SEED_ITEMS || [];
        if (!items.length) { alert('window.SEED_ITEMS boş.'); return; }
        await api.post('http://localhost:8001/api/results/bulk_upsert/', { items });
        await load();
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <aside className="fixed top-0 left-0 w-56 h-full bg-indigo-600 text-white p-4 space-y-3">
                <div className="text-xl font-semibold">Dashboard</div>
                <nav className="space-y-2">
                    <a className="block hover:bg-indigo-500 rounded px-2 py-1">Ana Sayfa</a>
                    <a className="block hover:bg-indigo-500 rounded px-2 py-1">Grafikler</a>
                    <a className="block hover:bg-indigo-500 rounded px-2 py-1">Tablolar</a>
                </nav>
            </aside>

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
                        <button onClick={bulkSeed} className="bg-indigo-600 text-white px-4 py-2 rounded">Örnek Veriyi Yükle</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <MetricCard 
                        title="Toplam Kayıt" 
                        value={stats?.totals?.count ?? '-'} 
                        color="blue"
                        sub="Tüm öğrenci kayıtları"
                    />
                    <MetricCard 
                        title="Benzersiz Öğrenci" 
                        value={stats?.totals?.unique_students ?? '-'} 
                        color="green"
                        sub="Farklı öğrenci sayısı"
                    />
                    <MetricCard 
                        title="Son Ekleme" 
                        value={list[0]?.ad ? list[0].ad + ' ' + list[0].soyad : '-'} 
                        color="purple"
                        sub="En son eklenen öğrenci"
                    />
                    <MetricCard 
                        title="Bugün Eklenen" 
                        value={list.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString()).length} 
                        color="orange"
                        sub="Bugünkü yeni kayıtlar"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2"><MonthlyLine data={stats?.monthly || []} /></div>
                    <PieBlock title="Cinsiyet Dağılımı" data={stats?.gender || []} labelKey="cinsiyet" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 p-4 bg-white rounded-2xl shadow">
                        <div className="font-medium mb-3">{editing ? 'Düzenle' : 'Yeni Kayıt'}</div>
                        <AnswerForm editing={editing} onSubmit={save} />
                    </div>
                    <PieBlock title="Kitapçık Dağılımı" data={stats?.kitapcik_turu || []} labelKey="kitapcik" />
                </div>

                <AnswerTable rows={list} onEdit={setEditing} onDelete={remove} />
            </main>
        </div>
    );
}