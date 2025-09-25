// src/components/LoginPage.jsx
import React, { useEffect, useRef, useState } from "react";
import VanillaTilt from "vanilla-tilt";
import { useDispatch } from "react-redux";
import { loginUser } from "../redux/authSlice";      // uzantısız import
import { useNavigate } from "react-router-dom";
import "./css/login.css";
import Swal from "sweetalert2";
import { api } from "../redux/authSlice";
import { GoogleOAuthProvider } from "@react-oauth/google";
import GoogleLoginButton from "./User/GoogleLoginButton";

const clientId =
  "795121666723-7neo6fh4omj35hddbsov7fspbqnrn2k1.apps.googleusercontent.com";

function LoginPage() {
  const [email, setEmail] = useState(() => localStorage.getItem("remember_email") || "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loginImage, setLoginImage] = useState(null);
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem("remember_email"));
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const tiltRef = useRef(null);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await dispatch(loginUser({ email, password }));
      if (result.type === "auth/loginUser/fulfilled") {
        if (rememberMe) localStorage.setItem("remember_email", email);
        else localStorage.removeItem("remember_email");

        Swal.fire({
          title: "🎉 Giriş Başarılı!",
          text: "Hoş geldiniz, iyi çalışmalar!",
          icon: "success",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          toast: true,
          position: "top-end",
          background: "#f0fff0",
          color: "#2e7d32",
          iconColor: "#2e7d32",
        });
        navigate("/");
      } else {
        Swal.fire("Hata", result.payload || "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.", "error");
      }
    } catch {
      Swal.fire("Hata", "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async (credentialResponse) => {
    const token = credentialResponse?.credential;
    if (!token) {
      console.error("Google token alınamadı");
      return;
    }
    try {
      const res = await api.post(`/auth/google/`, { access_token: token });
      const { access, refresh, user } = res.data || {};
      if (access && refresh) {
        localStorage.setItem("access_token", access);
        localStorage.setItem("refresh_token", refresh);
        localStorage.setItem("token", access);
        localStorage.setItem("last_user_activity", Date.now().toString());
        Swal.fire("Başarılı", `Hoş geldiniz ${user?.username || ""}`, "success").then(() => navigate("/"));
      } else {
        console.error("Token bilgisi eksik:", res.data);
        Swal.fire("Hata", "Beklenmeyen yanıt alındı.", "error");
      }
    } catch (error) {
      console.error("Backend Google login hatası:", error?.response?.data || error?.message);
      Swal.fire("Hata", "Google ile giriş başarısız oldu", "error");
    }
  };

  useEffect(() => {
    // Login görseli
    api.get(`/images/`)
      .then((response) => {
        const found = (response.data || []).find((item) => item?.kategori?.name === "LoginPage");
        if (found?.image) {
          setLoginImage(found.image); // backend mutlak URL gönderiyorsa direkt kullan
        }
      })
      .catch((error) => console.error("Görsel yüklenemedi:", error));

    // Tilt init (cleanup’ta aynı 'el' kullanılır)
    const el = tiltRef.current;
    if (el) {
      VanillaTilt.init(el, {
        scale: 1.05,
        speed: 400,
        max: 15,
        glare: true,
        "max-glare": 0.2,
      });
    }
    return () => {
      if (el?.vanillaTilt) el.vanillaTilt.destroy();
    };
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = "Email gereklidir.";
    else if (!/^[a-zA-Z0-9_.-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(email.trim()))
      newErrors.email = "Geçersiz email formatı.";
    if (!password.trim()) newErrors.password = "Şifre gereklidir.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSmsLogin = () => navigate("/sms-giris");
  const handleForgot = () => navigate("/forgot-password");
  const handleSignup = () => navigate("/signup");

  return (
    <div className="limiter">
      <div className="container-login100">
        <div className="wrap-login100">
          <div className="login100-pic js-tilt" ref={tiltRef}>
            {loginImage && <img src={loginImage} alt="Login Page" />}
          </div>

          <form className="login100-form validate-form" onSubmit={handleEmailSubmit} method="POST" noValidate>
            <span className="login100-form-title">Üye Girişi</span>

            <div className={`wrap-input100 validate-input ${errors.email ? "alert-validate" : ""}`} data-validate={errors.email}>
              <input
                className="input100"
                type="email"
                name="email"
                placeholder="Email"
                value={email}
                autoComplete="email"
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                required
                aria-invalid={!!errors.email}
              />
              <span className="focus-input100"></span>
              <span className="symbol-input100">
                <i className="fa fa-envelope" aria-hidden="true"></i>
              </span>
            </div>

            <div className={`wrap-input100 validate-input ${errors.password ? "alert-validate" : ""}`} data-validate={errors.password}>
              <input
                className="input100"
                type="password"
                name="password"
                placeholder="Password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: "" });
                }}
                required
                aria-invalid={!!errors.password}
              />
              <span className="focus-input100"></span>
              <span className="symbol-input100">
                <i className="fa fa-lock" aria-hidden="true"></i>
              </span>
            </div>

            <div className="container-login100-form-btn">
              <button className="login100-form-btn" type="submit" disabled={loading}>
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </button>
            </div>

            {/* SMS Giriş */}
            <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: 15, marginBottom: 15 }}>
              <button
                type="button"
                onClick={handleSmsLogin}
                style={{
                  background: "linear-gradient(45deg, #ff6b6b 0%, #ee5a24 100%)",
                  border: "none",
                  borderRadius: 25,
                  padding: "12px 30px",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 15px rgba(255, 107, 107, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(255, 107, 107, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(255, 107, 107, 0.3)";
                }}
              >
                <i className="fa fa-mobile" aria-hidden="true"></i>
                SMS ile Giriş
              </button>
            </div>

            {/* Google Login */}
            <div style={{ width: "100%", display: "flex", justifyContent: "center", marginBottom: 15 }}>
              <GoogleOAuthProvider clientId={clientId}>
                <GoogleLoginButton onSuccess={handleSuccess} onError={() => console.log("Google login başarısız")} />
              </GoogleOAuthProvider>
            </div>

            {/* Remember me */}
            <div className="text-center p-t-12">
              <label className="txt1" style={{ cursor: "pointer" }}>
                <input type="checkbox" className="mr-2" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                Beni Hatırla
              </label>
            </div>

            {/* Forgot password */}
            <div className="text-center p-t-12">
              <span className="txt1">Şifrenizi mi unuttunuz? </span>
              <button type="button" className="txt2" onClick={handleForgot}>
                Şifre Sıfırla
              </button>
            </div>

            {/* Signup */}
            <div className="text-center p-t-40">
              <button type="button" className="txt2" onClick={handleSignup}>
                Hesap Oluştur
                <i className="fa fa-long-arrow-right m-l-5" aria-hidden="true"></i>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
