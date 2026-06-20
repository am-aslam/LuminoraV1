import { createContext, useContext, useEffect, useState } from "react";
import api, { TOKEN_KEY } from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get("/auth/me");
        setUser(data);
      } catch (e) {
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, role = "student") => {
    const { data } = await api.post("/auth/register", { name, email, password, role });
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const refreshUser = async () => {
    const { data } = await api.get("/auth/me");
    setUser(data);
    return data;
  };

  const updateAcademicProfile = async (profile) => {
    await api.put("/academic/profile", profile);
    return refreshUser();
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser, updateAcademicProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
