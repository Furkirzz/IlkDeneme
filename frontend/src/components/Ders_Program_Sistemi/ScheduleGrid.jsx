// src/components/schedule/ScheduleGrid.jsx

import React, { useMemo } from "react";
// import "./schedule-grid.css"; ARTIK GEREKSİZ, ORTAK CSS KULLANILACAK

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

// ... (parseTimeToMinutes, formatMinutesToTime, buildSlotsForDay fonksiyonları aynı kalır)

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function formatMinutesToTime(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function buildSlotsForDay(d) {
  if (!d.start_time) return [];
  const slots = [];
  let current = parseTimeToMinutes(d.start_time);

  // Sabah dersleri
  for (let i = 0; i < d.lessons_before_noon; i++) {
    const start = current;
    const end = start + d.lesson_duration;
    slots.push({
      index: slots.length,
      startMinutes: start,
      endMinutes: end,
      label: `${formatMinutesToTime(start)}-${formatMinutesToTime(end)}`,
      isLunch: false,
    });
    current = end + d.break_duration;
  }

  // Öğle arası
  if (d.lunch_break_duration > 0) {
    const lunchStart = current;
    const lunchEnd = lunchStart + d.lunch_break_duration;
    slots.push({
      index: slots.length,
      startMinutes: lunchStart,
      endMinutes: lunchEnd,
      label: `${formatMinutesToTime(lunchStart)}-${formatMinutesToTime(
        lunchEnd
      )}`,
      isLunch: true,
    });
    current = lunchEnd;
  }

  // Öğleden sonra dersleri
  for (let i = 0; i < d.lessons_after_noon; i++) {
    const start = current;
    const end = start + d.lesson_duration;
    slots.push({
      index: slots.length,
      startMinutes: start,
      endMinutes: end,
      label: `${formatMinutesToTime(start)}-${formatMinutesToTime(end)}`,
      isLunch: false,
    });
    current = end + d.break_duration;
  }

  return slots;
}

export default function ScheduleGrid({ dayDetails, programs, teacherId, onCellClick }) {
  const { dayToSlots, maxSlots } = useMemo(() => {
    const map = {};
    let max = 0;
    dayDetails.forEach((d) => {
      const slots = buildSlotsForDay(d);
      map[d.day_of_week] = slots;
      max = Math.max(max, slots.length);
    });
    return { dayToSlots: map, maxSlots: max };
  }, [dayDetails]);

  if (!dayDetails.length) return <div>DERS YOK</div>;

  const getProgramsForCell = (dayKey, slot) => {
    if (!slot) return [];
    return programs.filter((p) => {
      if (p.day_of_week !== dayKey) return false;
      return parseTimeToMinutes(p.start_time) === slot.startMinutes;
    });
  };

  return (
    <table className="schedule-table">
      <thead>
        <tr className="bg-gray-100">
          {DAY_ORDER.filter((d) => dayToSlots[d]).map((day) => (
            <th key={day} className="border px-2 py-1">
              {DAY_LABELS[day]}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {Array.from({ length: maxSlots }).map((_, rowIdx) => (
          <tr key={rowIdx}>
            {DAY_ORDER.filter((d) => dayToSlots[d]).map((dayKey) => {
              const slot = dayToSlots[dayKey]?.[rowIdx];
              if (!slot)
                return <td key={dayKey} className="border px-2 py-1" />;

              const cellPrograms = getProgramsForCell(dayKey, slot);
              let clickable = onCellClick && cellPrograms.length > 0;

// 🔥 Eğer teacherId gönderildiyse, sadece öğretmenin kendi dersleri tıklanabilir olsun
if (teacherId) {
  const hasOwnLesson = cellPrograms.some(
    (p) => p.teacher?.id === teacherId
  );
  clickable = clickable && hasOwnLesson;
}


              return (
                <td
                  key={dayKey}
                  // Sınıflandırmayı schedule.css'e taşıdık
                  className={
                    "border px-2 py-1 align-top" +
                    (clickable ? " clickable" : "")
                  }
                  onClick={() =>
                    clickable && onCellClick({ dayKey, slot, programs: cellPrograms })
                  }
                >
                  {/* Her kutucukta saat bilgisi */}
                  <div className="schedule-slot-time">
                    {slot.label}
                  </div>

                  {/* Ders içerikleri */}
                  {slot.isLunch ? (
                    <div className="schedule-lunch">Öğle Arası</div>
                  ) : cellPrograms.length === 0 ? (
                    <div className="schedule-empty">DERS YOK</div>
                  ) : (
                    cellPrograms.map((p) => (
                      <div key={p.id} className="schedule-lesson-box">
                        <div className="schedule-lesson-title">{p.lesson?.name}</div>
                        <div className="schedule-lesson-info">Sınıf: {p.classroom?.name}</div>
                        <div className="schedule-lesson-info">Öğrt: {p.teacher?.user?.full_name}</div>
                      </div>
                    ))
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}