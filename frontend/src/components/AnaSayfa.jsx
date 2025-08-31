import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap CSS'i import edin
import Header from './Header'; // Mevcut Header bileşeniniz
import ImageCarousel from './ImageCarousel'; // Kaydırılabilir resimler bileşeniniz
import Footer from './Footer'; // Footer bileşeniniz
import HeroSection from "./Ana Sayfa/HeroSection"
import FeaturesSection from './Ana Sayfa/FeaturesSection';
import CTASection from './Ana Sayfa/CtaSection';



// Ana sayfa bileşeni
function AnaSayfa() {
    return (
        // Ana kapsayıcı: dikey hizalama, minimum ekran yüksekliği ve font ayarı
        <div className="flex flex-col min-h-screen ">
            {/* Header bileşeni */}

            <HeroSection />

            {/* Ana içerik alanı: esnek büyüme, merkezlenmiş kapsayıcı, padding */}
            <main className="flex-grow container mx-auto px-4 py-8">


                <FeaturesSection />
                <CTASection />


                {/* ImageCarousel bileşeni */}


                {/* Hakkımızda Bölümü */}


                {/* Hizmetlerimiz Bölümü */}
                {/* <section className="mt-12 px-4">
                    <h3 className="text-2xl sm:text-3xl font-semibold text-gray-700 mb-8 text-center">
                        Eğitim Hizmetlerimiz
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-all duration-300 hover:transform hover:-translate-y-1">
                            <div className="text-red-600 text-4xl mb-4">📚</div>
                            <h4 className="text-lg sm:text-xl font-semibold mb-3">Ders Programları</h4>
                            <p className="text-gray-600 text-sm sm:text-base">Kişiselleştirilmiş ders programları ile hedeflerinize odaklanın.</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-all duration-300 hover:transform hover:-translate-y-1">
                            <div className="text-red-600 text-4xl mb-4">📊</div>
                            <h4 className="text-lg sm:text-xl font-semibold mb-3">Deneme Sınavları</h4>
                            <p className="text-gray-600 text-sm sm:text-base">Düzenli deneme sınavları ile kendinizi test edin ve gelişiminizi takip edin.</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-all duration-300 hover:transform hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
                            <div className="text-red-600 text-4xl mb-4">🎯</div>
                            <h4 className="text-lg sm:text-xl font-semibold mb-3">Bireysel Takip</h4>
                            <p className="text-gray-600 text-sm sm:text-base">Her öğrencimizin bireysel gelişimini yakından takip ediyoruz.</p>
                        </div>
                    </div>
                </section> */}

                {/* İletişim Çağrısı */}

            </main>

            {/* Footer bileşeni */}

        </div>
    );
}

export default AnaSayfa;
