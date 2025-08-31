import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001/api';

// Async thunks for auth operations
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/token/`, {
        email,
        password,
      });
      
      const { access, refresh } = response.data;
      
      // Token'ları localStorage'a kaydet
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      // User bilgilerini al
      const userResponse = await axios.get(`${API_BASE_URL}/user/`, {
        headers: { Authorization: `Bearer ${access}` }
      });
      
      return {
        user: userResponse.data,
        accessToken: access,
        refreshToken: refresh,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || error.response?.data?.error || 'Giriş başarısız'
      );
    }
  }
);

export const refreshTokenAsync = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const refreshToken = auth.refreshToken || localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        throw new Error('Refresh token bulunamadı');
      }
      
      const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
        refresh: refreshToken,
      });
      
      const { access } = response.data;
      localStorage.setItem('access_token', access);
      
      return { accessToken: access };
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return rejectWithValue('Token yenileme başarısız');
    }
  }
);

export const loadUserFromStorage = createAsyncThunk(
  'auth/loadUserFromStorage',
  async (_, { dispatch, rejectWithValue }) => {
          try {
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!accessToken) {
          throw new Error('Token bulunamadı');
        }
        
        // User bilgilerini çek
        const userResponse = await axios.get(`${API_BASE_URL}/user/`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        return {
          user: userResponse.data,
          accessToken,
          refreshToken,
        };
      } catch (error) {
        // Token geçersizse refresh dene
        if (error.response?.status === 401) {
          const refreshResult = await dispatch(refreshTokenAsync());
          if (refreshResult.type === 'auth/refreshToken/fulfilled') {
            // Refresh başarılıysa user bilgilerini tekrar çek
            const newAccessToken = refreshResult.payload.accessToken;
            const userResponse = await axios.get(`${API_BASE_URL}/user/`, {
              headers: { Authorization: `Bearer ${newAccessToken}` }
            });
            
            return {
              user: userResponse.data,
              accessToken: newAccessToken,
              refreshToken: localStorage.getItem('refresh_token'),
            };
          }
        }
        
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return rejectWithValue('Kullanıcı bilgileri yüklenemedi');
      }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    },
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = !!accessToken;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Refresh Token
      .addCase(refreshTokenAsync.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
      })
      .addCase(refreshTokenAsync.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })
      // Load User
      .addCase(loadUserFromStorage.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(loadUserFromStorage.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
      });
  },
});

export const { logout, clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;