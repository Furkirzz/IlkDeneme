// src/App.jsx
import "./index.css"; // Tailwind CSS
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { Provider, useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import store, { persistor } from "./store/store";
import { fetchMe, selectAccess } from "./store/authSlice";

// Sayfalar ve bileşenler
import MainLayout from "./layouts/mainLayout";
import AnaSayfa from "./components/AnaSayfa";
import SmartAssistant from "./components/SmartAI/SmartAssistant";
import Takvim2 from "./components/NewCalendar";
import LoginPage from "./components/LoginPage";
import GoogleLoginButton from "./components/User/GoogleLoginButton";
import UploadResult from "./components/UploadResult";
import Manager from "./components/Manager/Manager";
import CombinedResults from "./components/CombinedResults";
import SmsGiris from "./components/SmsGiris";
import HaftalikPlan from "./components/HaftalikPlan";
import Hakkimizda from "./components/Hakkimizda";
import AttendanceSystem from "./components/yoklama_modülü/AttendanceSystem";
import StudentAttendanceStats from "./components/yoklama_modülü/StudentAttendenceStats";
import ImportResults from "./pdf/ImportResults";
import Deneme from "./pdf/deneme";

// Auth loader: access varsa profil bilgilerini tazeler
function AuthLoader() {
  const dispatch = useDispatch();
  const access = useSelector(selectAccess);

  useEffect(() => {
    if (access) {
      dispatch(fetchMe());
    }
  }, [dispatch, access]);

  return null;
}

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {/* Provider içinde çalışmalı */}
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
              <Route path="/hakkimizda" element={<Hakkimizda />} />
              <Route path="/yoklama" element={<AttendanceSystem />} />
              <Route path="/yoklama/:lessonId/:date" element={<AttendanceSystem />} />
              <Route path="/student-attendance/:id" element={<StudentAttendanceStats />} />
              <Route path="/import-results" element={<ImportResults />} />
              <Route path="/pdf-deneme" element={<Deneme />} />
            </Route>

            {/* Giriş sayfaları */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/sms-giris" element={<SmsGiris />} />
            <Route path="/googleLogin" element={<GoogleLoginButton />} />

            {/* Yönetim */}
            <Route path="/manager" element={<Manager />} />
            <Route path="/combined-results" element={<CombinedResults />} />


          </Routes>
        </Router>
      </PersistGate>
    </Provider>
  );
}

export default App;
