// src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import {
  FiBell,
  FiSearch,
  FiMenu,
  FiX,
  FiChevronDown,
  FiMail,
  FiHome,
  FiBookOpen,
  FiCalendar,
  FiAward,
} from 'react-icons/fi';
import {
  BsPersonFill,
  BsBook,
  BsCalendar as BsCalendarIcon,
  BsAward,
} from 'react-icons/bs';

import { useSelector, useDispatch } from 'react-redux';
import {
  api,
  logout,
  selectUser,
  selectRoles,
  selectIsLoggedIn,
} from '../store/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { normalizeImageUrl } from '../utils/imageUrl';

const Header = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [image, setImage] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAchievementsDropdownOpen, setIsAchievementsDropdownOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Auth state (selector'lar ile)
  const user = useSelector(selectUser);
  const roles = useSelector(selectRoles);
  const isAuthenticated = useSelector(selectIsLoggedIn);

  // Rol kestirimi (string / obje farklılıklarına toleranslı)
  const isTeacher =
    user?.is_staff ||
    user?.is_superuser ||
    roles.some((r) => String(r).toLowerCase().includes('teacher') || String(r).toLowerCase().includes('öğretmen') || String(r).toLowerCase().includes('ogretmen'));

  const isStudent =
    roles.some((r) => String(r).toLowerCase().includes('student') || String(r).toLowerCase().includes('öğrenci') || String(r).toLowerCase().includes('ogrenci')) ||
    (!user?.is_staff && !user?.is_superuser && !isTeacher);

  // Eski isimlerle uyum
  const canYonetici = isTeacher;
  const canFirma = isStudent;

  // Logo yükle (Django API üzerinden)
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const { data } = await api.get('/images/', { signal: controller.signal });

        const list = Array.isArray(data) ? data : [];
        // Önce 'Logo' kategorisini dene, yoksa ilk kaydı kullan
        const logo = list.find((img) => img?.kategori?.name === 'Logo') || list[0];

        if (logo) {
          const fileUrl = normalizeImageUrl(
            logo.image || logo.url || logo.path || logo.fullImageUrl
          );
          setImage(fileUrl || null);
        } else {
          setImage(null);
        }
      } catch (e) {
        if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') return;
        setImage(null);
      }
    })();
    return () => controller.abort();
  }, []);

  // Çıkış
  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  // Giriş
  const handleLogin = () => {
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  // Dışarı tıklayınca dropdownları kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isAchievementsDropdownOpen && !event.target.closest('.achievements-dropdown')) {
        setIsAchievementsDropdownOpen(false);
      }
      if (isUserMenuOpen && !event.target.closest('.user-menu')) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAchievementsDropdownOpen, isUserMenuOpen]);

  const menuItems = [
    { name: 'Ana Sayfa', to: '/', icon: FiHome },
    { name: 'Başarılarımız', to: '#', icon: FiAward }, // dropdown
    { name: 'Takvim', to: '/takvim', icon: FiCalendar },
    { name: 'Kadromuz', to: '/Kadro', icon: BsBook },
    { name: 'Hakkımızda', to: '/hakkimizda', icon: FiBookOpen },
    { name: 'İletişim', to: '/iletisim', icon: FiMail },
  ];

  const currentUser = user || {};

  return (
    <div className="w-full">
      <nav className="bg-white/95 backdrop-blur-sm border-b-[3px] border-red-600 w-full z-50 shadow-lg sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ÜST SATIR */}
          <div className="flex items-center justify-between h-20">
            {/* Sol: Logo */}
            <div className="flex items-center group cursor-pointer flex-shrink-0">
              <div className="flex items-center space-x-3">
                {image ? (
                  <div className="relative">
                    <img
                      src={image}
                      alt="Dershane Logo"
                      className="h-12 w-auto max-w-[180px] object-contain cursor-pointer transition-all duration-300 hover:scale-105 hover:brightness-110"
                      draggable={false}
                      onClick={() => navigate('/')}
                      onError={() => setImage(null)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2" onClick={() => navigate('/')}>
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

            {/* Orta: Menü (desktop) */}
            <div className="hidden lg:flex items-center justify-start flex-1 space-x-1 ml-6">
              {menuItems.map((item, index) => {
                const Icon = item.icon;

                if (item.name === 'Başarılarımız') {
                  return (
                    <div key={index} className="relative achievements-dropdown">
                      <button
                        onClick={() => setIsAchievementsDropdownOpen(!isAchievementsDropdownOpen)}
                        className="flex items-center space-x-2 text-gray-700 hover:text-red-600 hover:bg-red-50 font-medium text-sm px-3 py-2.5 rounded-lg transition-all duration-300 whitespace-nowrap relative group"
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                        <FiChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isAchievementsDropdownOpen ? 'rotate-180' : ''
                          }`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                      </button>

                      {isAchievementsDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                          <div className="py-2">
                            <Link
                              to="/basarilarimiz/2022-2023"
                              className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 text-sm no-underline"
                              onClick={() => setIsAchievementsDropdownOpen(false)}
                            >
                              <FiAward className="w-4 h-4 mr-3" />
                              2022-2023
                            </Link>
                            <Link
                              to="/basarilarimiz/2023-2024"
                              className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 text-sm no-underline"
                              onClick={() => setIsAchievementsDropdownOpen(false)}
                            >
                              <FiAward className="w-4 h-4 mr-3" />
                              2023-2024
                            </Link>
                            <Link
                              to="/basarilarimiz/2024-2025"
                              className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 text-sm no-underline"
                              onClick={() => setIsAchievementsDropdownOpen(false)}
                            >
                              <FiAward className="w-4 h-4 mr-3" />
                              2024-2025
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={index}
                    to={item.to}
                    className="flex items-center space-x-2 text-gray-700 hover:text-red-600 hover:bg-red-50 font-medium text-sm px-3 py-2.5 rounded-lg transition-all duration-300 whitespace-nowrap no-underline relative group"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                  </Link>
                );
              })}
            </div>

            {/* Sağ: Aksiyonlar */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {/* Arama (desktop) */}
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

              {/* Arama (mobil toggle) */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden p-2.5 rounded-lg hover:bg-gray-100 transition-all duration-200"
              >
                <FiSearch className="w-5 h-5 text-gray-600" />
              </button>

              {/* Bildirim simgesi */}
              <div className="relative hidden sm:block">
                <button className="p-2.5 rounded-lg hover:bg-gray-100 transition-all duration-200 relative group">
                  <FiBell className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" />
                  <div className="absolute -top-1 -right-1">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                  </div>
                </button>
              </div>

              {/* Kullanıcı menüsü */}
              <div className="relative user-menu">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                    <BsPersonFill className="w-4 h-4 text-white" />
                  </div>
                  <FiChevronDown
                    className={`w-4 h-4 text-gray-500 transition-all duration-200 hidden sm:block group-hover:text-red-600 ${
                      isUserMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                    <div className="px-4 py-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                          <BsPersonFill className="w-6 h-6 text-white" />
                        </div>
                        <div>
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
                            {currentUser?.full_name || 'Kullanıcı'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {currentUser?.email || 'email@dershane.com'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="py-2">
                      {/* Öğretmen menüleri */}
                      {canYonetici && (
                        <>
                          <Link
                            to="/assignments"
                            className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors duration-200 text-gray-700 no-underline"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <FiBookOpen className="w-4 h-4" />
                            <span className="text-sm">📋 Ödev Atama</span>
                          </Link>
                          <Link
                            to="/sinav_okuma"
                            className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors duration-200 text-gray-700 no-underline"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <BsBook className="w-4 h-4" />
                            <span className="text-sm">Deneme Yükle</span>
                          </Link>
                          <Link
                            to="/HaftalikPlan"
                            className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors duration-200 text-gray-700 no-underline"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <BsCalendarIcon className="w-4 h-4" />
                            <span className="text-sm">Ders Programı</span>
                          </Link>
                          <Link
                            to="/ogrenci-analizleri"
                            className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors duration-200 text-gray-700 no-underline"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <BsAward className="w-4 h-4" />
                            <span className="text-sm">Öğrenci Analizleri</span>
                          </Link>
                        </>
                      )}

                      {/* Öğrenci menüleri */}
                      {canFirma && (
                        <>
                          <Link
                            to="/student-homework"
                            className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors duration-200 text-gray-700 no-underline"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <FiBookOpen className="w-4 h-4" />
                            <span className="text-sm">📚 Ödevlerim</span>
                          </Link>
                          <Link
                            to="/sinav_okuma"
                            className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors duration-200 text-gray-700 no-underline"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <BsBook className="w-4 h-4" />
                            <span className="text-sm">Deneme Yükle</span>
                          </Link>
                          <Link
                            to="/HaftalikPlan"
                            className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors duration-200 text-gray-700 no-underline"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <BsCalendarIcon className="w-4 h-4" />
                            <span className="text-sm">Ders Programım</span>
                          </Link>
                          <Link
                            to="/notlarim"
                            className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors duration-200 text-gray-700 no-underline"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <BsAward className="w-4 h-4" />
                            <span className="text-sm">Notlarım</span>
                          </Link>
                        </>
                      )}

                      {/* Ortak menüler */}
                      <Link
                        to="/profil"
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200 text-gray-700 no-underline"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <BsPersonFill className="w-4 h-4" />
                        <span className="text-sm">Profil Ayarları</span>
                      </Link>

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

              {/* Giriş (desktop) */}
              {!isAuthenticated && (
                <button
                  onClick={handleLogin}
                  className="hidden sm:flex items-center px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg text-white text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md whitespace-nowrap"
                >
                  <BsPersonFill className="w-4 h-4 mr-1" />
                  Giriş
                </button>
              )}

              {/* Mobil menü toggle */}
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

          {/* Arama (mobil) */}
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

          {/* Mobil menü */}
          {isMobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-100 bg-white/95 backdrop-blur-sm">
              <div className="space-y-2 px-4">
                {/* Kullanıcı bilgisi (mobil) */}
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
                        {currentUser?.full_name || 'Kullanıcı'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Ana menü öğeleri */}
                {menuItems.map((item, index) => {
                  const Icon = item.icon;

                  if (item.name === 'Başarılarımız') {
                    return (
                      <div key={index} className="space-y-1">
                        <button
                          onClick={() => setIsAchievementsDropdownOpen(!isAchievementsDropdownOpen)}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 font-medium text-sm"
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className="w-5 h-5" />
                            <span>{item.name}</span>
                          </div>
                          <FiChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isAchievementsDropdownOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {isAchievementsDropdownOpen && (
                          <div className="ml-4 space-y-1 border-l-2 border-red-100 pl-4">
                            <Link
                              to="/basarilarimiz/2022-2023"
                              className="flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 text-sm no-underline"
                              onClick={() => {
                                setIsAchievementsDropdownOpen(false);
                                setIsMobileMenuOpen(false);
                              }}
                            >
                              <FiAward className="w-4 h-4" />
                              <span>2022-2023</span>
                            </Link>
                            <Link
                              to="/basarilarimiz/2023-2024"
                              className="flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 text-sm no-underline"
                              onClick={() => {
                                setIsAchievementsDropdownOpen(false);
                                setIsMobileMenuOpen(false);
                              }}
                            >
                              <FiAward className="w-4 h-4" />
                              <span>2023-2024</span>
                            </Link>
                            <Link
                              to="/basarilarimiz/2024-2025"
                              className="flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 text-sm no-underline"
                              onClick={() => {
                                setIsAchievementsDropdownOpen(false);
                                setIsMobileMenuOpen(false);
                              }}
                            >
                              <FiAward className="w-4 h-4" />
                              <span>2024-2025</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={index}
                      to={item.to}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 font-medium text-sm whitespace-nowrap no-underline group"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                      <div className="ml-auto w-0 h-0.5 bg-red-600 rounded-full transition-all duration-300 group-hover:w-8" />
                    </Link>
                  );
                })}

                {/* Rol bazlı ek menüler (mobil) */}
                {isAuthenticated && (
                  <div className="border-t border-gray-100 pt-4 mt-4 space-y-1">
                    <div className="px-4 py-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {canYonetici ? 'Öğretmen İşlemleri' : canFirma ? 'Öğrenci İşlemleri' : 'Hesap İşlemleri'}
                      </p>
                    </div>

                    {canYonetici && (
                      <>
                        <Link
                          to="/assignments"
                          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 text-sm no-underline"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <FiBookOpen className="w-5 h-5" />
                          <span>📋 Ödev Atama</span>
                        </Link>
                        <Link
                          to="/ogrenci-analizleri"
                          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 text-sm no-underline"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <BsAward className="w-5 h-5" />
                          <span>Öğrenci Analizleri</span>
                        </Link>
                      </>
                    )}

                    {canFirma && (
                      <>
                        <Link
                          to="/student-homework"
                          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 text-sm no-underline"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <FiBookOpen className="w-5 h-5" />
                          <span>📚 Ödevlerim</span>
                        </Link>
                        <Link
                          to="/notlarim"
                          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 text-sm no-underline"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <BsAward className="w-5 h-5" />
                          <span>Notlarım</span>
                        </Link>
                      </>
                    )}

                    <Link
                      to="/profil"
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 text-sm no-underline"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <BsPersonFill className="w-5 h-5" />
                      <span>Profil Ayarları</span>
                    </Link>
                  </div>
                )}

                {/* Giriş/Çıkış (mobil) */}
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
