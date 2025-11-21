// src/pages/CourseSchedule.jsx
import React, { useEffect, useState } from "react";
import { api } from "../../store/authSlice";

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DAY_LABELS = {
  monday: "Pazartesi",
  tuesday: "Salı",
  wednesday: "Çarşamba",
  thursday: "Perşembe",
  friday: "Cuma",
  saturday: "Cumartesi",
  sunday: "Pazar",
};

export default function CourseSchedule() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null); // "student" | "teacher"

  const [scheduleGrid, setScheduleGrid] = useState({});
  const [maxRows, setMaxRows] = useState(0);

  // program listeleri
  const [coursePrograms, setCoursePrograms] = useState([]); // aktif kullanılan liste
  const [teacherAllPrograms, setTeacherAllPrograms] = useState([]); // sadece öğretmen için

  // schedule type seçimi
  const [scheduleTypes, setScheduleTypes] = useState([]); // [{id,name,...}]
  const [selectedScheduleTypeId, setSelectedScheduleTypeId] = useState(null);

  // öğretmene özel filtreler
  const [teacherMode, setTeacherMode] = useState("self"); // "self" | "classroom"
  const [teacherClassrooms, setTeacherClassrooms] = useState([]); // [{id,name,grade_level}]
  const [selectedClassroomId, setSelectedClassroomId] = useState(null);

  // -------------------------------------------------
  // İlk yükleme: profil + başlangıç programları
  // -------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const profileRes = await api.get("/current/profile/");
        const prof = profileRes.data;
        setProfile(prof);
        const r = prof.profile_type;
        setRole(r);

        const p = prof.profile;

        if (r === "student") {
          // Öğrenci: sadece kendi sınıfının programları
          const classroomId = p.classroom;
          const cpRes = await api.get(
            `/yts/course-programs/by-classroom/${classroomId}/`
          );
          const cpList = cpRes.data || [];
          setCoursePrograms(cpList);
        } else if (r === "teacher") {
          // Öğretmen: tüm girdiği dersler
          const teacherId = p.id;
          const cpRes = await api.get(
            `/yts/course-programs/by-teacher/${teacherId}/`
          );
          const cpList = cpRes.data || [];
          setTeacherAllPrograms(cpList);
          setCoursePrograms(cpList);

          // Öğretmenin girdiği sınıflar listesi
          const classroomMap = new Map();
          cpList.forEach((cp) => {
            if (cp.classroom) {
              classroomMap.set(cp.classroom.id, cp.classroom);
            }
          });
          const classesArr = Array.from(classroomMap.values());
          setTeacherClassrooms(classesArr);
          if (classesArr.length > 0) {
            setSelectedClassroomId(classesArr[0].id);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Profil / başlangıç programları yüklenemedi:", err);
        setLoading(false);
      }
    })();
  }, []);

  // -------------------------------------------------
  // coursePrograms değişince scheduleType listesini çıkar
  // -------------------------------------------------
  useEffect(() => {
    if (!coursePrograms || coursePrograms.length === 0) {
      setScheduleTypes([]);
      setSelectedScheduleTypeId(null);
      setScheduleGrid({});
      setMaxRows(0);
      return;
    }

    const stMap = new Map();
    coursePrograms.forEach((cp) => {
      if (cp.schedule_type) {
        stMap.set(cp.schedule_type.id, cp.schedule_type);
      }
    });

    const stArr = Array.from(stMap.values());
    setScheduleTypes(stArr);

    // seçili yoksa ilkini seç
    if (!selectedScheduleTypeId && stArr.length > 0) {
      setSelectedScheduleTypeId(stArr[0].id);
    }
  }, [coursePrograms]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------
  // Grid hesaplama
  // -------------------------------------------------
  useEffect(() => {
    if (!selectedScheduleTypeId) return;
    if (!coursePrograms || coursePrograms.length === 0) return;

    (async () => {
      try {
        setLoading(true);

        // 1) Bu schedule_type'a ait day detail verileri
        const ddRes = await api.get(
          `/yts/schedule-type-day-details/?schedule_type=${selectedScheduleTypeId}`
        );
        const dayDetails = ddRes.data || [];

        // 2) Bu schedule_type'a ait dersler
        let cpFiltered = coursePrograms.filter(
          (cp) => cp.schedule_type && cp.schedule_type.id === selectedScheduleTypeId
        );

        // Öğretmen modunda sınıfa göre ekstra filtre
        if (role === "teacher" && teacherMode === "classroom" && selectedClassroomId) {
          cpFiltered = cpFiltered.filter(
            (cp) => cp.classroom && cp.classroom.id === selectedClassroomId
          );
        }

        const grid = buildGridFromData(dayDetails, cpFiltered);
        setScheduleGrid(grid);

        // maksimum satır sayısı
        const mr = Math.max(
          0,
          ...DAY_ORDER.map((d) => (grid[d] ? grid[d].length : 0))
        );
        setMaxRows(mr);

        setLoading(false);
      } catch (err) {
        console.error("Program grid hesaplanırken hata:", err);
        setLoading(false);
      }
    })();
  }, [
    selectedScheduleTypeId,
    coursePrograms,
    role,
    teacherMode,
    selectedClassroomId,
  ]);

  // -------------------------------------------------
  // Helper: grid oluşturma
  // -------------------------------------------------
  function buildGridFromData(dayDetails, cpList) {
    const grid = {};

    const addMinutes = (time, mins) => {
      const [h, m] = time.split(":").map(Number);
      const d = new Date(0, 0, 0, h, m + mins);
      return d.toTimeString().substring(0, 5);
    };

    DAY_ORDER.forEach((day) => {
      const info = dayDetails.find((d) => d.day_of_week === day);

      // Bu gün için day_detail yoksa bir boş slot koy
      if (!info) {
        grid[day] = [
          {
            lesson: "-",
            teacher: "-",
            time: "-",
          },
        ];
        return;
      }

      const slots = [];
      let current = info.start_time.substring(0, 5);
      const total = info.lessons_before_noon + info.lessons_after_noon;

      for (let i = 0; i < total; i++) {
        const start = current;
        const end = addMinutes(start, info.lesson_duration);

        const match = cpList.find(
          (cp) =>
            cp.day_of_week === day &&
            cp.start_time &&
            cp.start_time.substring(0, 5) === start
        );

        slots.push({
          lesson: match && match.lesson ? match.lesson.name : "-",
          teacher:
            match && match.teacher && match.teacher.user
              ? match.teacher.user.full_name
              : "-",
          time: `${start} - ${end}`,
        });

        // sonraki slot başlangıcı
        current = addMinutes(start, info.lesson_duration);

        if (i === info.lessons_before_noon - 1) {
          current = addMinutes(current, info.lunch_break_duration);
        } else {
          current = addMinutes(current, info.break_duration);
        }
      }

      grid[day] = slots;
    });

    return grid;
  }

  // -------------------------------------------------
  // Stil ve küçük bileşenler
  // -------------------------------------------------
  const primaryRed = "#E53935";
  const darkRed = "#B71C1C";
  const softRedBg = "#FFEBEE";
  const hoverRed = "#FFCDD2";
  const textColor = "#424242";
  const fontFamily = "'Poppins', sans-serif";

  const styles = {
    layout: {
      display: "flex",
      gap: 24,
      alignItems: "flex-start",
    },
    sidebar: {
      width: 260,
      backgroundColor: "#fff",
      borderRadius: 12,
      boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
      padding: 20,
      fontFamily,
    },
    sidebarTitle: {
      fontSize: "1.1em",
      fontWeight: 600,
      color: darkRed,
      marginBottom: 10,
    },
    sidebarSection: {
      marginBottom: 20,
      borderBottom: `1px solid ${hoverRed}`,
      paddingBottom: 12,
    },
    sidebarButton: (active) => ({
      width: "100%",
      textAlign: "left",
      padding: "8px 10px",
      marginBottom: 6,
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
      fontFamily,
      backgroundColor: active ? hoverRed : "transparent",
      color: active ? darkRed : textColor,
      fontWeight: active ? 600 : 400,
    }),
    select: {
      width: "100%",
      padding: "8px 10px",
      borderRadius: 8,
      border: `1px solid ${hoverRed}`,
      fontFamily,
      marginTop: 6,
    },
    container: {
      padding: 30,
      fontFamily,
      backgroundColor: softRedBg,
      minHeight: "100vh",
    },
    title: {
      textAlign: "center",
      marginBottom: 30,
      color: darkRed,
      fontSize: "2.3em",
      fontWeight: 700,
    },
    tableWrapper: {
      flex: 1,
    },
    table: {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: 0,
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: "#fff",
    },
    tableHeader: {
      backgroundColor: darkRed,
      color: "white",
      fontWeight: 600,
      padding: "16px 10px",
      textAlign: "center",
      textTransform: "uppercase",
      fontSize: "0.95em",
      letterSpacing: "0.08em",
    },
    tableCell: {
      padding: 0,
      borderBottom: `1px solid ${hoverRed}`,
      borderRight: `1px solid ${hoverRed}`,
    },
    clickableBlock: {
      minWidth: 180,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      width: "100%",
      padding: 18,
      textAlign: "left",
      backgroundColor: "transparent",
      border: "none",
      cursor: "pointer",
      transition: "all 0.25s ease",
      position: "relative",
    },
    clickableEmpty: {
      minHeight: "90px",
      backgroundColor: "#F8F8F8",
      cursor: "default",
      color: "#BDBDBD",
      fontStyle: "italic",
    },
    clickableHover: {
      backgroundColor: hoverRed,
      transform: "translateY(-2px)",
      boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
      zIndex: 1,
    },
    lessonName: {
      fontWeight: 700,
      color: primaryRed,
      fontSize: "1.1em",
      marginBottom: 4,
      textTransform: "capitalize",
    },
    teacher: {
      color: textColor,
      fontSize: "0.9em",
      marginBottom: 6,
      borderBottom: `1px dashed ${hoverRed}`,
      paddingBottom: 4,
    },
    time: {
      color: darkRed,
      fontWeight: 600,
      fontSize: "0.85em",
      marginTop: 4,
    },
    emptyText: {
      textAlign: "center",
      margin: "auto",
      fontSize: "0.95em",
      fontWeight: 500,
    },
    infoText: {
      fontSize: "0.85em",
      color: "#757575",
      marginTop: 8,
    },
  };

  const handleLessonClick = (slot) => {
    if (!slot || slot.lesson === "-" || !slot.lesson) return;
    // İstersen buraya detay sayfasına yönlendirme ekleyebilirsin
    // örn: navigate(`/dersler?name=${encodeURIComponent(slot.lesson)}`)
  };

  const ClickableScheduleCell = ({ slot }) => {
    const [isHovered, setIsHovered] = React.useState(false);

    if (!slot || !slot.lesson || slot.lesson === "-") {
      return (
        <div
          style={{
            ...styles.clickableBlock,
            ...styles.clickableEmpty,
          }}
        >
          <span style={styles.emptyText}>DERS YOK</span>
        </div>
      );
    }

    const currentStyle = isHovered
      ? { ...styles.clickableBlock, ...styles.clickableHover }
      : styles.clickableBlock;

    return (
      <button
        type="button"
        style={currentStyle}
        onClick={() => handleLessonClick(slot)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
      >
        <div style={styles.lessonName}>{slot.lesson}</div>
        <div style={styles.teacher}>Öğretmen: {slot.teacher || "-"}</div>
        <div style={styles.time}>{slot.time || "--:--"}</div>
      </button>
    );
  };

  // -------------------------------------------------

  if (loading && !profile) return <p>Yükleniyor...</p>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Ders Programı Takvimi</h2>

      <div style={styles.layout}>
        {/* SOL FİLTRE PANELİ */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarSection}>
            <div style={styles.sidebarTitle}>Program Tipleri</div>
            {scheduleTypes.length === 0 && (
              <div style={styles.infoText}>
                Bu kullanıcı için program tipi bulunamadı.
              </div>
            )}
            {scheduleTypes.map((st) => (
              <button
                key={st.id}
                style={styles.sidebarButton(st.id === selectedScheduleTypeId)}
                onClick={() => setSelectedScheduleTypeId(st.id)}
              >
                {st.name}
              </button>
            ))}
          </div>

          {role === "teacher" && (
            <div style={styles.sidebarSection}>
              <div style={styles.sidebarTitle}>Sınıf Filtresi</div>
              <select
                style={styles.select}
                value={teacherMode}
                onChange={(e) => {
                  const value = e.target.value;
                  setTeacherMode(value);
                  if (value === "self") {
                    setCoursePrograms(teacherAllPrograms);
                  } else if (
                    value === "classroom" &&
                    selectedClassroomId &&
                    teacherAllPrograms.length
                  ) {
                    const filtered = teacherAllPrograms.filter(
                      (cp) =>
                        cp.classroom && cp.classroom.id === selectedClassroomId
                    );
                    setCoursePrograms(filtered);
                  }
                }}
              >
                <option value="self">Sadece kendi derslerim</option>
                <option value="classroom">Sınıfa göre filtrele</option>
              </select>

              {teacherMode === "classroom" && (
                <>
                  <div style={{ marginTop: 10, fontSize: "0.9em" }}>
                    Sınıf Seç
                  </div>
                  <select
                    style={styles.select}
                    value={selectedClassroomId || ""}
                    onChange={(e) => {
                      const id = Number(e.target.value || 0);
                      setSelectedClassroomId(id || null);
                      if (id && teacherAllPrograms.length) {
                        const filtered = teacherAllPrograms.filter(
                          (cp) => cp.classroom && cp.classroom.id === id
                        );
                        setCoursePrograms(filtered);
                      } else {
                        setCoursePrograms(teacherAllPrograms);
                      }
                    }}
                  >
                    {teacherClassrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <div style={styles.infoText}>
                Öğretmenler hem kendi programını hem de dersine girdiği diğer
                sınıfların programlarını görebilir.
              </div>
            </div>
          )}

          {role === "student" && (
            <div style={styles.sidebarSection}>
              <div style={styles.sidebarTitle}>Bilgi</div>
              <div style={styles.infoText}>
                Bu ekranda sadece kayıtlı olduğunuz sınıfın ders program
                tiplerine erişebilirsiniz.
              </div>
            </div>
          )}
        </aside>

        {/* SAĞ TARAF: TABLO */}
        <div style={styles.tableWrapper}>
          {loading && <p>Tablo güncelleniyor...</p>}

          {!loading && maxRows === 0 && (
            <p>Bu filtreyle eşleşen ders bulunamadı.</p>
          )}

          {!loading && maxRows > 0 && (
            <table style={styles.table}>
              <thead>
                <tr>
                  {DAY_ORDER.map((day) => (
                    <th key={day} style={styles.tableHeader}>
                      {DAY_LABELS[day]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxRows }).map((_, rowIdx) => (
                  <tr key={rowIdx}>
                    {DAY_ORDER.map((day) => {
                      const slot = scheduleGrid[day]?.[rowIdx];
                      return (
                        <td key={day} style={styles.tableCell}>
                          <ClickableScheduleCell slot={slot} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
