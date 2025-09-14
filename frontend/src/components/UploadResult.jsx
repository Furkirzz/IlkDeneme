import React, { useState } from 'react';
import axios from 'axios';
import { FiUpload, FiFileText, FiKey, FiCheck, FiX, FiLoader, FiBook, FiCheckCircle } from 'react-icons/fi';
// import SplashCursor from './ExtraComponents/SplashCursor';

function UploadResult() {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");
    const [denemeAdi, setDenemeAdi] = useState("");
    const [cevapAnahtariA, setCevapAnahtariA] = useState("");
    const [cevapAnahtariB, setCevapAnahtariB] = useState("");
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!denemeAdi.trim()) {
            setMessage("Lütfen deneme adını girin.");
            return;
        }

        if (!file) {
            setMessage("Lütfen bir .txt dosyası seçin.");
            return;
        }

        if (cevapAnahtariA.length < 90) {
            setMessage("A kitapçığı cevap anahtarı en az 90 karakter olmalıdır.");
            return;
        }

        if (cevapAnahtariB.length < 90) {
            setMessage("B kitapçığı cevap anahtarı en az 90 karakter olmalıdır.");
            return;
        }

        const formData = new FormData();
        formData.append("deneme_adi", denemeAdi.trim());
        formData.append("file", file);
        formData.append("cevap_anahtari_a", cevapAnahtariA.trim());
        formData.append("cevap_anahtari_b", cevapAnahtariB.trim());

        try {
            setLoading(true);
            const res = await axios.post("http://localhost:8001/api/upload-results/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setMessage(res.data.message || "Başarıyla yüklendi.");
        } catch (err) {
            const hataMesaji = err.response?.data?.error || "Yükleme sırasında hata oluştu.";
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

                    {/* Step 3 - Answer Keys */}
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
                            Her kitapçık için tam 90 karakter girilmelidir. A-B-C-D-E-F harfleri kullanın.
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
            {/* <SplashCursor /> */}
        </div>

    );
}

export default UploadResult;

// import React, { useState } from "react";
// import chardet from "jschardet";

// /**
//  * Dönüştürülmüş içeriği dosya olarak indirir.
//  * @param {string} content - Dosya içeriği
//  * @param {string} filename - Dosya adı
//  */
// const downloadConvertedFile = (content, filename = 'donusmus_deneme.txt') => {
//     const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
//     const url = URL.createObjectURL(blob);

//     const link = document.createElement('a');
//     link.href = url;
//     link.download = filename;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     URL.revokeObjectURL(url);
// };

// /**
//  * Akademi formatındaki TXT dosyasını Deneme formatına dönüştürür.
//  * Kodlama tespiti yapar, öğrenci_no ve cevap uzunluklarını kurallara göre işler.
//  */
// const convertAkademiToDeneme = async (file) => {
//     if (!file) throw new Error("Dosya bulunamadı.");

//     return new Promise((resolve, reject) => {
//         const binaryReader = new FileReader();

//         binaryReader.onload = (e) => {
//             try {
//                 const buffer = e.target.result;
//                 let encoding = 'utf-8';

//                 try {
//                     const detected = chardet.detect(new Uint8Array(buffer));
//                     if (detected?.encoding) encoding = detected.encoding;
//                 } catch {
//                     encoding = 'windows-1254';
//                 }

//                 const textReader = new FileReader();
//                 textReader.onload = (textEvent) => {
//                     try {
//                         const content = textEvent.target.result;
//                         const lines = content.split(/\r?\n/);
//                         const outputLines = [];

//                         for (const line of lines) {
//                             try {
//                                 if (line.length < 70) continue;

//                                 const okulKodu = line.substring(0, 10).trim();
//                                 const ogrenciNoRaw = line.substring(10, 20).trim();
//                                 const ad = line.substring(20, 30).trim();
//                                 const soyad = line.substring(30, 40).trim();
//                                 const sinif = line.substring(40, 45).trim();

//                                 const kitapcikRaw = line.substring(45, 60).trim();
//                                 if (kitapcikRaw.length < 3) continue;

//                                 const cinsiyet = kitapcikRaw[0];
//                                 const oturum = kitapcikRaw[1];
//                                 const kitapcikTuru = kitapcikRaw[2];

//                                 // Cevapları temizle
//                                 const cevapHam = line.substring(60).replace(/[\s\*]/g, '');
//                                 const cevapUzunlugu = oturum === "1" ? 50 : 40;
//                                 const cevaplar = cevapHam.padEnd(cevapUzunlugu, ' ').substring(0, cevapUzunlugu);

//                                 // Öğrenci numarası geçerli mi?
//                                 const ogrenciNo = /^\d{5}$/.test(ogrenciNoRaw) ? ogrenciNoRaw : "";

