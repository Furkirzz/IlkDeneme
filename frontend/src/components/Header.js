
// import React, { useState, useEffect } from 'react';
// import { FiBell, FiSearch, FiMenu, FiX, FiChevronDown, FiPhone, FiMail, FiHome, FiBookOpen, FiCalendar, FiUsers, FiAward, FiUpload } from 'react-icons/fi';
// import { BsPersonFill, BsBook, BsPlayCircle, BsCalendar as BsCalendarIcon, BsAward } from 'react-icons/bs';
// import { FaInstagram, FaYoutube, FaFacebook, FaTiktok } from 'react-icons/fa';
// import { FaXTwitter } from 'react-icons/fa6';
// import axios from 'axios';
// import { useSelector } from 'react-redux';
// import { useMemo } from 'react';

// function decodeJwt(token) {
//     try {
//         const payload = token?.split(".")[1];
//         if (!payload) return null;
//         const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
//         return JSON.parse(decodeURIComponent(escape(json)));
//     } catch {
//         return null;
//     }
// }

// // Türkçe karakter/boşluk normalize edip case-insensitive rol kontrolü
// const normalize = (s) =>
//     (s || "")
//         .toString()
//         .toLowerCase()
//         .normalize("NFD")
//         .replace(/[\u0300-\u036f]/g, ""); // diacritic kaldır

// const hasAny = (roles, candidates) => {
//     const bag = new Set((roles || []).map((r) => normalize(r)));
//     return candidates.some((c) => bag.has(normalize(c)));
// };

// const Header = () => {
//     const [searchTerm, setSearchTerm] = useState('');
//     const [image, setImage] = useState(null);
//     const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
//     const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//     const [isSearchOpen, setIsSearchOpen] = useState(false);
//     const [isAchievementsDropdownOpen, setIsAchievementsDropdownOpen] = useState(false);


//     const access = useSelector((s) => s.auth.access);
//     const userInStore = useSelector((s) => s.auth.user);
//     const rolesInStore = useSelector((s) => s.auth.roles);

//     // const decoded = useMemo(() => decodeJwt(accessToken), [accessToken]);



//     // Rolleri şu öncelikle belirle:
//     // 1) store.roles
//     // 2) store.user?.roles
//     // 3) access JWT içindeki "roles" claim
//     const roles =
//         rolesInStore?.length
//             ? rolesInStore
//             : userInStore?.roles?.length
//                 ? userInStore.roles
//                 : Array.isArray(decoded?.roles)
//                     ? decoded.roles
//                     : [];

//     console.log(roles);

//     const currentUser = {
//         full_name:
//             userInStore?.full_name ||
//             decoded?.full_name ||
//             decoded?.name ||
//             "",
//         email: userInStore?.email || decoded?.email || "",
//     };

//     const isLoggedIn = !!access;

//     const canYonetici = hasAny(roles, ["öğretmen", "yonetici", "admin", "administrator"]);
//     const canFirma = hasAny(roles, ["öğrenci", "company", "vendor", "supplier"]);


//     useEffect(() => {
//         console.log('Logo API çağrısı başlatılıyor...');
//         axios.get('http://127.0.0.1:8001/api/images/')
//             .then(response => {
//                 console.log('API Response:', response.data);
//                 if (response.data.length > 0) {
//                     const fullImageUrl = 'http://127.0.0.1:8001' + response.data[0].image;
//                     console.log('Logo URL:', fullImageUrl);
//                     setImage(fullImageUrl);
//                 } else {
//                     console.log('API\'den logo verisi gelmedi');
//                     setImage(null);
//                 }
//             })
//             .catch(error => {
//                 console.error('Logo API hatası:', error);
//                 setImage(null);
//             });
//     }, []);

//     // Close dropdowns when clicking outside
//     useEffect(() => {
//         const handleClickOutside = (event) => {
//             // Close achievements dropdown if clicking outside
//             if (isAchievementsDropdownOpen && !event.target.closest('.achievements-dropdown')) {
//                 setIsAchievementsDropdownOpen(false);
//             }
//             // Close user menu if clicking outside
//             if (isUserMenuOpen && !event.target.closest('.user-menu')) {
//                 setIsUserMenuOpen(false);
//             }
//         };

//         document.addEventListener('mousedown', handleClickOutside);
//         return () => {
//             document.removeEventListener('mousedown', handleClickOutside);
//         };
//     }, [isAchievementsDropdownOpen, isUserMenuOpen]);

//     const menuItems = [
//         { name: 'Fyfa', href: '/', icon: FiHome },
//         { name: 'Başarılarımız', href: '#', icon: FiAward },
//         { name: 'Takvim', href: '/takvim', icon: FiCalendar },
//         { name: 'Ders Programı', href: '/HaftalikPlan', icon: BsBook },
//         { name: 'Deneme Yükle', href: '/sinav_okuma', icon: FiUpload },
//     ];

//     return (
//         <div className="w-full">
//             {/* <div className="bg-red-600 text-white py-3 px-4">
//                 <div className="max-w-7xl mx-auto flex items-center justify-between text-base">

