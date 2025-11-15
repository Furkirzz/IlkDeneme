import React, { useState } from "react";
import { FiUpload, FiCheckCircle } from "react-icons/fi";
import Swal from "sweetalert2";

const ImportResults = () => {
  const [examName, setExamName] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const API_BASE = "http://127.0.0.1:8001";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      Swal.fire({
        icon: "warning",
        title: "Eksik Bilgi",
        text: "Lütfen bir PDF dosyası seçin.",
      });
      return;
    }

    if (!examName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Eksik Bilgi",
        text: "Lütfen bir sınav adı girin.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("exam_name", examName);

    try {
      setStatus("Yükleniyor...");

      const response = await fetch(`${API_BASE}/api/import-pdf/`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Sunucu hatası oluştu!");
      }

      Swal.fire({
        icon: "success",
        title: "Yükleme Başarılı!",
        html: `
          <p><strong>${result.exam_name}</strong> sınavı oluşturuldu.</p>
          <p>${result.imported || 0} öğrenci başarıyla eklendi.</p>
        `,
        confirmButtonColor: "#3085d6",
      });

      setStatus(`✅ ${result.exam_name} sınavı oluşturuldu (${result.imported} öğrenci).`);
      setExamName("");
      setFile(null);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Yükleme Hatası",
        text: err.message || "Bir hata oluştu!",
      });
      setStatus("❌ Hata oluştu.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">PDF Sonuç Yükle</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sınav adı alanı */}
          <div>
            <label className="block text-sm font-medium mb-2">Sınav Adı</label>
            <input
              type="text"
              placeholder="Örn: 8. Sınıf Deneme 2"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          {/* PDF dosyası alanı */}
          <div>
            <label className="block text-sm font-medium mb-2">PDF Dosyası</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full border rounded-lg p-2"
            />
          </div>

          {/* Gönder butonu */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <FiUpload /> Yükle
          </button>
        </form>

        {status && (
          <div className="mt-6 text-center text-sm text-gray-700">
            <FiCheckCircle className="inline-block mr-1" />
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportResults;
