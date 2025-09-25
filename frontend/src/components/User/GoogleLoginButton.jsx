import React from "react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { FaGoogle } from "react-icons/fa";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const clientId = "795121666723-7neo6fh4omj35hddbsov7fspbqnrn2k1.apps.googleusercontent.com";

const GoogleLoginButton = () => {
    const navigate = useNavigate();
    const login = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            console.log("Giriş başarılı:", tokenResponse);
            Swal.fire("Başarılı", "Google ile giriş başarılı", "success").then(() => {
                navigate("/"); // Giriş başarılıysa ana sayfaya yönlendir
                // İsteğe bağlı olarak, tokenResponse içindeki bilgileri kullanabilirsiniz

            });


            // handleSuccess(tokenResponse); // İstersen dışarıdan gelen handleSuccess fonksiyonunu burada çağır
        },
        onError: () => {
            console.log("Google login başarısız");
        },
    });

    const handleClick = () => {
        console.log("Butona tıklandı");
        login(); // Google login tetikleniyor
    };

    return (
        <button
            onClick={handleClick}
            style={{
                backgroundColor: "#DB4437",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                gap: "10px",
            }}
        >
            <FaGoogle size={20} />
            Google ile oturum açın
        </button>
    );
};

const LoginPage = () => {
    return (
        <GoogleOAuthProvider clientId={clientId}>
            <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
                <GoogleLoginButton />
            </div>
        </GoogleOAuthProvider>
    );
};

export default LoginPage;
