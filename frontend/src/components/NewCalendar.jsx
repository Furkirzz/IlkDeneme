import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import trLocale from "@fullcalendar/core/locales/tr";
import Swal from "sweetalert2";
import axios from "axios";

const ModernCalendar = () => {
    const [events, setEvents] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const calendarRef = useRef(null);

    // Form state'leri
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newDate, setNewDate] = useState("");
    const [newTime, setNewTime] = useState("12:00");
    const [newBackgroundColor, setNewBackgroundColor] = useState("#3788d8");
    const [newBorderColor, setNewBorderColor] = useState("#2653a6");

    // Düzenleme bilgisi
    const [isEditing, setIsEditing] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);

    useEffect(() => {
        async function fetchSchedule() {
            try {
                const response = await axios.get("http://localhost:8001/api/events/");
                const data = response.data.map((event) => ({
                    id: event.id,
                    title: event.title,
                    description: event.description,
                    start: event.date,
                    backgroundColor: event.background_color,
                    borderColor: event.border_color,
                }));
                setEvents(data);
            } catch (error) {
                console.error("Etkinlikler alınamadı:", error);
            }
        }
        fetchSchedule();
    }, []);

    const handleAddEvent = () => {
        clearForm();
        setIsEditing(false);
        setShowModal(true);
    };

    const clearForm = () => {
        setNewTitle("");
        setNewDescription("");
        setNewDate("");
        setNewTime("12:00");
        setNewBackgroundColor("#3788d8");
        setNewBorderColor("#2653a6");
        setEditingEventId(null);
    };

    const handleModalClose = () => {
        setShowModal(false);
        clearForm();
        setIsEditing(false);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (!newTitle || !newDate || !newTime) {
            Swal.fire("Başlık, tarih ve saat zorunludur.");
            return;
        }

        const startDateTime = new Date(`${newDate}T${newTime}`);
        const calendarApi = calendarRef.current.getApi();

        if (isEditing && editingEventId) {
            try {
                await axios.patch(`http://localhost:8001/api/events/${editingEventId}/`, {
                    title: newTitle,
                    description: newDescription,
                    date: startDateTime.toISOString(),
                    background_color: newBackgroundColor,
                    border_color: newBorderColor,
                });

                // FullCalendar güncelleme:
                const oldEvent = calendarApi.getEventById(editingEventId);
                if (oldEvent) oldEvent.remove();

                calendarApi.addEvent({
                    id: editingEventId,
                    title: newTitle,
                    start: startDateTime,
                    description: newDescription,
                    backgroundColor: newBackgroundColor,
                    borderColor: newBorderColor,
                    allDay: false,
                });

                Swal.fire("Etkinlik güncellendi!");
                handleModalClose();
            } catch (error) {
                console.error("Güncelleme hatası:", error);
                Swal.fire("Hata!", "Etkinlik güncellenemedi.", "error");
            }
        } else {
            const newEvent = {
                title: newTitle,
                description: newDescription,
                date: startDateTime.toISOString(),
                background_color: newBackgroundColor,
                border_color: newBorderColor,
                active: true,
            };

            try {
                const response = await axios.post("http://localhost:8001/api/events/", newEvent);
                const eventData = {
                    id: response.data.id,
                    title: newTitle,
                    start: startDateTime,
                    description: newDescription,
                    backgroundColor: newBackgroundColor,
                    borderColor: newBorderColor,
                    allDay: false,
                };

                calendarApi.addEvent(eventData);
                setEvents((prev) => [...prev, eventData]);
                Swal.fire("Etkinlik eklendi!");
                handleModalClose();
            } catch (error) {
                console.error("Ekleme hatası:", error);
                Swal.fire("Hata!", "Etkinlik eklenemedi.", "error");
            }
        }
    };

    const handleEventClick = (info) => {
        const event = info.event;

        const startDate = event.start;
        const formattedDateTime = startDate
            ? startDate.toLocaleString("tr-TR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
                hour: "2-digit",
                minute: "2-digit",
            })
            : "Tarih yok";

        Swal.fire({
            title: event.title,
            html: `📝 Açıklama:<br>${event.extendedProps.description || "Yok"}<br><br>
                   🕒 Tarih:<br>${formattedDateTime}`,
            icon: "info",
            showCancelButton: true,
            confirmButtonText: "Sil",
            cancelButtonText: "Kapat",
            showDenyButton: true,
            denyButtonText: "Düzenle",
            reverseButtons: true,
            confirmButtonColor: "#e74c3c",
            denyButtonColor: "#3498db",
            cancelButtonColor: "#95a5a6",
        }).then((result) => {
            if (result.isConfirmed) {
                axios
                    .patch(`http://localhost:8001/api/events/${event.id}/`, {
                        active: false,
                    })
                    .then(() => {
                        event.remove();
                        setEvents((prev) => prev.filter((e) => e.id !== event.id));
                        Swal.fire("Etkinlik silindi!");
                    })
                    .catch((error) => {
                        console.error("Silme hatası:", error);
                        Swal.fire("Hata!", "Silinemedi.", "error");
                    });
            } else if (result.isDenied) {
                setNewTitle(event.title);
                setNewDescription(event.extendedProps.description || "");
                setNewDate(event.start.toISOString().slice(0, 10));
                setNewTime(event.start.toTimeString().slice(0, 5));
                setNewBackgroundColor(event.backgroundColor || "#3788d8");
                setNewBorderColor(event.borderColor || "#2653a6");
                setEditingEventId(event.id);
                setIsEditing(true);
                setShowModal(true);
            }
        });
    };

    const handleEventDrop = async (info) => {
        const event = info.event;

        const updatedEvent = {
            title: event.title,
            description: event.extendedProps.description || "",
            date: event.start.toISOString(),
            background_color: event.backgroundColor,
            border_color: event.borderColor,
        };

        try {
            await axios.patch(`http://localhost:8001/api/events/${event.id}/`, updatedEvent);

            Swal.fire("Etkinlik güncellendi", "", "success");
        } catch (error) {
            console.error("Etkinlik güncellenemedi:", error);
            Swal.fire("Hata!", "Etkinlik güncellenemedi.", "error");

            // Hata durumunda geri eski yerine al
            info.revert();
        }
    };


    const formatDateToMonthYear = (date) =>
        date.toLocaleDateString("tr-TR", { year: "numeric", month: "long" });

    return (
        <div className="max-w-5xl mx-auto mt-10 font-sans">
            {/* <div className="text-xl font-bold mb-3">
                📅 {formatDateToMonthYear(currentDate)}
            </div> */}

            <div className="flex justify-end mb-4">
                <button
                    onClick={handleAddEvent}
                    className="bg-blue-600 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded-md shadow-md transition-colors duration-300"
                >
                    Yeni Etkinlik
                </button>
            </div>

            {/* <button
                onClick={handleAddEvent}
                className="bg-blue-600 hover:bg-blue-800 text-white font-normal text-sm px-3 py-1 rounded shadow-sm transition"
            >
                Yeni Etkinlik
            </button> */}


            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                locale={trLocale}
                events={events}
                eventDisplay="block"
                displayEventTime={false} // ✅ "12 ..." sorunu çözülür
                height="auto"
                nowIndicator={true}
                editable={true}
                selectable={true}
                dayMaxEventRows={3}
                eventTextColor="#000"
                eventClick={handleEventClick}
                datesSet={(arg) => setCurrentDate(arg.start)}
                eventDrop={handleEventDrop}

            />

            {showModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                    onClick={handleModalClose}
                >
                    <div
                        className="bg-white rounded-lg p-6 min-w-[320px] shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-semibold mb-4">
                            {isEditing ? "Etkinlik Düzenle" : "Yeni Etkinlik Ekle"}
                        </h3>
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div>
                                <label className="block mb-1 font-medium">Başlık*</label>
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    required
                                    className="w-full border border-gray-300 rounded-md p-2"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">Açıklama</label>
                                <textarea
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-md p-2 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">Tarih*</label>
                                <input
                                    type="date"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    required
                                    className="w-full border border-gray-300 rounded-md p-2"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">Saat*</label>
                                <input
                                    type="time"
                                    value={newTime}
                                    onChange={(e) => setNewTime(e.target.value)}
                                    required
                                    className="w-full border border-gray-300 rounded-md p-2"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">Arka Plan Rengi</label>
                                <input
                                    type="color"
                                    value={newBackgroundColor}
                                    onChange={(e) => setNewBackgroundColor(e.target.value)}
                                    className="w-full h-10 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">Çerçeve Rengi</label>
                                <input
                                    type="color"
                                    value={newBorderColor}
                                    onChange={(e) => setNewBorderColor(e.target.value)}
                                    className="w-full h-10 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={handleModalClose}
                                    className="px-4 py-2 border border-gray-300 rounded-md"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-800"
                                >
                                    {isEditing ? "Güncelle" : "Ekle"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModernCalendar;
