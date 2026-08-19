import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar         from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginModal     from "./components/modals/LoginModal";
import RegisterModal  from "./components/modals/RegisterModal";

import Home               from "./pages/Home";
import Formations         from "./pages/Formations";
import FormationDetail    from "./pages/FormationDetail";
import DashboardApprenant from "./pages/DashboardApprenant";
import DashboardFormateur from "./pages/DashboardFormateur";
import SuiviFormation     from "./pages/SuiviFormation";

export default function App() {
    // Gestion centralisée des modals auth
    // Une seule modal ouverte à la fois : null | 'login' | 'register'
    const [modal, setModal] = useState(null);

    const openLogin    = () => setModal("login");
    const openRegister = () => setModal("register");
    const closeModal   = () => setModal(null);

    return (
        // AuthProvider enveloppe toute l'app pour que useAuth()
        // soit accessible dans tous les composants enfants
        <AuthProvider>
            <BrowserRouter>

                {/* Navbar globale — toujours visible sur toutes les pages */}
                <Navbar onOpenLogin={openLogin} onOpenRegister={openRegister} />

                {/* Modals montées au niveau App pour être accessibles
                    depuis n'importe quelle page (Navbar, Home, FormationDetail...) */}
                {modal === "login" && (
                    <LoginModal
                        onClose={closeModal}
                        onSwitchToRegister={() => setModal("register")}
                    />
                )}
                {modal === "register" && (
                    <RegisterModal
                        onClose={closeModal}
                        onSwitchToLogin={() => setModal("login")}
                    />
                )}

                <main>
                    <Routes>
                        {/* ── Routes publiques ───────────────────────────── */}
                        <Route
                            path="/"
                            element={<Home onOpenLogin={openLogin} onOpenRegister={openRegister} />}
                        />
                        <Route path="/formations"     element={<Formations />} />
                        <Route
                            path="/formation/:id"
                            element={<FormationDetail onOpenLogin={openLogin} />}
                        />

                        {/* ── Routes protégées apprenant ─────────────────── */}
                        <Route
                            path="/dashboard/apprenant"
                            element={
                                <ProtectedRoute role="apprenant">
                                    <DashboardApprenant />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/apprendre/:id"
                            element={
                                <ProtectedRoute role="apprenant">
                                    <SuiviFormation />
                                </ProtectedRoute>
                            }
                        />

                        {/* ── Routes protégées formateur ─────────────────── */}
                        <Route
                            path="/dashboard/formateur"
                            element={
                                <ProtectedRoute role="formateur">
                                    <DashboardFormateur />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </main>

            </BrowserRouter>
        </AuthProvider>
    );
}