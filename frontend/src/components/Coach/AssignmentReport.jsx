import React, { useEffect, useState } from "react";
import { api } from "../../store/authSlice";
import { useParams } from "react-router-dom";

const AssignmentReport = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);

  useEffect(() => {
    api
      .get(`/coaching/assignments/${id}/report/`)
      .then((res) => setReport(res.data))
      .catch((err) => console.error(err));
  }, [id]);

  if (!report) return <div>Yükleniyor...</div>;

  return (
    <div style={{ padding: 25 }}>
      <h2>Görev Raporu</h2>

      <p><b>Ders:</b> {report.lesson}</p>
      <p><b>Konu:</b> {report.topic}</p>
      <p><b>Hedef Soru:</b> {report.target_question_count}</p>

      <h3>Özet</h3>
      <p>Toplam öğrenci: {report.total_students}</p>
      <p>Tamamlayan: {report.completed_students}</p>
      <p>Tamamlama oranı: {report.completion_rate}</p>
      <p>Ortalama doğruluk: %{(report.avg_accuracy * 100).toFixed(2)}</p>

      <h3>Öğrenciler</h3>

      <table border="1" cellPadding={6}>
        <thead>
          <tr>
            <th>Öğrenci</th>
            <th>Sınıf</th>
            <th>Doğru</th>
            <th>Yanlış</th>
            <th>Boş</th>
            <th>Tamamlandı?</th>
          </tr>
        </thead>
        <tbody>
          {report.students.map((s) => (
            <tr key={s.id}>
              <td>{s.student_name}</td>
              <td>{s.classroom_name}</td>
              <td>{s.correct_count}</td>
              <td>{s.wrong_count}</td>
              <td>{s.blank_count}</td>
              <td>{s.is_completed ? "Evet" : "Hayır"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssignmentReport;