//                     <div className="flex items-center space-x-6">
//                         <div className="flex items-center space-x-2">
//                             <FiPhone className="w-4 h-4" />
//                             <span>0 533 236 20 05</span>
//                         </div>
//                     </div>


//                     <div className="flex items-center space-x-3">
//                         <a href="#" className="hover:text-red-200 transition-colors duration-200">
//                             <FaInstagram className="w-4 h-4" />
//                         </a>
//                     </div>
//                 </div>
//             </div> */}

//             {/* Main Navbar */}
//             <nav className="bg-white/95 backdrop-blur-sm border-b-[3px] border-red-600 w-full z-50 shadow-lg sticky top-0">
//                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//                     <div className="flex items-center justify-between h-20">
//                         {/* Left Side - Logo */}
//                         <div className="flex items-center group cursor-pointer flex-shrink-0">
//                             <div className="flex items-center space-x-3">
//                                 {image ? (
//                                     <div className="relative">
//                                         <img
//                                             src={image}
//                                             alt="Dershane Logo"
//                                             className="h-12 w-auto max-w-[180px] object-contain cursor-pointer transition-all duration-300 hover:scale-105 hover:brightness-110"
//                                             draggable={false}
//                                             onClick={() => window.location.href = '/'}
//                                             onLoad={() => console.log('Logo başarıyla yüklendi')}
//                                             onError={(e) => {
//                                                 console.log('Logo yüklenemedi, yedek logo gösteriliyor');
//                                                 setImage(null);
//                                             }}
//                                         />
//                                     </div>
//                                 ) : (
//                                     <div className="flex items-center space-x-2">
//                                         <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
//                                             <FiBookOpen className="text-white text-lg" />
//                                         </div>
//                                         <span className="text-xl font-bold text-gray-800 hidden sm:block">
//                                             Akademi Eğitim
//                                         </span>
//                                     </div>
//                                 )}
//                             </div>
//                         </div>
//                         {/* Center - Navigation Menu */}
//                         <div className="hidden lg:flex items-center justify-start flex-1 space-x-1 ml-6">
//                             {menuItems.map((item, index) => {
//                                 const IconComponent = item.icon;

//                                 // Special handling for "Başarılarımız" dropdown
//                                 if (item.name === 'Başarılarımız') {
//                                     return (
//                                         <div key={index} className="relative achievements-dropdown">
//                                             <button
//                                                 onClick={() => setIsAchievementsDropdownOpen(!isAchievementsDropdownOpen)}
//                                                 className="flex items-center space-x-2 text-gray-700 hover:text-red-600 hover:bg-red-50 font-medium text-sm px-3 py-2.5 rounded-lg transition-all duration-300 whitespace-nowrap relative group"
//                                             >
//                                                 <IconComponent className="w-4 h-4" />
//                                                 <span>{item.name}</span>
//                                                 <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isAchievementsDropdownOpen ? 'rotate-180' : ''}`} />
//                                                 <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
//                                             </button>

//                                             {isAchievementsDropdownOpen && (
//                                                 <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
//                                                     <div className="py-2">
//                                                         <a
//                                                             href="/basarilarimiz/2022-2023"
//                                                             className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 text-sm no-underline"
//                                                             style={{ textDecoration: 'none' }}
//                                                             onClick={() => setIsAchievementsDropdownOpen(false)}
//                                                         >
//                                                             <FiAward className="w-4 h-4 mr-3" />
//                                                             2022-2023
//                                                         </a>
//                                                         <a
//                                                             href="/basarilarimiz/2023-2024"
//                                                             className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 text-sm no-underline"
//                                                             style={{ textDecoration: 'none' }}
//                                                             onClick={() => setIsAchievementsDropdownOpen(false)}
//                                                         >
//                                                             <FiAward className="w-4 h-4 mr-3" />
//                                                             2023-2024
//                                                         </a>
//                                                         <a
//                                                             href="/basarilarimiz/2024-2025"
//                                                             className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 text-sm no-underline"
//                                                             style={{ textDecoration: 'none' }}
//                                                             onClick={() => setIsAchievementsDropdownOpen(false)}
//                                                         >
//                                                             <FiAward className="w-4 h-4 mr-3" />
//                                                             2024-2025
//                                                         </a>
//                                                     </div>
//                                                 </div>
//                                             )}
//                                         </div>
//                                     );
//                                 }

//                                 return (
//                                     <a
//                                         key={index}
//                                         href={item.href}
//                                         className="flex items-center space-x-2 text-gray-700 hover:text-red-600 hover:bg-red-50 font-medium text-sm px-3 py-2.5 rounded-lg transition-all duration-300 whitespace-nowrap no-underline relative group"
//                                         style={{ textDecoration: 'none' }}
//                                     >
//                                         <IconComponent className="w-4 h-4" />
//                                         <span>{item.name}</span>
//                                         <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
//                                     </a>
//                                 );
//                             })}
//                         </div>

