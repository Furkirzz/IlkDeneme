// src/pages/StudentScheduleTable.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../../store/authSlice";
import ScheduleGrid from "./ScheduleGrid";
import "./schedule-grid.css";

export default function StudentScheduleTable({ classroomId, studentId }) {

  const [programs, setPrograms] = useState([]);
  const [scheduleTypes, setScheduleTypes] = useState([]);
  const [selectedScheduleTypeId, setSelectedScheduleTypeId] = useState(null);
  const [dayDetails, setDayDetails] = useState([]);
  const [popupInfo, setPopupInfo] = useState(null);

  const navigate = useNavigate();

  // -------------------------------------------------------
  // 1) CLASSROOM PROGRAMLARINI ÇEK
  // -------------------------------------------------------
  useEffect(() => {
    if (!classroomId) return;

    api
      .get(`/yts/course-programs/by-classroom/${classroomId}/`)
      .then((res) => {
        const data = res.data || [];
        setPrograms(data);

        const map = new Map();
        data.forEach((p) => {
          if (p.schedule_type) {
            map.set(p.schedule_type.id, p.schedule_type);
          }
        });

        // ❗ HATALI KOD buydu: const types = [...map.values()];
        const types = Array.from(map.values()); // ✔ DOĞRU YÖNTEM

        setScheduleTypes(types);

        if (types.length > 0) {
          setSelectedScheduleTypeId(types[0].id);
        }
      });
  }, [classroomId]);

  // -------------------------------------------------------
  // 2) SEÇİLEN PROGRAM TİPİNE AİT GÜN DETAYLARI
  // -------------------------------------------------------
  useEffect(() => {
  if (!selectedScheduleTypeId) return;

  console.log("📌 Seçilen Schedule Type ID:", selectedScheduleTypeId);

  api
    .get(`/yts/schedule-type-day-details/by-schedule-type/${selectedScheduleTypeId}/`)
    .then((res) => {
      console.log("📌 Backend'den gelen dayDetails:", res.data);
      setDayDetails(res.data || []);
    });
}, [selectedScheduleTypeId]);


  // -------------------------------------------------------
  // 3) SEÇİLİ PROGRAM TİPİNE GÖRE FİLTRE
  // -------------------------------------------------------
  const filtered = programs.filter(
    (p) => p.schedule_type?.id === selectedScheduleTypeId
  );

  // -------------------------------------------------------
  // 4) COMPONENT RENDER
  // -------------------------------------------------------
  return (
    <div className="flex gap-4">

      {/* =========================
          SOL MENÜ (Program Tipleri)
         ========================= */}
      <aside className="schedule-sidebar">
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
      </aside>

      {/* =========================
          ANA TABLO
         ========================= */}
      <main className="flex-1">
        {dayDetails.length === 0 ? (
          <div>DERS YOK</div>
        ) : (
          <ScheduleGrid
            dayDetails={dayDetails}
            programs={filtered}
            onCellClick={(info) => setPopupInfo(info)}
          />
        )}
      </main>

      {/* =========================
          POPUP
         ========================= */}
      {popupInfo && (
        <div className="schedule-popup-overlay">
          <div className="schedule-popup">

            <div className="schedule-popup-header">
              <div className="schedule-popup-title">
                Yoklama Bilgisi
              </div>

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
                  const program = popupInfo.programs[0];
                  navigate(`/attendance-session/student/${program.id}/${studentId}`);
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
