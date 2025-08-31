import axios from "axios";

export const login = async (email, password, dispatch, setCredentials) => {
    const res = await axios.post("http://localhost:8001/api/token/", {
        email,
        password,
    });

    const { access, refresh } = res.data;

    // Token'ları localStorage'a kaydet
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);

    // User bilgilerini al
    const userResponse = await axios.get("http://localhost:8001/api/user/", {
        headers: { Authorization: `Bearer ${access}` }
    });

    // Redux store'a yaz
    dispatch(setCredentials({ 
        user: userResponse.data,
        accessToken: access, 
        refreshToken: refresh 
    }));
};

export const sendSmsCode = async (phone) => {
    debugger;
    phone = "05527315038";
    const { data } = await axios.post(`http://localhost:8001/api/send-sms/`, { phone });
    return data;
};

// SMS: kod doğrula → access/refresh al, store'a yaz
export const verifySmsCode = async (phone, code, dispatch, setCredentials) => {
    debugger;
    const { data } = await axios.post(`http://localhost:8001/api/verify-code/`, { phone, code });
    const { access, refresh } = data;
    
    // Token'ları localStorage'a kaydet
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    
    // User bilgilerini al
    const userResponse = await axios.get("http://localhost:8001/api/user/", {
        headers: { Authorization: `Bearer ${access}` }
    });
    
    dispatch(setCredentials({ 
        user: userResponse.data,
        accessToken: access, 
        refreshToken: refresh 
    }));
    return data;
};

// import axios from "axios";

// export const login = async (email, password, dispatch, loginSuccess, rememberMe) => {
//     try {
//         const res = await axios.post("http://localhost:8001/api/token/", {
//             email,
//             password,
//         });

//         const { access, refresh } = res.data;

//         dispatch(loginSuccess({ access, refresh }));

//         if (rememberMe) {
//             localStorage.setItem("access", access);
//             localStorage.setItem("refresh", refresh);
//         } else {
//             sessionStorage.setItem("access", access);
//             sessionStorage.setItem("refresh", refresh);
//         }

//     } catch (error) {
//         console.error("Login error:", error);
//         alert("Giriş başarısız. Lütfen bilgileri kontrol edin.");
//     }
// };
