// src/App.jsx
import "./index.css";
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { Provider, useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import store, { persistor } from "./store/store";
import { fetchMe, selectAccess } from "./store/authSlice";

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
import Hakkimizda from "./components/Hakkimizda";
import ImportResults from "./pdf/ImportResults";
import Deneme from "./pdf/deneme";
import ScheduleTable from "./components/Ders_Program_Sistemi/ScheduleTable";
import CreateAssignment from "./components/Coach/CreateAssignment";
import MyAssignments from "./components/Coach/MyAssignments";
import AssignmentReport from "./components/Coach/AssignmentReport";
import InstanceFilter from "./components/yoklama_modülü/Instance-filter";


// ===============================================
//  AppWithStore → tüm auth işlemleri burada
// ===============================================
function AppWithStore() {
  const dispatch = useDispatch();
  const access = useSelector(selectAccess);

  const user = useSelector((s) => s.auth.user);
  const isStudent = user?.profile_type === "student";
  const isTeacher = user?.profile_type === "teacher";
  const isAdmin = user?.is_superuser;
  const isStaff = user?.is_staff;

  useEffect(() => {
    if (access) dispatch(fetchMe());
  }, [dispatch, access]);

  return (
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
          <Route path="/takvim" element={<Takvim2 />} />
          <Route path="/sinav_okuma" element={<UploadResult />} />
          <Route path="/hakkimizda" element={<Hakkimizda />} />
          <Route path="/import-results" element={<ImportResults />} />
          <Route path="/pdf-deneme" element={<Deneme />} />
          <Route path="/schedule-table" element={<ScheduleTable />} />
          <Route path="/ders-islemleri" element={<InstanceFilter />} />
          

          {/* Koçluk Modülü */}
          {(isAdmin || isStaff) && (
            <>
              <Route path="/coaching/new" element={<CreateAssignment />} />
              <Route path="/coaching/assignments/:id/report" element={<AssignmentReport />} />
            </>
          )}

          {isStudent && (
            <Route path="/coaching/my-assignments" element={<MyAssignments />} />
          )}
        </Route>

        {/* Auth Pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sms-giris" element={<SmsGiris />} />
        <Route path="/googleLogin" element={<GoogleLoginButton />} />

        {/* Yönetim */}
        <Route path="/manager" element={<Manager />} />
        <Route path="/combined-results" element={<CombinedResults />} />
      </Routes>
    </Router>
  );
}


// ===============================================
//  Provider Wrapping
// ===============================================
function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppWithStore />
      </PersistGate>
    </Provider>
  );
}

export default App;
