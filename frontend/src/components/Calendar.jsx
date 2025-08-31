// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import FullCalendar from '@fullcalendar/react';
// import dayGridPlugin from '@fullcalendar/daygrid';
// import interactionPlugin from '@fullcalendar/interaction';
// import trLocale from '@fullcalendar/core/locales/tr';
// import Modal from './Modal';
// import "./css/calendar.css" // 📌 Modal bileşenini ekliyoruz

// const CalendarComponent = () => {
//     const [events, setEvents] = useState([]);
//     const [modalOpen, setModalOpen] = useState(false);
//     const [newEvent, setNewEvent] = useState({
//         title: '',
//         description: '',
//         start: '',
//         end: '',
//         all_day: true,
//         color: '#3788d8',
//     });

//     useEffect(() => {
//         axios
//             .get('http://localhost:8001/api/events/')
//             .then((res) => setEvents(res.data))
//             .catch((err) => console.error('Etkinlikleri çekerken hata:', err));
//     }, []);

//     const handleAddClick = () => {
//         setModalOpen(true);
//         setNewEvent({
//             title: '',
//             description: '',
//             start: '',
//             end: '',
//             all_day: true,
//             color: '#3788d8',
//         });
//     };

//     const handleInputChange = (e) => {
//         const { name, value, type, checked } = e.target;
//         setNewEvent((prev) => ({
//             ...prev,
//             [name]: type === 'checkbox' ? checked : value,
//         }));
//     };

//     const handleAddEvent = () => {
//         if (!newEvent.title || !newEvent.start) {
//             alert('Başlık ve Başlangıç tarihi zorunludur.');
//             return;
//         }

//         axios
//             .post('http://localhost:8001/api/events/', newEvent)
//             .then((res) => {
//                 setEvents((prev) => [...prev, res.data]);
//                 setModalOpen(false);
//             })
//             .catch((err) => {
//                 console.error('Etkinlik eklenirken hata:', err);
//                 alert('Etkinlik eklenemedi.');
//             });
//     };

//     const handleCloseModal = () => {
//         setModalOpen(false);
//     };

//     return (
//         <div className="calendar-container">
//             <button className="add-button" onClick={handleAddClick}>
//                 ETKİNLİK EKLE
//             </button>

//             <div className="calendar-wrapper">
//                 <FullCalendar
//                     plugins={[dayGridPlugin, interactionPlugin]}
//                     initialView="dayGridMonth"
//                     events={events}
//                     height="auto"
//                     locale="tr"
//                     locales={[trLocale]}
//                     firstDay={1}
//                 />
//             </div>

//             <Modal isOpen={modalOpen} onClose={handleCloseModal}>
//                 <h2 className="modal-title">Etkinlik Ekle</h2>

//                 <div className="form-group">
//                     <div className="form-field">
//                         <label className="form-label required">Başlık</label>
//                         <input
//                             type="text"
//                             name="title"
//                             value={newEvent.title}
//                             onChange={handleInputChange}
//                             className="form-input"
//                             placeholder="Etkinlik başlığı"
//                         />
//                     </div>

//                     <div className="form-field">
//                         <label className="form-label">Açıklama</label>
//                         <textarea
//                             name="description"
//                             value={newEvent.description}
//                             onChange={handleInputChange}
//                             className="form-textarea"
//                             rows={3}
//                             placeholder="Etkinlik açıklaması"
//                         />
//                     </div>

//                     <div className="form-row">
//                         <div className="form-field">
//                             <label className="form-label required">Başlangıç</label>
//                             <input
//                                 type="date"
//                                 name="start"
//                                 value={newEvent.start}
//                                 onChange={handleInputChange}
//                                 className="form-input"
//                             />
//                         </div>

//                         <div className="form-field">
//                             <label className="form-label">Bitiş</label>
//                             <input
//                                 type="date"
//                                 name="end"
//                                 value={newEvent.end}
//                                 onChange={handleInputChange}
//                                 className="form-input"
//                             />
//                         </div>
//                     </div>

//                     <div className="form-footer">
//                         <label className="checkbox-group">
//                             <input
//                                 type="checkbox"
//                                 name="all_day"
//                                 checked={newEvent.all_day}
//                                 onChange={handleInputChange}
//                                 className="checkbox-input"
//                             />
//                             <span className="checkbox-label">Tüm Gün</span>
//                         </label>

//                         <div className="color-group">
//                             <span className="color-label">Renk:</span>
//                             <input
//                                 type="color"
//                                 name="color"
//                                 value={newEvent.color}
//                                 onChange={handleInputChange}
//                                 className="color-input"
//                             />
//                         </div>
//                     </div>
//                 </div>

//                 <div className="modal-actions">
//                     <button className="btn btn-secondary" onClick={handleCloseModal}>
//                         KAPAT
//                     </button>
//                     <button className="btn btn-primary" onClick={handleAddEvent}>
//                         EKLE
//                     </button>
//                 </div>
//             </Modal>
//         </div>
//     );
// };

// export default CalendarComponent;
