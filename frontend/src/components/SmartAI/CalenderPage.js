// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import FullCalendar from '@fullcalendar/react';
// import dayGridPlugin from '@fullcalendar/daygrid';
// import interactionPlugin from '@fullcalendar/interaction';
// import trLocale from '@fullcalendar/core/locales/tr';
// import { PlusIcon } from '@heroicons/react/24/solid'; // Şık bir ikon için
// import EventFormModal from './EventFormModal'; // Yeni modal bileşenimiz
// import { Toaster, toast } from 'react-hot-toast'; // Şık bildirimler için

// const CalendarPage = () => {
//     const [events, setEvents] = useState([]);
//     const [isModalOpen, setIsModalOpen] = useState(false);

//     useEffect(() => {
//         axios.get('http://localhost:8001/api/events/')
//             .then(res => setEvents(res.data))
//             .catch(err => {
//                 console.error('Etkinlikleri çekerken hata:', err);
//                 toast.error('Etkinlikler yüklenemedi.');
//             });
//     }, []);

//     const handleEventAdded = (newEvent) => {
//         setEvents(prevEvents => [...prevEvents, newEvent]);
//     };

//     return (
//         <div className="bg-gray-100 min-h-screen p-4 md:p-8">
//             <Toaster position="top-right" />
//             <div className="max-w-5xl mx-auto">
//                 <div className="flex justify-end mb-6">
//                     <button
//                         onClick={() => setIsModalOpen(true)}
//                         className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-transform transform hover:scale-105"
//                     >
//                         <PlusIcon className="h-5 w-5" />
//                         Etkinlik Ekle
//                     </button>
//                 </div>
//                 <div className="bg-white rounded-xl shadow-lg p-4">
//                     <FullCalendar
//                         plugins={[dayGridPlugin, interactionPlugin]}
//                         initialView="dayGridMonth"
//                         events={events}
//                         height="auto"
//                         locale={trLocale}
//                         firstDay={1}
//                         headerToolbar={{
//                             left: 'prev,next today',
//                             center: 'title',
//                             right: 'dayGridMonth,dayGridWeek,dayGridDay'
//                         }}
//                         buttonText={{
//                             today: 'Bugün',
//                             month: 'Ay',
//                             week: 'Hafta',
//                             day: 'Gün',
//                         }}
//                     />
//                 </div>
//             </div>

//             <EventFormModal
//                 isOpen={isModalOpen}
//                 onClose={() => setIsModalOpen(false)}
//                 onEventAdded={handleEventAdded}
//             />
//         </div>
//     );
// };

// export default CalendarPage;