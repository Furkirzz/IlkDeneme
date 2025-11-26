import React, { useEffect, useState } from "react";
import { api } from "../../store/authSlice";

const CreateAssignment = () => {
  const [lesson, setLesson] = useState("");
  const [topic, setTopic] = useState("");

  const [targetType, setTargetType] = useState("all");
  const [targetQuestionCount, setTargetQuestionCount] = useState("");

  const [gradeLevel, setGradeLevel] = useState("");
  const [classroom, setClassroom] = useState("");
  const [students, setStudents] = useState([]);

  const [classroomList, setClassroomList] = useState([]);
  const [studentList, setStudentList] = useState([]);

  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");

  useEffect(() => {
    api.get("/academic/classrooms/")
      .then((res) => setClassroomList(res.data))
      .catch(console.error);

    api.get("/accounts/students/")
      .then((res) => setStudentList(res.data))
      .catch(console.error);
  }, []);

  const handleSubmit = async () => {
    const payload = {
      lesson,
      topic,
      target_question_count: Number(targetQuestionCount),
      target_type: targetType,
      week_start: weekStart,
      week_end: weekEnd,
    };

    if (targetType === "grade") payload.grade_level = Number(gradeLevel);
    if (targetType === "classroom") payload.classroom = Number(classroom);
    if (targetType === "students") payload.students = students.map(Number);

    try {
      await api.post("/coaching/assignments/", payload);
      alert("Görev oluşturuldu!");
    } catch (err) {
      alert("Hata oluştu!");
      console.log(err);
    }
  };

  return (
    <div style={{ padding: 25 }}>
      <h2>Koçluk Görevi Oluştur</h2>

      <div>
        <label>Ders:</label>
        <input value={lesson} onChange={(e) => setLesson(e.target.value)} />
      </div>

      <div>
        <label>Konu (Opsiyonel):</label>
        <input value={topic} onChange={(e) => setTopic(e.target.value)} />
      </div>

      <div>
        <label>Hedef Soru:</label>
        <input
          type="number"
          value={targetQuestionCount}
          onChange={(e) => setTargetQuestionCount(e.target.value)}
        />
      </div>

      <div>
        <label>Hedef Tipi:</label>
        <select value={targetType} onChange={(e) => setTargetType(e.target.value)}>
          <option value="all">Tüm Öğrenciler</option>
          <option value="grade">Seviye (örn. 8)</option>
          <option value="classroom">Sınıf</option>
          <option value="students">Öğrenciler</option>
        </select>
      </div>

      {targetType === "grade" && (
        <div>
          <label>Seviye:</label>
          <input
            type="number"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
          />
        </div>
      )}

      {targetType === "classroom" && (
        <div>
          <label>Sınıf:</label>
          <select value={classroom} onChange={(e) => setClassroom(e.target.value)}>
            <option value="">Seçiniz</option>
            {classroomList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.grade_level}
              </option>
            ))}
          </select>
        </div>
      )}

      {targetType === "students" && (
        <div>
          <label>Öğrenciler:</label>
          <select
            multiple
            value={students}
            onChange={(e) =>
              setStudents([...e.target.selectedOptions].map((o) => o.value))
            }
          >
            {studentList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.user.full_name} ({s.classroom?.name})
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label>Hafta Başlangıcı:</label>
        <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
      </div>

      <div>
        <label>Hafta Bitişi:</label>
        <input type="date" value={weekEnd} onChange={(e) => setWeekEnd(e.target.value)} />
      </div>

      <button onClick={handleSubmit}>Görev Oluştur</button>
    </div>
  );
};

export default CreateAssignment;
