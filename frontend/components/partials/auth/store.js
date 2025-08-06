import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import apiService from "@/services/api";

// Thunk para login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      console.log("Store: Iniciando login para:", email);
      const response = await apiService.login(email, password);
      console.log("Store: Resposta recebida:", response);
      
      // Salvar tokens e dados do usuário
      apiService.setToken(response.data.accessToken);
      apiService.setRefreshToken(response.data.refreshToken);
      apiService.setUser(response.data.user);
      
      console.log("Store: Tokens salvos, retornando dados");
      return response.data;
    } catch (error) {
      console.error("Store: Erro no login:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para logout
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.logout();
      apiService.clearTokens();
      return true;
    } catch (error) {
      // Mesmo se der erro no logout, limpar tokens localmente
      apiService.clearTokens();
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para obter usuário atual
export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getCurrentUser();
      apiService.setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Verificar autenticação inicial
const getInitialAuthState = () => {
  if (typeof window !== "undefined") {
    const isAuth = apiService.isAuthenticated() && !apiService.isTokenExpired();
    const user = apiService.getUser();
    console.log("Store: Estado inicial - isAuth:", isAuth, "user:", user);
    return {
      isAuth,
      user,
      loading: false,
      error: null
    };
  }
  return {
    isAuth: false,
    user: null,
    loading: false,
    error: null
  };
};

export const authSlice = createSlice({
  name: "auth",
  initialState: getInitialAuthState(),
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
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
        state.isAuth = true;
        state.user = action.payload.user;
        state.error = null;
        toast.success("Login realizado com sucesso!", {
          position: "top-right",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuth = false;
        state.user = null;
        state.error = action.payload;
        toast.error(action.payload || "Erro no login", {
          position: "top-right",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      })
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.isAuth = false;
        state.user = null;
        state.error = null;
        toast.success("Logout realizado com sucesso!", {
          position: "top-right",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuth = false;
        state.user = null;
        state.error = action.payload;
        toast.error(action.payload || "Erro no logout", {
          position: "top-right",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      })
      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuth = true;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuth = false;
        state.user = null;
        state.error = action.payload;
      });
  }
});

export const { clearError, setLoading } = authSlice.actions;
export default authSlice.reducer;
