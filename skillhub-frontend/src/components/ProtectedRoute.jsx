import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Protège les routes qui nécessitent une authentification
// et/ou un rôle spécifique
//
// Props :
//   children → composant à afficher si accès autorisé
//   role     → "formateur" | "apprenant" (optionnel)
//
// Usage dans App.jsx :
//   <ProtectedRoute role="formateur"><DashboardFormateur /></ProtectedRoute>
export default function ProtectedRoute({ children, role }) {
    const { user, loading, isAuthenticated } = useAuth();

    // Attend que localStorage soit lu avant de décider
    // Sans ce check, isAuthenticated serait false au premier rendu
    // et redirigerait l'utilisateur même s'il est connecté
    if (loading) return null;

    // Redirige vers l'accueil si non connecté
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // Redirige si le rôle ne correspond pas
    if (role && user?.role !== role) {
        console.warn(`Accès refusé: requis ${role}, actuel ${user?.role}`);
        return <Navigate to="/" replace />;
    }

    return children;
}