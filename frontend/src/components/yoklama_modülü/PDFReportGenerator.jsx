// PDFReportGenerator.js
// (React/Next.js kullanıyorsan bu modülü client tarafında çalıştır:
//  bileşende 'use client' ekle veya dinamik importta { ssr:false } kullan.)

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

class PDFReportGenerator {
  constructor(statsData = {}, reportData = {}, reportFilter = {}) {
    this.statsData = statsData ?? {};
    this.reportData = reportData ?? {};
    this.reportFilter = reportFilter ?? {};
  }

  generate() {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Başlık
    this.addHeader(pdf, pageWidth);

    // Öğrenci Bilgileri
    let currentY = this.addStudentInfo(pdf, 35);

    // Özet İstatistikler
    currentY = this.addSummaryStats(pdf, currentY, pageWidth, pageHeight);

    // Branş İstatistikleri
    currentY = this.addSubjectStats(pdf, currentY, pageWidth, pageHeight);

    // Detaylı Kayıtlar
    const records = this.reportData?.attendance_records ?? [];
    if (Array.isArray(records) && records.length > 0) {
      this.addDetailedRecords(pdf);
    }

    // Footer
    this.addFooters(pdf, pageWidth, pageHeight);

    return pdf;
  }

  addHeader(pdf, pageWidth) {
    pdf.setFontSize(22);
    pdf.setTextColor(255, 1, 1);
    pdf.text('KATILIM RAPORU', pageWidth / 2, 20, { align: 'center' });

    pdf.setLineWidth(0.5);
    pdf.setDrawColor(255, 1, 1);
    pdf.line(14, 25, pageWidth - 14, 25);
  }

  addStudentInfo(pdf, startY) {
    const student = this.statsData?.student ?? {};

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, 'bold');
    pdf.text('Öğrenci Bilgileri:', 14, startY);

    pdf.setFont(undefined, 'normal');
    pdf.text(`Ad Soyad: ${student.full_name ?? '-'}`, 20, startY + 7);
    pdf.text(`Sınıf: ${student.classroom ?? 'Belirtilmemiş'}`, 20, startY + 14);
    pdf.text(`E-posta: ${student.email ?? '-'}`, 20, startY + 21);

    let currentY = startY + 28;

    const startDate = this.reportFilter?.start_date;
    const endDate = this.reportFilter?.end_date;
    if (startDate || endDate) {
      pdf.text(
        `Tarih Aralığı: ${startDate ?? 'Başlangıç'} - ${endDate ?? 'Bitiş'}`,
        20,
        currentY
      );
      currentY += 7;
    }

    pdf.setDrawColor(200, 200, 200);
    pdf.line(14, currentY, pdf.internal.pageSize.getWidth() - 14, currentY);

    return currentY + 10;
  }

  addSummaryStats(pdf, startY, _pageWidth, pageHeight) {
    const summary = this.statsData?.summary ?? {};

    if (startY > pageHeight - 80) {
      pdf.addPage();
      startY = 20;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(255, 1, 1);
    pdf.setFont(undefined, 'bold');
    pdf.text('GENEL ÖZET', 14, startY);

    const summaryData = [
      ['Toplam Ders Sayısı', String(summary.total_lessons ?? 0)],
      ['Katıldı', `${summary.present_count ?? 0} (%${summary.present_percentage ?? 0})`],
      ['Katılmadı', `${summary.absent_count ?? 0} (%${summary.absent_percentage ?? 0})`],
      ['Geç Kaldı', `${summary.late_count ?? 0} (%${summary.late_percentage ?? 0})`],
      ['Genel Katılım Oranı', `%${summary.attendance_rate ?? 0}`],
    ];

    autoTable(pdf, {
      startY: startY + 5,
      head: [['Kategori', 'Değer']],
      body: summaryData,
      theme: 'grid',
      headStyles: {
        fillColor: [255, 1, 1],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
      },
      bodyStyles: {
        fontSize: 10,
      },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 70, halign: 'center', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });

    const finalY = (pdf.lastAutoTable?.finalY ?? startY + 5) + 15;
    return finalY;
  }

  addSubjectStats(pdf, startY, _pageWidth, pageHeight) {
    const subjectStats = this.statsData?.subject_stats ?? [];

    if (startY > pageHeight - 80) {
      pdf.addPage();
      startY = 20;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(255, 1, 1);
    pdf.setFont(undefined, 'bold');
    pdf.text('BRANŞ BAZLI İSTATİSTİKLER', 14, startY);

    const subjectTableData = subjectStats.map((stat) => [
      stat?.subject ?? '-',
      stat?.teacher ?? '-',
      String(stat?.total_lessons ?? 0),
      String(stat?.attended ?? 0),
      `%${stat?.attendance_rate ?? 0}`,
    ]);

    autoTable(pdf, {
      startY: startY + 5,
      head: [['Branş', 'Öğretmen', 'Toplam', 'Katıldı', 'Oran']],
      body: subjectTableData,
      theme: 'striped',
      headStyles: {
        fillColor: [255, 1, 1],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 50 },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'center', cellWidth: 25 },
        4: { halign: 'center', fontStyle: 'bold', cellWidth: 25 },
      },
      margin: { left: 14, right: 14 },
    });

    return pdf.lastAutoTable?.finalY ?? startY + 5;
  }

  addDetailedRecords(pdf) {
    const detailedData = (this.reportData?.attendance_records ?? []).map((record) => [
      record?.date ?? '-',
      record?.subject ?? '-',
      record?.teacher ?? '-',
      `${record?.start_time ?? '-'} - ${record?.end_time ?? '-'}`,
      record?.status_display ?? '-',
      record?.notes || '-',
    ]);

    pdf.addPage();

    pdf.setFontSize(14);
    pdf.setTextColor(255, 1, 1);
    pdf.setFont(undefined, 'bold');
    pdf.text('DETAYLI KATILIM KAYITLARI', 14, 20);

    autoTable(pdf, {
      startY: 25,
      head: [['Tarih', 'Branş', 'Öğretmen', 'Saat', 'Durum', 'Not']],
      body: detailedData,
      theme: 'grid',
      headStyles: {
        fillColor: [255, 1, 1],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 30 },
        2: { cellWidth: 35 },
        3: { cellWidth: 28 },
        4: { halign: 'center', cellWidth: 20 },
        5: { cellWidth: 42 },
      },
      margin: { left: 14, right: 14 },
    });
  }

  addFooters(pdf, pageWidth, pageHeight) {
    const totalPages = pdf.internal.getNumberOfPages();
    const reportDate = new Date().toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Sayfa ${i} / ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      pdf.text(`Rapor Tarihi: ${reportDate}`, 14, pageHeight - 10);
    }
  }

  save() {
    const pdf = this.generate();
    const name = (this.statsData?.student?.full_name ?? 'Ogrenci').replace(/\s+/g, '_');
    const fileName = `${name}_Katilim_Raporu_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  }
}

export default PDFReportGenerator;
