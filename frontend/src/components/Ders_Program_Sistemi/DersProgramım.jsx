import React, { useEffect, useState } from "react";
import { api } from "../../store/authSlice"; 

const DAY_LABELS = {
  monday: "Pazartesi",
  tuesday: "Salı",
  wednesday: "Çarşamba",
  thursday: "Perşembe",
  friday: "Cuma",
};

export default function CourseSchedule() {
  const [tableData, setTableData] = useState({});
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, []);

  async function loadSchedule() {
    try {
      // 1) Kullanıcı profil bilgisi
      const profileRes = await api.get("/student/profile/");
      const profile = profileRes.data;

      const role = profile.profile_type;
      const isTeacherUser = role === "teacher";
      setIsTeacher(isTeacherUser);

      let apiUrl = "";

      // 2) Öğretmen ise kendi dersleri
      if (isTeacherUser) {
        const teacherId = profile.profile?.id;
        apiUrl = `/yts/course-programs/?teacher_id=${teacherId}`;
      } else {
        // 3) Öğrenci ise sınıfına göre ders programı
        const classroomId = profile.profile?.classroom;

        apiUrl = `/yts/course-programs/?classroom_id=${classroomId}`;
      }

      // 4) API'den ders programı çek
      const res = await api.get(apiUrl);
      const cp = res.data;

      const grouped = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
      };

      cp.forEach((c) => {
        const day = c.day_of_week.toLowerCase();
        if (grouped[day]) grouped[day].push(c);
      });

      setTableData(grouped);
      setLoading(false);
    } catch (err) {
      console.error("Ders programı yüklenirken hata:", err);
      alert("Ders programı yüklenemedi!");
      setLoading(false);
    }
  }

  if (loading) return <p>Yükleniyor...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>{isTeacher ? "Öğretmen Ders Programı" : "Ders Programı"}</h2>

      <table
        border="1"
        cellPadding="10"
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <thead>
          <tr>
            {Object.keys(DAY_LABELS).map((day) => (
              <th key={day}>{DAY_LABELS[day]}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          <tr>
            {Object.keys(DAY_LABELS).map((day) => (
              <td key={day} style={{ verticalAlign: "top", minWidth: 150 }}>
                {tableData[day]?.length > 0 ? (
                  tableData[day].map((lesson) => (
                    <div
                      key={lesson.id}
                      style={{
                        marginBottom: 15,
                        paddingBottom: 5,
                        borderBottom: "1px solid #ddd",
                      }}
                    >
                      <p style={{ margin: 0, fontWeight: "bold" }}>
                        {lesson.name}
                      </p>

                      <p style={{ margin: 0 }}>
                        {lesson.start_time.substring(0, 5)} -{" "}
                        {lesson.end_time.substring(0, 5)}
                      </p>

                      {!isTeacher && (
                        <p style={{ margin: 0, fontStyle: "italic" }}>
                          Öğretmen: {lesson.teacher.full_name}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div>Ders Yok</div>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
