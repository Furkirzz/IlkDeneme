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
import Haftalik_Plan from './components/Haftalik_Plan';
import SmartAssistant from './components/SmartAI/SmartAssistant';
import Takvim2 from './components/NewCalendar.jsx';
import LoginPage from './components/LoginPage.js';
import GoogleLoginButton from './components/User/GoogleLoginButton.js';
import UploadResult from './components/UploadResult.jsx';
import Manager from './components/Manager/Manager.jsx';
import CombinedResults from './components/CombinedResults.jsx';
import SmsGiris from './components/SmsGiris.jsx';
import Basarilar from './components/Basarilar.js';
import Hakkimizda from './components/hakkimizda.js';


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
              <Route path="/HaftalikPlan" element={<Haftalik_Plan />} />
              <Route path="/takvim" element={<Takvim2 />} />
              <Route path="/sinav_okuma" element={<UploadResult />} />
              <Route path="/basarilarimiz" element={<Basarilar />} />
              <Route path='/Hakkimizda' element={<Hakkimizda />} />


            </Route>

            {/* Giriş sayfaları */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/sms-giris" element={<SmsGiris />} />
            <Route path="/googleLogin" element={<GoogleLoginButton />} />
            <Route path="/Manager" element={<Manager />} />
            <Route path="/combined-results" element={<CombinedResults />} />
          </Routes>
        </Router>
      </PersistGate>
    </Provider>
  );
}

export default App;
