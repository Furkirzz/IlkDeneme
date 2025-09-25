// src/components/Footer.jsx
import React, { useEffect, useState } from "react";
import { FiPhone, FiMail, FiHome, FiBookOpen } from "react-icons/fi";
import { FaInstagram, FaYoutube, FaFacebook, FaTiktok } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import axios from "axios";

const API_BASE = "http://46.31.79.7:9000"; // gerekirse .env'den okuyun

const Footer = () => {
  const [contactInfo, setContactInfo] = useState({
    city: null,
    district: null,
    address: null,
    phone: null,
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    axios
      .get(`${API_BASE}/api/contact-info/`, { signal: controller.signal })
      .then((res) => setContactInfo(res.data || {}))
      .catch((error) => {
        if (!axios.isCancel(error)) {
          console.error("İletişim bilgileri alınamadı:", error);
          setErr("İletişim bilgileri alınamadı.");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const phoneName = contactInfo?.phone?.name || "";
  const cityName = contactInfo?.city?.name || "";
  const districtName = contactInfo?.district?.name || "";
  const addressName = contactInfo?.address?.name || "";

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <FiBookOpen className="text-white text-lg" />
              </div>
              <span className="text-2xl font-bold">Akademi Eğitim Merkezi</span>
            </div>

            <p className="text-gray-300 mb-6 leading-relaxed">
              Gençliğe yol göstermek için eğitim, teknoloji ve değerler
              alanında buradayız. Kaliteli eğitim anlayışımızla geleceğin
              liderlerini yetiştiriyoruz.
            </p>

            {/* Socials */}
            <div className="flex space-x-4">
              <a
                href="https://www.instagram.com/akademi.egitim.merkezi/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gradient-to-r hover:from-pink-500 hover:to-red-500 transition-all duration-300 transform hover:scale-110"
                aria-label="Instagram"
              >
                <FaInstagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.youtube.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-red-600 transition-all duration-300 transform hover:scale-110"
                aria-label="YouTube"
              >
                <FaYoutube className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-all duration-300 transform hover:scale-110"
                aria-label="Facebook"
              >
                <FaFacebook className="w-5 h-5" />
              </a>
              <a
                href="https://x.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-all duration-300 transform hover:scale-110"
                aria-label="X (Twitter)"
              >
                <FaXTwitter className="w-5 h-5" />
              </a>
              <a
                href="https://www.tiktok.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-black transition-all duration-300 transform hover:scale-110"
                aria-label="TikTok"
              >
                <FaTiktok className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Hızlı Linkler</h3>
            <ul className="space-y-3">
              {[
                { href: "/", label: "Ana Sayfa" },
                { href: "/hakkimizda", label: "Hakkımızda" },
                { href: "/kurslar", label: "Kurslarımız" },
                { href: "/basarilarimiz", label: "Başarılarımız" },
                { href: "/iletisim", label: "İletişim" },
                { href: "/takvim", label: "Takvim" },
              ].map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-gray-300 hover:text-red-400 transition-colors duration-200 flex items-center group"
                  >
                    <span className="w-0 h-0.5 bg-red-400 rounded-full transition-all duration-300 group-hover:w-4 mr-0 group-hover:mr-2" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">İletişim</h3>
            <div className="space-y-4">
              {/* Telefon (backend) */}
              {loading ? (
                <div className="h-10 bg-gray-800/40 rounded animate-pulse" />
              ) : phoneName ? (
                <div className="flex items-center space-x-3 group">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-red-600 transition-colors duration-300">
                    <FiPhone className="w-5 h-5 text-red-400 group-hover:text-white" />
                  </div>
                  <a
                    href={`tel:${phoneName.replace(/\s+/g, "")}`}
                    className="text-gray-300 group-hover:text-white transition-colors"
                  >
                    {phoneName}
                  </a>
                </div>
              ) : null}

              {/* Email */}
              <div className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-red-600 transition-colors duration-300">
                  <FiMail className="w-5 h-5 text-red-400 group-hover:text-white" />
                </div>
                <a
                  href="mailto:info@akademiegitim.com"
                  className="text-gray-300 group-hover:text-white transition-colors"
                >
                  info@akademiegitim.com
                </a>
              </div>

              {/* Adres (backend) */}
              {(addressName || districtName || cityName) && (
                <div className="flex items-start space-x-3 group">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-red-600 transition-colors duration-300 mt-1">
                    <FiHome className="w-5 h-5 text-red-400 group-hover:text-white" />
                  </div>
                  <p className="text-gray-300 group-hover:text-white transition-colors leading-relaxed">
                    {addressName}
                    {addressName && (districtName || cityName) ? <br /> : null}
                    {districtName}
                    {districtName && cityName ? " / " : null}
                    {cityName}
                  </p>
                </div>
              )}

              {err ? <p className="text-sm text-red-400">{err}</p> : null}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            © 2025 Akademi Eğitim Merkezi. Tüm hakları saklıdır.
          </p>
          <div className="flex space-x-6">
            <a
              href="/gizlilik"
              className="text-gray-400 hover:text-red-400 text-sm transition-colors duration-200"
            >
              Gizlilik Politikası
            </a>
            <a
              href="/kullanim-kosullari"
              className="text-gray-400 hover:text-red-400 text-sm transition-colors duration-200"
            >
              Kullanım Koşulları
            </a>
            <a
              href="/kvkk"
              className="text-gray-400 hover:text-red-400 text-sm transition-colors duration-200"
            >
              KVKK
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