//                         {/* Right Side - Actions */}
//                         <div className="flex items-center space-x-1 flex-shrink-0">
//                             {/* Search */}
//                             <div className="hidden md:flex items-center">
//                                 <div className="relative">
//                                     <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 transition-all duration-200 hover:shadow-sm">
//                                         <FiSearch className="w-4 h-4 text-gray-400 ml-3" />
//                                         <input
//                                             type="text"
//                                             placeholder="Ara..."
//                                             value={searchTerm}
//                                             onChange={(e) => setSearchTerm(e.target.value)}
//                                             className="w-36 px-3 py-2.5 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none text-sm rounded-xl"
//                                         />
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* Mobile Search Toggle */}
//                             <button
//                                 onClick={() => setIsSearchOpen(!isSearchOpen)}
//                                 className="md:hidden p-2.5 rounded-lg hover:bg-gray-100 transition-all duration-200"
//                             >
//                                 <FiSearch className="w-5 h-5 text-gray-600" />
//                             </button>

//                             {/* Notifications */}
//                             <div className="relative hidden sm:block">
//                                 <button className="p-2.5 rounded-lg hover:bg-gray-100 transition-all duration-200 relative group">
//                                     <FiBell className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" />
//                                     <div className="absolute -top-1 -right-1">
//                                         <div className="w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
//                                     </div>
//                                 </button>
//                             </div>

//                             {/* User Profile */}
//                             <div className="relative user-menu">
//                                 <button
//                                     onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
//                                     className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
//                                 >
//                                     <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
//                                         <BsPersonFill className="w-4 h-4 text-white" />
//                                     </div>
//                                     <FiChevronDown className={`w-4 h-4 text-gray-500 transition-all duration-200 hidden sm:block group-hover:text-red-600 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
//                                 </button>

//                                 {isUserMenuOpen && (
//                                     <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
//                                         <div className="px-4 py-4 border-b border-gray-100">
//                                             <div className="flex items-center space-x-3">
//                                                 <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
//                                                     <BsPersonFill className="w-6 h-6 text-white" />
//                                                 </div>
//                                                 <div>
//                                                     <p className="text-sm font-semibold text-gray-900">Öğrenci Adı</p>
//                                                     <p className="text-xs text-gray-500">ogrenci@dershane.com</p>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                         <div className="py-2">
//                                             <a href="sinav_okuma" className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors duration-200 text-gray-700">
//                                                 <BsBook className="w-4 h-4" />
//                                                 <span className="text-sm">Deneme Yükle</span>
//                                             </a>
//                                             <a href="#" className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors duration-200 text-gray-700">
//                                                 <BsCalendarIcon className="w-4 h-4" />
//                                                 <span className="text-sm">Program</span>
//                                             </a>
//                                             <a href="#" className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors duration-200 text-gray-700">
//                                                 <BsAward className="w-4 h-4" />
//                                                 <span className="text-sm">Notlarım</span>
//                                             </a>
//                                             <div className="border-t border-gray-100 mt-2">
//                                                 <a href="/" className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors duration-200 text-red-600">
//                                                     <span className="text-sm">Çıkış Yap</span>
//                                                 </a>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 )}
//                             </div>

//                             {/* Login Button */}
//                             <a
//                                 href="/login"
//                                 className="hidden sm:flex items-center px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg text-white text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md whitespace-nowrap no-underline"
//                                 style={{ textDecoration: 'none' }}
//                             >
//                                 <BsPersonFill className="w-4 h-4 mr-1" />
//                                 Giriş
//                             </a>

//                             <div style={{ display: "flex", gap: 12 }}>
//                                 <a
//                                     href={canYonetici ? "/yonetici" : "#"}
//                                     style={{
//                                         pointerEvents: canYonetici ? "auto" : "none",
//                                         opacity: canYonetici ? 1 : 0.5,
//                                     }}
//                                     title={canYonetici ? "" : "Bu işlem için 'Yönetici' rolü gerekir"}
//                                 >
//                                     Yönetici
//                                 </a>
//                                 <a
//                                     href={canFirma ? "/firma" : "#"}
//                                     style={{
//                                         pointerEvents: canFirma ? "auto" : "none",
//                                         opacity: canFirma ? 1 : 0.5,
//                                     }}
//                                     title={canFirma ? "" : "Bu işlem için 'Firma' rolü gerekir"}
//                                 >
//                                     Firma
//                                 </a>
//                             </div>



//                             {/* Mobile Menu Toggle */}
//                             <button
//                                 onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//                                 className="lg:hidden p-2.5 rounded-lg hover:bg-gray-100 transition-all duration-200"
//                             >
//                                 {isMobileMenuOpen ? (
//                                     <FiX className="w-5 h-5 text-gray-600" />
//                                 ) : (
//                                     <FiMenu className="w-5 h-5 text-gray-600" />
//                                 )}
//                             </button>
//                         </div>
//                     </div>