//                                 // Sabit alan genişliği
//                                 const formatField = (val, len) =>
//                                     String(val ?? "").padEnd(len).slice(0, len);

//                                 const newLine =
//                                     formatField(okulKodu, 10) +
//                                     formatField(ogrenciNo, 10) +
//                                     formatField(ad, 10) +
//                                     formatField(soyad, 10) +
//                                     formatField(sinif, 5) +
//                                     formatField(cinsiyet, 5) +
//                                     formatField(oturum, 5) +
//                                     formatField(kitapcikTuru, 5) +
//                                     cevaplar;

//                                 const expectedLength = oturum === "1" ? 111 : 101;
//                                 if (newLine.length !== expectedLength) {
//                                     console.warn(`Satır uzunluğu beklenenden farklı: ${newLine.length} / ${expectedLength}`, newLine);
//                                 }

//                                 outputLines.push(newLine);
//                             } catch (err) {
//                                 continue;
//                             }
//                         }

//                         if (outputLines.length === 0) {
//                             reject(new Error("Hiçbir satır işlenemedi."));
//                             return;
//                         }

//                         resolve(outputLines.join('\n'));
//                     } catch (err) {
//                         reject(new Error("Dosya işlenemedi: " + err.message));
//                     }
//                 };

//                 textReader.onerror = () => reject(new Error("Dosya metin olarak okunamadı."));
//                 textReader.readAsText(file, encoding);
//             } catch (error) {
//                 reject(new Error("Dosya okuma sürecinde hata oluştu: " + error.message));
//             }
//         };

//         binaryReader.onerror = () => reject(new Error("Dosya ikili olarak okunamadı."));
//         binaryReader.readAsArrayBuffer(file);
//     });
// };
// const App = () => {
//     const [file, setFile] = useState(null);
//     const [message, setMessage] = useState("");
//     const [loading, setLoading] = useState(false);

//     const handleFileChange = (e) => {
//         setFile(e.target.files[0]);
//         setMessage("");
//     };

//     const handleUpload = async () => {
//         if (!file) {
//             setMessage("Lütfen bir .txt dosyası seçin.");
//             return;
//         }

//         setLoading(true);
//         setMessage("");

//         try {
//             const convertedContent = await convertAkademiToDeneme(file);
//             downloadConvertedFile(convertedContent, 'donusmus_deneme.txt');
//             setMessage("Dönüştürme başarılı. Dosya indiriliyor...");
//         } catch (error) {
//             setMessage("Hata oluştu: " + error.message);
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 font-sans">
//             <div className="w-full max-w-xl bg-white p-8 rounded-xl shadow-lg border border-gray-200">
//                 <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Akademi Pruva → Deneme Formatı</h2>
//                 <p className="text-sm text-center text-gray-500 italic mb-6">Client-side dönüştürme (Sunucu gerektirmez)</p>

//                 <label
//                     htmlFor="file-input"
//                     className="flex flex-col items-center justify-center w-full px-4 py-8 mb-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
//                 >
//                     <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-4-4v-1a4 4 0 014-4h4.586a2 2 0 011.414.586l.5.5a2 2 0 001.414.586H17a4 4 0 014 4v2a4 4 0 01-4 4H7z"></path></svg>
//                     <span className="text-gray-600 font-medium">
//                         {file ? file.name : "Bir .txt dosyası seçin"}
//                     </span>
//                     <input
//                         id="file-input"
//                         type="file"
//                         accept=".txt"
//                         onChange={handleFileChange}
//                         className="hidden"
//                     />
//                 </label>

//                 <button
//                     onClick={handleUpload}
//                     disabled={loading || !file}
//                     className={`w-full px-6 py-3 rounded-lg text-lg font-semibold transition-all duration-300 ease-in-out
//                         ${loading || !file
//                             ? 'bg-gray-400 cursor-not-allowed shadow-none'
//                             : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'}`}
//                 >
//                     {loading ? "Dönüştürülüyor..." : "Dönüştür ve İndir"}
//                 </button>

//                 {message && (
//                     <div className={`mt-6 p-4 rounded-lg font-bold text-sm
//                         ${message.includes("başarılı")
//                             ? 'bg-green-100 text-green-700'
//                             : 'bg-red-100 text-red-700'}`}
//                     >
//                         {message}
//                     </div>
//                 )}

//                 {file && (
//                     <div className="mt-4 p-3 bg-gray-200 rounded-lg text-gray-700 text-xs text-left">
//                         <p className="font-bold">Seçilen Dosya Bilgileri:</p>
//                         <p><strong>Dosya Adı:</strong> {file.name}</p>
//                         <p><strong>Dosya Boyutu:</strong> {(file.size / 1024).toFixed(2)} KB</p>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default App;