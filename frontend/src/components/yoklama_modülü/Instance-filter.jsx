import React, { useEffect, useState } from "react";
import { api } from "../../store/authSlice";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import { trTR } from "@mui/x-data-grid/locales";

export default function InstanceFilter() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ======================================================
  // STATE
  // ======================================================
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

  const [statusFilter, setStatusFilter] = useState("all"); 
  // all | normal | cancelled | rescheduled

  const [profile, setProfile] = useState(null);

  // Popups
  const [actionPopup, setActionPopup] = useState(null);
  const [cancelPopup, setCancelPopup] = useState(null);
  const [reschedulePopup, setReschedulePopup] = useState(null);
  const [selectedInstance, setSelectedInstance] = useState(null);

  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  // ======================================================
  // STATUS EMOJI
  // ======================================================
  const getStatusEmoji = (i) => {
    if (i.is_cancelled) return "❌ İptal Edildi";
    if (i.is_rescheduled) return "🔄 Ertelendi";
    return "🟩 Normal";
  };

  // ======================================================
  // PROFILE
  // ======================================================
  useEffect(() => {
    api.get("/current/profile/").then((res) => {
      const p = res.data;
      setProfile(p);
      if (p.profile_type === "teacher") {
        setTeacherId(String(p.profile.id));
      }
    });
  }, []);

  // ======================================================
  // URL PARAM İLE OTOMATİK FİLTRE
  // ======================================================
  useEffect(() => {
    const lp = searchParams.get("lesson");
    const tp = searchParams.get("teacher");
    const cp = searchParams.get("classroom");

    if (lp) setLessonId(lp);
    if (tp) setTeacherId(tp);
    if (cp) setClassroomId(cp);
  }, [searchParams]);

  // ======================================================
  // NORMAL + RESCHEDULED + CANCELLED API’LERİNİ GETİR
  // ======================================================
  useEffect(() => {
    async function load() {
      const normal = await api.get("/yts/course-program-instances/normal/");
      const rescheduled = await api.get("/yts/course-program-instances/rescheduled/");
      const cancelled = await api.get("/yts/course-program-instances/cancelled/");

      const combined = [...normal.data, ...rescheduled.data, ...cancelled.data];

      setInstances(combined);
      setFiltered(combined);
    }

    load();

    api.get("/yts/lessons/").then((res) => setLessons(res.data));
    api.get("/teachers/").then((res) => setTeachers(res.data));
    api.get("/classrooms/").then((res) => setClassrooms(res.data));
  }, []);

  // ======================================================
  // FILTERING
  // ======================================================
  useEffect(() => {
    let data = [...instances];

    // Tarih
    if (day && month && year) {
      const d = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      data = data.filter((i) => i.date === d);
    }

    // Ders
    if (lessonId) data = data.filter((i) => i.template.lesson?.id == lessonId);

    // Öğretmen
    if (profile?.profile_type === "teacher") {
      data = data.filter((i) => i.template.teacher?.id == profile.profile.id);
    } else if (teacherId) {
      data = data.filter((i) => i.template.teacher?.id == teacherId);
    }

    // Sınıf
    if (classroomId)
      data = data.filter((i) => i.template.classroom?.id == classroomId);

    // Durum filtresi
    if (statusFilter !== "all") {
      if (statusFilter === "normal")
        data = data.filter((i) => !i.is_cancelled && !i.is_rescheduled);

      if (statusFilter === "cancelled")
        data = data.filter((i) => i.is_cancelled);

      if (statusFilter === "rescheduled")
        data = data.filter((i) => i.is_rescheduled);
    }

    setFiltered(data);
  }, [
    instances,
    day,
    month,
    year,
    lessonId,
    teacherId,
    classroomId,
    statusFilter,
    profile,
  ]);

  if (!profile) return <div>Yükleniyor...</div>;

  // ======================================================
  // SESSION
  // ======================================================
  const getSession = async (id) => {
    const r = await api.get(`/yts/attendance-sessions/by-instance/${id}/`);
    return r.data.id;
  };

  // ======================================================
  // CANCEL
  // ======================================================
  const cancelLesson = async () => {
    await api.patch(`/yts/course-program-instances/${cancelPopup.id}/`, {
      is_cancelled: true,
      is_rescheduled: false,
    });
    setCancelPopup(null);
  };

  // ======================================================
  // RESCHEDULE (Dynamic backend duration)
  // ======================================================
  const rescheduleLesson = async () => {
    if (!newDate || !newTime) {
      alert("Lütfen tarih ve saat seçiniz.");
      return;
    }

    const inst = selectedInstance;
    const template = inst.template;

    let duration = 40;

    if (template.schedule_type?.id) {
      const r = await api.get(
        `/yts/schedule-type-day-details/by-schedule-type/${template.schedule_type.id}/`
      );

      const det = r.data.find(
        (d) => d.day_of_week === template.day_of_week
      );
      if (det?.lesson_duration) duration = det.lesson_duration;
    }

    // Zaman hesapla
    const [h, m] = newTime.split(":").map(Number);
    const startObj = new Date(2000, 1, 1, h, m);
    const endObj = new Date(startObj.getTime() + duration * 60000);

    const start_time = `${newTime}:00`;
    const end_time = `${String(endObj.getHours()).padStart(
      2,
      "0"
    )}:${String(endObj.getMinutes()).padStart(2, "0")}:00`;

    // Instance güncelle
    await api.patch(`/yts/course-program-instances/${inst.id}/`, {
      date: newDate,
      is_rescheduled: true,
      is_cancelled: false,
    });

    // Template saat güncelle
    await api.patch(`/yts/course-programs/${template.id}/`, {
      start_time,
      end_time,
    });

    setReschedulePopup(null);
  };

  // ======================================================
  // GRID
  // ======================================================
  const rows = filtered.map((i) => ({
    id: i.id,
    date: i.date,
    lesson: i.template.lesson?.name,
    classroom: i.template.classroom?.name,
    teacher: i.template.teacher?.user.full_name,
    status: getStatusEmoji(i),
    fullInstance: i,
  }));

  const columns = [
    { field: "date", headerName: "Tarih", flex: 1 },
    { field: "lesson", headerName: "Ders", flex: 1 },
    { field: "classroom", headerName: "Sınıf", flex: 1 },
    { field: "teacher", headerName: "Öğretmen", flex: 1 },
    {
      field: "status",
      headerName: "Durum",
      flex: 1,
      renderCell: (params) => (
        <span className="font-semibold">{params.row.status}</span>
      ),
    },
    {
      field: "action",
      headerName: "İşlemler",
      flex: 1,
      renderCell: (params) => (
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          onClick={() => {
            setSelectedInstance(params.row.fullInstance);
            setActionPopup(params.row);
          }}
        >
          İşlemler
        </button>
      ),
    },
  ];

  // ======================================================
  // RENDER
  // ======================================================
  return (
    <div className="w-full max-w-screen-2xl mx-auto p-4">

      <h2 className="text-2xl font-bold mb-6 text-red-700">
        Ders İşlemleri
      </h2>

      {/* FILTER PANEL */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 bg-white p-5 rounded-lg shadow">

        <input
          type="number"
          placeholder="Gün"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="number"
          placeholder="Ay"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="number"
          placeholder="Yıl"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border p-2 rounded"
        />

        <select
          className="border p-2 rounded"
          value={lessonId}
          onChange={(e) => setLessonId(e.target.value)}
        >
          <option value="">Ders Seç</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>

        {/* DURUM FİLTRESİ (SADECE ADMIN) */}
        {profile?.profile_type === "admin" && (
          <select
            className="border p-2 rounded"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tümü</option>
            <option value="normal">🟩 Normal</option>
            <option value="cancelled">❌ İptal Edilmiş</option>
            <option value="rescheduled">🔄 Ertelenmiş</option>
          </select>
        )}

        {/* Teacher */}
        {profile.profile_type === "teacher" ? (
          <input
            disabled
            className="border p-2 rounded bg-gray-100"
            value={
              teachers.find((t) => t.id == teacherId)?.user.full_name || ""
            }
          />
        ) : (
          <select
            className="border p-2 rounded"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
          >
            <option value="">Öğretmen</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.user.full_name}
              </option>
            ))}
          </select>
        )}

        {/* Classroom */}
        <select
          className="border p-2 rounded"
          value={classroomId}
          onChange={(e) => setClassroomId(e.target.value)}
        >
          <option value="">Sınıf</option>
          {classrooms.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div
        className="mt-6 bg-white p-3 rounded-lg shadow w-full"
        style={{ height: "calc(100vh - 260px)" }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 20, 50, 100]}
          pagination
          disableRowSelectionOnClick
          localeText={trTR.components.MuiDataGrid.defaultProps.localeText}
        />
      </div>

      {/* ACTION POPUP */}
      {actionPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">

          <div className="bg-white rounded-lg p-5 w-96">

            <h3 className="text-xl font-bold mb-3 text-red-700">Ders İşlemleri</h3>

            {/* Student */}
            {profile.profile_type === "student" && (
              <button
                className="w-full bg-blue-600 text-white p-2 rounded mb-2"
                onClick={async () => {
                  const sid = await getSession(actionPopup.id);
                  navigate(`/attendance-session/student/${sid}/${profile.profile.id}`);
                }}
              >
                Yoklama Verisine Eriş
              </button>
            )}

            {/* Teacher */}
            {profile.profile_type === "teacher" && (
              <button
                className="w-full bg-blue-600 text-white p-2 rounded mb-2"
                onClick={async () => {
                  const sid = await getSession(actionPopup.id);
                  navigate(`/attendance-session/teacher/${sid}`);
                }}
              >
                Yoklama Verilerine Eriş
              </button>
            )}

            {/* Admin */}
            {profile.profile_type === "admin" && (
              <>
                <button
                  className="w-full bg-blue-600 text-white p-2 rounded mb-2"
                  onClick={async () => {
                    const sid = await getSession(actionPopup.id);
                    navigate(`/attendance-session/admin/${sid}`);
                  }}
                >
                  Yoklama Verilerine Eriş
                </button>

                <button
                  className="w-full bg-red-600 text-white p-2 rounded mb-2"
                  onClick={() => {
                    setCancelPopup(actionPopup);
                    setActionPopup(null);
                  }}
                >
                  Dersi İptal Et
                </button>

                <button
                  className="w-full bg-yellow-600 text-white p-2 rounded"
                  onClick={() => {
                    setReschedulePopup(actionPopup);
                    setSelectedInstance(actionPopup.fullInstance);
                    setActionPopup(null);
                  }}
                >
                  Dersi Ertele
                </button>
              </>
            )}

            <button
              className="mt-4 w-full text-center text-gray-500"
              onClick={() => setActionPopup(null)}
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* CANCEL POPUP */}
      {cancelPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">

          <div className="bg-white rounded-lg p-5 w-96">
            <h3 className="text-xl font-bold text-red-700 mb-4">Dersi İptal Et</h3>

            <p>Bu dersi iptal etmek istediğinize emin misiniz?</p>

            <div className="flex gap-3 mt-4">
              <button
                className="w-1/2 bg-gray-300 text-black p-2 rounded"
                onClick={() => setCancelPopup(null)}
              >
                Vazgeç
              </button>

              <button
                className="w-1/2 bg-red-600 text-white p-2 rounded"
                onClick={cancelLesson}
              >
                İptal Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE POPUP */}
      {reschedulePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">

          <div className="bg-white rounded-lg p-5 w-96">

            <h3 className="text-xl font-bold text-yellow-700 mb-4">
              Dersi Ertele
            </h3>

            <p>Yeni Tarih</p>
            <input
              type="date"
              className="border p-2 rounded w-full mb-4"
              onChange={(e) => setNewDate(e.target.value)}
            />

            <p>Yeni Saat</p>
            <input
              type="time"
              className="border p-2 rounded w-full mb-4"
              onChange={(e) => setNewTime(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                className="w-1/2 bg-gray-300 text-black p-2 rounded"
                onClick={() => setReschedulePopup(null)}
              >
                Vazgeç
              </button>

              <button
                className="w-1/2 bg-yellow-600 text-white p-2 rounded"
                onClick={rescheduleLesson}
              >
                Ertele
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
