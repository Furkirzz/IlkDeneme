import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {

    FiBookOpen,
    FiPlay, FiStar, FiTrendingUp,
    FiChevronLeft, FiChevronRight
} from 'react-icons/fi';

import {
    BsCalendar as
        BsLightbulb
} from 'react-icons/bs';

// import ElectricBorder from '../ExtraComponents/ElectricBorder';
import AnimatedContent from '../ExtraComponents/AnimatedContent';

const HeroSection = () => {
    // State to hold hero images
    const [heroImages, setHeroImages] = useState([]);
    const [imageLoading, setImageLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const fetchHeroImages = async () => {
            try {
                // API'den resimleri çek
                const response = await axios.get('http://127.0.0.1:8001/api/images/');
                console.log('API Response for Hero Images:', response.data);

                // 'Orta Resim' kategorisindeki resimleri filtrele
                const filteredImages = response.data.filter(
                    (image) => image.kategori && image.kategori.name === 'Orta Resim'
                );

                if (filteredImages.length > 0) {
                    const formattedImages = filteredImages.map((img) => ({
                        ...img,
                        fullImageUrl: img.image
                    }));
                    setHeroImages(formattedImages);
                }

                setImageLoading(false);
            } catch (err) {
                console.error('Error fetching hero images:', err);
                setImageLoading(false);
            }
        };

        fetchHeroImages();
    }, []);

    // Auto slide functionality
    useEffect(() => {
        if (heroImages.length > 1) {
            const interval = setInterval(() => {
                setCurrentImageIndex((prevIndex) =>
                    prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
                );
            }, 4000); // 4 saniyede bir değiş

            return () => clearInterval(interval);
        }
    }, [heroImages.length]);

    const goToPrevious = () => {
        setCurrentImageIndex(
            currentImageIndex === 0 ? heroImages.length - 1 : currentImageIndex - 1
        );
    };

    const goToNext = () => {
        setCurrentImageIndex(
            currentImageIndex === heroImages.length - 1 ? 0 : currentImageIndex + 1
        );
    };

    const goToSlide = (index) => {
        setCurrentImageIndex(index);
    };
    //bg-gradient-to-br from-red-50 via-white to-red-50
    return (
        <AnimatedContent
            distance={150}
            direction="vertical"
            reverse={true}
            duration={1.2}
            ease="power3.out"
            initialOpacity={0.2}
            animateOpacity
            scale={1.1}
            threshold={0.2}
            delay={0.3}
        >
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden ">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    {/* Floating Shapes */}
                    <div className="absolute top-10 left-10 w-20 h-20 bg-red-200 rounded-full opacity-20 animate-bounce"></div>
                    <div className="absolute top-40 right-20 w-16 h-16 bg-red-300 rounded-full opacity-30 animate-pulse"></div>
                    <div className="absolute bottom-20 left-20 w-24 h-24 bg-red-100 rounded-full opacity-25 animate-bounce delay-300"></div>
                    <div className="absolute bottom-40 right-10 w-12 h-12 bg-red-400 rounded-full opacity-20 animate-pulse delay-500"></div>

                    {/* Grid Pattern */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="grid grid-cols-12 gap-4 h-full">
                            {Array.from({ length: 144 }).map((_, i) => (
                                <div key={i} className="border border-red-300"></div>
                            ))}
                        </div>
                    </div>

                    {/* Gradient Overlays */}
                    <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-red-400/10 to-transparent rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-red-300/10 to-transparent rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
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
                                Modern eğitim yöntemleri ve deneyimli öğretmen kadromuzla, öğrencilerimizi
                                başarıya taşıyoruz. Kaliteli eğitim, güvenilir gelecek.
                            </p>
                            {/* <ElectricBorder
                                color="#7df9ff"
                                speed={1}
                                chaos={0.5}
                                thickness={2}
                                style={{ borderRadius: 16 }}
                            > */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">

                                <button className="group flex items-center justify-center px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl text-white font-semibold text-lg transition-all duration-300  shadow-lg hover:shadow-xl">
                                    <FiPlay className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                                    Hemen Kayıt Ol
                                </button>
                                {/* <button className="flex items-center justify-center px-8 py-4 bg-white hover:bg-gray-50 border-2 border-red-200 hover:border-red-300 rounded-xl text-red-600 font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl">
                                <FiBookOpen className="w-5 h-5 mr-2" />
                                Kursları İncele
                            </button> */}
                            </div>
                            {/* </ElectricBorder> */}



                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-6 pt-8 border-t border-gray-200">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600">300+</div>
                                    <div className="text-sm text-gray-600">Başarılı Öğrenci</div>
                                </div>
                                {/* <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">15+</div>
                                <div className="text-sm text-gray-600">Yıllık Deneyim</div>
                            </div> */}
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600">85%</div>
                                    <div className="text-sm text-gray-600">Yerleştirme Oranı</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Content - Carousel Image Card (Büyütülmüş) */}
                        <div className="relative">
                            <div className="relative">
                                {/* Sola ve Sağa Geç Butonları */}
                                {heroImages.length > 1 && (
                                    <>
                                        {/* Sola Geç Butonu */}
                                        <button
                                            onClick={goToPrevious}
                                            className="absolute -left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
                                        >
                                            <FiChevronLeft className="w-4 h-4" />
                                        </button>

                                        {/* Sağa Geç Butonu */}
                                        <button
                                            onClick={goToNext}
                                            className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
                                        >
                                            <FiChevronRight className="w-4 h-4" />
                                        </button>
                                    </>
                                )}

                                {/* Main Image Card - Orijinal boyut */}
                                <div className="bg-red-50 rounded-3xl shadow-lg transform rotate-2 hover:rotate-0 transition-transform duration-500 overflow-hidden">
                                    {imageLoading ? (
                                        // Loading State - Orijinal boyut
                                        <div className="flex items-center justify-center h-96 bg-gray-100 rounded-2xl">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                                                <p className="text-gray-600">Resimler yükleniyor...</p>
                                            </div>
                                        </div>
                                    ) : heroImages.length > 0 ? (
                                        // Image Carousel
                                        <div className="relative group">
                                            {/* Current Image - Büyütülmüş */}
                                            <div className="relative overflow-hidden rounded-2xl">
                                                <img
                                                    src={heroImages[currentImageIndex].fullImageUrl}
                                                    alt={heroImages[currentImageIndex].title || 'Hero Image'}
                                                    className="w-full h-96 object-cover transition-transform duration-500 hover:scale-105"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = `https://placehold.co/600x400/f3f4f6/6b7280?text=Resim+Bulunamadı`;
                                                    }}
                                                />

                                                {/* Image Overlay with Info */}
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

                                                {/* Navigation Arrows - Sadece birden fazla resim varsa */}
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

                                            {/* Image Indicators - Sadece birden fazla resim varsa */}
                                            {heroImages.length > 1 && (
                                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                                                    {heroImages.map((_, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => goToSlide(index)}
                                                            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentImageIndex
                                                                ? 'bg-white'
                                                                : 'bg-white/50 hover:bg-white/75'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            {/* Image Counter - Sağ üst köşede */}
                                            {heroImages.length > 1 && (
                                                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                                                    {currentImageIndex + 1} / {heroImages.length}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // Fallback when no image - Orijinal boyut

                                        <div className="flex items-center justify-center h-96 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl">
                                            <div className="text-center">
                                                <FiBookOpen className="w-16 h-16 text-red-400 mx-auto mb-4" />
                                                <h3 className="text-red-600 font-semibold text-lg mb-2">Eğitim Materyalleri</h3>
                                                <p className="text-red-500">Yakında eklenecek</p>
                                            </div>
                                        </div>

                                    )}
                                </div>


                                {/* Floating Elements - Orijinal konumlar */}
                                <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12 hover:rotate-6 transition-transform duration-500">
                                    <FiTrendingUp className="w-8 h-8 text-white" />
                                </div>

                                <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-12 hover:-rotate-6 transition-transform duration-500">
                                    <BsLightbulb className="w-6 h-6 text-white" />
                                </div>

                                {/* Ek dekoratif element */}
                                <div className="absolute top-1/3 -right-3 w-8 h-16 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full opacity-80 shadow-lg transform rotate-12"></div>
                            </div>
                        </div>
                    </div>

                </div>

            </section >
        </AnimatedContent>
    );
};

export default HeroSection;