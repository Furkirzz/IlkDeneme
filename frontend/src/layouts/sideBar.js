// // src/layouts/Sidebar.jsx
// import React, { useState } from "react";
// import { NavLink } from "react-router-dom";
// import "./css/sideBar.css";

// const Sidebar = () => {
//     const [openDropdown, setOpenDropdown] = useState(false);

//     return (
//         <div className="sidebar">
//             <div className="sidebar-header">E-Ürün</div>
//             <nav className="sidebar-nav">
//                 <NavLink to="/products" className="sidebar-link">
//                     🧭 Ürünler
//                 </NavLink>

//                 <NavLink to="/productCreate" className="sidebar-link">
//                     📚 Ürün Ekle
//                 </NavLink>

//                 <button
//                     className="sidebar-link dropdown-toggle"
//                     onClick={() => setOpenDropdown(!openDropdown)}
//                 >
//                     ⚙ Ayarlar
//                 </button>
//                 {openDropdown && (
//                     <div className="dropdown-menu">
//                         <NavLink to="/settings/profile" className="sidebar-link sub-link">
//                             👤 Profil
//                         </NavLink>
//                         <NavLink to="/settings/account" className="sidebar-link sub-link">
//                             🔐 Hesap Ayarları
//                         </NavLink>
//                     </div>
//                 )}

//                 <NavLink to="/about" className="sidebar-link">
//                     📄 Hakkımızda
//                 </NavLink>
//             </nav>
//         </div>
//     );
// };

// export default Sidebar;
