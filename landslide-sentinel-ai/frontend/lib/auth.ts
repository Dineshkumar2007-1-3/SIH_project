import { useState, useEffect } from "react";

export const useAuth = () => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on load
    const token = localStorage.getItem("token");
    if (token) {
      // In a real implementation, we would validate the token with the backend
      // and fetch user data
      setUser({
        id: 1,
        name: "Demo User",
        email: "user@example.com",
        role: "observer"
      });
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // In a real implementation, this would call the login API
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Set user data
      setUser({
        id: 1,
        name: "Demo User",
        email: email,
        role: "observer"
      });

      // Store token
      localStorage.setItem("token", "fake-jwt-token");
    } catch (err) {
      throw new Error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  const hasRole = (role: string) => {
    return user?.role === role;
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole
  };
};

// export const requireAuth = (): boolean => {
//   // This is a simplified version - in a real app, you'd use a proper auth context
//   // Note: This function should only be called in event handlers or effects, not during render
//   const token = localStorage.getItem("token");
//   return token !== null;
// };