// src/components/SmsSignIn.jsx
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  sendSmsCode as sendSmsCodeThunk,
  verifySmsCode as verifySmsCodeThunk,
  fetchMe,
} from "../store/authSlice.js";
import Swal from "sweetalert2";
import "./css/smsGiris.css";

function SmsSignIn() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // SMS durumları
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sendingSms, setSendingSms] = useState(false);
  const [verifyingSms, setVerifyingSms] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [smsError, setSmsError] = useState("");

  // Telefon numarası formatı (sadece rakamlar)
  const formatPhone = (value) => value.replace(/\D/g, "");

  const handlePhoneChange = (e) => setPhone(formatPhone(e.target.value));

  // SMS Kod Gönderme
  const handleSendSms = async (e) => {
    e.preventDefault();
    setSmsError("");
    setSendingSms(true);
    try {
      const cleanPhone = phone.replace(/\s+/g, "");
      await dispatch(sendSmsCodeThunk({ phone: cleanPhone })).unwrap();
      setSmsSent(true);
      Swal.fire({
        title: "Başarılı",
        text: "Doğrulama kodu telefonunuza gönderildi.",
        icon: "success",
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (err) {
      const errorMessage = err?.detail || "Kod gönderilemedi";
      setSmsError(errorMessage);
      Swal.fire("Hata", errorMessage, "error");
    } finally {
      setSendingSms(false);
    }
  };

  // SMS Kod Doğrulama
  const handleVerifySms = async (e) => {
    e.preventDefault();
    setVerifyingSms(true);
    setSmsError("");
    try {
      const cleanPhone = phone.replace(/\s+/g, "");
      await dispatch(verifySmsCodeThunk({ phone: cleanPhone, code })).unwrap();
      // Tokenlar slice içinde set edilir; kullanıcı bilgisini tazele
      dispatch(fetchMe());
      Swal.fire("Başarılı", "Giriş başarılı! Yönlendiriliyorsunuz...", "success").then(() =>
        navigate("/")
      );
    } catch (err) {
      const errorMessage = err?.detail || "Doğrulama başarısız";
      setSmsError(errorMessage);
      Swal.fire("Hata", errorMessage, "error");
    } finally {
      setVerifyingSms(false);
    }
  };

  // Ana giriş sayfasına dönüş
  const handleBackToLogin = () => navigate("/signin");

  return (
    <div className="container-sms100">
      <div className="wrap-sms100 fade-in">
        <div className="sms100-form-header">
          <span className="sms100-form-title">SMS ile Giriş</span>
        </div>
        <div className="sms100-form-header">
          <span className="sms100-form-subtitle">
            Telefon numaranızı girin, size doğrulama kodu gönderelim
          </span>
        </div>

        {/* Adım göstergesi */}
        <div className="sms-step-indicator">
          <div className="sms-steps">
            <div className="sms-step">
              <div className={`sms-step-icon ${!smsSent ? "active" : "completed"}`}>📱</div>
              <span className="sms-step-label">Telefon</span>
            </div>
            <div className="sms-step">
              <div className={`sms-step-icon ${!smsSent ? "inactive" : "active"}`}>🔑</div>
              <span className="sms-step-label">Doğrulama</span>
            </div>
            <div className="sms-progress-line">
              <div className="sms-progress-fill" style={{ width: smsSent ? "100%" : "50%" }} />
            </div>
          </div>
        </div>

        {smsError && (
          <div className="sms-alert sms-alert-error" role="alert">
            {smsError}
          </div>
        )}

        {!smsSent ? (
          <form onSubmit={handleSendSms}>
            <div className="wrap-sms-input">
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                className="sms-input"
                placeholder="05XXXXXXXXX"
                value={phone}
                onChange={handlePhoneChange}
                required
                maxLength={11}
                aria-label="Telefon numarası"
              />
            </div>
            <div className="container-sms-btn">
              <button
                type="submit"
                className="sms-btn"
                disabled={sendingSms || phone.length < 11}
              >
                {sendingSms ? (
                  <span className="sms-loading">
                    <span className="sms-spinner" />
                    Gönderiliyor...
                  </span>
                ) : (
                  "Doğrulama Kodu Gönder"
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifySms}>
            <div className="wrap-sms-input">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="sms-input code-input"
                placeholder="Doğrulama Kodu"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
                maxLength={6}
                aria-label="Doğrulama kodu"
              />
            </div>
            <div className="container-sms-btn">
              <button
                type="submit"
                className="sms-btn"
                disabled={verifyingSms || code.length < 4}
              >
                {verifyingSms ? (
                  <span className="sms-loading">
                    <span className="sms-spinner" />
                    Doğrulanıyor...
                  </span>
                ) : (
                  "Doğrula ve Giriş Yap"
                )}
              </button>
            </div>
            <div className="container-sms-btn">
              <button
                type="button"
                className="sms-btn sms-btn-secondary"
                onClick={() => {
                  setSmsSent(false);
                  setCode("");
                  setSmsError("");
                }}
              >
                Kodu alamadınız mı? Yeniden gönder
              </button>
            </div>
          </form>
        )}

        <div className="sms-footer">
          <div>
            Hesabınız yok mu? <Link className="sms-link" to="/signup">Kayıt Ol</Link>
          </div>
          <div>
            <span
              className="sms-link sms-link-primary"
              onClick={handleBackToLogin}
              style={{ cursor: "pointer" }}
            >
              E-posta ile giriş yap
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SmsSignIn;
