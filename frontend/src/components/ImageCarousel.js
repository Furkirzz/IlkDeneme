import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Carousel from 'react-bootstrap/Carousel';

// ImageCarousel component fetches images from the backend and displays them using Bootstrap Carousel.
const ImageCarousel = () => {
    // State to hold image data
    const [images, setImages] = useState([]);
    // State to track loading status
    const [loading, setLoading] = useState(true);
    // State to track error status
    const [error, setError] = useState(null);
    // State to track which images have loaded
    const [loadedImages, setLoadedImages] = useState(new Set());

    useEffect(() => {
        // Effect to run when the component mounts or updates
        const fetchImages = async () => {
            try {
                // Using Axios to fetch images from the API
                const response = await axios.get('http://127.0.0.1:8001/api/images/');
                console.log('API Response for Images:', response.data);

                // Filter the data received from the API.
                const filteredImages = response.data.filter(
                    (image) => image.kategori && image.kategori.name === 'Orta Resim'
                );
                console.log('Filtered Images:', filteredImages);

                // Combine image URLs with the backend address and save to state
                const formattedImages = filteredImages.map((img) => ({
                    ...img,
                    fullImageUrl: 'http://127.0.0.1:8001' + img.image,
                }));

                setImages(formattedImages);

                // Preload all images
                preloadImages(formattedImages);

                setLoading(false);
            } catch (err) {
                console.error('Error fetching images for carousel:', err);
                setError('Resimler yüklenirken bir hata oluştu.');
                setLoading(false);
            }
        };

        fetchImages();
    }, []);

    // Function to preload images
    const preloadImages = (imageList) => {
        imageList.forEach((img, index) => {
            const imageObj = new Image();
            imageObj.onload = () => {
                setLoadedImages(prev => new Set([...prev, index]));
            };
            imageObj.onerror = () => {
                console.warn(`Failed to preload image: ${img.fullImageUrl}`);
                // Still mark as "loaded" so it doesn't block the UI
                setLoadedImages(prev => new Set([...prev, index]));
            };
            imageObj.src = img.fullImageUrl;
        });
    };

    // Handle individual image load
    const handleImageLoad = (index) => {
        setLoadedImages(prev => new Set([...prev, index]));
    };

    // Show loading status
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '600px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Resimler yükleniyor...</span>
                </div>
                <p className="ms-3 text-muted">Resimler yükleniyor...</p>
            </div>
        );
    }

    // Show error status
    if (error) {
        return (
            <div className="text-center text-danger py-5">
                <p>{error}</p>
                <p>Lütfen backend sunucunuzun çalıştığından ve resimlerin doğru kategoride olduğundan emin olun.</p>
            </div>
        );
    }

    // Show message if no images are found
    if (images.length === 0) {
        return (
            <div className="text-center text-muted py-5">
                <p>Görüntülenecek 'Orta Resim' kategorisinde resim bulunamadı.</p>
                <p>Lütfen backend'e bu kategoride resimler yüklediğinizden emin olun.</p>
            </div>
        );
    }

    return (
        <div className="carousel-container" style={{
            maxWidth: '100%',
            margin: '80px auto 0 auto',
            padding: '0 15px'
        }}>
            <style>
                {`
                    @keyframes fadeSlideIn {
                        0% {
                            opacity: 0;
                            transform: scale(1.05) translateY(20px);
                        }
                        100% {
                            opacity: 1;
                            transform: scale(1) translateY(0);
                        }
                    }
                    
                    @keyframes pulseGlow {
                        0%, 100% {
                            box-shadow: 0 15px 50px rgba(0, 0, 0, 0.25);
                        }
                        50% {
                            box-shadow: 0 25px 70px rgba(0, 0, 0, 0.35), 0 0 30px rgba(255, 255, 255, 0.1);
                        }
                    }
                    
                    .carousel-container {
                        position: relative;
                        z-index: 1;
                    }
                    
                    .custom-carousel {
                        animation: pulseGlow 6s ease-in-out infinite;
                        transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                        border-radius: 20px;
                        overflow: hidden;
                        position: relative;
                    }
                    
                    .custom-carousel:hover {
                        transform: translateY(-8px);
                        box-shadow: 0 30px 90px rgba(0, 0, 0, 0.4) !important;
                    }
                    
                    .carousel-item {
                        border-radius: 20px;
                        overflow: hidden;
                    }
                    
                    .carousel-item img {
                        animation: fadeSlideIn 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                        transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                        border-radius: 20px;
                    }
                    
                    .carousel-item:hover img {
                        transform: scale(1.02);
                    }
                    
                    .carousel-control-prev, 
                    .carousel-control-next {
                        transition: all 0.3s ease;
                        opacity: 0.7;
                        width: 60px;
                        height: 60px;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 50%;
                        top: 50%;
                        transform: translateY(-50%);
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                    }
                    
                    .carousel-control-prev {
                        left: 20px;
                    }
                    
                    .carousel-control-next {
                        right: 20px;
                    }
                    
                    .carousel-control-prev:hover, 
                    .carousel-control-next:hover {
                        opacity: 1;
                        background: rgba(255, 255, 255, 0.2);
                        transform: translateY(-50%) scale(1.1);
                    }
                    
                    .carousel-control-prev-icon,
                    .carousel-control-next-icon {
                        width: 25px;
                        height: 25px;
                        background-size: 100% 100%;
                        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                    }
                    
                    .carousel-indicators {
                        bottom: 25px;
                        margin-bottom: 0;
                        z-index: 3;
                    }
                    
                    .carousel-indicators [data-bs-target] {
                        transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                        border-radius: 8px;
                        width: 40px !important;
                        height: 4px !important;
                        margin: 0 4px !important;
                        background: rgba(255, 255, 255, 0.4) !important;
                        border: none !important;
                        opacity: 0.6;
                        backdrop-filter: blur(5px);
                    }
                    
                    .carousel-indicators [data-bs-target]:hover {
                        opacity: 0.8;
                        background: rgba(255, 255, 255, 0.6) !important;
                        transform: scaleY(1.5);
                    }
                    
                    .carousel-indicators .active {
                        opacity: 1 !important;
                        background: rgba(255, 255, 255, 0.95) !important;
                        transform: scaleY(1.2);
                        box-shadow: 0 2px 8px rgba(255, 255, 255, 0.3);
                    }
                    
                    .carousel-caption {
                        animation: fadeSlideIn 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s both;
                        background: linear-gradient(transparent, rgba(0,0,0,0.8));
                        border-radius: 0 0 20px 20px;
                        padding: 40px 40px 30px 40px;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        backdrop-filter: blur(15px);
                        border-top: 1px solid rgba(255,255,255,0.1);
                        margin: 0;
                    }
                    
                    .carousel-caption h3 {
                        animation: fadeSlideIn 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.5s both;
                        font-size: 32px;
                        font-weight: 700;
                        background: linear-gradient(45deg, #ffffff 0%, #f8f9fa 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        text-shadow: 2px 2px 6px rgba(0,0,0,0.9);
                        margin-bottom: 15px;
                        line-height: 1.2;
                        letter-spacing: 0.5px;
                    }
                    
                    .carousel-caption p {
                        animation: fadeSlideIn 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.7s both;
                        font-size: 18px;
                        text-shadow: 1px 1px 3px rgba(0,0,0,0.9);
                        margin-bottom: 0;
                        line-height: 1.5;
                        max-width: 85%;
                        margin: 0 auto;
                        color: #f1f2f6;
                        font-weight: 300;
                        letter-spacing: 0.3px;
                    }
                    
                    @media (max-width: 768px) {
                        .custom-carousel {
                            margin: 40px 10px 0 10px;
                        }
                        
                        .carousel-control-prev, 
                        .carousel-control-next {
                            width: 45px;
                            height: 45px;
                        }
                        
                        .carousel-control-prev {
                            left: 10px;
                        }
                        
                        .carousel-control-next {
                            right: 10px;
                        }
                        
                        .carousel-caption {
                            padding: 25px 20px 20px 20px;
                        }
                        
                        .carousel-caption h3 {
                            font-size: 24px;
                            margin-bottom: 10px;
                        }
                        
                        .carousel-caption p {
                            font-size: 16px;
                            max-width: 95%;
                        }
                        
                        .carousel-indicators [data-bs-target] {
                            width: 30px !important;
                            height: 3px !important;
                            margin: 0 3px !important;
                        }
                    }
                `}
            </style>

            <Carousel
                interval={5000}
                indicators={true}
                controls={true}
                fade={true}
                touch={true}
                slide={false}
                className="custom-carousel"
                style={{
                    boxShadow: '0 15px 50px rgba(0, 0, 0, 0.25)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    minHeight: '600px',
                    background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)'
                }}
            >
                {images.map((img, index) => (
                    <Carousel.Item key={img.id || index}>
                        <div
                            style={{
                                position: 'relative',
                                height: '600px',
                                background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                            }}
                        >
                            <img
                                className="d-block w-100"
                                src={img.fullImageUrl}
                                alt={img.title || `Slide ${index + 1}`}
                                style={{
                                    height: '600px',
                                    objectFit: 'cover',
                                    objectPosition: 'center',
                                    width: '100%',
                                    filter: 'brightness(1.05) contrast(1.1) saturate(1.1)',
                                }}
                                onLoad={() => handleImageLoad(index)}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://placehold.co/1200x600/2c3e50/ffffff?text=Resim+Yok`;
                                    handleImageLoad(index);
                                    console.warn(`Failed to load image: ${img.fullImageUrl}`);
                                }}
                            />

                            {/* Subtle overlay for better text readability */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'linear-gradient(45deg, transparent 60%, rgba(0,0,0,0.2) 100%)',
                                pointerEvents: 'none'
                            }} />
                        </div>

                        {/* Carousel Caption */}
                        {(img.title || img.description) && (
                            <Carousel.Caption>
                                {img.title && (
                                    <h3>{img.title}</h3>
                                )}
                                {img.description && (
                                    <p>{img.description}</p>
                                )}
                            </Carousel.Caption>
                        )}
                    </Carousel.Item>
                ))}
            </Carousel>
        </div>
    );
};

export default ImageCarousel;