import {
    FiPhone,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

import React from 'react';

const CTASection = () => {
    return (
        <section className="py-20 bg-gradient-to-r from-red-500 to-red-600 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-48 -translate-y-48"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl translate-x-40 translate-y-40"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-4xl font-bold text-white mb-6">
                    Başarı Yolculuğuna
                    <span className="block">Hemen Başlayın!</span>
                </h2>
                <p className="text-xl text-red-100 mb-8 leading-relaxed">
                    Hedeflerinize ulaşmak için gereken tüm desteği almanın tam zamanı.
                    Uzman öğretmenlerimizle tanışın ve başarı hikayenizi yazın.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button className="group flex items-center justify-center px-8 py-4 bg-white hover:bg-gray-50 rounded-xl text-red-600 font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                        <FiPhone className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                        Hemen Ara
                    </button>
                    <a
                        href="https://wa.me/+905331339548?text=I%27m%20interested%20in%20your%20car%20for%20sale"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center px-8 py-4 bg-green-600 hover:bg-green-800 border-2 border-red-400 rounded-xl text-white font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        <FaWhatsapp className="w-5 h-5 mr-2" />
                        WhatsApp'dan Ulaş
                    </a>
                </div>
            </div>
        </section>
    );
};

export default CTASection;