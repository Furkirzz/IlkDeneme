// src/pages/AdminScheduleTable.jsx

import React, { useEffect, useState } from "react";
import { api } from "../../store/authSlice";
import ScheduleGrid from "./ScheduleGrid";
import "./schedule-grid.css";
import { useNavigate } from "react-router-dom";


export default function AdminScheduleTable() {
  const [scheduleTypes, setScheduleTypes] = useState([]);
  const [selectedScheduleTypeId, setSelectedScheduleTypeId] = useState(null);

  const [allPrograms, setAllPrograms] = useState([]);
  const [dayDetails, setDayDetails] = useState([]);

  const [popupInfo, setPopupInfo] = useState(null);
  const navigate = useNavigate();


  useEffect(() => {
    Promise.all([
      api.get("/yts/schedule-types/"),
      api.get("/yts/course-programs/"),
    ]).then(([st, cp]) => {
      setScheduleTypes(st.data);
      setAllPrograms(cp.data);

      if (st.data.length > 0) setSelectedScheduleTypeId(st.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedScheduleTypeId) return;

    api
      .get(
        `/yts/schedule-type-day-details/by-schedule-type/${selectedScheduleTypeId}/`
      )
      .then((res) => setDayDetails(res.data || []));
  }, [selectedScheduleTypeId]);

  const filtered = allPrograms.filter(
    (p) => p.schedule_type?.id === selectedScheduleTypeId
  );

  return (
    <div className="relative flex gap-4">
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


      <main className="flex-1">
        {!dayDetails.length ? (
          <div>DERS YOK</div>
        ) : (
          <ScheduleGrid
            dayDetails={dayDetails}
            programs={filtered}
            onCellClick={(info) => setPopupInfo(info)}
          />
        )}
      </main>

      {/* POPUP */}
      {popupInfo && (
  <div className="schedule-popup-overlay">
    <div className="schedule-popup">

      <div className="schedule-popup-header">
        <div className="schedule-popup-title">
          {popupInfo.slot.label} — Detaylar
        </div>

        <button
          className="schedule-popup-close"
          onClick={() => setPopupInfo(null)}
        >
          Kapat
        </button>
      </div>

      <div className="mt-3 max-h-[320px] overflow-auto">
        {popupInfo.programs.map((p) => (
  <div key={p.id} className="border rounded p-2 mb-2 text-sm space-y-1">
    <div className="font-semibold">
      {p.classroom?.name} — {p.lesson?.name}
    </div>

    <div className="text-xs">
      Öğretmen: {p.teacher?.user?.full_name}
    </div>

    <button
      onClick={() => navigate( `/ders-islemleri?lesson=${p.lesson.id}&teacher=${p.teacher.id}&classroom=${p.classroom.id}`)}
      className="mt-2 text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
    >
      Bu Dersin İşlemlerine Git
    </button>
  </div>
))}

      </div>

    </div>
  </div>
)}

    </div>
  );
}
