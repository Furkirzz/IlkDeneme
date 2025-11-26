// src/pages/ScheduleTable.jsx

import React, { useEffect, useState } from "react";
import { api } from "../../store/authSlice";

import StudentScheduleTable from "./StudentScheduleTable";
import TeacherScheduleTable from "./TeacherScheduleTable";
import AdminScheduleTable from "./AdminScheduleTable";

export default function ScheduleTable() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  const [studentClassroomId, setStudentClassroomId] = useState(null);
  const [studentId, setStudentId] = useState(null);

  const [teacherId, setTeacherId] = useState(null);

 useEffect(() => {
  (async () => {
    try {
      setLoading(true);

      const res = await api.get("/current/profile/");
      const prof = res.data;

      console.log("📌 PROF:", prof);                // <--- BUNLAR ÇOK ÖNEMLİ
      console.log("📌 profile_type:", prof.profile_type);

      const p = prof.profile;
      console.log("📌 profile objesi:", p);

      setRole(prof.profile_type);

      if (prof.profile_type === "student") {
        console.log("📌 Öğrenci olarak algılandı!");
        setStudentId(p.id);
        setStudentClassroomId(p.classroom?.id || p.classroom);
      }

      if (prof.profile_type === "parent") {
        console.log("📌 Veli olarak algılandı!");
        setStudentId(p.child?.id);
        setStudentClassroomId(p.child?.classroom?.id || p.child?.classroom);
      }

      if (prof.profile_type === "teacher") {
        console.log("📌 Öğretmen olarak algılandı!");
        setTeacherId(p.id);
      }

    } catch (err) {
      console.error("Profile error:", err);
    } finally {
      setLoading(false);
    }
  })();
}, []);

console.log("📌 Render — role:", role);
console.log("📌 Render — studentId:", studentId);
console.log("📌 Render — classroomId:", studentClassroomId);
console.log("📌 Render — teacherId:", teacherId);


  // -------------------------------------------------------
  // LOADING / ROLE CHECK
  // -------------------------------------------------------

  if (loading) return <div>Yükleniyor...</div>;
  if (!role) return <div>Profil bulunamadı.</div>;

  // -------------------------------------------------------
  // STUDENT
  // -------------------------------------------------------

  if (role === "student") {
    return (
      <StudentScheduleTable
        classroomId={studentClassroomId}
        studentId={studentId}
      />
    );
  }

  // -------------------------------------------------------
  // PARENT — Çocuk öğrencinin aynı componenti
  // -------------------------------------------------------

  if (role === "parent") {
    return (
      <StudentScheduleTable
        classroomId={studentClassroomId}
        studentId={studentId}
      />
    );
  }

  // -------------------------------------------------------
  // TEACHER
  // -------------------------------------------------------

  if (role === "teacher") {
    return <TeacherScheduleTable teacherId={teacherId} />;
  }

  // -------------------------------------------------------
  // ADMIN
  // -------------------------------------------------------

  if (role === "admin") {
    return <AdminScheduleTable />;
  }

  return <div>Yetkisiz erişim</div>;
}
