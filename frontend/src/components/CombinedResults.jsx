import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiAward, FiUser, FiBookOpen, FiTarget, FiRefreshCw, FiDownload } from 'react-icons/fi';

const CombinedResults = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalStudents, setTotalStudents] = useState(0);
    const [denemeler, setDenemeler] = useState([]);
    const [selectedDeneme, setSelectedDeneme] = useState(null);
    const [denemeInfo, setDenemeInfo] = useState(null);
    const [averageType, setAverageType] = useState("toplam");



    const loadDenemeler = async () => {
        try {
            const response = await axios.get('http://localhost:8001/api/denemeler/');
            setDenemeler(response.data.denemeler || []);

            // Eğer deneme seçili değilse, en son denemeyi seç
            if (!selectedDeneme && response.data.denemeler.length > 0) {
                setSelectedDeneme(response.data.denemeler[0].id);
            }
        } catch (error) {
            console.error('Denemeler loading error:', error);
        }
    };

    const loadCombinedResults = async (denemeId = null) => {
        try {
            setLoading(true);
            let url = 'http://localhost:8001/api/results/combined/';

            if (denemeId || selectedDeneme) {
                url += `?deneme_id=${denemeId || selectedDeneme}`;
            }

            const response = await axios.get(url);
            setResults(response.data.results || []);
            setTotalStudents(response.data.total_students || 0);
            setDenemeInfo(response.data.deneme_sinavi || null);
        } catch (error) {
            console.error('Combined results loading error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDenemeler();
    }, []);

    useEffect(() => {
        if (selectedDeneme) {
            loadCombinedResults();
        }
    }, [selectedDeneme]);

    const handleDenemeChange = (denemeId) => {
        setSelectedDeneme(denemeId);
        loadCombinedResults(denemeId);
    };

    const calculateAverage = () => {
        if (results.length === 0) return 0;

        switch (averageType) {
            case "turkce":
                return (results.reduce((sum, r) => sum + r.turkce_net, 0) / results.length).toFixed(2);
            case "tarih":
                return (results.reduce((sum, r) => sum + r.tarih_net, 0) / results.length).toFixed(2);
            case "din":
                return (results.reduce((sum, r) => sum + r.din_net, 0) / results.length).toFixed(2);
            case "ingilizce":
                return (results.reduce((sum, r) => sum + r.ingilizce_net, 0) / results.length).toFixed(2);
            case "matematik":
                return (results.reduce((sum, r) => sum + r.matematik_net, 0) / results.length).toFixed(2);
            case "fen":
                return (results.reduce((sum, r) => sum + r.fen_net, 0) / results.length).toFixed(2);
            default: // toplam
                return (results.reduce((sum, r) => sum + r.toplam_net, 0) / results.length).toFixed(2);
        }
    };

    // Ders ortalamaları hesaplama
    const getDersOrtalamalari = () => {
        if (results.length === 0) return {};

        return {
            turkce: (results.reduce((sum, r) => sum + r.turkce_net, 0) / results.length).toFixed(2),
            tarih: (results.reduce((sum, r) => sum + r.tarih_net, 0) / results.length).toFixed(2),
            din: (results.reduce((sum, r) => sum + r.din_net, 0) / results.length).toFixed(2),
            ingilizce: (results.reduce((sum, r) => sum + r.ingilizce_net, 0) / results.length).toFixed(2),
            matematik: (results.reduce((sum, r) => sum + r.matematik_net, 0) / results.length).toFixed(2),
            fen: (results.reduce((sum, r) => sum + r.fen_net, 0) / results.length).toFixed(2),
            toplam: (results.reduce((sum, r) => sum + r.toplam_net, 0) / results.length).toFixed(2)
        };
    };

    // Ders bazında toplam doğru/yanlış/boş hesaplama
    const getDersToplamIstatistikleri = () => {
        if (results.length === 0) return {};

        const totalStudents = results.length;

        return {
            turkce: {
                dogru: Math.round(results.reduce((sum, r) => sum + r.turkce_dogru, 0) / totalStudents),
                yanlis: Math.round(results.reduce((sum, r) => sum + r.turkce_yanlis, 0) / totalStudents),
                bos: Math.round(results.reduce((sum, r) => sum + r.turkce_bos, 0) / totalStudents)
            },
            tarih: {
                dogru: Math.round(results.reduce((sum, r) => sum + r.tarih_dogru, 0) / totalStudents),
                yanlis: Math.round(results.reduce((sum, r) => sum + r.tarih_yanlis, 0) / totalStudents),
                bos: Math.round(results.reduce((sum, r) => sum + r.tarih_bos, 0) / totalStudents)
            },
            din: {
                dogru: Math.round(results.reduce((sum, r) => sum + r.din_dogru, 0) / totalStudents),
                yanlis: Math.round(results.reduce((sum, r) => sum + r.din_yanlis, 0) / totalStudents),
                bos: Math.round(results.reduce((sum, r) => sum + r.din_bos, 0) / totalStudents)
            },
            ingilizce: {
                dogru: Math.round(results.reduce((sum, r) => sum + r.ingilizce_dogru, 0) / totalStudents),
                yanlis: Math.round(results.reduce((sum, r) => sum + r.ingilizce_yanlis, 0) / totalStudents),
                bos: Math.round(results.reduce((sum, r) => sum + r.ingilizce_bos, 0) / totalStudents)
            },
            matematik: {
                dogru: Math.round(results.reduce((sum, r) => sum + r.matematik_dogru, 0) / totalStudents),
                yanlis: Math.round(results.reduce((sum, r) => sum + r.matematik_yanlis, 0) / totalStudents),
                bos: Math.round(results.reduce((sum, r) => sum + r.matematik_bos, 0) / totalStudents)
            },
            fen: {
                dogru: Math.round(results.reduce((sum, r) => sum + r.fen_dogru, 0) / totalStudents),
                yanlis: Math.round(results.reduce((sum, r) => sum + r.fen_yanlis, 0) / totalStudents),
                bos: Math.round(results.reduce((sum, r) => sum + r.fen_bos, 0) / totalStudents)
            },
            toplam: (() => {
                const totalDogru = Math.round(results.reduce((sum, r) => sum + (r.turkce_dogru + r.tarih_dogru + r.din_dogru + r.ingilizce_dogru + r.matematik_dogru + r.fen_dogru), 0) / totalStudents);
                const totalYanlis = Math.round(results.reduce((sum, r) => sum + (r.turkce_yanlis + r.tarih_yanlis + r.din_yanlis + r.ingilizce_yanlis + r.matematik_yanlis + r.fen_yanlis), 0) / totalStudents);
                const totalBos = Math.round(results.reduce((sum, r) => sum + (r.turkce_bos + r.tarih_bos + r.din_bos + r.ingilizce_bos + r.matematik_bos + r.fen_bos), 0) / totalStudents);
                return { dogru: totalDogru, yanlis: totalYanlis, bos: totalBos };
            })()
        };
    };

    // Toplam doğru/yanlış/boş hesaplama
    const calculateTotalStats = (student) => {
        const totalDogru = student.turkce_dogru + student.tarih_dogru + student.din_dogru +
            student.ingilizce_dogru + student.matematik_dogru + student.fen_dogru;
        const totalYanlis = student.turkce_yanlis + student.tarih_yanlis + student.din_yanlis +
            student.ingilizce_yanlis + student.matematik_yanlis + student.fen_yanlis;
        const totalBos = student.turkce_bos + student.tarih_bos + student.din_bos +
            student.ingilizce_bos + student.matematik_bos + student.fen_bos;

        return { totalDogru, totalYanlis, totalBos };
    };

    const getRankBadgeColor = (rank) => {
        if (rank === 1) return 'bg-yellow-500 text-white';
        if (rank === 2) return 'bg-gray-400 text-white';
        if (rank === 3) return 'bg-amber-600 text-white';
        if (rank <= 10) return 'bg-green-100 text-green-800';
        if (rank <= 50) return 'bg-blue-100 text-blue-800';
        return 'bg-gray-100 text-gray-800';
    };

    const getScoreColor = (score) => {
        if (score >= 15) return 'text-green-600 font-bold';
        if (score >= 10) return 'text-blue-600 font-semibold';
        if (score >= 5) return 'text-orange-600';
        return 'text-red-600';
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
                                    {denemeInfo ? `${denemeInfo.adi} - Birleştirilmiş 1. ve 2. Oturum Sonuçları` : 'Birleştirilmiş 1. ve 2. Oturum Sonuçları'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* Deneme Seçimi */}
                            <div className="flex flex-col">
                                <label className="text-xs text-gray-500 mb-1">Deneme Seçin</label>
                                <select
                                    value={selectedDeneme || ''}
                                    onChange={(e) => handleDenemeChange(e.target.value)}
                                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm min-w-48"
                                >
                                    <option value="">Deneme Seçin</option>
                                    {denemeler.map((deneme) => (
                                        <option key={deneme.id} value={deneme.id}>
                                            {deneme.adi} ({new Date(deneme.tarih).toLocaleDateString('tr-TR')})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Ortalama Türü Seçimi */}
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
                            >
                                <FiRefreshCw className="w-4 h-4 mr-2" />
                                Yenile
                            </button>
                            <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                <FiDownload className="w-4 h-4 mr-2" />
                                Excel İndir
                            </button>
                        </div>
                    </div>
                </div>



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
                                <p className="text-sm text-gray-600">En Yüksek Net</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {results.length > 0 ? results[0].toplam_net.toFixed(2) : '0.00'}
                                </p>
                            </div>
                            <FiTarget className="w-8 h-8 text-green-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    {averageType === "toplam" ? "Genel Ortalama" :
                                        averageType === "turkce" ? "Türkçe Ort." :
                                            averageType === "tarih" ? "Tarih Ort." :
                                                averageType === "din" ? "Din Ort." :
                                                    averageType === "ingilizce" ? "İngilizce Ort." :
                                                        averageType === "matematik" ? "Matematik Ort." :
                                                            "Fen Ort."}
                                </p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {calculateAverage()}
                                </p>
                            </div>
                            <FiBookOpen className="w-8 h-8 text-orange-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">70+ Net</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {results.filter(r => r.toplam_net >= 70).length}
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
                        {Object.entries(getDersOrtalamalari()).map(([ders, ortalama]) => {
                            const istatistikler = getDersToplamIstatistikleri()[ders];
                            return (
                                <div key={ders} className="text-center p-3 bg-gray-50 rounded-lg">
                                    <div className="text-xs text-gray-600 mb-1 capitalize">
                                        {ders === "toplam" ? "Toplam" : ders}
                                    </div>
                                    <div className="text-lg font-bold text-blue-600 mb-1">
                                        {ortalama}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {istatistikler ? `${istatistikler.dogru}D ${istatistikler.yanlis}Y ${istatistikler.bos}B` : ''}
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
                        <p className="text-gray-600">Net puana göre sıralanmış sonuçlar</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sıra</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İsim</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sınıf</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Türkçe</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Din</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">İngilizce</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Matematik</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Fen</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {results.map((student, index) => (
                                    <tr key={`${student.ogrenci_no}_${student.okul_kodu}`} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getRankBadgeColor(student.genel_siralama)}`}>
                                                {student.genel_siralama}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex-shrink-0">
                                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                        {student.ad.charAt(0)}{student.soyad.charAt(0)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {student.ad} {student.soyad}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        No: {student.ogrenci_no}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {student.sinif}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="text-sm">
                                                <div className={`font-semibold ${getScoreColor(student.turkce_net)}`}>
                                                    {student.turkce_net.toFixed(1)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {student.turkce_dogru}D {student.turkce_yanlis}Y {student.turkce_bos}B
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="text-sm">
                                                <div className={`font-semibold ${getScoreColor(student.tarih_net)}`}>
                                                    {student.tarih_net.toFixed(1)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {student.tarih_dogru}D {student.tarih_yanlis}Y {student.tarih_bos}B
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="text-sm">
                                                <div className={`font-semibold ${getScoreColor(student.din_net)}`}>
                                                    {student.din_net.toFixed(1)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {student.din_dogru}D {student.din_yanlis}Y {student.din_bos}B
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="text-sm">
                                                <div className={`font-semibold ${getScoreColor(student.ingilizce_net)}`}>
                                                    {student.ingilizce_net.toFixed(1)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {student.ingilizce_dogru}D {student.ingilizce_yanlis}Y {student.ingilizce_bos}B
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="text-sm">
                                                <div className={`font-semibold ${getScoreColor(student.matematik_net)}`}>
                                                    {student.matematik_net.toFixed(1)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {student.matematik_dogru}D {student.matematik_yanlis}Y {student.matematik_bos}B
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="text-sm">
                                                <div className={`font-semibold ${getScoreColor(student.fen_net)}`}>
                                                    {student.fen_net.toFixed(1)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {student.fen_dogru}D {student.fen_yanlis}Y {student.fen_bos}B
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="text-sm">
                                                <div className={`text-lg font-bold ${student.toplam_net >= 300 ? 'text-green-600' :
                                                    student.toplam_net >= 200 ? 'text-blue-600' :
                                                        student.toplam_net >= 100 ? 'text-orange-600' :
                                                            'text-red-600'
                                                    }`}>
                                                    {student.toplam_net.toFixed(2)}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {(() => {
                                                        const { totalDogru, totalYanlis, totalBos } = calculateTotalStats(student);
                                                        return `${totalDogru}D ${totalYanlis}Y ${totalBos}B`;
                                                    })()}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CombinedResults;