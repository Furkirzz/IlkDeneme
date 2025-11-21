import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Worker Ayarı (Hata almamak için unpkg kullanıyoruz)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const ExamResultViewer = () => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setTableData([]); 
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const typedarray = new Uint8Array(e.target.result);
      try {
        const parsedData = await parsePdfData(typedarray);
        setTableData(parsedData);
      } catch (error) {
        console.error("PDF İşleme Hatası:", error);
        alert("Veri okunurken hata oluştu: " + error.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // --- GELİŞTİRİLMİŞ PDF PARSE ALGORİTMASI ---
  const parsePdfData = async (pdfData) => {
    const pdf = await pdfjsLib.getDocument(pdfData).promise;
    let allRows = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // 1. Metinleri al
      const items = textContent.items.map(item => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
      }));

      // 2. Satırları Y koordinatına göre grupla
      items.sort((a, b) => b.y - a.y);
      const rowTolerance = 6; 
      let rows = [];
      let currentRow = [];
      let currentY = items[0]?.y || 0;

      items.forEach((item) => {
        if (Math.abs(item.y - currentY) < rowTolerance) {
          currentRow.push(item);
        } else {
          currentRow.sort((a, b) => a.x - b.x);
          rows.push(currentRow);
          currentRow = [item];
          currentY = item.y;
        }
      });
      if (currentRow.length > 0) {
        currentRow.sort((a, b) => a.x - b.x);
        rows.push(currentRow);
      }

      // 3. Öğrenci verisi olmayan satırları ele
      const validRows = rows.filter(row => {
        const textCombined = row.map(r => r.text).join(" ");
        // İçinde sayı olmalı ve 'Ortalama', 'Katılım' gibi başlık satırı olmamalı
        return /\d/.test(textCombined) && 
               !textCombined.includes("Ortalama") && 
               !textCombined.includes("Katılım") &&
               !textCombined.includes("Net");
      });

      const parsedRows = validRows.map(row => {
        // Satırdaki metinleri temizle
        const textItems = row.map(r => r.text.trim()).filter(t => t !== "");
        
        // --- AYRIŞTIRMA MANTIĞI (KAYMAYI ÖNLEYEN KISIM) ---
        
        // 1. Adım: İsim Nerede Bitiyor?
        // Genellikle puanlar virgüllü sayı (14,67) veya küçük tamsayılardır (15, 3).
        // İsim ve Sıra No/Numara kısmını bulana kadar ilerle.
        
        let splitIndex = 0;
        // Tersten giderek ilk "metin" (isim parçası) bulduğumuz yerin sağı puanlardır.
        // Ancak en güvenlisi soldan gidip, peş peşe sayıların başladığı yeri bulmaktır.
        
        for(let k = 0; k < textItems.length; k++) {
            const current = textItems[k];
            
            // Eğer bu eleman virgüllü bir sayıysa (Net: 14,67) kesin puandır.
            if(current.includes(',') && !isNaN(parseFloat(current.replace(',','.')))) {
                // Genellikle Net'ten önce Doğru ve Yanlış gelir (2 sütun geri git)
                // Ama bazen D ve Y birleşik olabilir. Güvenli liman burası.
                // Bizim stratejimiz: İsim, içinde hiç rakam olmayan (veya sınıf 8-A hariç) uzun metindir.
                splitIndex = k;
                break; 
            }
        }
        
        // Virgül bulamadıysa manuel bir ayrım noktası tahmin et (Genellikle 2. veya 3. index isimdir)
        // Daha sağlam bir yöntem: Puanların başladığı yeri tespit et.
        // Puanlar genelde satırın sonuna doğru yığılır.
        
        // Basit ve etkili yöntem:
        // Bütün satırı tek bir string yap, sonra sayısal desenleri analiz et.
        const fullLine = textItems.join(" ");
        
        // İsim ve Numara Ayrıştırma
        // Genelde yapı: [Sıra] [No] [Ad Soyad] [Sınıf] [Puanlar...]
        // Örnek: "1 173 ÖMÜR BÜYÜKÇONGAR 8-A 16 4 14,67 ..."
        
        // Puanların başladığı yeri bulmak için Regex kullanalım. 
        // 3'lü gruplar (D Y N) genelde şöyledir: Sayı Sayı VirgüllüSayı
        
        // İsimden sonra gelen her şey "Veri"dir.
        // İsim/Sınıf ayrımı zor olabilir ama Puanları ayırmak kolaydır.
        
        let nameDataPart = [];
        let scoreDataPart = [];
        
        // Ayrım noktası: İlk virgüllü sayıdan önceki 2 eleman (D ve Y) puan başlangıcıdır diyebiliriz
        // Ama bazen D ve Y 0 olabilir.
        
        // Manuel döngü ile ayır:
        let foundScores = false;
        for (let k = 0; k < textItems.length; k++) {
            const item = textItems[k];
            // Sayı mı? (Virgül içeriyorsa veya sadece rakamsa)
            // 8-A, 7/B gibi sınıf isimlerini sayı sanmasın diye '-' kontrolü yapıyoruz.
            const isPureNumber = /^\d+$/.test(item); 
            const isDecimal = /^\d+,\d+$/.test(item);
            const isClass = item.includes('-') || item.includes('/');

            // Eğer virgüllü sayıysa veya (saf sayı ise ve önceki eleman sınıf değilse)
            // Bu mantık PDF'e göre hassastır, en garantisi 'Ders Neti' formatını yakalamaktır.
            
            if (!foundScores) {
                // Puanların başladığını anlamaya çalışıyoruz
                // Genellikle 3-4. indexten sonra başlar.
                if (k > 2 && (isDecimal || (isPureNumber && !isClass))) {
                     foundScores = true;
                     scoreDataPart.push(item);
                } else {
                    nameDataPart.push(item);
                }
            } else {
                scoreDataPart.push(item);
            }
        }

        // EĞER split yanlış yapıldıysa (isimden hemen sonra puan gelmesi):
        // scoreDataPart içindeki verileri normalize et (boşlukları ayır)
        // Örn: "10 0" -> ["10", "0"]
        const normalizedScores = scoreDataPart.join(" ").split(" ").filter(s => s !== "");

        // İlk baştaki verileri (Sıra, No, Ad) düzenle
        let rank = nameDataPart[0] || "-";
        // İsim geri kalanlar
        let name = nameDataPart.slice(1).join(" ");

        // Eğer normalize edilmiş skorların başında sınıf bilgisi (8-A vb.) kaldıysa onu isme ekle
        if (normalizedScores.length > 0 && (normalizedScores[0].includes('-') || normalizedScores[0].includes('/'))) {
             name += " " + normalizedScores.shift();
        }

        return {
          rank,
          name,
          scores: normalizedScores
        };
      });

      allRows = [...allRows, ...parsedRows];
    }

    return allRows;
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen font-sans">
      <div className="max-w-[98%] mx-auto">
        
        {/* Header / Upload Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-200 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">LGS Deneme Sınavı Sonuçları</h1>
            <p className="text-sm text-gray-500 mt-1">PDF dosyasını yükleyerek listeyi görüntüleyin.</p>
          </div>
          
          <div className="flex items-center gap-4">
            {loading && <span className="text-blue-600 font-medium animate-pulse">İşleniyor...</span>}
            {!loading && fileName && <span className="text-green-600 text-sm font-semibold border px-3 py-1 rounded bg-green-50">{fileName}</span>}
            
            <label className="cursor-pointer inline-flex items-center px-5 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition shadow-md">
              PDF Yükle
              <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Table Section */}
        {tableData.length > 0 ? (
          <div className="bg-white rounded-lg shadow border border-gray-300 overflow-x-auto">
            <table className="w-full text-sm text-center border-collapse">
              <thead>
                {/* 1. Satır: Ders Başlıkları */}
                <tr className="text-xs uppercase text-white">
                  <th rowSpan="2" className="px-4 py-3 bg-gray-100 text-gray-700 border border-gray-300 sticky left-0 z-10">SIRA</th>
                  <th rowSpan="2" className="px-4 py-3 bg-gray-100 text-gray-700 border border-gray-300 text-left min-w-[200px] sticky left-[60px] z-10">ADI SOYADI</th>
                  
                  <th colSpan="3" className="py-2 border border-gray-300 bg-red-500">TÜRKÇE</th>
                  <th colSpan="3" className="py-2 border border-gray-300 bg-blue-600">MATEMATİK</th>
                  <th colSpan="3" className="py-2 border border-gray-300 bg-green-600">FEN BİL.</th>
                  <th colSpan="3" className="py-2 border border-gray-300 bg-yellow-500">SOSYAL</th>
                  <th colSpan="3" className="py-2 border border-gray-300 bg-purple-600">DİN KÜL.</th>
                  <th colSpan="3" className="py-2 border border-gray-300 bg-pink-500">İNGİLİZCE</th>
                  <th colSpan="3" className="py-2 border border-gray-300 bg-gray-600">GENEL TOPLAM</th>
                  <th rowSpan="2" className="px-2 py-3 bg-gray-200 text-gray-800 border border-gray-300 font-bold">LGS<br/>PUAN</th>
                </tr>

                {/* 2. Satır: D - Y - N */}
                <tr className="text-[10px] font-bold text-gray-600 bg-gray-50">
                  {/* 7 Grup için (6 Ders + 1 Toplam) döngü */}
                  {[...Array(7)].map((_, i) => (
                    <React.Fragment key={i}>
                      <th className="border border-gray-300 px-1 py-1 min-w-[30px]">D</th>
                      <th className="border border-gray-300 px-1 py-1 min-w-[30px]">Y</th>
                      <th className="border border-gray-300 px-1 py-1 min-w-[40px] bg-gray-100 text-black">N</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              
              <tbody className="text-gray-700 text-xs">
                {tableData.map((student, index) => (
                  <tr key={index} className={`hover:bg-blue-50 border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-2 py-3 border-r border-gray-300 font-medium sticky left-0 bg-inherit z-10">{student.rank}</td>
                    <td className="px-3 py-3 border-r border-gray-300 text-left font-bold text-gray-900 sticky left-[60px] bg-inherit z-10 whitespace-nowrap">{student.name}</td>
                    
                    {/* Puanlar */}
                    {student.scores.map((score, sIndex) => {
                         // Tablo taşmaması için limit (Puan sütunu hariç 21 veri + puan)
                         if(sIndex > 21) return null;
                         
                         // Net sütunu (her 3. sütun) kalın olsun
                         const isNet = (sIndex + 1) % 3 === 0;
                         
                         return (
                           <td key={sIndex} className={`px-1 py-2 border-r border-gray-200 ${isNet ? 'font-extrabold text-black bg-gray-100' : ''}`}>
                             {score}
                           </td>
                         )
                    })}
                    
                    {/* Eğer skor verisi eksikse boş hücre bas (Tablo şekli bozulmasın) */}
                    {[...Array(Math.max(0, 22 - student.scores.length))].map((_, i) => (
                        <td key={`empty-${i}`} className="border-r border-gray-200"></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
           !loading && (
            <div className="text-center py-20 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-400 text-lg">Görüntülenecek veri yok.</p>
            </div>
           )
        )}
      </div>
    </div>
  );
};

export default ExamResultViewer;