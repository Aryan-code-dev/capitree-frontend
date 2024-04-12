import { useState, createContext, useContext } from "react";


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Check if the user data is stored in a cookie and use it if available.
    const storedUserData = sessionStorage.getItem("token");
    if (storedUserData) {
      return storedUserData;
    } else {
      return {
        token: ""
      };
    }
  });

  const login = (userData) => {
    setUser(userData);
    sessionStorage.setItem("token", userData.token);
    sessionStorage.setItem("user", userData.owner);
 
  };

  const logout = () => {
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("user")
    setUser({
      token: ""
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  return useContext(AuthContext);
};