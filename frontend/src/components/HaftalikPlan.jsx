import React, { useEffect, useState } from 'react';
import axios from 'axios';

const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

function HaftalikPlan() { 
  const [scheduleData, setScheduleData] = useState([]);

  useEffect(() => {
    // Backend API adresini kendi projene göre ayarla
    axios.get('http://localhost:8001/api/ders-programi/')
      .then(response => {
        const data = response.data;
        // Beklenen data formatı:
        // [{gun: 'Pazartesi', Baslangic_saat: '09:00', Bitis_saat: '09:45', ders_kategori: {name: 'Matematik'}}, ...]

        // 1. Unique saat aralıklarını çıkar ve sırala
        const times = [...new Set(data.map(d => `${d.Baslangic_saat} - ${d.Bitis_saat}`))].sort();

        // 2. Tablo verisi oluştur
        const tableData = times.map(time => {
          const row = { time };
          days.forEach(day => {
            const lessonObj = data.find(d => d.gun === day && `${d.Baslangic_saat} - ${d.Bitis_saat}` === time);
            row[day] = lessonObj ? (lessonObj.ders_kategori ? lessonObj.ders_kategori.name : '') : '';
          });
          return row;
        });

        setScheduleData(tableData);
      })
      .catch(error => {
        console.error("API'den veri alınırken hata:", error);
      });
  }, []);

  return (
    <div style={styles.container}>
      <style>{`
        .schedule-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 16px;
          font-family: 'Arial', sans-serif;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        .schedule-table th, .schedule-table td {
          padding: 12px 15px;
          text-align: center;
          border: 1px solid #e0e0e0;
        }
        .schedule-table thead th {
          background-color: #007bff;
          color: #ffffff;
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 1;
        }
        .schedule-table tbody tr:nth-of-type(even) {
          background-color: #f8f9fa;
        }
        .schedule-table tbody tr:hover {
          background-color: #e9ecef;
          cursor: pointer;
        }
        .time-slot {
          background-color: #6c757d;
          color: white;
          font-weight: bold;
        }
        .empty-slot {
          background-color: #fdfdfd;
          color: #b0b0b0;
        }
        .lunch-slot {
          background-color: #ffc107;
          color: #333;
          font-style: italic;
        }
      `}</style>

      <h1 style={styles.header}>Haftalık Ders Programı</h1>
      <table className="schedule-table">
        <thead>
          <tr>
            <th className="time-slot">Saat</th>
            {days.map(day => (
              <th key={day}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {scheduleData.map((row, idx) => (
            <tr key={idx}>
              <td className="time-slot">{row.time}</td>
              {days.map(day => {
                const lesson = row[day];
                const cellClass = lesson === 'Öğle Arası' ? 'lunch-slot' : (lesson ? '' : 'empty-slot');
                return (
                  <td key={day} className={cellClass}>
                    {lesson || '---'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: { padding: '20px' },
  header: { textAlign: 'center', color: '#343a40', marginBottom: '20px' }
};

export default HaftalikPlan;
