import React, { useEffect, useState } from "react";
import { api } from "../../store/authSlice";
import { useNavigate } from "react-router-dom";

export default function InstanceFilter() {
  const navigate = useNavigate();

  const [instances, setInstances] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [lessons, setLessons] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const [lessonId, setLessonId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [classroomId, setClassroomId] = useState("");

  const [profile, setProfile] = useState(null);

  // =====================================================
  // 1) Load current profile
  // =====================================================
  useEffect(() => {
    api.get("/current/profile/").then((res) => {
      setProfile(res.data);

      if (res.data.profile_type === "teacher") {
        setTeacherId(res.data.profile.id); // teacher ID kilitlenecek
      }
    });
  }, []);

  // =====================================================
  // 2) Load instances + dropdowns
  // =====================================================
  useEffect(() => {
    api.get("/yts/course-program-instances/normal/").then((res) => {
      setInstances(res.data);
      setFiltered(res.data);
    });

    api.get("/yts/lessons/").then((res) => setLessons(res.data));
    api.get("/teachers/").then((res) => setTeachers(res.data));
    api.get("/classrooms/").then((res) => setClassrooms(res.data));
  }, []);

  // =====================================================
  // 3) Filtering
  // =====================================================
  useEffect(() => {
    let data = [...instances];

    if (day && month && year) {
      const target = `${year}-${month.padStart(2, "0")}-${day.padStart(
        2,
        "0"
      )}`;
      data = data.filter((i) => i.date === target);
    }

    if (lessonId) data = data.filter((i) => i.template.lesson?.id == lessonId);

    if (teacherId)
      data = data.filter((i) => i.template.teacher?.id == teacherId);

    if (classroomId)
      data = data.filter((i) => i.template.classroom?.id == classroomId);

    setFiltered(data);
  }, [day, month, year, lessonId, teacherId, classroomId, instances]);

  if (!profile) return <div>Yükleniyor...</div>;

  // =====================================================
  // 4) Go to attendance session (fetch session by instance)
  // =====================================================
  const goToSession = async (instanceId) => {
    const res = await api.get(
      `/yts/attendance-sessions/by-instance/${instanceId}/`
    );

    const sessionId = res.data.id;

    const url =
      profile.profile_type === "teacher"
        ? `/attendance-session/teacher/${sessionId}`
        : `/attendance-session/admin/${sessionId}`;

    navigate(url);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6 text-red-700">
        Ders Yoklaması Filtreleme
      </h2>

      {/* ======================= FİLTRE PANELİ ======================= */}
      <div className="grid grid-cols-4 gap-4 bg-white p-5 rounded-lg shadow">

        <input
          value={day}
          onChange={(e) => setDay(e.target.value)}
          type="number"
          placeholder="Gün"
          className="border rounded p-2"
        />

        <input
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          type="number"
          placeholder="Ay"
          className="border rounded p-2"
        />

        <input
          value={year}
          onChange={(e) => setYear(e.target.value)}
          type="number"
          placeholder="Yıl"
          className="border rounded p-2"
        />

        <select
          value={lessonId}
          onChange={(e) => setLessonId(e.target.value)}
          className="border rounded p-2"
        >
          <option value="">Ders Seç</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        {/* Teacher filter — admin aktif, teacher kilitli */}
        {profile.profile_type === "admin" ? (
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="border rounded p-2"
          >
            <option value="">Öğretmen</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.user.full_name}
              </option>
            ))}
          </select>
        ) : (
          <input
            disabled
            value={
              teachers.find((t) => t.id == teacherId)?.user.full_name || ""
            }
            className="border rounded p-2 bg-gray-100 text-gray-500"
          />
        )}

        <select
          value={classroomId}
          onChange={(e) => setClassroomId(e.target.value)}
          className="border rounded p-2"
        >
          <option value="">Sınıf</option>
          {classrooms.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

      </div>

      {/* ======================= TABLO ======================= */}
      <table className="mt-6 w-full border rounded-lg overflow-hidden shadow">
        <thead className="bg-red-600 text-white">
          <tr>
            <th className="border px-3 py-2">Tarih</th>
            <th className="border px-3 py-2">Ders</th>
            <th className="border px-3 py-2">Sınıf</th>
            <th className="border px-3 py-2">Öğretmen</th>
            <th className="border px-3 py-2">İşlem</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((i) => (
            <tr key={i.id} className="hover:bg-red-50 transition">
              <td className="border px-3 py-2">{i.date}</td>
              <td className="border px-3 py-2">{i.template.lesson?.name}</td>
              <td className="border px-3 py-2">
                {i.template.classroom?.name}
              </td>
              <td className="border px-3 py-2">
                {i.template.teacher?.user.full_name}
              </td>
              <td className="border px-3 py-2 text-center">
                <button
                  onClick={() => goToSession(i.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                  İncele
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
