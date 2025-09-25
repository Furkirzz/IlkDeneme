import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap CSS'i import edin
import Header from './Header'; // Mevcut Header bileşeniniz
import ImageCarousel from './ImageCarousel'; // Kaydırılabilir resimler bileşeniniz
import Footer from './Footer'; // Footer bileşeniniz
import HeroSection from "./Ana Sayfa/HeroSection"
import FeaturesSection from './Ana Sayfa/FeaturesSection';
import CTASection from './Ana Sayfa/CtaSection';

function AnaSayfa() {
    const location = useLocation();

    // /#iletisim ile gelindiyse sayfayı CTA'ya kaydır
    useEffect(() => {
        if (location.hash === "#iletisim") {
            // DOM yerleşsin diye 0 ms bekletiyoruz
            setTimeout(() => {
                document
                    .getElementById("iletisim")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 0);
        }
    }, [location.hash]);

    return (
        <div className="flex flex-col min-h-screen">
            {/* Üst kahraman alanı */}
            <HeroSection />

            {/* Ana içerik */}
            <main className="flex-grow">
                {/* Özellikler / Neden biz */}
                <section className="container mx-auto px-4 py-12">
                    <FeaturesSection />
                </section>

                {/* CTA – hedef id burada */}
                <section id="iletisim" className="mt-8">
                    <CTASection />
                </section>
            </main>
        </div>
    );
}

export default AnaSayfa;
