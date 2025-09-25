import React, { useState } from 'react';
import axios from 'axios';
import { FiUpload, FiFileText, FiKey, FiCheck, FiX, FiLoader, FiBook, FiCheckCircle } from 'react-icons/fi';

function UploadResult() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [denemeAdi, setDenemeAdi] = useState("");
  const [cevapAnahtariA, setCevapAnahtariA] = useState("");
  const [cevapAnahtariB, setCevapAnahtariB] = useState("");
  const [loading, setLoading] = useState(false);

  const endpoint = "http://localhost:8001/api/upload-results/";

  const handleFileChange = (e) => setFile(e.target.files?.[0] || null);

  // Sadece A-F harfleri, boşluk/satır sonu yok; uppercase'e çevir
  const sanitizeAnswer = (val) =>
    val.toUpperCase().replace(/[^A-F]/g, "").slice(0, 90);

  const onAChange = (e) => setCevapAnahtariA(sanitizeAnswer(e.target.value));
  const onBChange = (e) => setCevapAnahtariB(sanitizeAnswer(e.target.value));

  const isValidAnswers =
    cevapAnahtariA.length === 90 && cevapAnahtariB.length === 90;

  const canSubmit =
    !loading &&
    denemeAdi.trim().length >= 3 &&
    file &&
    isValidAnswers;

  const handleUpload = async () => {
    setMessage("");

    if (!denemeAdi.trim()) {
      setMessage("Lütfen deneme adını girin.");
      return;
    }
    if (!file) {
      setMessage("Lütfen bir .txt dosyası seçin.");
      return;
    }
    if (!isValidAnswers) {
      setMessage(
        "Cevap anahtarları A–F harflerinden oluşmalı ve tam 90 karakter olmalıdır."
      );
      return;
    }

    const formData = new FormData();
    formData.append("deneme_adi", denemeAdi.trim());
    formData.append("file", file);
    formData.append("cevap_anahtari_a", cevapAnahtariA);
    formData.append("cevap_anahtari_b", cevapAnahtariB);

    try {
      setLoading(true);
      const res = await axios.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(res.data?.message || "Başarıyla yüklendi.");
    } catch (err) {
      const hataMesaji =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Yükleme sırasında hata oluştu.";
      setMessage(hataMesaji);
    } finally {
      setLoading(false);
    }
  };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6 shadow-lg">
                        <FiUpload className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">
                        Sınav Sonuçları Yükleme
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Deneme adını girin, öğrenci cevap dosyanızı ve A & B kitapçığı cevap anahtarlarını yükleyerek 
                        sınav sonuçlarını hızlıca analiz edin.
                    </p>
                </div>

                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-100">
                    {/* Step 1 - Deneme Adı */}
                    <div className="mb-10">
                        <div className="flex items-center mb-6">
                            <div className="flex items-center justify-center w-10 h-10 bg-green-100 text-green-600 rounded-full mr-4 font-bold">
                                1
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-800">
                                Deneme Adı
                            </h2>
                        </div>
                        
                        <div className="relative">
                            <input
                                type="text"
                                value={denemeAdi}
                                onChange={(e) => setDenemeAdi(e.target.value)}
                                placeholder="Örn: 1. Deneme Sınavı, Mayıs Denemesi, vb."
                                className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-200 transition-all outline-none bg-gray-50 hover:bg-white"
                            />
                            <div className="flex justify-between items-center mt-3">
                                <div className="flex items-center text-sm text-green-600">
                                    <FiBook className="w-4 h-4 mr-1" />
                                    Deneme Sınavı Adı
                                </div>
                                <div className={`
                                    px-3 py-1 rounded-full text-sm font-medium
                                    ${denemeAdi.trim().length >= 3 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-gray-100 text-gray-700'
                                    }
                                `}>
                                    {denemeAdi.length > 0 ? 'Geçerli' : 'Boş'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 2 - File Upload */}
                    <div className="mb-10">
                        <div className="flex items-center mb-6">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full mr-4 font-bold">
                                2
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-800">
                                Dosya Seçimi
                            </h2>
                        </div>
                        
                        <div className="relative">
                            <input
                                type="file"
                                accept=".txt"
                                onChange={handleFileChange}
                                id="file-upload"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className={`
                                border-3 border-dashed rounded-2xl p-8 text-center transition-all duration-300 hover:scale-[1.02]
                                ${file 
                                    ? 'border-green-400 bg-green-50' 
                                    : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                                }
                            `}>
                                <div className="flex flex-col items-center">
                                    {file ? (
                                        <>
                                            <FiCheckCircle className="w-16 h-16 text-green-500 mb-4" />
                                            <p className="text-xl font-semibold text-green-700 mb-2">
                                                Dosya Seçildi!
                                            </p>
                                            <p className="text-green-600 mb-4">
                                                {file.name}
                                            </p>
                                            <p className="text-sm text-green-500">
                                                Boyut: {(file.size / 1024).toFixed(2)} KB
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <FiFileText className="w-16 h-16 text-gray-400 mb-4" />
                                            <p className="text-xl font-semibold text-gray-700 mb-2">
                                                .txt Dosyasını Seçin
                                            </p>
                                            <p className="text-gray-500 mb-4">
                                                Öğrenci cevaplarını içeren dosyayı buraya sürükleyin veya tıklayın
                                            </p>
                                            <div className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
                                                <FiUpload className="w-5 h-5 mr-2" />
                                                Dosya Seç
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

          {/* Step 3 */}
          <div className="mb-10">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-100 text-purple-600 rounded-full mr-4 font-bold">
                3
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">
                Cevap Anahtarları
              </h2>
            </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* A Booklet */}
                            <div className="group">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-t-2xl">
                                    <div className="flex items-center text-white">
                                        <FiBook className="w-6 h-6 mr-3" />
                                        <h3 className="text-xl font-bold">A Kitapçığı</h3>
                                    </div>
                                </div>
                                <div className="bg-blue-50 p-6 rounded-b-2xl border-2 border-blue-200 transition-all duration-300 group-hover:border-blue-400">
                                    <textarea
                                        rows={5}
                                        value={cevapAnahtariA}
                                        onChange={(e) => setCevapAnahtariA(e.target.value)}
                                        placeholder="A kitapçığı cevaplarını girin (ABCD... 90 karakter)"
                                        className="w-full resize-none border-2 border-blue-300 rounded-xl p-4 text-sm font-mono focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all outline-none bg-white"
                                    />
                                    <div className="flex justify-between items-center mt-3">
                                        <div className="flex items-center text-sm text-blue-600">
                                            <FiKey className="w-4 h-4 mr-1" />
                                            Karakter Sayısı
                                        </div>
                                        <div className={`
                                            px-3 py-1 rounded-full text-sm font-medium
                                            ${cevapAnahtariA.length === 90 
                                                ? 'bg-green-100 text-green-700' 
                                                : cevapAnahtariA.length > 90
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-blue-100 text-blue-700'
                                            }
                                        `}>
                                            {cevapAnahtariA.length}/90
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* B Booklet */}
                            <div className="group">
                                <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 rounded-t-2xl">
                                    <div className="flex items-center text-white">
                                        <FiBook className="w-6 h-6 mr-3" />
                                        <h3 className="text-xl font-bold">B Kitapçığı</h3>
                                    </div>
                                </div>
                                <div className="bg-red-50 p-6 rounded-b-2xl border-2 border-red-200 transition-all duration-300 group-hover:border-red-400">
                                    <textarea
                                        rows={5}
                                        value={cevapAnahtariB}
                                        onChange={(e) => setCevapAnahtariB(e.target.value)}
                                        placeholder="B kitapçığı cevaplarını girin (CADB... 90 karakter)"
                                        className="w-full resize-none border-2 border-red-300 rounded-xl p-4 text-sm font-mono focus:border-red-500 focus:ring-4 focus:ring-red-200 transition-all outline-none bg-white"
                                    />
                                    <div className="flex justify-between items-center mt-3">
                                        <div className="flex items-center text-sm text-red-600">
                                            <FiKey className="w-4 h-4 mr-1" />
                                            Karakter Sayısı
                                        </div>
                                        <div className={`
                                            px-3 py-1 rounded-full text-sm font-medium
                                            ${cevapAnahtariB.length === 90 
                                                ? 'bg-green-100 text-green-700' 
                                                : cevapAnahtariB.length > 90
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-red-100 text-red-700'
                                            }
                                        `}>
                                            {cevapAnahtariB.length}/90
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Upload Button */}
                    <div className="text-center">
                        <button
                            onClick={handleUpload}
                            disabled={loading}
                            className={`
                                inline-flex items-center px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-300 transform min-w-[200px]
                                ${loading 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:scale-105 hover:shadow-xl text-white'
                                }
                            `}
                        >
                            {loading ? (
                                <>
                                    <FiLoader className="w-6 h-6 mr-3 animate-spin" />
                                    Yükleniyor...
                                </>
                            ) : (
                                <>
                                    <FiUpload className="w-6 h-6 mr-3" />
                                    Sonuçları Yükle
                                </>
                            )}
                        </button>
                    </div>

                    {/* Message Display */}
                    {message && (
                        <div className={`
                            mt-8 p-6 rounded-2xl border-l-4 
                            ${message.includes("hata") || message.includes("karakter") 
                                ? 'bg-red-50 border-red-400' 
                                : 'bg-green-50 border-green-400'
                            }
                        `}>
                            <div className="flex items-start">
                                {message.includes("hata") || message.includes("karakter") ? (
                                    <FiX className="w-6 h-6 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                                ) : (
                                    <FiCheck className="w-6 h-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                )}
                                <div>
                                    <p className={`
                                        text-lg font-medium
                                        ${message.includes("hata") || message.includes("karakter") 
                                            ? 'text-red-800' 
                                            : 'text-green-800'
                                        }
                                    `}>
                                        {message.includes("hata") || message.includes("karakter") ? "Hata!" : "Başarılı!"}
                                    </p>
                                    <p className={`
                                        mt-1
                                        ${message.includes("hata") || message.includes("karakter") 
                                            ? 'text-red-700' 
                                            : 'text-green-700'
                                        }
                                    `}>
                                        {message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <FiBook className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Deneme Adı</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Her deneme için benzersiz bir ad verin. Aynı isimde deneme varsa güncellenecektir.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <FiFileText className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Dosya Formatı</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Sadece .txt formatında dosyalar kabul edilir. Dosya UTF-8 kodlamasında olmalıdır.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <FiKey className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Cevap Anahtarı</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Her kitapçık için tam 90 karakter girilmelidir. Sadece A–F harflerini kullanın.
            </p>
          </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <FiCheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-gray-800">Otomatik Analiz</h3>
                        </div>
                        <p className="text-gray-600 text-sm">
                            Sistem otomatik olarak A ve B kitapçığı öğrencilerini doğru cevap anahtarıyla kontrol eder.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UploadResult;