//                     {/* Mobile Search */}
//                     {isSearchOpen && (
//                         <div className="md:hidden py-4 border-t border-gray-100 bg-white/95 backdrop-blur-sm">
//                             <div className="px-4">
//                                 <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 transition-all duration-200">
//                                     <FiSearch className="w-4 h-4 text-gray-400 ml-3" />
//                                     <input
//                                         type="text"
//                                         placeholder="Kurs, öğretmen ara..."
//                                         value={searchTerm}
//                                         onChange={(e) => setSearchTerm(e.target.value)}
//                                         className="w-full px-3 py-3 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none text-sm rounded-xl"
//                                         autoFocus
//                                     />
//                                 </div>
//                             </div>
//                         </div>
//                     )}

//                     {/* Mobile Menu */}
//                     {isMobileMenuOpen && (
//                         <div className="lg:hidden py-4 border-t border-gray-100 bg-white/95 backdrop-blur-sm">
//                             <div className="space-y-2 px-4">
//                                 {menuItems.map((item, index) => {
//                                     const IconComponent = item.icon;

//                                     // Special handling for "Başarılarımız" dropdown in mobile
//                                     if (item.name === 'Başarılarımız') {
//                                         return (
//                                             <div key={index} className="space-y-1">
//                                                 <button
//                                                     onClick={() => setIsAchievementsDropdownOpen(!isAchievementsDropdownOpen)}
//                                                     className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 font-medium text-sm"
//                                                 >
//                                                     <div className="flex items-center space-x-3">
//                                                         <IconComponent className="w-5 h-5" />
//                                                         <span>{item.name}</span>
//                                                     </div>
//                                                     <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isAchievementsDropdownOpen ? 'rotate-180' : ''}`} />
//                                                 </button>

//                                                 {isAchievementsDropdownOpen && (
//                                                     <div className="ml-4 space-y-1 border-l-2 border-red-100 pl-4">
//                                                         <a
//                                                             href="/basarilarimiz/2022-2023"
//                                                             className="flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 text-sm no-underline"
//                                                             style={{ textDecoration: 'none' }}
//                                                             onClick={() => {
//                                                                 setIsAchievementsDropdownOpen(false);
//                                                                 setIsMobileMenuOpen(false);
//                                                             }}
//                                                         >
//                                                             <FiAward className="w-4 h-4" />
//                                                             <span>2022-2023</span>
//                                                         </a>
//                                                         <a
//                                                             href="/basarilarimiz/2023-2024"
//                                                             className="flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 text-sm no-underline"
//                                                             style={{ textDecoration: 'none' }}
//                                                             onClick={() => {
//                                                                 setIsAchievementsDropdownOpen(false);
//                                                                 setIsMobileMenuOpen(false);
//                                                             }}
//                                                         >
//                                                             <FiAward className="w-4 h-4" />
//                                                             <span>2023-2024</span>
//                                                         </a>
//                                                         <a
//                                                             href="/basarilarimiz/2024-2025"
//                                                             className="flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 text-sm no-underline"
//                                                             style={{ textDecoration: 'none' }}
//                                                             onClick={() => {
//                                                                 setIsAchievementsDropdownOpen(false);
//                                                                 setIsMobileMenuOpen(false);
//                                                             }}
//                                                         >
//                                                             <FiAward className="w-4 h-4" />
//                                                             <span>2024-2025</span>
//                                                         </a>
//                                                     </div>
//                                                 )}
//                                             </div>
//                                         );
//                                     }

//                                     return (
//                                         <a
//                                             key={index}
//                                             href={item.href}
//                                             className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 font-medium text-sm whitespace-nowrap no-underline group"
//                                             style={{ textDecoration: 'none' }}
//                                             onClick={() => setIsMobileMenuOpen(false)}
//                                         >
//                                             <IconComponent className="w-5 h-5" />
//                                             <span>{item.name}</span>
//                                             <div className="ml-auto w-0 h-0.5 bg-red-600 rounded-full transition-all duration-300 group-hover:w-8"></div>
//                                         </a>
//                                     );
//                                 })}
//                                 <div className="pt-4 border-t border-gray-100 mt-4">
//                                     <a
//                                         href="/login"
//                                         className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg text-white font-medium text-sm transition-all duration-200 transform hover:scale-105 whitespace-nowrap no-underline"
//                                         style={{ textDecoration: 'none' }}
//                                         onClick={() => setIsMobileMenuOpen(false)}
//                                     >
//                                         <BsPersonFill className="w-4 h-4" />
//                                         <span>Giriş Yap</span>
//                                     </a>
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </div>
//             </nav>
//         </div>
//     );
// };

// export default Header;

import React, { useState, useEffect, useMemo } from 'react';
import {
    FiBell, FiSearch, FiMenu, FiX, FiChevronDown, FiPhone, FiMail,
    FiHome, FiBookOpen, FiCalendar, FiAward, FiUpload
} from 'react-icons/fi';
import {
    BsPersonFill, BsBook, BsPlayCircle, BsCalendar as BsCalendarIcon, BsAward
} from 'react-icons/bs';
import { FaInstagram, FaYoutube, FaFacebook, FaTiktok } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import { useNavigate } from 'react-router-dom';

function decodeJwt(token) {
    try {
        const payload = token?.split(".")[1];
        if (!payload) return null;
        const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
        return JSON.parse(decodeURIComponent(escape(json)));
    } catch {
        return null;
    }
}

// Türkçe karakter/boşluk normalize edip case-insensitive rol kontrolü
const normalize = (s) =>
    (s || "")
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // diacritic kaldır

const hasAny = (roles, candidates) => {
    const bag = new Set((roles || []).map((r) => normalize(r)));
    return candidates.some((c) => bag.has(normalize(c)));
};

const Header = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [image, setImage] = useState(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isAchievementsDropdownOpen, setIsAchievementsDropdownOpen] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, accessToken, isAuthenticated } = useSelector((s) => s.auth);

    // Çıkış işlemi
    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
    };

    // Giriş işlemi
    const handleLogin = () => {
        navigate('/login');
        setIsMobileMenuOpen(false);
    };

    // Kullanıcı rolleri ve bilgileri
    const currentUser = user || {};
    const roles = user?.roles || [];
    
    const isTeacher = user?.is_staff || user?.is_superuser || roles.includes('teacher');
    const isStudent = roles.includes('student') || (!user?.is_staff && !user?.is_superuser);

    // Eski sistem uyumluluğu için
    const canYonetici = isTeacher;
    const canFirma = isStudent;

    useEffect(() => {
        console.log('Logo API çağrısı başlatılıyor...');
        axios.get('http://127.0.0.1:8001/api/images/')
            .then(response => {
                console.log('API Response:', response.data);
                if (response.data.length > 0) {
                    const fullImageUrl = 'http://127.0.0.1:8001' + response.data[0].image;
                    console.log('Logo URL:', fullImageUrl);
                    setImage(fullImageUrl);
                } else {
                    console.log('API\'den logo verisi gelmedi');
                    setImage(null);
                }
            })
            .catch(error => {
                console.error('Logo API hatası:', error);
                setImage(null);
            });
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Close achievements dropdown if clicking outside
            if (isAchievementsDropdownOpen && !event.target.closest('.achievements-dropdown')) {
                setIsAchievementsDropdownOpen(false);
            }
            // Close user menu if clicking outside
            if (isUserMenuOpen && !event.target.closest('.user-menu')) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isAchievementsDropdownOpen, isUserMenuOpen]);

    const menuItems = [
        { name: 'Ana Sayfa', href: '/', icon: FiHome },
        { name: 'Başarılarımız', href: '#', icon: FiAward },
        { name: 'Takvim', href: '/takvim', icon: FiCalendar },
        { name: 'Kadromuz', href: '/Kadro', icon: BsBook },
        { name: 'Hakkımızda', href: '/hakkimizda', icon: FiBookOpen },
        { name: 'İletişim', href: '/iletisim', icon: FiMail },


    ];

    return (
        <div className="w-full">
            {/* Top Contact Bar (Uncomment if needed) */}
            {/* <div className="bg-red-600 text-white py-3 px-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between text-base">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <FiPhone className="w-4 h-4" />
                            <span>0 533 236 20 05</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <a href="#" className="hover:text-red-200 transition-colors duration-200">
                            <FaInstagram className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div> */}

            {/* Main Navbar */}
            <nav className="bg-white/95 backdrop-blur-sm border-b-[3px] border-red-600 w-full z-50 shadow-lg sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Left Side - Logo */}
                        <div className="flex items-center group cursor-pointer flex-shrink-0">
                            <div className="flex items-center space-x-3">
                                {image ? (
                                    <div className="relative">
                                        <img
                                            src={image}
                                            alt="Dershane Logo"
                                            className="h-12 w-auto max-w-[180px] object-contain cursor-pointer transition-all duration-300 hover:scale-105 hover:brightness-110"
                                            draggable={false}
                                            onClick={() => window.location.href = '/'}
                                            onLoad={() => console.log('Logo başarıyla yüklendi')}
                                            onError={(e) => {
                                                console.log('Logo yüklenemedi, yedek logo gösteriliyor');
                                                setImage(null);
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                                            <FiBookOpen className="text-white text-lg" />
                                        </div>
                                        <span className="text-xl font-bold text-gray-800 hidden sm:block">
                                            Akademi Eğitim
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Center - Navigation Menu */}
                        <div className="hidden lg:flex items-center justify-start flex-1 space-x-1 ml-6">
                            {menuItems.map((item, index) => {
                                const IconComponent = item.icon;

                                // Special handling for "Başarılarımız" dropdown
                                if (item.name === 'Başarılarımız') {
                                    return (
                                        <div key={index} className="relative achievements-dropdown">
                                            <button
                                                onClick={() => setIsAchievementsDropdownOpen(!isAchievementsDropdownOpen)}
                                                className="flex items-center space-x-2 text-gray-700 hover:text-red-600 hover:bg-red-50 font-medium text-sm px-3 py-2.5 rounded-lg transition-all duration-300 whitespace-nowrap relative group"
                                            >
                                                <IconComponent className="w-4 h-4" />
                                                <span>{item.name}</span>
                                                <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isAchievementsDropdownOpen ? 'rotate-180' : ''}`} />
                                                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                                            </button>

                                            {isAchievementsDropdownOpen && (
                                                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                                                    <div className="py-2">
                                                        <a
                                                            href="/basarilarimiz/2022-2023"
                                                            className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 text-sm no-underline"
                                                            style={{ textDecoration: 'none' }}
                                                            onClick={() => setIsAchievementsDropdownOpen(false)}
                                                        >
                                                            <FiAward className="w-4 h-4 mr-3" />
                                                            2022-2023
                                                        </a>
                                                        <a
                                                            href="/basarilarimiz/2023-2024"
                                                            className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 text-sm no-underline"
                                                            style={{ textDecoration: 'none' }}
                                                            onClick={() => setIsAchievementsDropdownOpen(false)}
                                                        >
                                                            <FiAward className="w-4 h-4 mr-3" />
                                                            2023-2024
                                                        </a>
                                                        <a
                                                            href="/basarilarimiz/2024-2025"
                                                            className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 text-sm no-underline"
                                                            style={{ textDecoration: 'none' }}
                                                            onClick={() => setIsAchievementsDropdownOpen(false)}
                                                        >
                                                            <FiAward className="w-4 h-4 mr-3" />
                                                            2024-2025
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                return (
                                    <a
                                        key={index}
                                        href={item.href}
                                        className="flex items-center space-x-2 text-gray-700 hover:text-red-600 hover:bg-red-50 font-medium text-sm px-3 py-2.5 rounded-lg transition-all duration-300 whitespace-nowrap no-underline relative group"
                                        style={{ textDecoration: 'none' }}
                                    >
                                        <IconComponent className="w-4 h-4" />
                                        <span>{item.name}</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                                    </a>
                                );
                            })}
                        </div>

                        {/* Right Side - Actions */}
                        <div className="flex items-center space-x-1 flex-shrink-0">
                            {/* Search */}
                            <div className="hidden md:flex items-center">
                                <div className="relative">
                                    <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 transition-all duration-200 hover:shadow-sm">
                                        <FiSearch className="w-4 h-4 text-gray-400 ml-3" />
                                        <input
                                            type="text"
                                            placeholder="Ara..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-36 px-3 py-2.5 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none text-sm rounded-xl"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Search Toggle */}
                            <button
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className="md:hidden p-2.5 rounded-lg hover:bg-gray-100 transition-all duration-200"
                            >
                                <FiSearch className="w-5 h-5 text-gray-600" />
                            </button>

                            {/* Notifications */}
                            <div className="relative hidden sm:block">
                                <button className="p-2.5 rounded-lg hover:bg-gray-100 transition-all duration-200 relative group">
                                    <FiBell className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" />
                                    <div className="absolute -top-1 -right-1">
                                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
                                    </div>
                                </button>
                            </div>

                            {/* User Profile */}
                            <div className="relative user-menu">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
                                >
                                    <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                        <BsPersonFill className="w-4 h-4 text-white" />
                                    </div>
                                    <FiChevronDown className={`w-4 h-4 text-gray-500 transition-all duration-200 hidden sm:block group-hover:text-red-600 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                </button>



                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                                        <div className="px-4 py-4 border-b border-gray-100">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                                                    <BsPersonFill className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    {/* Rol bazlı başlık */}
                                                    {canYonetici ? (
                                                        <p className="text-xs font-medium text-red-600 uppercase tracking-wider mb-1">
                                                            Öğretmen Hesabı
                                                        </p>
                                                    ) : canFirma ? (
                                                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
                                                            Öğrenci Hesabı
                                                        </p>
                                                    ) : (
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                            Kullanıcı Hesabı
                                                        </p>
                                                    )}
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {currentUser.full_name || 'Kullanıcı'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {currentUser.email || 'email@dershane.com'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="py-2">
                                            {/* Öğretmen için özel menüler */}
                                            {canYonetici && (
                                                <>
                                                    <a href="/assignments" className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors duration-200 text-gray-700 no-underline">
                                                        <FiBookOpen className="w-4 h-4" />
                                                        <span className="text-sm">📋 Ödev Atama</span>
                                                    </a>
                                                    <a href="/sinav_okuma" className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors duration-200 text-gray-700 no-underline">
                                                        <BsBook className="w-4 h-4" />
                                                        <span className="text-sm">Deneme Yükle</span>
                                                    </a>
                                                    <a href="/HaftalikPlan" className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors duration-200 text-gray-700 no-underline">
                                                        <BsCalendarIcon className="w-4 h-4" />
                                                        <span className="text-sm">Ders Programı</span>
                                                    </a>
                                                    <a href="/ogrenci-analizleri" className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors duration-200 text-gray-700 no-underline">
                                                        <BsAward className="w-4 h-4" />
                                                        <span className="text-sm">Öğrenci Analizleri</span>
                                                    </a>
                                                </>
                                            )}

                                            {/* Öğrenci için özel menüler */}
                                            {canFirma && (
                                                <>
                                                    <a href="/student-homework" className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors duration-200 text-gray-700 no-underline">
                                                        <FiBookOpen className="w-4 h-4" />
                                                        <span className="text-sm">📚 Ödevlerim</span>
                                                    </a>
                                                    <a href="/sinav_okuma" className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors duration-200 text-gray-700 no-underline">
                                                        <BsBook className="w-4 h-4" />
                                                        <span className="text-sm">Deneme Yükle</span>
                                                    </a>
                                                    <a href="/HaftalikPlan" className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors duration-200 text-gray-700 no-underline">
                                                        <BsCalendarIcon className="w-4 h-4" />
                                                        <span className="text-sm">Ders Programım</span>
                                                    </a>
                                                    <a href="/notlarim" className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors duration-200 text-gray-700 no-underline">
                                                        <BsAward className="w-4 h-4" />
                                                        <span className="text-sm">Notlarım</span>
                                                    </a>
                                                </>
                                            )}

                                            {/* Ortak menüler (hem öğretmen hem öğrenci için) */}
                                            <a href="/profil" className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200 text-gray-700 no-underline">
                                                <BsPersonFill className="w-4 h-4" />
                                                <span className="text-sm">Profil Ayarları</span>
                                            </a>

                                            {/* Ayırıcı çizgi */}
                                            <div className="border-t border-gray-100 mt-2">
                                                <button 
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors duration-200 text-red-600 text-left"
                                                >
                                                    <span className="text-sm">Çıkış Yap</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Role-based Navigation Links */}
                            {/* <div style={{ display: "flex", gap: 12 }}>
                                <a
                                    href={canYonetici ? "/yonetici" : "#"}
                                    style={{
                                        pointerEvents: canYonetici ? "auto" : "none",
                                        opacity: canYonetici ? 1 : 0.5,
                                        textDecoration: 'none',
                                        color: canYonetici ? '#dc2626' : '#6b7280',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        transition: 'all 0.2s'
                                    }}
                                    title={canYonetici ? "" : "Bu işlem için 'Yönetici' rolü gerekir"}
                                    className={canYonetici ? "hover:bg-red-50" : ""}
                                >
                                    Öğretmen
                                </a>
                                <a
                                    href={canFirma ? "/firma" : "#"}
                                    style={{
                                        pointerEvents: canFirma ? "auto" : "none",
                                        opacity: canFirma ? 1 : 0.5,
                                        textDecoration: 'none',
                                        color: canFirma ? '#dc2626' : '#6b7280',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        transition: 'all 0.2s'
                                    }}
                                    title={canFirma ? "" : "Bu işlem için 'Firma' rolü gerekir"}
                                    className={canFirma ? "hover:bg-red-50" : ""}
                                >
                                    öğrenci
                                </a>
                            </div> */}

                            {/* Login Button */}
                            {!isAuthenticated && (
                                <button
                                    onClick={handleLogin}
                                    className="hidden sm:flex items-center px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg text-white text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md whitespace-nowrap"
                                >
                                    <BsPersonFill className="w-4 h-4 mr-1" />
                                    Giriş
                                </button>
                            )}

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden p-2.5 rounded-lg hover:bg-gray-100 transition-all duration-200"
                            >
                                {isMobileMenuOpen ? (
                                    <FiX className="w-5 h-5 text-gray-600" />
                                ) : (
                                    <FiMenu className="w-5 h-5 text-gray-600" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Search */}
                    {isSearchOpen && (
                        <div className="md:hidden py-4 border-t border-gray-100 bg-white/95 backdrop-blur-sm">
                            <div className="px-4">
                                <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 transition-all duration-200">
                                    <FiSearch className="w-4 h-4 text-gray-400 ml-3" />
                                    <input
                                        type="text"
                                        placeholder="Kurs, öğretmen ara..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-3 py-3 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none text-sm rounded-xl"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        </div>
                    )}



                    {/* Mobile Menu */}
                    {isMobileMenuOpen && (
                        <div className="lg:hidden py-4 border-t border-gray-100 bg-white/95 backdrop-blur-sm">
                            <div className="space-y-2 px-4">
                                {/* Kullanıcı Bilgileri - Mobil */}
                                {isAuthenticated && (
                                    <div className="flex items-center space-x-3 px-4 py-3 border-b border-gray-100 mb-4">
                                        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                                            <BsPersonFill className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            {canYonetici ? (
                                                <p className="text-xs font-medium text-red-600 uppercase tracking-wider">
                                                    Öğretmen Hesabı
                                                </p>
                                            ) : canFirma ? (
                                                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                                                    Öğrenci Hesabı
                                                </p>
                                            ) : (
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Kullanıcı Hesabı
                                                </p>
                                            )}
                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                {currentUser.full_name || 'Kullanıcı'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Ana Menü Öğeleri */}
                                {menuItems.map((item, index) => {
                                    const IconComponent = item.icon;

                                    // Special handling for "Başarılarımız" dropdown in mobile
                                    if (item.name === 'Başarılarımız') {
                                        return (
                                            <div key={index} className="space-y-1">
                                                <button
                                                    onClick={() => setIsAchievementsDropdownOpen(!isAchievementsDropdownOpen)}
                                                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 font-medium text-sm"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <IconComponent className="w-5 h-5" />
                                                        <span>{item.name}</span>
                                                    </div>
                                                    <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isAchievementsDropdownOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                {isAchievementsDropdownOpen && (
                                                    <div className="ml-4 space-y-1 border-l-2 border-red-100 pl-4">
                                                        <a
                                                            href="/basarilarimiz/2022-2023"
                                                            className="flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 text-sm no-underline"
                                                            style={{ textDecoration: 'none' }}
                                                            onClick={() => {
                                                                setIsAchievementsDropdownOpen(false);
                                                                setIsMobileMenuOpen(false);
                                                            }}
                                                        >
                                                            <FiAward className="w-4 h-4" />
                                                            <span>2022-2023</span>
                                                        </a>
                                                        <a
                                                            href="/basarilarimiz/2023-2024"
                                                            className="flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 text-sm no-underline"
                                                            style={{ textDecoration: 'none' }}
                                                            onClick={() => {
                                                                setIsAchievementsDropdownOpen(false);
                                                                setIsMobileMenuOpen(false);
                                                            }}
                                                        >
                                                            <FiAward className="w-4 h-4" />
                                                            <span>2023-2024</span>
                                                        </a>
                                                        <a
                                                            href="/basarilarimiz/2024-2025"
                                                            className="flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 text-sm no-underline"
                                                            style={{ textDecoration: 'none' }}
                                                            onClick={() => {
                                                                setIsAchievementsDropdownOpen(false);
                                                                setIsMobileMenuOpen(false);
                                                            }}
                                                        >
                                                            <FiAward className="w-4 h-4" />
                                                            <span>2024-2025</span>
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    return (
                                        <a
                                            key={index}
                                            href={item.href}
                                            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 font-medium text-sm whitespace-nowrap no-underline group"
                                            style={{ textDecoration: 'none' }}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <IconComponent className="w-5 h-5" />
                                            <span>{item.name}</span>
                                            <div className="ml-auto w-0 h-0.5 bg-red-600 rounded-full transition-all duration-300 group-hover:w-8"></div>
                                        </a>
                                    );
                                })}

                                {/* Rol Bazlı Ekstra Menüler - Mobil */}
                                {isAuthenticated && (
                                    <div className="border-t border-gray-100 pt-4 mt-4 space-y-1">
                                        <div className="px-4 py-2">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {canYonetici ? 'Öğretmen İşlemleri' : canFirma ? 'Öğrenci İşlemleri' : 'Hesap İşlemleri'}
                                            </p>
                                        </div>

                                        {/* Öğretmen için mobil menüler */}
                                        {canYonetici && (
                                            <>
                                                <a href="/assignments" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 text-sm no-underline" onClick={() => setIsMobileMenuOpen(false)}>
                                                    <FiBookOpen className="w-5 h-5" />
                                                    <span>📋 Ödev Atama</span>
                                                </a>
                                                <a href="/ogrenci-analizleri" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 text-sm no-underline" onClick={() => setIsMobileMenuOpen(false)}>
                                                    <BsAward className="w-5 h-5" />
                                                    <span>Öğrenci Analizleri</span>
                                                </a>
                                            </>
                                        )}

                                        {/* Öğrenci için mobil menüler */}
                                        {canFirma && (
                                            <>
                                                <a href="/student-homework" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 text-sm no-underline" onClick={() => setIsMobileMenuOpen(false)}>
                                                    <FiBookOpen className="w-5 h-5" />
                                                    <span>📚 Ödevlerim</span>
                                                </a>
                                                <a href="/notlarim" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 text-sm no-underline" onClick={() => setIsMobileMenuOpen(false)}>
                                                    <BsAward className="w-5 h-5" />
                                                    <span>Notlarım</span>
                                                </a>
                                            </>
                                        )}

                                        {/* Ortak menüler */}
                                        <a href="/profil" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 text-sm no-underline" onClick={() => setIsMobileMenuOpen(false)}>
                                            <BsPersonFill className="w-5 h-5" />
                                            <span>Profil Ayarları</span>
                                        </a>
                                    </div>
                                )}

                                {/* Mobile Login Button veya Çıkış */}
                                <div className="pt-4 border-t border-gray-100 mt-4">
                                    {!isAuthenticated ? (
                                        <button
                                            onClick={handleLogin}
                                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg text-white font-medium text-sm transition-all duration-200 transform hover:scale-105 whitespace-nowrap"
                                        >
                                            <BsPersonFill className="w-4 h-4" />
                                            <span>Giriş Yap</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium text-sm transition-all duration-200 whitespace-nowrap"
                                        >
                                            <span>Çıkış Yap</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </nav>
        </div>
    );
};

export default Header;