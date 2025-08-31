// import React, { useState } from 'react';
// import axios from 'axios';
// import { Dialog, Transition } from '@headlessui/react';
// import { Fragment } from 'react';
// import { toast } from 'react-hot-toast';

// const EventFormModal = ({ isOpen, onClose, onEventAdded }) => {
//     const initialState = {
//         title: '',
//         description: '',
//         start: '',
//         end: '',
//         all_day: true,
//         color: '#3788d8',
//     };
//     const [newEvent, setNewEvent] = useState(initialState);
//     const [isLoading, setIsLoading] = useState(false);

//     const handleInputChange = (e) => {
//         const { name, value, type, checked } = e.target;
//         setNewEvent(prev => ({
//             ...prev,
//             [name]: type === 'checkbox' ? checked : value,
//         }));
//     };

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         if (!newEvent.title || !newEvent.start) {
//             toast.error('Başlık ve Başlangıç Tarihi zorunludur.');
//             return;
//         }

//         setIsLoading(true);
//         axios.post('http://localhost:8001/api/events/', newEvent)
//             .then(res => {
//                 toast.success('Etkinlik başarıyla eklendi!');
//                 onEventAdded(res.data);
//                 setNewEvent(initialState);
//                 onClose();
//             })
//             .catch(err => {
//                 console.error('Etkinlik eklenirken hata:', err);
//                 toast.error('Etkinlik eklenirken bir hata oluştu.');
//             })
//             .finally(() => {
//                 setIsLoading(false);
//             });
//     };

//     return (
//         <Transition appear show={isOpen} as={Fragment}>
//             <Dialog as="div" className="relative z-10" onClose={onClose}>
//                 <Transition.Child
//                     as={Fragment}
//                     enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
//                     leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
//                 >
//                     <div className="fixed inset-0 bg-black bg-opacity-40" />
//                 </Transition.Child>

//                 <div className="fixed inset-0 overflow-y-auto">
//                     <div className="flex min-h-full items-center justify-center p-4 text-center">
//                         <Transition.Child
//                             as={Fragment}
//                             enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
//                             leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
//                         >
//                             <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
//                                 <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
//                                     Yeni Etkinlik Ekle
//                                 </Dialog.Title>
//                                 <form onSubmit={handleSubmit} className="mt-4 space-y-4">
//                                     <input type="text" name="title" value={newEvent.title} onChange={handleInputChange} placeholder="Başlık" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
//                                     <textarea name="description" value={newEvent.description} onChange={handleInputChange} placeholder="Açıklama" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" rows="3"></textarea>

//                                     <div className="flex items-center justify-between">
//                                         <label className="flex items-center gap-2 text-sm text-gray-600">
//                                             <input type="checkbox" name="all_day" checked={newEvent.all_day} onChange={handleInputChange} className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500" />
//                                             Tüm gün
//                                         </label>
//                                         <div className="flex items-center gap-2">
//                                             <label htmlFor="color" className="text-sm text-gray-600">Renk:</label>
//                                             <input type="color" id="color" name="color" value={newEvent.color} onChange={handleInputChange} className="h-8 w-10 border-none rounded-md cursor-pointer" />
//                                         </div>
//                                     </div>

//                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                         <div>
//                                             <label className="text-sm text-gray-500">Başlangıç</label>
//                                             <input type="date" name="start" value={newEvent.start} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
//                                         </div>
//                                         <div>
//                                             <label className="text-sm text-gray-500">Bitiş</label>
//                                             <input type="date" name="end" value={newEvent.end} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" disabled={newEvent.all_day} />
//                                         </div>
//                                     </div>

//                                     <div className="mt-6 flex justify-end gap-3">
//                                         <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500">
//                                             İptal
//                                         </button>
//                                         <button type="submit" disabled={isLoading} className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 disabled:bg-indigo-300">
//                                             {isLoading ? 'Ekleniyor...' : 'Ekle'}
//                                         </button>
//                                     </div>
//                                 </form>
//                             </Dialog.Panel>
//                         </Transition.Child>
//                     </div>
//                 </div>
//             </Dialog>
//         </Transition>
//     );
// };

// export default EventFormModal;