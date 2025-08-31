import React, { useEffect, useRef, useState } from "react";
import VanillaTilt from "vanilla-tilt";
import { useDispatch } from "react-redux";
import { loginUser } from "../redux/authSlice.js";
import { useNavigate } from "react-router-dom";
import "./css/login.css";
import Swal from "sweetalert2";
import axios from "axios";
import { GoogleOAuthProvider } from "@react-oauth/google";
import GoogleLoginButton from "./User/GoogleLoginButton";

const clientId = "795121666723-7neo6fh4omj35hddbsov7fspbqnrn2k1.apps.googleusercontent.com";

function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [loginImage, setLoginImage] = useState(null);
    const [rememberMe, setRememberMe] = useState(false);

    const dispatch = useDispatch();//stora eri yazmak için kullanılır
    // Redux store'a erişim için kullanılır
    const navigate = useNavigate();
    const tiltRef = useRef(null);

    const [loading, setLoading] = useState(false);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const result = await dispatch(loginUser({ email, password }));
            if (result.type === 'auth/loginUser/fulfilled') {
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
        } catch (err) {
            Swal.fire("Hata", "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.", "error");
        } finally {
            setLoading(false);
        }
    };


    const handleSuccess = async (credentialResponse) => {
        const token = credentialResponse.credential;
        if (!token) {
            console.error("Google token alınamadı");
            return;
        }

        try {
            const res = await axios.post("http://127.0.0.1:8001/auth/google/", {
                access_token: token,
            });

            const { access, refresh, user } = res.data;

            if (access && refresh) {
                localStorage.setItem("access_token", access);
                localStorage.setItem("refresh_token", refresh);
                localStorage.setItem("token", access);
                localStorage.setItem("last_user_activity", Date.now().toString());

                Swal.fire("Başarılı", `Hoş geldiniz ${user?.username || ""}`, "success").then(() =>
                    navigate("/products")
                );
            } else {
                console.error("Token bilgisi eksik:", res.data);
            }
        } catch (error) {
            console.error("Backend Google login hatası:", error.response?.data || error.message);
            Swal.fire("Hata", "Google ile giriş başarısız oldu", "error");
        }
    };

    useEffect(() => {
        axios.get("http://127.0.0.1:8001/api/images/")
            .then((response) => {
                const found = response.data.find(item => item.kategori?.name === "LoginPage");
                if (found) {
                    const fullImageUrl = "http://127.0.0.1:8001" + found.image;
                    setLoginImage(fullImageUrl);
                }
            })
            .catch((error) => console.error("Görsel yüklenemedi:", error));

        if (tiltRef.current) {
            VanillaTilt.init(tiltRef.current, {
                scale: 1.1,
                speed: 400,
                max: 15,
            });
        }
    }, []);

    const validate = () => {
        const newErrors = {};
        if (!email.trim()) {
            newErrors.email = "Email is required.";
        } else if (!/^([a-zA-Z0-9_\-.]+)@(([a-zA-Z0-9\-]+\.)+)([a-zA-Z]{2,})$/.test(email.trim())) {
            newErrors.email = "Invalid email format.";
        }
        if (!password.trim()) {
            newErrors.password = "Password is required.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSmsLogin = () => {
        navigate("/sms-giris");
    };

    return (
        <div className="limiter">
            <div className="container-login100">
                <div className="wrap-login100">
                    <div className="login100-pic js-tilt" ref={tiltRef}>
                        {loginImage && <img src={loginImage} alt="Login Page" />}
                    </div>

                    <form className="login100-form validate-form" onSubmit={handleEmailSubmit} method="POST">
                        <span className="login100-form-title">Üye Girişi</span>

                        <div className={`wrap-input100 validate-input ${errors.email ? "alert-validate" : ""}`} data-validate={errors.email}>
                            <input className="input100" type="email" name="email" placeholder="Email" value={email} autoComplete="on" onChange={(e) => {
                                setEmail(e.target.value);
                                setErrors({ ...errors, email: "" });
                            }} required />
                            <span className="focus-input100"></span>
                            <span className="symbol-input100">
                                <i className="fa fa-envelope" aria-hidden="true"></i>
                            </span>
                        </div>

                        <div className={`wrap-input100 validate-input ${errors.password ? "alert-validate" : ""}`} data-validate={errors.password}>
                            <input className="input100" type="password" name="password" placeholder="Password" value={password} autoComplete="on" onChange={(e) => {
                                setPassword(e.target.value);
                                setErrors({ ...errors, password: "" });
                            }} required />
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


                        {/* SMS Giriş Butonu */}
                        <div style={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                            marginTop: "15px",
                            marginBottom: "15px"
                        }}>
                            <button
                                type="button"
                                onClick={handleSmsLogin}
                                style={{
                                    background: "linear-gradient(45deg, #ff6b6b 0%, #ee5a24 100%)",
                                    border: "none",
                                    borderRadius: "25px",
                                    padding: "12px 30px",
                                    color: "white",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    cursor: "pointer",
                                    transition: "all 0.3s ease",
                                    boxShadow: "0 4px 15px rgba(255, 107, 107, 0.3)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px"
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = "translateY(-2px)";
                                    e.target.style.boxShadow = "0 6px 20px rgba(255, 107, 107, 0.4)";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = "translateY(0)";
                                    e.target.style.boxShadow = "0 4px 15px rgba(255, 107, 107, 0.3)";
                                }}
                            >
                                <i className="fa fa-mobile" aria-hidden="true"></i>
                                SMS ile Giriş
                            </button>
                        </div>

                        {/* Google Login */}
                        <div style={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "15px"
                        }}>
                            <GoogleOAuthProvider clientId={clientId}>
                                <GoogleLoginButton onSuccess={handleSuccess} onError={() => console.log("Google login başarısız")} />
                            </GoogleOAuthProvider>
                        </div>

                        <div className="text-center p-t-12">
                            <label className="txt1">
                                <input type="checkbox" className="mr-2" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                                Beni Hatırla
                            </label>
                        </div>

                        <div className="text-center p-t-12">
                            <span className="txt1">Şifrenizi mi unuttunuz? </span>
                            <a className="txt2" href="#">
                                Kullanıcı Adı / Şifre
                            </a>
                        </div>

                        <div className="text-center p-t-40">
                            <a className="txt2" href="#">
                                Hesap Oluştur
                                <i className="fa fa-long-arrow-right m-l-5" aria-hidden="true"></i>
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;