import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

const decodeToken = (token) => {
  try {
    const base64 = token.split(".")[1];
    const decoded = JSON.parse(atob(base64));
    return { token, ...decoded };
  } catch {
    return { token };
  }
};

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    return token ? decodeToken(token) : null;
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !user) {
      setUser(decodeToken(token));
    }
  }, [user]);

  const login = (token) => {
    localStorage.setItem("token", token);
    setUser(decodeToken(token));
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
} 
