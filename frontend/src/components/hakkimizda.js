import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Hakkimizda = () => {
    const [aboutImage, setAboutImage] = useState(null);
    const [aboutText, setAboutText] = useState(null);
    const [imageLoading, setImageLoading] = useState(true);
    const [textLoading, setTextLoading] = useState(true);

    useEffect(() => {
        // Google Font ekle
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        fetchAboutImage();
        fetchAboutText();

        // Cleanup
        return () => {
            document.head.removeChild(link);
        };
    }, []);

    // Hakkımızda resmini çek
    const fetchAboutImage = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:8001/api/images/');
            console.log('API Response for About Images:', response.data);

            // 'Hakkımızda' kategorisindeki resimleri filtrele
            const filteredImages = response.data.filter(
                (image) => image.kategori && image.kategori.name === 'Hakkımızda'
            );

            if (filteredImages.length > 0) {
                // İlk resmi al (veya istersen order'a göre sırala)
                const selectedImage = filteredImages[0];
                setAboutImage({
                    ...selectedImage,
                    fullImageUrl: 'http://127.0.0.1:8001' + selectedImage.image
                });
            }

            setImageLoading(false);
        } catch (err) {
            console.error('Error fetching about image:', err);
            setImageLoading(false);
        }
    };

    // Hakkımızda textini çek
    const fetchAboutText = async () => {
        try {
            // Önce /api/texts/ dene
            let response;
            try {
                response = await axios.get('http://127.0.0.1:8001/api/texts/');
            } catch (textError) {
                // Eğer /api/texts/ yoksa /api/content/ dene
                response = await axios.get('http://127.0.0.1:8001/api/content/');
            }

            console.log('API Response for About Texts:', response.data);
            console.log('First text object structure:', response.data[0]);

            // 'Hakkımızda' kategorisindeki textleri filtrele - farklı yapıları dene
            const filteredTexts = response.data.filter((text) => {
                console.log('Checking text:', text);

                // Farklı kategori yapılarını kontrol et
                const categoryName = text.kategori?.name || text.category?.name || text.kategori?.title || text.category?.title;
                console.log('Category name found:', categoryName);

                return categoryName === 'Hakkımızda';
            });

            if (filteredTexts.length > 0) {
                // İlk texti al
                const selectedText = filteredTexts[0];
                console.log('Selected text object:', selectedText);
                console.log('Text content:', selectedText.content || selectedText.text || selectedText.description);
                console.log('Text title:', selectedText.title || selectedText.name);

                setAboutText(selectedText);
            } else {
                console.log('No texts found with Hakkımızda category');
            }

            setTextLoading(false);
        } catch (err) {
            console.error('Error fetching about text:', err);
            setTextLoading(false);
        }
    };

    return (
        <section className="py-3 py-md-5" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            <div className="container">
                <div className="row gy-3 gy-md-4 gy-lg-0 align-items-lg-center">

                    {/* Sol Taraf - Resim */}
                    <div className="col-12 col-lg-6 col-xl-5">
                        {imageLoading ? (
                            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Resim yükleniyor...</span>
                                </div>
                            </div>
                        ) : aboutImage ? (
                            <img
                                className="img-fluid rounded shadow-lg"
                                loading="lazy"
                                src={aboutImage.fullImageUrl}
                                alt={aboutImage.title || aboutImage.name || "Hakkımızda"}
                                style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'cover' }}
                            />
                        ) : (
                            <div className="bg-light rounded d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                                <div className="text-center text-muted">
                                    <i className="bi bi-image fs-1 mb-3"></i>
                                    <p className="mb-0">Henüz resim eklenmemiş</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sağ Taraf - Text */}
                    <div className="col-12 col-lg-6 col-xl-7">
                        <div className="row justify-content-xl-center">
                            <div className="col-12 col-xl-11">

                                {textLoading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary mb-3" role="status">
                                            <span className="visually-hidden">İçerik yükleniyor...</span>
                                        </div>
                                        <p className="text-muted">İçerik yükleniyor...</p>
                                    </div>
                                ) : aboutText ? (
                                    <>
                                        <h2 className="mb-4" style={{
                                            fontFamily: 'Inter, sans-serif',
                                            fontWeight: '700',
                                            fontSize: '2.5rem',
                                            color: '#1a202c',
                                            lineHeight: '1.2'
                                        }}>
                                            {aboutText.title || aboutText.name || "Hakkımızda"}
                                        </h2>

                                        <div className="about-content">
                                            {/* Backend'de field ismi 'icerik' */}
                                            {(() => {
                                                const textContent = aboutText.icerik || aboutText.content || aboutText.text || aboutText.description || aboutText.body;
                                                console.log('Final text content to display:', textContent);

                                                if (textContent) {
                                                    return textContent.split('\n').map((paragraph, index) => {
                                                        if (!paragraph.trim()) return null;

                                                        return (
                                                            <p key={index} style={{
                                                                fontFamily: 'Inter, sans-serif',
                                                                fontSize: '1.1rem',
                                                                fontWeight: '400',
                                                                lineHeight: '1.7',
                                                                color: '#4a5568',
                                                                marginBottom: '1.5rem',
                                                                textAlign: 'justify'
                                                            }}>
                                                                {paragraph.trim()}
                                                            </p>
                                                        );
                                                    });
                                                } else {
                                                    return <p className="text-muted">İçerik field'ı bulunamadı. Console'u kontrol edin.</p>;
                                                }
                                            })()}
                                        </div>

                                        {/* Özellik Kartları */}
                                        <div className="row gy-4 gy-md-0 gx-xxl-5 mt-5">
                                            <div className="col-12 col-md-6">
                                                <div className="d-flex">
                                                    <div className="me-4 text-primary">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-gear-fill" viewBox="0 0 16 16">
                                                            <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h4 style={{
                                                            fontFamily: 'Inter, sans-serif',
                                                            fontWeight: '600',
                                                            fontSize: '1.25rem',
                                                            color: '#2d3748',
                                                            marginBottom: '0.75rem'
                                                        }}>
                                                            Yenilikçi Yaklaşım
                                                        </h4>
                                                        <p style={{
                                                            fontFamily: 'Inter, sans-serif',
                                                            fontSize: '1rem',
                                                            fontWeight: '400',
                                                            lineHeight: '1.6',
                                                            color: '#718096',
                                                            marginBottom: '0'
                                                        }}>
                                                            Modern teknolojiler ve yaratıcı çözümlerle projelerinizi hayata geçiriyoruz.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <div className="d-flex">
                                                    <div className="me-4 text-primary">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-fire" viewBox="0 0 16 16">
                                                            <path d="M8 16c3.314 0 6-2 6-5.5 0-1.5-.5-4-2.5-6 .25 1.5-1.25 2-1.25 2C11 4 9 .5 6 0c.357 2 .5 4-2 6-1.25 1-2 2.729-2 4.5C2 14 4.686 16 8 16Zm0-1c-1.657 0-3-1-3-2.75 0-.75.25-2 1.25-3C6.125 10 7 10.5 7 10.5c-.375-1.25.5-3.25 2-3.5-.179 1-.25 2 1 3 .625.5 1 1.364 1 2.25C11 14 9.657 15 8 15Z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h4 style={{
                                                            fontFamily: 'Inter, sans-serif',
                                                            fontWeight: '600',
                                                            fontSize: '1.25rem',
                                                            color: '#2d3748',
                                                            marginBottom: '0.75rem'
                                                        }}>
                                                            Tutkulu Ekip
                                                        </h4>
                                                        <p style={{
                                                            fontFamily: 'Inter, sans-serif',
                                                            fontSize: '1rem',
                                                            fontWeight: '400',
                                                            lineHeight: '1.6',
                                                            color: '#718096',
                                                            marginBottom: '0'
                                                        }}>
                                                            Deneyimli ve tutkulu ekibimizle en iyi sonuçları elde etmek için çalışıyoruz.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-5">
                                        <h2 className="mb-3">Hakkımızda</h2>
                                        <div className="alert alert-info">
                                            <i className="bi bi-info-circle me-2"></i>
                                            Henüz içerik eklenmemiş.
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hakkimizda;