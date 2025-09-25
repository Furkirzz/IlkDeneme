import './index.css'; // Tailwind CSS dosyası
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import store, { persistor } from "./redux/store";
import { loadUserFromStorage } from './redux/authSlice';

// Sayfalar ve bileşenler
import MainLayout from './layouts/mainLayout';
import AnaSayfa from './components/AnaSayfa';

import SmartAssistant from './components/SmartAI/SmartAssistant';
import Takvim2 from './components/NewCalendar';
import LoginPage from './components/LoginPage';
import GoogleLoginButton from './components/User/GoogleLoginButton';
import UploadResult from './components/UploadResult';
import Manager from './components/Manager/Manager';
import CombinedResults from './components/CombinedResults';
import SmsGiris from './components/SmsGiris';

import HaftalikPlan from './components/HaftalikPlan';
import Hakkimizda from './components/Hakkimizda';

// Auth loader component
function AuthLoader() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Sayfa yüklendiğinde localStorage'dan token'ı yükle
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  return null;
}

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthLoader />
        <Router>
          <Routes>
            <Route
              element={
                <>
                  <SmartAssistant />
                  <MainLayout />
                </>
              }
            >
              <Route path="/" element={<AnaSayfa />} />
              <Route path="/haftalik-plan" element={<HaftalikPlan />} />
              <Route path="/takvim" element={<Takvim2 />} />
              <Route path="/sinav_okuma" element={<UploadResult />} />
              {/* <Route path="/basarilarimiz" element={<Basarilar />} /> */}
              <Route path="/hakkimizda" element={<Hakkimizda />} />
            </Route>

            {/* Giriş sayfaları */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/sms-giris" element={<SmsGiris />} />
            <Route path="/googleLogin" element={<GoogleLoginButton />} />
            <Route path="/manager" element={<Manager />} />
            <Route path="/combined-results" element={<CombinedResults />} />
          </Routes>
        </Router>
      </PersistGate>
    </Provider>
  );
}

export default App;
