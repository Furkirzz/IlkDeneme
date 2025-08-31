import React, { useEffect, useState } from 'react';
import { FiPhone, FiMail, FiHome, FiBookOpen } from 'react-icons/fi';
import { FaInstagram, FaYoutube, FaFacebook, FaTiktok } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import axios from 'axios';

const Footer = () => {
    const [contactInfo, setContactInfo] = useState({
        city: {},
        district: {},
        address: {},
        phone: {}
    });

    // Backend'den iletişim bilgilerini çek
    useEffect(() => {
        axios.get('http://127.0.0.1:8001/api/contact-info/')
            .then(response => {
                setContactInfo(response.data);
            })
            .catch(error => {
                console.error('İletişim bilgileri alınamadı:', error);
            });
    }, []);

    return (
        <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid md:grid-cols-4 gap-8">
                    {/* Logo and Description */}
                    <div className="col-span-2">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                                <FiBookOpen className="text-white text-lg" />
                            </div>
                            <span className="text-2xl font-bold">Akademi Eğitim Merkezi</span>
                        </div>
                        <p className="text-gray-300 mb-6 leading-relaxed">
                            Gençliğe yol göstermek için eğitim, teknoloji ve değerler alanında buradayız.
                            Kaliteli eğitim anlayışımızla geleceğin liderlerini yetiştiriyoruz.
                        </p>

                        {/* Social Media Links */}
                        <div className="flex space-x-4">
                            <a
                                href="https://www.instagram.com/akademi.egitim.merkezi/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gradient-to-r hover:from-pink-500 hover:to-red-500 transition-all duration-300 transform hover:scale-110"
                            >
                                <FaInstagram className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-red-600 transition-all duration-300 transform hover:scale-110"
                            >
                                <FaYoutube className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-all duration-300 transform hover:scale-110"
                            >
                                <FaFacebook className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-all duration-300 transform hover:scale-110"
                            >
                                <FaXTwitter className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-black transition-all duration-300 transform hover:scale-110"
                            >
                                <FaTiktok className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6 text-white">Hızlı Linkler</h3>
                        <ul className="space-y-3">
                            <li>
                                <a
                                    href="/"
                                    className="text-gray-300 hover:text-red-400 transition-colors duration-200 flex items-center group"
                                >
                                    <span className="w-0 h-0.5 bg-red-400 rounded-full transition-all duration-300 group-hover:w-4 mr-0 group-hover:mr-2"></span>
                                    Ana Sayfa
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/hakkimizda"
                                    className="text-gray-300 hover:text-red-400 transition-colors duration-200 flex items-center group"
                                >
                                    <span className="w-0 h-0.5 bg-red-400 rounded-full transition-all duration-300 group-hover:w-4 mr-0 group-hover:mr-2"></span>
                                    Hakkımızda
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/kurslar"
                                    className="text-gray-300 hover:text-red-400 transition-colors duration-200 flex items-center group"
                                >
                                    <span className="w-0 h-0.5 bg-red-400 rounded-full transition-all duration-300 group-hover:w-4 mr-0 group-hover:mr-2"></span>
                                    Kurslarımız
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/basarilarimiz"
                                    className="text-gray-300 hover:text-red-400 transition-colors duration-200 flex items-center group"
                                >
                                    <span className="w-0 h-0.5 bg-red-400 rounded-full transition-all duration-300 group-hover:w-4 mr-0 group-hover:mr-2"></span>
                                    Başarılarımız
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/iletisim"
                                    className="text-gray-300 hover:text-red-400 transition-colors duration-200 flex items-center group"
                                >
                                    <span className="w-0 h-0.5 bg-red-400 rounded-full transition-all duration-300 group-hover:w-4 mr-0 group-hover:mr-2"></span>
                                    İletişim
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/takvim"
                                    className="text-gray-300 hover:text-red-400 transition-colors duration-200 flex items-center group"
                                >
                                    <span className="w-0 h-0.5 bg-red-400 rounded-full transition-all duration-300 group-hover:w-4 mr-0 group-hover:mr-2"></span>
                                    Takvim
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info - Backend'den gelen veriler */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6 text-white">İletişim</h3>
                        <div className="space-y-4">
                            {/* Backend'den gelen telefon bilgisi */}
                            {contactInfo.phone?.name && (
                                <div className="flex items-center space-x-3 group">
                                    <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-red-600 transition-colors duration-300">
                                        <FiPhone className="w-5 h-5 text-red-400 group-hover:text-white" />
                                    </div>
                                    <div>
                                        <p className="text-gray-300 group-hover:text-white transition-colors">
                                            {contactInfo.phone.name}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Email - sabit */}
                            <div className="flex items-center space-x-3 group">
                                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-red-600 transition-colors duration-300">
                                    <FiMail className="w-5 h-5 text-red-400 group-hover:text-white" />
                                </div>
                                <div>
                                    <p className="text-gray-300 group-hover:text-white transition-colors">
                                        info@akademiegitim.com
                                    </p>
                                </div>
                            </div>

                            {/* Backend'den gelen adres bilgisi */}
                            {(contactInfo.address?.name || contactInfo.district?.name || contactInfo.city?.name) && (
                                <div className="flex items-start space-x-3 group">
                                    <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-red-600 transition-colors duration-300 mt-1">
                                        <FiHome className="w-5 h-5 text-red-400 group-hover:text-white" />
                                    </div>
                                    <div>
                                        <p className="text-gray-300 group-hover:text-white transition-colors leading-relaxed">
                                            {contactInfo.address?.name && `${contactInfo.address.name}`}
                                            {contactInfo.address?.name && (contactInfo.district?.name || contactInfo.city?.name) && <br />}
                                            {contactInfo.district?.name && `${contactInfo.district.name}`}
                                            {contactInfo.district?.name && contactInfo.city?.name && ' / '}
                                            {contactInfo.city?.name && `${contactInfo.city.name}`}
                                        </p>
                                    </div>
                                </div>
                            )}
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