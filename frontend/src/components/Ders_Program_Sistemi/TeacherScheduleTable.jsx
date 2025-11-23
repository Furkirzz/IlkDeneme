// src/pages/TeacherScheduleTable.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../store/authSlice";
import ScheduleGrid from "./ScheduleGrid";
import "./schedule-grid.css";

export default function TeacherScheduleTable({ teacherId }) {
  const [teacherPrograms, setTeacherPrograms] = useState([]);
  const [teacherClassrooms, setTeacherClassrooms] = useState([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState(null);

  const [classroomPrograms, setClassroomPrograms] = useState([]);
  const [scheduleTypes, setScheduleTypes] = useState([]);          // sınıf bazlı tipler
  const [weeklyScheduleTypes, setWeeklyScheduleTypes] = useState([]); // haftalık mod tipleri
  const [selectedScheduleTypeId, setSelectedScheduleTypeId] = useState(null);

  const [dayDetails, setDayDetails] = useState([]);
  const [showOnlyMyLessons, setShowOnlyMyLessons] = useState(false);
  const [showFullWeeklyView, setShowFullWeeklyView] = useState(false); // Haftalık toplu mod
  const [popupInfo, setPopupInfo] = useState(null);

  const navigate = useNavigate();

  // -------------------------------------------------
  // 1) Öğretmenin tüm derslerini çek
  // -------------------------------------------------
  useEffect(() => {
    if (!teacherId) return;

    api
      .get(`/yts/course-programs/by-teacher/${teacherId}/`)
      .then((res) => {
        const data = res.data || [];
        setTeacherPrograms(data);

        // Öğretmenin ders verdiği sınıflar
        const classMap = new Map();
        data.forEach((p) => {
          if (p.classroom) classMap.set(p.classroom.id, p.classroom);
        });
        const cls = Array.from(classMap.values());
        setTeacherClassrooms(cls);
        if (!selectedClassroomId && cls.length > 0) {
          setSelectedClassroomId(cls[0].id);
        }

        // Haftalık toplu mod için program tipleri
        const stMap = new Map();
        data.forEach((p) => {
          if (p.schedule_type) stMap.set(p.schedule_type.id, p.schedule_type);
        });
        const weeklyTypes = Array.from(stMap.values());
        setWeeklyScheduleTypes(weeklyTypes);
      })
      .catch((err) => {
        console.error("Teacher programs error:", err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  // -------------------------------------------------
  // 2) Sınıf bazlı görünümdeysek, seçili sınıfın programlarını çek
  // -------------------------------------------------
  useEffect(() => {
    if (!selectedClassroomId || showFullWeeklyView) return;

    api
      .get(`/yts/course-programs/by-classroom/${selectedClassroomId}/`)
      .then((res) => {
        const data = res.data || [];
        setClassroomPrograms(data);

        const map = new Map();
        data.forEach((p) => {
          if (p.schedule_type) map.set(p.schedule_type.id, p.schedule_type);
        });
        const types = Array.from(map.values());
        setScheduleTypes(types);
      })
      .catch((err) => {
        console.error("Classroom programs error:", err);
      });
  }, [selectedClassroomId, showFullWeeklyView]);

  // -------------------------------------------------
  // 3) Mod + tip listeleri değişince default schedule type seç
  // -------------------------------------------------
  useEffect(() => {
    if (showFullWeeklyView) {
      // Haftalık toplu mod
      if (!selectedScheduleTypeId && weeklyScheduleTypes.length > 0) {
        setSelectedScheduleTypeId(weeklyScheduleTypes[0].id);
      }
    } else {
      // Sınıf bazlı mod
      if (!selectedScheduleTypeId && scheduleTypes.length > 0) {
        setSelectedScheduleTypeId(scheduleTypes[0].id);
      }
    }
  }, [showFullWeeklyView, weeklyScheduleTypes, scheduleTypes, selectedScheduleTypeId]);

  // -------------------------------------------------
  // 4) Seçili schedule type'a göre dayDetails çek
  // -------------------------------------------------
  useEffect(() => {
    if (!selectedScheduleTypeId) {
      setDayDetails([]);
      return;
    }

    api
      .get(
        `/yts/schedule-type-day-details/by-schedule-type/${selectedScheduleTypeId}/`
      )
      .then((res) => setDayDetails(res.data || []))
      .catch((err) => {
        console.error("Day details error:", err);
      });
  }, [selectedScheduleTypeId]);

  // -------------------------------------------------
  // 5) Sınıf bazlı mod için filtre
  // -------------------------------------------------
  let filtered = classroomPrograms.filter(
    (p) => p.schedule_type?.id === selectedScheduleTypeId
  );

  if (!showFullWeeklyView && showOnlyMyLessons) {
    filtered = filtered.filter((p) => p.teacher?.id === teacherId);
  }

  // -------------------------------------------------
  // 6) Haftalık toplu mod için filtre
  // -------------------------------------------------
  const weeklyPrograms = teacherPrograms.filter(
    (p) =>
      p.teacher?.id === teacherId &&
      p.schedule_type?.id === selectedScheduleTypeId
  );

  const programsForGrid = showFullWeeklyView ? weeklyPrograms : filtered;

  // -------------------------------------------------
  // 7) Render
  // -------------------------------------------------
  return (
    <div className="flex gap-4">
      <aside className="schedule-sidebar">
        {/* Mod Seçimi */}
        <h3 className="schedule-sidebar-title">Görünüm</h3>
        <button
          className={showFullWeeklyView ? "active" : ""}
          onClick={() => setShowFullWeeklyView(true)}
        >
          Hafta Boyunca Tüm Derslerim
        </button>
        <button
          className={!showFullWeeklyView ? "active" : ""}
          onClick={() => setShowFullWeeklyView(false)}
        >
          Sınıf Bazlı Görünüm
        </button>

        {/* Haftalık modda sadece program tipleri */}
        {showFullWeeklyView ? (
          <>
            <h3 className="schedule-sidebar-title">Program Tipleri</h3>
            {weeklyScheduleTypes.map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedScheduleTypeId(st.id)}
                className={st.id === selectedScheduleTypeId ? "active" : ""}
              >
                {st.name}
              </button>
            ))}
          </>
        ) : (
          <>
            {/* Sınıf Bazlı Mod */}
            <h3 className="schedule-sidebar-title">Sınıflar</h3>
            {teacherClassrooms.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassroomId(cls.id)}
                className={cls.id === selectedClassroomId ? "active" : ""}
              >
                {cls.name}
              </button>
            ))}

            <h3 className="schedule-sidebar-title">Program Tipleri</h3>
            {scheduleTypes.map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedScheduleTypeId(st.id)}
                className={st.id === selectedScheduleTypeId ? "active" : ""}
              >
                {st.name}
              </button>
            ))}

            <label className="schedule-checkbox-label">
              <input
                type="checkbox"
                checked={showOnlyMyLessons}
                onChange={() => setShowOnlyMyLessons(!showOnlyMyLessons)}
              />
              Sadece kendi derslerim
            </label>
          </>
        )}
      </aside>

      <main className="flex-1">
        {!dayDetails.length ? (
          <div>DERS YOK</div>
        ) : (
          <ScheduleGrid
            dayDetails={dayDetails}
            programs={programsForGrid}
            teacherId={teacherId} // sadece kendi derslerine tıklayabilsin
            onCellClick={(info) => setPopupInfo(info)}
          />
        )}
      </main>

      {popupInfo && (
        <div className="schedule-popup-overlay">
          <div className="schedule-popup">
            <div className="schedule-popup-header">
              <div className="schedule-popup-title">Yoklama Bilgisi</div>
              <button
                className="schedule-popup-close"
                onClick={() => setPopupInfo(null)}
              >
                Kapat
              </button>
            </div>

            <div className="mt-3 text-sm">
              Bu dersin yoklama verilerini görüntülemek istiyor musun?
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                className="schedule-popup-close"
                onClick={() => setPopupInfo(null)}
              >
                Vazgeç
              </button>

              <button
                className="schedule-popup-close"
                style={{ background: "var(--red-main)", color: "white" }}
                onClick={() => {
                  const program = popupInfo.programs.find(
                    (p) => p.teacher?.id === teacherId
                  );
                  if (!program) {
                    setPopupInfo(null);
                    return;
                  }
                  navigate(`/attendance-session/${program.id}`);
                }}
              >
                Evet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
