// src/store/authSlice.js
import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import axios from "axios";

/* ===========================
   API base
=========================== */
const API_BASE =
  (typeof process !== "undefined" &&
    process.env &&
    (process.env.REACT_APP_API_BASE ||
     process.env.VITE_API_BASE ||              // isterseniz DefinePlugin ile besleyebilirsiniz
     process.env.NEXT_PUBLIC_API_BASE)) ||
  (typeof window !== "undefined" &&
    window.__APP_CONFIG__ &&
    window.__APP_CONFIG__.API_BASE) ||
  "http://localhost:8001/api";


export const api = axios.create({ baseURL: API_BASE });
// export const publicApi = axios.create({ baseURL: API_BASE });

export const attachAuthInterceptors = (store) => {
  api.interceptors.request.use((req) => {

    const { access } = store.getState().auth || {};
    if (access) {
      req.headers = req.headers || {};
      req.headers.Authorization = `Bearer ${access}`;
    }
    return req;
  });

  let isRefreshing = false;
  let queue = [];

  const processQueue = (error, token = null) => {
    queue.forEach(({ resolve, reject }) => {
      if (error) reject(error);
      else resolve(token);
    });
    queue = [];
  };

  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error?.config;
      const status = error?.response?.status;

      if (status !== 401 || original?._retry) {
        return Promise.reject(error);
      }

      original._retry = true;

      const state = store.getState();
      const refresh = state?.auth?.refresh;

      if (!refresh) {
        store.dispatch(logout());
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // refresh devam ederken sıraya al
        return new Promise((resolve, reject) => {
          queue.push({
            resolve: (newAccess) => {
              original.headers.Authorization = `Bearer ${newAccess}`;
              resolve(api(original));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh/`, { refresh });
        // access (ve varsa refresh) güncelle
        store.dispatch(setTokens({ access: data?.access, refresh: data?.refresh }));
        setAuthHeader(data?.access);
        processQueue(null, data?.access);

        // orijinal isteği tekrar dene
        original.headers.Authorization = `Bearer ${data?.access}`;
        return api(original);
      } catch (e) {
        processQueue(e, null);
        store.dispatch(logout());
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
  );
};

/* ===========================
   Auth header helpers
=========================== */
export const setAuthHeader = (token) => {
  debugger;
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    // axios.defaults.headers.common["Authorization"] = `Bearer ${token}`; // global
  } else {
    delete api.defaults.headers.common["Authorization"];
    // delete axios.defaults.headers.common["Authorization"];
  }
};

/* ===========================
   Persist helpers
=========================== */
const saveToStorage = (state) => {
  debugger;
  localStorage.setItem(
    "auth",
    JSON.stringify({
      access: state.access,
      refresh: state.refresh,
      user: state.user,
      roles: state.roles,
    })
  );
};

// const writeCompatKeys = (access, refresh) => {
//    debugger;
//   if (access) {
//     localStorage.setItem("access_token", access); // bazı guard'lar
//     localStorage.setItem("token", access);        // eski kontroller
//     localStorage.setItem("last_user_activity", Date.now().toString());
//   }
//   if (refresh) localStorage.setItem("refresh_token", refresh);
// };

const clearAllAuthKeys = () => {
  debugger;
  localStorage.removeItem("auth");
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("token");
  localStorage.removeItem("last_user_activity");
};

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem("auth");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const restored = loadFromStorage();
if (restored?.access) {
  // sayfa yenilendiğinde header hazır olsun
  setAuthHeader(restored.access);
}

/* ===========================
   Thunks
=========================== */

// E-posta/Şifre login
export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {    
    try {
      const { data } = await api.post("/auth/login/", { email, password });
      debugger;
      return data; // { access, refresh, user }
    } catch (err) {
      return rejectWithValue(err.response?.data || { detail: "Giriş başarısız" });
    }
  }
);

// Me
export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { access } = getState().auth || {};
      if (!access) return rejectWithValue({ detail: "Giriş gerekli" });
      const { data } = await api.get("/auth/me/");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { detail: "Kullanıcı bilgisi alınamadı" });
    }
  }
);

export const sendSmsCode = createAsyncThunk(
  "auth/sendSmsCode",
  async ({ phone }, { rejectWithValue }) => {
    try {
      await api.post("/send-sms/", { phone });
      return true;
    } catch {
      return rejectWithValue({ detail: "Kod gönderilemedi" });
    }
  }
);

export const verifySmsCode = createAsyncThunk(
  "auth/verifySmsCode",
  async ({ phone, code }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/verify-code/", { phone, code });
      return data; // { access, refresh, user }
    } catch (e) {
      return rejectWithValue(e?.response?.data || { detail: "Doğrulama başarısız" });
    }
  }
);

export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async ({ credential }, { rejectWithValue }) => {
    if (!credential) return rejectWithValue({ detail: "Google credential yok" });
    try {
      const { data } = await api.post("/auth/google/", { credential });
      return data;
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        "Google ile giriş başarısız";
      return rejectWithValue({ detail: msg });
    }
  }
);

const normalizeRoles = (roles) => {
  if (!roles) return [];
  // ["Admin","Koordinator"] veya [{name:"Admin"}] durumlarını normalize et
  return roles.map((r) => (typeof r === "string" ? r : (r?.name || r?.Name || r?.code || r?.role))).filter(Boolean);
};
/* ===========================
   Slice
=========================== */
const initialState = {
  user: restored?.user || null,
  roles: restored?.roles || [],
  access: restored?.access || null,
  refresh: restored?.refresh || null,

  status: "idle",
  error: null,

  smsStatus: "idle",
  smsError: null,

  socialStatus: "idle",
  socialError: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setTokens(state, action) {
      if (action.payload?.access) state.access = action.payload.access;
      if (action.payload?.refresh) state.refresh = action.payload.refresh;
      saveToStorage(state);
    },
    logout(state) {
      state.user = null;
      state.roles = [];
      state.access = null;
      state.refresh = null;

      state.status = "idle";
      state.error = null;

      state.smsStatus = "idle";
      state.smsError = null;

      state.socialStatus = "idle";
      state.socialError = null;

      saveToStorage(state);
      clearAllAuthKeys();
      setAuthHeader(null);
    },
  },
  extraReducers: (builder) => {
    builder
      // Email/Şifre login
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";       
        const { access, refresh, user } = action.payload || {};
        state.access = access || null;
        state.refresh = refresh || null;
        state.user = user || null;        
        state.roles = normalizeRoles(
         action.payload?.user?.roles ??
         action.payload?.roles ??
         state.user?.roles
        );
        setAuthHeader(state.access);
        //writeCompatKeys(state.access, state.refresh);
        saveToStorage(state);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || { detail: "Giriş başarısız" };
      })

      // Me
      .addCase(fetchMe.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.user = action.payload;
        state.roles = normalizeRoles(
          action.payload?.roles ?? action.payload?.user?.roles
        );
        saveToStorage(state);
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // SMS — kod gönder
      .addCase(sendSmsCode.pending, (state) => {
        state.smsStatus = "loading";
        state.smsError = null;
      })
      .addCase(sendSmsCode.fulfilled, (state) => {
        state.smsStatus = "sent";
      })
      .addCase(sendSmsCode.rejected, (state, action) => {
        state.smsStatus = "failed";
        state.smsError = action.payload || { detail: "Kod gönderilemedi" };
      })

      // SMS — kod doğrula
      .addCase(verifySmsCode.pending, (state) => {
        state.smsStatus = "verifying";
        state.smsError = null;
      })
      .addCase(verifySmsCode.fulfilled, (state, action) => {
        state.smsStatus = "verified";
        const { access, refresh, user } = action.payload || {};
        state.access = access || null;
        state.refresh = refresh || null;
        state.user = user || null;        
        state.roles = normalizeRoles(action.payload.user?.roles);

        setAuthHeader(state.access);
        //writeCompatKeys(state.access, state.refresh);
        saveToStorage(state);
      })
      .addCase(verifySmsCode.rejected, (state, action) => {
        state.smsStatus = "failed";
        state.smsError = action.payload || { detail: "Doğrulama başarısız" };
      })

      // Google login
      .addCase(googleLogin.pending, (state) => {
        state.socialStatus = "loading";
        state.socialError = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.socialStatus = "succeeded";
        state.access = action.payload.access;
        state.refresh = action.payload.refresh;
        state.user = action.payload.user;
        state.roles = normalizeRoles(action.payload.user?.roles);

        setAuthHeader(state.access);
        //writeCompatKeys(state.access, state.refresh);
        saveToStorage(state);
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.socialStatus = "failed";
        state.socialError = action.payload || { detail: "Google ile giriş başarısız" };
      });
  },
});

export const { logout,setTokens } = authSlice.actions;

/* ===========================
   Selectors
=========================== */
export const selectAuth = (s) => s.auth;
export const selectUser = (s) => s.auth.user;
export const selectRoles = (s) => normalizeRoles(s.auth.roles);
export const hasRole = (role) => (s) => selectRoles(s).some((r) => r.toLowerCase() === String(role).toLowerCase());
export const selectAccess = (s) => s.auth.access;
export const selectIsLoggedIn = (s) => !!s.auth.access;
// primitive (rerender güvenli) selectorlar
export const selectSmsStatus = (s) => s.auth.smsStatus;
export const selectSmsError = (s) => s.auth.smsError;
export const selectSocialStatus = (s) => s.auth.socialStatus;
export const selectSocialError = (s) => s.auth.socialError;

// memoized objeler
export const selectSms = createSelector(
  [selectSmsStatus, selectSmsError],
  (status, error) => ({ status, error })
);
export const selectSocial = createSelector(
  [selectSocialStatus, selectSocialError],
  (status, error) => ({ status, error })
);

export default authSlice.reducer;
