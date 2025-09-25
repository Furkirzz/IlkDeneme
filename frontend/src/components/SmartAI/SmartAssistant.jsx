import React, { useState, useEffect, useRef } from 'react';
import "../css/SmartAssistant.css"; // CSS dosyasını ekliyoruz

function SmartAssistant() {
    const [query, setQuery] = useState(""); // Bu state'i kullanıyoruz
    const [language, setLanguage] = useState("tr");
    // const [qaData, setQaData] = useState([]);
    const [messages, setMessages] = useState([]);
    const [open, setOpen] = useState(false);
    const chatRef = useRef(null);

    useEffect(() => {
        const fetchQA = async () => {
            try {
                // const res = await axios.get("http://127.0.0.1:8001/api/assistantqa/?lang=" + language);
                // setQaData(res.data);
            } catch (err) {
                console.error("Soru-cevap verileri alınamadı:", err);
            }
        };
        fetchQA();
    }, [language]);

    const handleAsk = async () => {
        if (!query.trim()) {
            alert(language === "tr" ? 'Lütfen bir soru girin.' : 'Please enter a question.');
            return;
        }

        const newUserMessage = { q: query, a: "..." };
        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        setQuery("");

        try {
            // Sistem mesajı
            const formattedMessages = [
                {
                    role: "system",
                    content: "Cevaplarını kısa ve net ver."
                }
            ];

            // Güncellenmiş mesaj geçmişini dönüştür
            updatedMessages.forEach(msg => {
                formattedMessages.push({ role: "user", content: msg.q });
                // Sadece boş değilse assistant cevabını da ekle
                if (msg.a && msg.a !== "...") {
                    formattedMessages.push({ role: "assistant", content: msg.a });
                }
            });

            const response = await fetch("http://127.0.0.1:8001/api/ask/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ messages: formattedMessages }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'API yanıtı başarısız oldu.');
            }

            const data = await response.json();
            const assistantResponse = data.answer;

            // Gelen cevabı son mesaja yerleştir
            setMessages(prevMessages => {
                const lastIndex = prevMessages.length - 1;
                const updated = [...prevMessages];
                if (updated[lastIndex].a === "...") {
                    updated[lastIndex].a = assistantResponse;
                }
                return updated;
            });

        } catch (error) {
            console.error("API çağrısında hata:", error);
            setMessages(prevMessages => {
                const updated = [...prevMessages];
                const lastIndex = updated.length - 1;
                if (updated[lastIndex].a === "...") {
                    updated[lastIndex].a = language === "tr" ? "Bir hata oluştu: " + error.message : "An error occurred: " + error.message;
                }
                return updated;
            });
        }
    };




    useEffect(() => {
        chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
    }, [messages]);

    return (
        <div className="assistant-wrapper position-fixed bottom-0 end-0 m-4 z-1050">
            {open ? (
                <div
                    className="assistant-box card shadow-lg border-0 rounded-4 overflow-hidden"
                    style={{ width: "350px", maxHeight: "80vh" }}
                >
                    <div className="assistant-header bg-primary text-white d-flex justify-content-between align-items-center px-3 py-2">
                        <span className="fw-bold">🤖 Akıllı Asistan</span>
                        <button
                            onClick={() => setOpen(false)}
                            className="btn-close btn-close-white"
                        ></button>
                    </div>

                    <div
                        className="assistant-body px-3 py-2 overflow-auto"
                        style={{ height: "300px" }}
                        ref={chatRef}
                    >
                        {messages.map((msg, i) => (
                            <div key={i} className="mb-3">
                                <div className="d-flex justify-content-end">
                                    <div className="bg-primary text-white p-2 px-3 rounded-start-4 rounded-top-4">
                                        {msg.q}
                                    </div>
                                </div>
                                <div className="d-flex justify-content-start mt-1">
                                    <div className="bg-light text-dark p-2 px-3 rounded-end-4 rounded-top-4 border">
                                        {msg.a}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="assistant-input p-3 border-top">
                        <select
                            className="form-select mb-2"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            <option value="tr">🇹🇷 Türkçe</option>
                            <option value="en">🇬🇧 English</option>
                        </select>

                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control"
                                value={query}
                                placeholder={
                                    language === "tr"
                                        ? "Sorunuzu yazın..."
                                        : "Type your question..."
                                }
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                            />
                            <button className="btn btn-primary" onClick={handleAsk}>
                                {language === "tr" ? "Sor" : "Ask"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <button
                    className="assistant-toggle btn btn-primary rounded-circle shadow-lg p-3"
                    onClick={() => setOpen(true)}
                    title="Akıllı Asistanı Aç"
                >
                    <i className="fa fa-comment-dots fa-lg"></i>
                </button>
            )}
        </div>
    );
}

export default SmartAssistant;