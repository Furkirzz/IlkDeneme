import React, { useEffect, useState } from "react";
import { api } from "../../store/authSlice";

const MyAssignments = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/coaching/student-status/")
      .then((res) => {
        setList(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  const sendResult = async (id) => {
    const c = Number(document.getElementById(`c${id}`).value);
    const w = Number(document.getElementById(`w${id}`).value);
    const b = Number(document.getElementById(`b${id}`).value);

    try {
      await api.patch(`/coaching/student-status/${id}/`, {
        correct_count: c,
        wrong_count: w,
        blank_count: b,
      });

      alert("Görev tamamlandı!");
      window.location.reload();
    } catch (err) {
      alert("Hata oluştu!");
    }
  };

  if (loading) {
    return <div style={{ padding: 30 }}>Yükleniyor...</div>;
  }

  return (
    <div style={{ padding: 25, maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 20 }}>Görevlerim</h2>

      {list.length === 0 && (
        <p style={{ fontSize: 18 }}>Herhangi bir göreviniz bulunmuyor.</p>
      )}

      {list.map((item) => (
        <div
          key={item.id}
          style={{
            border: "1px solid #ddd",
            padding: 20,
            marginBottom: 20,
            borderRadius: 8,
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#333" }}>
            {item.assignment_lesson} — {item.assignment_topic}
          </h3>

          <p><b>Hedef Soru:</b> {item.assignment_target}</p>
          <p><b>Sınıf:</b> {item.classroom_name}</p>
          <p><b>Durum:</b> {item.is_completed ? "Tamamlandı" : "Bekliyor"}</p>

          {!item.is_completed && (
            <div style={{ marginTop: 10 }}>
              <input
                id={`c${item.id}`}
                type="number"
                placeholder="Doğru"
                style={{ width: 80, marginRight: 5 }}
              />
              <input
                id={`w${item.id}`}
                type="number"
                placeholder="Yanlış"
                style={{ width: 80, marginRight: 5 }}
              />
              <input
                id={`b${item.id}`}
                type="number"
                placeholder="Boş"
                style={{ width: 80, marginRight: 10 }}
              />

              <button
                onClick={() => sendResult(item.id)}
                style={{
                  padding: "6px 12px",
                  cursor: "pointer",
                  background: "#007bff",
                  border: "none",
                  borderRadius: 4,
                  color: "white",
                }}
              >
                Gönder
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MyAssignments;
