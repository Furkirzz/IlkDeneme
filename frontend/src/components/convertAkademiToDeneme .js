// import chardet from 'jschardet';

// /**
//  * Akademi formatındaki TXT dosyasını Deneme formatına dönüştürür.
//  * Django view ile tam uyumlu JavaScript versiyonu.
//  * @param {File} file - Yüklenecek dosya
//  * @returns {Promise<string>} - Dönüştürülmüş dosya içeriği
//  */
// export const convertAkademiToDeneme = async (file) => {
//     if (!file) throw new Error("Dosya bulunamadı.");

//     return new Promise((resolve, reject) => {
//         const binaryReader = new FileReader();

//         binaryReader.onload = (e) => {
//             const buffer = e.target.result;
//             let encoding = 'windows-1254';

//             try {
//                 const detected = chardet.detect(new Uint8Array(buffer));
//                 if (detected && detected.encoding) {
//                     encoding = detected.encoding;
//                 }
//                 console.log(`Dosya için tespit edilen kodlama: ${encoding}`);
//             } catch {
//                 console.warn("Kodlama tespit edilemedi, varsayılan kullanılacak.");
//             }

//             const textReader = new FileReader();
//             textReader.onload = (textEvent) => {
//                 try {
//                     const content = textEvent.target.result;
//                     const lines = content.split(/\r?\n/);
//                     const outputLines = [];

//                     for (const line of lines) {
//                         try {
//                             const trimmedLine = line.replace(/\s+$/, '');
//                             if (trimmedLine.length < 70) continue;

//                             const okulKodu = trimmedLine.substring(0, 10).trim();
//                             const ogrenciNoRaw = trimmedLine.substring(10, 20).trim();
//                             const ad = trimmedLine.substring(20, 30).trim();
//                             const soyad = trimmedLine.substring(30, 40).trim();
//                             const sinif = trimmedLine.substring(40, 45).trim();
//                             const kitapcikRaw = trimmedLine.substring(45, 60).trim();
//                             const kitapcik = kitapcikRaw.substring(0, 3).trim();

//                             if (kitapcik.length !== 3) continue;

//                             const cinsiyet = kitapcik[0];
//                             const oturum = kitapcik[1];
//                             const kitapcikTuru = kitapcik[2];

//                             let cevapRaw = trimmedLine.substring(60)
//                                 .replace(/ /g, '')
//                                 .replace(/\*/g, '');

//                             const cevapUzunlugu = oturum === "1" ? 50 : 40;
//                             let cevaplar = cevapRaw.slice(0, cevapUzunlugu);

//                             if (cevaplar.length === 0) {
//                                 cevaplar = " ".repeat(cevapUzunlugu);
//                             } else if (cevaplar.length < cevapUzunlugu) {
//                                 cevaplar = cevaplar.padEnd(cevapUzunlugu, " ");
//                             }

//                             const isValidOgrNo = /^\d{5}$/.test(ogrenciNoRaw);
//                             const ogrenciNo = isValidOgrNo ? ogrenciNoRaw : "";

//                             const formatField = (val, len) =>
//                                 String(val ?? "").padEnd(len, ' ').substring(0, len);

//                             const newLine =
//                                 formatField(okulKodu, 10) +
//                                 formatField(ogrenciNo, 10) +
//                                 formatField(ad, 10) +
//                                 formatField(soyad, 10) +
//                                 formatField(sinif, 5) +
//                                 formatField(cinsiyet, 5) +
//                                 formatField(oturum, 5) +
//                                 formatField(kitapcikTuru, 5) +
//                                 cevaplar;

//                             outputLines.push(newLine);
//                         } catch {
//                             continue;
//                         }
//                     }

//                     if (outputLines.length === 0) {
//                         reject(new Error("Hiçbir satır işlenemedi. Format hatası olabilir."));
//                         return;
//                     }

//                     resolve(outputLines.join('\n'));

//                 } catch (err) {
//                     reject(new Error("Dosya işlenemedi: " + err.message));
//                 }
//             };

//             textReader.onerror = () => reject(new Error("Dosya metin olarak okunamadı."));
//             textReader.readAsText(file, encoding);
//         };

//         binaryReader.onerror = () => reject(new Error("Dosya ikili olarak okunamadı."));
//         binaryReader.readAsArrayBuffer(file);
//     });
// };

// /**
//  * Dönüştürülmüş içeriği dosya olarak indirir
//  * @param {string} content - Dosya içeriği
//  * @param {string} filename - Dosya adı
//  */
// export const downloadConvertedFile = (content, filename = 'donusmus_deneme.txt') => {
//     const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
//     const url = URL.createObjectURL(blob);

//     const link = document.createElement('a');
//     link.href = url;
//     link.download = filename;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);

//     // Bellek temizliği
//     URL.revokeObjectURL(url);
// };

// // ... (Kullanım örneği aynı kalabilir) ...