import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Calendar, TrendingUp, BookOpen, 
  Clock, CheckCircle, XCircle, Download, Filter 
} from 'lucide-react';
import Swal from 'sweetalert2';
import PDFReportGenerator from './PDFReportGenerator';
import '../css/StudentAttendanceStats.css';

const StudentAttendanceStats = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportFilter, setReportFilter] = useState({
    start_date: '',
    end_date: ''
  });
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const API_BASE = 'http://127.0.0.1:8001/yts';

  useEffect(() => {
    loadStudentStats();
  }, [id]);

  const loadStudentStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/students/${id}/attendance-stats/`);
      
      if (!response.ok) {
        throw new Error('Öğrenci bulunamadı');
      }
      
      const data = await response.json();
      setStatsData(data);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Hata!',
        text: error.message || 'Veriler yüklenirken hata oluştu!',
        confirmButtonColor: '#ff0101'
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReport = async () => {
    if (!statsData) {
      Swal.fire({
        icon: 'error',
        title: 'Hata!',
        text: 'Öğrenci verileri yüklenmedi!',
        confirmButtonColor: '#ff0101'
      });
      return;
    }

    setGeneratingPDF(true);
    
    try {
      // Detaylı rapor verisini çek
      let url = `${API_BASE}/students/${id}/attendance-report/`;
      const params = new URLSearchParams();
      
      if (reportFilter.start_date) params.append('start_date', reportFilter.start_date);
      if (reportFilter.end_date) params.append('end_date', reportFilter.end_date);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Rapor verisi alınamadı');
      }
      
      const reportData = await response.json();
      
      // PDF Generator kullan
      const pdfGenerator = new PDFReportGenerator(statsData, reportData, reportFilter);
      pdfGenerator.save();
      
      Swal.fire({
        icon: 'success',
        title: 'Başarılı!',
        text: 'Rapor başarıyla oluşturuldu ve indirildi!',
        confirmButtonColor: '#28a745',
        timer: 2000
      });
      
      setShowReportModal(false);
      setReportFilter({ start_date: '', end_date: '' });
      
    } catch (error) {
      console.error('PDF Oluşturma Hatası:', error);
      Swal.fire({
        icon: 'error',
        title: 'Hata!',
        text: error.message || 'Rapor oluşturulurken hata oluştu!',
        confirmButtonColor: '#ff0101'
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="container-attendance100">
        <div className="attendance-loading-container">
          <div className="attendance-spinner"></div>
          <p className="attendance-loading-text">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!statsData) {
    return (
      <div className="container-attendance100">
        <div className="attendance-alert attendance-alert-error">
          Öğrenci verisi bulunamadı!
        </div>
      </div>
    );
  }

  return (
    <div className="container-attendance100">
      <div className="wrap-attendance100 stats-wrapper">
        {/* Header */}
        <div className="stats-header">
          <button onClick={() => navigate(-1)} className="sms-back-btn">
            <ArrowLeft size={18} />
            Geri Dön
          </button>
          
          <div className="stats-header-content">
            <div className="stats-student-info">
              <div className="stats-student-avatar">
                <User size={48} />
              </div>
              <div className="stats-student-details">
                <h1 className="stats-student-name">{statsData.student.full_name}</h1>
                <p className="stats-student-meta">
                  {statsData.student.classroom && (
                    <span className="stats-meta-item">
                      <BookOpen size={16} />
                      {statsData.student.classroom}
                    </span>
                  )}
                  <span className="stats-meta-item">
                    <Calendar size={16} />
                    {statsData.student.email}
                  </span>
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => setShowReportModal(true)} 
              className="attendance-btn stats-report-btn"
            >
              <Download size={20} />
              Rapor İndir
            </button>
          </div>
        </div>

        {/* Genel Özet Kartları */}
        <div className="stats-summary-grid">
          <div className="stats-card stats-card-total">
            <div className="stats-card-icon">
              <BookOpen size={32} />
            </div>
            <div className="stats-card-content">
              <h3 className="stats-card-value">{statsData.summary.total_lessons}</h3>
              <p className="stats-card-label">Toplam Ders</p>
            </div>
          </div>

          <div className="stats-card stats-card-present">
            <div className="stats-card-icon">
              <CheckCircle size={32} />
            </div>
            <div className="stats-card-content">
              <h3 className="stats-card-value">{statsData.summary.present_count}</h3>
              <p className="stats-card-label">Katıldı</p>
              <span className="stats-card-badge">%{statsData.summary.present_percentage}</span>
            </div>
          </div>

          <div className="stats-card stats-card-absent">
            <div className="stats-card-icon">
              <XCircle size={32} />
            </div>
            <div className="stats-card-content">
              <h3 className="stats-card-value">{statsData.summary.absent_count}</h3>
              <p className="stats-card-label">Katılmadı</p>
              <span className="stats-card-badge">%{statsData.summary.absent_percentage}</span>
            </div>
          </div>

          <div className="stats-card stats-card-late">
            <div className="stats-card-icon">
              <Clock size={32} />
            </div>
            <div className="stats-card-content">
              <h3 className="stats-card-value">{statsData.summary.late_count}</h3>
              <p className="stats-card-label">Geç Kaldı</p>
              <span className="stats-card-badge">%{statsData.summary.late_percentage}</span>
            </div>
          </div>
        </div>

        {/* Katılım Oranı */}
        <div className="stats-attendance-rate">
          <h3 className="stats-section-title">
            <TrendingUp size={24} />
            Genel Katılım Oranı
          </h3>
          <div className="stats-progress-container">
            <div className="stats-progress-bar">
              <div 
                className="stats-progress-fill"
                style={{ width: `${statsData.summary.attendance_rate}%` }}
              >
                <span className="stats-progress-text">
                  %{statsData.summary.attendance_rate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Branş Bazlı İstatistikler */}
        <div className="stats-section">
          <h3 className="stats-section-title">
            <BookOpen size={24} />
            Branş Bazlı Katılım
          </h3>
          
          <div className="stats-subjects-grid">
            {statsData.subject_stats.map((subject, index) => (
              <div key={index} className="stats-subject-card">
                <div className="stats-subject-header">
                  <h4 className="stats-subject-name">{subject.subject}</h4>
                  <span className={`stats-subject-badge ${
                    subject.attendance_rate >= 80 ? 'badge-success' :
                    subject.attendance_rate >= 60 ? 'badge-warning' : 'badge-danger'
                  }`}>
                    %{subject.attendance_rate}
                  </span>
                </div>
                
                <p className="stats-subject-teacher">{subject.teacher}</p>
                
                <div className="stats-subject-info">
                  <div className="stats-subject-stat">
                    <span className="stat-label">Toplam Ders</span>
                    <span className="stat-value">{subject.total_lessons}</span>
                  </div>
                  <div className="stats-subject-stat">
                    <span className="stat-label">Katıldı</span>
                    <span className="stat-value">{subject.attended}</span>
                  </div>
                </div>
                
                {subject.description && (
                  <p className="stats-subject-description">{subject.description}</p>
                )}
                
                <div className="stats-subject-details">
                  <span className="detail-item status-present">
                    <CheckCircle size={14} /> {subject.present}
                  </span>
                  <span className="detail-item status-absent">
                    <XCircle size={14} /> {subject.absent}
                  </span>
                  <span className="detail-item status-late">
                    <Clock size={14} /> {subject.late}
                  </span>
                </div>
              </div>
            ))}</div>
        </div>

        {/* Aylık İstatistikler - GELİŞTİRİLMİŞ */}
        {statsData.monthly_stats && statsData.monthly_stats.length > 0 && (
          <div className="stats-section">
            <h3 className="stats-section-title">
              <Calendar size={24} />
              Aylık Katılım Trendi (Son 6 Ay)
            </h3>
            
            <div className="stats-monthly-chart">
                {statsData.monthly_stats.map((month, index) => {
                const maxValue = Math.max(...statsData.monthly_stats.map(m => m.total || 1));
                const heightPercent = month.total > 0 ? (month.total / maxValue) * 100 : 0;
                
                return (
                  <div key={index} className="stats-month-bar">
                    <div className="stats-bar-container">
                      <div 
                        className="stats-bar"
                        style={{ height: `${heightPercent}%`, minHeight: '20px' }}
                        title={`${month.month}: Toplam ${month.total} ders\nKatıldı: ${month.present}\nGeç: ${month.late}\nYok: ${month.absent}`}
                      >
                        <span className="stats-bar-value">{month.total}</span>
                      </div>
                    </div>
                    <div className="stats-bar-label">{month.month}</div>
                    <div className="stats-bar-details">
                      <span className="detail-present" title="Katıldı">
                        ✓ {month.present}
                      </span>
                      <span className="detail-late" title="Geç Kaldı">
                        ⏰ {month.late}
                      </span>
                      <span className="detail-absent" title="Katılmadı">
                        ✗ {month.absent}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Grafik Açıklaması */}
            <div className="stats-chart-legend">
              <div className="legend-item">
                <span className="legend-color legend-present"></span>
                <span>Katıldı</span>
              </div>
              <div className="legend-item">
                <span className="legend-color legend-late"></span>
                <span>Geç Kaldı</span>
              </div>
              <div className="legend-item">
                <span className="legend-color legend-absent"></span>
                <span>Katılmadı</span>
              </div>
            </div>
          </div>
        )}

        {/* Rapor Modal */}
        {showReportModal && (
          <div className="stats-modal-overlay" onClick={() => !generatingPDF && setShowReportModal(false)}>
            <div className="stats-modal" onClick={(e) => e.stopPropagation()}>
              <div className="stats-modal-header">
                <h3>
                  <Filter size={24} />
                  Rapor Filtrele
                </h3>
                <button 
                  className="stats-modal-close"
                  onClick={() => setShowReportModal(false)}
                  disabled={generatingPDF}
                >
                  ×
                </button>
              </div>
              
              <div className="stats-modal-body">
                <div className="stats-filter-group">
                  <label className="attendance-form-label">Başlangıç Tarihi:</label>
                  <input
                    type="date"
                    value={reportFilter.start_date}
                    onChange={(e) => setReportFilter({...reportFilter, start_date: e.target.value})}
                    className="attendance-select"
                    disabled={generatingPDF}
                    max={reportFilter.end_date || undefined}
                  />
                </div>
                
                <div className="stats-filter-group">
                  <label className="attendance-form-label">Bitiş Tarihi:</label>
                  <input
                    type="date"
                    value={reportFilter.end_date}
                    onChange={(e) => setReportFilter({...reportFilter, end_date: e.target.value})}
                    className="attendance-select"
                    disabled={generatingPDF}
                    min={reportFilter.start_date || undefined}
                  />
                </div>
                
                <p className="stats-filter-hint">
                  <strong>Not:</strong> Tarih seçmezseniz tüm kayıtlar rapora dahil edilecektir.
                </p>
              </div>
              
              <div className="stats-modal-footer">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="sms-btn-secondary"
                  disabled={generatingPDF}
                >
                  İptal
                </button>
                <button
                  onClick={generatePDFReport}
                  disabled={generatingPDF}
                  className="attendance-btn"
                >
                  {generatingPDF ? (
                    <>
                      <div className="attendance-spinner" style={{width: '16px', height: '16px', borderWidth: '2px'}}></div>
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Download size={20} />
                      PDF İndir
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendanceStats;  