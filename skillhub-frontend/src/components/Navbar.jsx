import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Navbar.module.css";

export default function Navbar({ onOpenLogin, onOpenRegister }) {
    const { isAuthenticated, isFormateur, user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleLogout = async () => {
        setDropdownOpen(false);
        await logout();
        navigate("/");
    };

    // Redirige vers le bon dashboard selon le rôle
    const dashboardPath = isFormateur
        ? "/dashboard/formateur"
        : "/dashboard/apprenant";

    // Active le lien "Formations" sur toutes les routes /formation/*
    const formationsClass = location.pathname.startsWith("/formation")
        ? `${styles.navLink} ${styles.navLinkActive}`
        : styles.navLink;

    // Fallback "?" si prenom pas encore chargé depuis localStorage
    const initiale = user?.prenom?.charAt(0).toUpperCase() ?? "?";

    const fullName = user?.prenom && user?.nom
        ? `${user.prenom} ${user.nom}`
        : user?.email ?? "";

    return (
        <nav className={styles.navbar}>

            <Link to="/" className={styles.logo}>
                Skill<span className={styles.logoAccent}>Hub</span>
            </Link>

            <div className={styles.navRight}>
                <Link to="/formations" className={formationsClass}>
                    Formations
                </Link>

                {!isAuthenticated ? (
                    <>
                        <button className={styles.btnConnexion} onClick={onOpenLogin}>
                            Connexion
                        </button>
                        <button className={styles.btnInscription} onClick={onOpenRegister}>
                            S'inscrire
                        </button>
                    </>
                ) : (
                    // Hover sur le wrapper ouvre le dropdown
                    // onMouseLeave ferme sans clic supplémentaire
                    <div
                        className={styles.profileWrapper}
                        onMouseEnter={() => setDropdownOpen(true)}
                        onMouseLeave={() => setDropdownOpen(false)}
                    >
                        <div className={styles.profileTrigger}>
                            {/* Couleur de l'avatar différente selon le rôle */}
                            <div className={`${styles.avatar} ${isFormateur ? styles.avatarFormateur : styles.avatarApprenant}`}>
                                {initiale}
                            </div>
                            <span className={styles.profileName}>{fullName}</span>
                        </div>

                        {dropdownOpen && (
                            <div className={styles.dropdown}>
                                <div className={styles.dropdownHeader}>
                                    <div className={styles.dropdownName}>{fullName}</div>
                                    <div className={styles.dropdownRole}>
                                        {isFormateur ? "Formateur" : "Apprenant"}
                                    </div>
                                </div>

                                <div className={styles.dropdownBody}>
                                    <button
                                        className={styles.dropdownBtn}
                                        onClick={() => {
                                            setDropdownOpen(false);
                                            navigate(dashboardPath);
                                        }}
                                    >
                                        🏠 Mon dashboard
                                    </button>
                                    <div className={styles.dropdownDivider} />
                                    <button
                                        className={`${styles.dropdownBtn} ${styles.dropdownBtnDanger}`}
                                        onClick={handleLogout}
                                    >
                                        🚪 Se déconnecter
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}