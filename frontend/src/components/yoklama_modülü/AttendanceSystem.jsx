import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Save, CheckCircle, XCircle, Clock, BookOpen, User, School, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';
import '../css/AttendanceSystem.css';

const AttendanceSystem = () => {
  const { lessonId, date } = useParams(); // URL'den parametreleri al
  const navigate = useNavigate();
  
  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState(lessonId || '');
  const [lessonData, setLessonData] = useState(null);
  const [rosterData, setRosterData] = useState(null);
  const [studentsData, setStudentsData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const API_BASE = 'http://127.0.0.1:8001/yts';

  useEffect(() => {
    loadLessons();
    
    // Eğer URL'den lessonId geliyorsa otomatik yükle
    if (lessonId) {
      setSelectedLessonId(lessonId);
      loadStudentsByLessonId(lessonId);
    }
  }, [lessonId]);

  const loadLessons = async () => {
    try {
      const response = await fetch(`${API_BASE}/lessons/`);
      const data = await response.json();
      
      // Eğer date parametresi varsa, sadece o tarihteki dersleri filtrele
      if (date) {
        const filteredLessons = data.filter(lesson => lesson.date === date);
        setLessons(filteredLessons);
      } else {
        setLessons(data);
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Hata!',
        text: 'Dersler yüklenirken hata oluştu!',
        confirmButtonColor: '#f56565'
      });
      console.error(error);
    }
  };

  const loadStudentsByLessonId = async (id) => {
    if (!id) return;

    setLoading(true);
    try {
      const [lessonResponse, rosterResponse] = await Promise.all([
        fetch(`${API_BASE}/lessons/${id}/`),
        fetch(`${API_BASE}/lessons/${id}/attendance/roster/`)
      ]);

      const lesson = await lessonResponse.json();
      const roster = await rosterResponse.json();

      setLessonData(lesson);
      setRosterData(roster);

      const initialData = {};
      roster.roster.forEach(item => {
        initialData[item.student.id] = {
          status: item.attendance?.status || null,
          notes: item.attendance?.notes || ''
        };
      });
      setStudentsData(initialData);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Hata!',
        text: 'Öğrenciler yüklenirken hata oluştu!',
        confirmButtonColor: '#f56565'
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    if (!selectedLessonId) {
      Swal.fire({
        icon: 'warning',
        title: 'Uyarı',
        text: 'Lütfen bir ders seçin!',
        confirmButtonColor: '#ff0101'
      });
      return;
    }

    loadStudentsByLessonId(selectedLessonId);
  };

  const setAttendance = (studentId, status) => {
    setStudentsData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const updateNotes = (studentId, notes) => {
    setStudentsData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes }
    }));
  };

  const saveAttendance = async () => {
    const items = Object.entries(studentsData)
      .filter(([_, data]) => data.status)
      .map(([studentId, data]) => ({
        student: parseInt(studentId),
        status: data.status,
        notes: data.notes || ''
      }));

    if (items.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Uyarı',
        text: 'En az bir öğrenci için yoklama durumu seçmelisiniz!',
        confirmButtonColor: '#ff0101'
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/lessons/${selectedLessonId}/attendance/bulk/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });

      const result = await response.json();

      if (response.ok) {
        const successCount = result.updated.length;
        const errorCount = result.errors?.length || 0;
        
        if (errorCount > 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Kısmi Başarı',
            html: `<strong>${successCount}</strong> öğrenci kaydedildi<br><strong>${errorCount}</strong> öğrenci kaydedilemedi`,
            confirmButtonColor: '#ff0101'
          });
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Başarılı!',
            text: `Tüm yoklamalar başarıyla kaydedildi! (${successCount} öğrenci)`,
            confirmButtonColor: '#28a745',
            timer: 3000
          });
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Hata!',
          text: 'Yoklamalar kaydedilemedi! Lütfen tekrar deneyin.',
          confirmButtonColor: '#f56565'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Bağlantı Hatası!',
        text: 'Sunucuya bağlanılamadı! İnternet bağlantınızı kontrol edin.',
        confirmButtonColor: '#f56565'
      });
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1); // Önceki sayfaya dön
  };

  return (
    <div className="container-attendance100">
      <div className="wrap-attendance100">
        {/* Geri Dön Butonu (URL'den geliyorsa göster) */}
        {lessonId && (
          <button onClick={handleGoBack} className="sms-back-btn" style={{ marginBottom: '20px' }}>
            <ArrowLeft size={18} />
            Ders Programına Dön
          </button>
        )}

        {/* Header */}
        <div className="attendance100-form-header">
          <h1 className="attendance100-form-title">
            <BookOpen size={32} />
            Yoklama Sistemi
          </h1>
          <p className="attendance100-form-subtitle">
            {date ? `${date} tarihli dersler` : 'Ders seçin ve öğrenci yoklamalarını işaretleyin'}
          </p>
        </div>

        {/* Alert Message */}
        {message.text && (
          <div className={`attendance-alert ${message.type === 'success' ? 'attendance-alert-success' : 'attendance-alert-error'}`}>
            {message.text}
          </div>
        )}

        {/* Form Section - URL'den gelmiyorsa göster */}
        {!lessonId && (
          <div className="attendance-form-section">
            <div className="attendance-form-row">
              <div className="attendance-form-group">
                <label className="attendance-form-label">Ders Seçiniz:</label>
                <div className="wrap-attendance-input">
                  <select
                    value={selectedLessonId}
                    onChange={(e) => setSelectedLessonId(e.target.value)}
                    className="attendance-select"
                  >
                    <option value="">-- Ders Seçin --</option>
                    {lessons.map(lesson => {
                      const classroomName = lesson.classroom_detail?.name || 'Sınıf Yok';
                      const teacherName = lesson.teacher_detail?.full_name || 'Öğretmen Yok';
                      
                      return (
                        <option key={lesson.id} value={lesson.id}>
                          {classroomName} - {teacherName} - {lesson.date} - {lesson.start_time} - {lesson.end_time}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="container-attendance-btn">
                <button onClick={loadStudents} className="attendance-btn">
                  <Search size={20} />
                  Öğrencileri Getir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="attendance-loading-container">
            <div className="attendance-spinner"></div>
            <p className="attendance-loading-text">Yükleniyor...</p>
          </div>
        )}

        {/* Students Container */}
        {!loading && rosterData && (
          <div className="attendance-fade-in">
            {/* Lesson Info */}
            <div className="attendance-lesson-info">
              <h3 className="attendance-lesson-title">
                <BookOpen size={22} />
                Ders Bilgileri
              </h3>
              <div className="attendance-lesson-grid">
                <div className="attendance-lesson-item">
                  <strong className="attendance-lesson-label">Tarih</strong>
                  <span className="attendance-lesson-value">{lessonData.date}</span>
                </div>
                <div className="attendance-lesson-item">
                  <strong className="attendance-lesson-label">Saat</strong>
                  <span className="attendance-lesson-value">
                    {lessonData.start_time} - {lessonData.end_time}
                  </span>
                </div>
                <div className="attendance-lesson-item">
                  <strong className="attendance-lesson-label">Öğretmen</strong>
                  <span className="attendance-lesson-value">
                    {rosterData.lesson.teacher.full_name}
                  </span>
                </div>
                <div className="attendance-lesson-item">
                  <strong className="attendance-lesson-label">Sınıf</strong>
                  <span className="attendance-lesson-value">
                    {rosterData.lesson.classroom.name} ({rosterData.lesson.classroom.grade_level}. Sınıf)
                  </span>
                </div>
              </div>
            </div>

            {/* Student Cards */}
            {rosterData.roster.map(item => (
              <div key={item.student.id} className="attendance-student-card">
                <div className="attendance-student-header">
                  <div className="attendance-student-info">
                    <div className="attendance-student-name">
                      <User size={18} />
                      {item.student.full_name}
                    </div>
                    <div className="attendance-student-id">ID: {item.student.id}</div>
                  </div>
                  
                  <div className="attendance-class-badge">
                    <School size={16} />
                    {rosterData.lesson.classroom.name}
                  </div>
                  
                  <div className="attendance-status-group">
                    <button
                      onClick={() => setAttendance(item.student.id, 'present')}
                      className={`attendance-status-btn present ${
                        studentsData[item.student.id]?.status === 'present' ? 'active' : ''
                      }`}
                    >
                      <CheckCircle size={18} />
                      Geldi
                    </button>
                    <button
                      onClick={() => setAttendance(item.student.id, 'absent')}
                      className={`attendance-status-btn absent ${
                        studentsData[item.student.id]?.status === 'absent' ? 'active' : ''
                      }`}
                    >
                      <XCircle size={18} />
                      Gelmedi
                    </button>
                    <button
                      onClick={() => setAttendance(item.student.id, 'late')}
                      className={`attendance-status-btn late ${
                        studentsData[item.student.id]?.status === 'late' ? 'active' : ''
                      }`}
                    >
                      <Clock size={18} />
                      Geç
                    </button>
                  </div>
                </div>

                <div className="attendance-notes-wrapper">
                  <textarea
                    value={studentsData[item.student.id]?.notes || ''}
                    onChange={(e) => updateNotes(item.student.id, e.target.value)}
                    placeholder="Not ekleyin (opsiyonel)..."
                    className="attendance-notes"
                    rows="2"
                  />
                </div>
              </div>
            ))}

            {/* Save Section */}
            <div className="attendance-save-section">
              <button
                onClick={saveAttendance}
                disabled={saving}
                className="attendance-btn attendance-btn-save"
              >
                <Save size={22} />
                {saving ? 'Kaydediliyor...' : 'Yoklamaları Kaydet'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceSystem;