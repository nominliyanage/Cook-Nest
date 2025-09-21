import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "@/firebase";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
type AuthContextType = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
      <AuthContext.Provider value={{ user, loading, signOut: handleSignOut }}>
        {children}
      </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
