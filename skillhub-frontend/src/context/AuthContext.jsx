import { createContext, useContext, useState, useEffect } from "react";
import authApi from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user,    setUser]    = useState(null);
    const [token,   setToken]   = useState(null);
    const [loading, setLoading] = useState(true);

    // Restaure la session au refresh — sans ça, l'utilisateur
    // serait déconnecté à chaque rechargement de page
    useEffect(() => {
        const storedToken = localStorage.getItem("skillhub_token");
        const storedUser  = localStorage.getItem("skillhub_user");

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }

        // Doit passer à false dans tous les cas pour débloquer
        // le rendu de ProtectedRoute
        setLoading(false);
    }, []);


    // Appelle Spring Boot → reçoit { accessToken, role, nom, prenom, email }
    const login = async (email, password) => {
        try {
            const response = await authApi.post("/auth/login", { email, password });
            const receivedToken = response.data.accessToken;

            if (!receivedToken) {
                throw new Error("Token non reçu de Spring Boot");
            }

            const userData = {
                email:  response.data.email || email,
                role:   response.data.role,
                nom:    response.data.nom,
                prenom: response.data.prenom,
            };

            localStorage.setItem("skillhub_token", receivedToken);
            localStorage.setItem("skillhub_user",  JSON.stringify(userData));

            setToken(receivedToken);
            setUser(userData);

            return userData;

        } catch (error) {
            console.error("Erreur login :", error);
            throw error;
        }
    };


    // Envoie exactement les champs attendus par RegisterRequest.java
    const register = async (formData) => {
        await authApi.post("/auth/register", {
            nom:      formData.nom,
            prenom:   formData.prenom,
            email:    formData.email,
            password: formData.password,
            role:     formData.role,
        });
    };


    // JWT est stateless — pas de session serveur à détruire
    // On vide simplement le localStorage et les states
    const logout = () => {
        localStorage.removeItem("skillhub_token");
        localStorage.removeItem("skillhub_user");
        setToken(null);
        setUser(null);
    };


    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                isAuthenticated: !!token && !!user,
                isFormateur:     user?.role === "formateur",
                isApprenant:     user?.role === "apprenant",
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth doit être utilisé dans AuthProvider");
    return context;
}