import React from "react";
import "./css/calendar.css"; // CSS senin calendar.css içinde birleşikmiş

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null; // Modal kapalıysa hiçbir şey render etme

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                onClick={(e) => e.stopPropagation()} // İçeriğe tıklanınca kapanmasın
            >
                {children}
            </div>
        </div>
    );
};

export default Modal;
