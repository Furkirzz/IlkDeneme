// src/components/HeroSection.jsx
import React, { useEffect, useState } from "react";
import { api } from "../store/authSlice";
import {
  FiBookOpen,
  FiPlay,
  FiStar,
  FiTrendingUp,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { BsLightbulb } from "react-icons/bs";

const S3_BASE =
  (import.meta?.env && import.meta.env.VITE_S3_BASE) ||
  "http://46.31.79.7:9000/dershanemedia/photos"; // MinIO bucket URL'si

/** MinIO görsel URL normalizasyonu
 *  - :9001/browser/... → :9000/<bucket>/<key>
 *  - Göreli key (photos/...) → S3_BASE + key
 *  - Göreli URL (/something) → S3_BASE + path (bucket zaten S3_BASE içinde)
 *  - Tam URL → encodeURI ile güvenli hale getir
 */
function normalizeImageUrl(input) {
  if (!input) return null;
  let s = String(input).trim();

  // 1) MinIO console linkini dosya linkine dönüştür: :9001/browser/<encodedPath>
  //    <encodedPath> genelde "dershanemedia/photos%2Fdosya.png"
  const consoleRe = /^https?:\/\/([^/]+):9001\/browser\/([^?#]+)/i;
  const m = s.match(consoleRe);
  if (m) {
    const host = m[1];
    const decodedPath = decodeURIComponent(m[2]); // "dershanemedia/photos/...png"
    // nihai dosya URL'si
    return encodeURI(`http://${host}:9000/${decodedPath}`);
  }

  // 2) Tam (absolute) URL ise dokunma (sadece güvenli encode)
  if (/^https?:\/\//i.test(s)) {
    return encodeURI(s);
  }

  // 3) "bucket/key" değil de yalnızca "key" ise (ör: photos/..)
  //    S3_BASE zaten "http://host:9000/<bucket>" içeriyor → sadece key ekle
  if (!s.startsWith("/")) {
    const safeKey = s.split("/").map(encodeURIComponent).join("/");
    return `${S3_BASE.replace(/\/+$/, "")}/${safeKey}`;
  }

  // 4) "/<bucket>/key" veya "/key" gibi başlayabilir
  //    S3_BASE'e ekle (S3_BASE bucket'ı içerdiği için /key durumu daha doğru)
  const trimmed = s.replace(/^\/+/, "");
  const safeTail = trimmed.split("/").map(encodeURIComponent).join("/");
  return `${S3_BASE.replace(/\/+$/, "")}/${safeTail}`;
}

const HeroSection = () => {
  const [heroImages, setHeroImages] = useState([]);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchHeroImages = async () => {
      try {
        const { data } = await api.get("/images/");
        const filtered = (data || []).filter(
          (img) => img?.kategori?.name === "Orta Resim"
        );
        const formatted = filtered.map((img) => ({
          ...img,
          // image alanı ne gelirse gelsin normalize et
          fullImageUrl: normalizeImageUrl(
            img.image || img.url || img.path || img.fullImageUrl
          ),
        }));
        setHeroImages(formatted);
      } catch (err) {
        console.error("Error fetching hero images:", err);
      } finally {
        setImageLoading(false);
      }
    };
    fetchHeroImages();
  }, []);

  useEffect(() => {
    if (heroImages.length > 1) {
      const t = setInterval(() => {
        setCurrentImageIndex((prev) =>
          prev === heroImages.length - 1 ? 0 : prev + 1
        );
      }, 4000);
      return () => clearInterval(t);
    }
  }, [heroImages.length]);

  const goToPrevious = () =>
    setCurrentImageIndex(
      currentImageIndex === 0 ? heroImages.length - 1 : currentImageIndex - 1
    );
  const goToNext = () =>
    setCurrentImageIndex(
      currentImageIndex === heroImages.length - 1
        ? 0
        : currentImageIndex + 1
    );
  const goToSlide = (index) => setCurrentImageIndex(index);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-red-200 rounded-full opacity-20 animate-bounce" />
        <div className="absolute top-40 right-20 w-16 h-16 bg-red-300 rounded-full opacity-30 animate-pulse" />
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-red-100 rounded-full opacity-25 animate-bounce delay-300" />
        <div className="absolute bottom-40 right-10 w-12 h-12 bg-red-400 rounded-full opacity-20 animate-pulse delay-500" />
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-12 gap-4 h-full">
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} className="border border-red-300" />
            ))}
          </div>
        </div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-red-400/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-red-300/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div className="text-center lg:text-left">
            <div className="mb-6">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800 mb-4">
                <FiStar className="w-4 h-4 mr-2" />
                #1 Eğitim Kurumu
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Geleceğin
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">
                Liderleri
              </span>
              Burada Yetişir
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Modern eğitim yöntemleri ve deneyimli öğretmen kadromuzla,
              öğrencilerimizi başarıya taşıyoruz. Kaliteli eğitim, güvenilir
              gelecek.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <button className="group flex items-center justify-center px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl text-white font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl">
                <FiPlay className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                Hemen Kayıt Ol
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">300+</div>
                <div className="text-sm text-gray-600">Başarılı Öğrenci</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">85%</div>
                <div className="text-sm text-gray-600">Yerleştirme Oranı</div>
              </div>
            </div>
          </div>

          {/* Right - Carousel */}
          <div className="relative">
            <div className="relative">
              {heroImages.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="absolute -left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              <div className="bg-red-50 rounded-3xl shadow-lg transform rotate-2 hover:rotate-0 transition-transform duration-500 overflow-hidden">
                {imageLoading ? (
                  <div className="flex items-center justify-center h-96 bg-gray-100 rounded-2xl">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4" />
                      <p className="text-gray-600">Resimler yükleniyor...</p>
                    </div>
                  </div>
                ) : heroImages.length > 0 ? (
                  <div className="relative group">
                    <div className="relative overflow-hidden rounded-2xl">
                      <img
                        src={heroImages[currentImageIndex].fullImageUrl}
                        alt={
                          heroImages[currentImageIndex].title || "Hero Image"
                        }
                        className="w-full h-96 object-cover transition-transform duration-500 hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            "https://placehold.co/600x400/f3f4f6/6b7280?text=Resim+Bulunamadı";
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-2xl">
                        {heroImages[currentImageIndex].title && (
                          <h3 className="text-white font-semibold text-lg mb-1">
                            {heroImages[currentImageIndex].title}
                          </h3>
                        )}
                        {heroImages[currentImageIndex].description && (
                          <p className="text-white/90 text-sm">
                            {heroImages[currentImageIndex].description}
                          </p>
                        )}
                      </div>

                      {heroImages.length > 1 && (
                        <>
                          <button
                            onClick={goToPrevious}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 hover:scale-110 opacity-0 group-hover:opacity-100"
                          >
                            <FiChevronLeft className="w-6 h-6 text-white" />
                          </button>
                          <button
                            onClick={goToNext}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 hover:scale-110 opacity-0 group-hover:opacity-100"
                          >
                            <FiChevronRight className="w-6 h-6 text-white" />
                          </button>
                        </>
                      )}
                    </div>

                    {heroImages.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {heroImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              index === currentImageIndex
                                ? "bg-white"
                                : "bg-white/50 hover:bg-white/75"
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {heroImages.length > 1 && (
                      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                        {currentImageIndex + 1} / {heroImages.length}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl">
                    <div className="text-center">
                      <FiBookOpen className="w-16 h-16 text-red-400 mx-auto mb-4" />
                      <h3 className="text-red-600 font-semibold text-lg mb-2">
                        Eğitim Materyalleri
                      </h3>
                      <p className="text-red-500">Yakında eklenecek</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12 hover:rotate-6 transition-transform duration-500">
                <FiTrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-12 hover:-rotate-6 transition-transform duration-500">
                <BsLightbulb className="w-6 h-6 text-white" />
              </div>
              <div className="absolute top-1/3 -right-3 w-8 h-16 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full opacity-80 shadow-lg transform rotate-12" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
