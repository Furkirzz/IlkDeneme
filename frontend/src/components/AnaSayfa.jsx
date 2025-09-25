// src/components/AnaSayfa.jsx
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Bu sayfa API çağrısı yapmıyor; authSlice ile çakışan bir şey yok.
// Header/Footer genellikle MainLayout içinde olduğundan burada import etmiyoruz.
import HeroSection from "./HeroSection";
import FeaturesSection from "./AnaSayfa/FeaturesSection";
import CTASection from "./AnaSayfa/CtaSection";

function AnaSayfa() {
  const location = useLocation();

  // /#iletisim ile gelindiyse, CTA bölümüne kaydır
  useEffect(() => {
    if (location.hash === "#iletisim") {
      // DOM yerleşimini bekletmek için kısa gecikme
      const t = setTimeout(() => {
        document
          .getElementById("iletisim")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
      return () => clearTimeout(t);
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
