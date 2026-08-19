import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import ModuleList from "../components/formations/ModuleList";
import styles from "./FormationDetail.module.css";

function BadgeNiveau({ niveau }) {
    if (niveau === "Débutant")      return <span className={styles.badgeDebutant}>{niveau}</span>;
    if (niveau === "Intermédiaire") return <span className={styles.badgeIntermediaire}>{niveau}</span>;
    return <span className={styles.badgeAvance}>{niveau}</span>;
}

// onOpenLogin → ouvre la LoginModal si l'utilisateur clique
// "Suivre" sans être connecté
export default function FormationDetail({ onOpenLogin }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [formation,   setFormation]   = useState(null);
    const [modules,     setModules]     = useState([]);
    const [enrollment,  setEnrollment]  = useState(null); // null = non inscrit
    const [loading,     setLoading]     = useState(true);
    const [actionLoad,  setActionLoad]  = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // 3 appels parallélisables — on les garde séquentiels
                // pour simplifier la gestion d'erreur
                const resF = await api.get(`/formations/${id}`);
                setFormation(resF.data);

                const resM = await api.get(`/formations/${id}/modules`);
                setModules(resM.data);

                // Vérifie si l'apprenant est déjà inscrit
                // On lit localStorage directement pour éviter un
                // re-render supplémentaire via useAuth
                const token = localStorage.getItem('skillhub_token');
                const user  = localStorage.getItem('skillhub_user');

                if (token && user) {
                    const parsedUser = JSON.parse(user);
                    if (parsedUser.role === 'apprenant') {
                        try {
                            const resE = await api.get('/apprenant/formations');
                            const enrollments = resE.data.data ?? resE.data;
                            const found = enrollments.find(
                                e => e.formation?.id === parseInt(id)
                            );
                            if (found) {
                                setEnrollment({
                                    progression:   found.progression ?? 0,
                                    enrollment_id: found.enrollment_id,
                                });
                            }
                        } catch (e) {
                            console.error('Erreur vérif inscription :', e.response?.status);
                        }
                    }
                }
            } catch (err) {
                console.error('Erreur chargement formation', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]); // se relance si l'id change (navigation entre formations)


    const handleSuivre = async () => {
        // Redirige vers LoginModal si non connecté
        if (!isAuthenticated) {
            onOpenLogin();
            return;
        }
        setActionLoad(true);
        try {
            await api.post(`/formations/${id}/inscription`);
            setEnrollment({ progression: 0 });
            navigate(`/apprendre/${id}`);
        } catch (err) {
            // 409 = déjà inscrit → on redirige quand même
            if (err.response?.status === 409 || err.response?.status === 422) {
                navigate(`/apprendre/${id}`);
            } else {
                console.error("Erreur inscription", err);
            }
        } finally {
            setActionLoad(false);
        }
    };

    const handleDesinscrire = async () => {
        if (!window.confirm("Tu vas te désinscrire de cette formation. Ta progression sera perdue.")) return;
        setActionLoad(true);
        try {
            await api.delete(`/formations/${id}/inscription`);
            setEnrollment(null);
        } catch (err) {
            console.error("Erreur désinscription", err);
        } finally {
            setActionLoad(false);
        }
    };

    if (loading)    return <div className={styles.loading}>Chargement...</div>;
    if (!formation) return <div className={styles.loading}>Formation introuvable.</div>;

    const isEnrolled       = !!enrollment;
    const progression      = enrollment?.progression ?? 0;
    // Calcule le nb de modules complétés depuis le % de progression
    const modulesCompleted = Math.round((progression / 100) * modules.length);
    const formateurNom     = formation.formateur
        ? `${formation.formateur.prenom} ${formation.formateur.nom}`
        : "Formateur";

    return (
        <div className={styles.page}>

            {/* Breadcrumb */}
            <div className={styles.breadcrumb}>
                <button className={styles.breadcrumbLink} onClick={() => navigate("/")}>Accueil</button>
                <span className={styles.breadcrumbSep}>›</span>
                <button className={styles.breadcrumbLink} onClick={() => navigate("/formations")}>Formations</button>
                <span className={styles.breadcrumbSep}>›</span>
                <span>{formation.titre}</span>
            </div>

            {/* Hero */}
            <div className={styles.hero}>
                <div className={styles.heroInner}>
                    <div>
                        <div className={styles.heroBadges}>
                            <BadgeNiveau niveau={formation.niveau} />
                            <span className={styles.heroCatBadge}>{formation.categorie}</span>
                        </div>
                        <h1 className={styles.heroTitle}>{formation.titre}</h1>
                        <p className={styles.heroDesc}>{formation.description}</p>

                        <div className={styles.heroMeta}>
                            <div className={styles.heroMetaItem}>
                                {/* Avatar initiale du formateur */}
                                <div style={{
                                    width: 36, height: 36, borderRadius: "50%",
                                    background: "#2D8A6E", display: "flex",
                                    alignItems: "center", justifyContent: "center",
                                    fontSize: 14, fontWeight: 700, color: "#fff",
                                }}>
                                    {formation.formateur?.prenom?.charAt(0)}
                                </div>
                                <div>
                                    <div className={styles.heroMetaLabel}>Formateur</div>
                                    <div className={styles.heroMetaValue}>{formateurNom}</div>
                                </div>
                            </div>
                            <div className={styles.heroMetaItem}>
                                <span className={styles.heroMetaEmoji}>👤</span>
                                <div>
                                    <div className={styles.heroMetaLabel}>Apprenants</div>
                                    <div className={styles.heroMetaValue}>{formation.enrollments_count ?? 0} inscrits</div>
                                </div>
                            </div>
                            <div className={styles.heroMetaItem}>
                                <span className={styles.heroMetaEmoji}>👁</span>
                                <div>
                                    <div className={styles.heroMetaLabel}>Vues</div>
                                    <div className={styles.heroMetaValue}>{formation.nombre_vues ?? 0} vues</div>
                                </div>
                            </div>
                            <div className={styles.heroMetaItem}>
                                <span className={styles.heroMetaEmoji}>📚</span>
                                <div>
                                    <div className={styles.heroMetaLabel}>Modules</div>
                                    <div className={styles.heroMetaValue}>{modules.length} modules</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card action — contenu différent selon isEnrolled */}
                    <div className={styles.actionCard}>
                        {!isEnrolled ? (
                            <>
                                <div className={styles.freeLabel}>
                                    <div className={styles.freeLabelTitle}>100% Gratuit</div>
                                    <div className={styles.freeLabelSub}>Aucune carte bancaire requise</div>
                                </div>
                                <button
                                    className={styles.btnSuivre}
                                    onClick={handleSuivre}
                                    disabled={actionLoad}
                                >
                                    {actionLoad ? "Inscription..." : "Suivre la formation"}
                                </button>
                                {!isAuthenticated && (
                                    <div className={styles.actionHint}>
                                        Connecte-toi ou inscris-toi pour commencer
                                    </div>
                                )}
                                <div className={styles.inclusList}>
                                    <div className={styles.inclusTitle}>Cette formation inclut :</div>
                                    <div className={styles.inclusItem}><span>✅</span> {modules.length} modules progressifs</div>
                                    <div className={styles.inclusItem}><span>✅</span> Accès illimité</div>
                                    <div className={styles.inclusItem}><span>✅</span> Suivi de progression</div>
                                    <div className={styles.inclusItem}><span>✅</span> 100% gratuit</div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={styles.progressBox}>
                                    <div className={styles.progressBoxTitle}>Ta progression</div>
                                    <div className={styles.progressPct}>{progression}%</div>
                                    <div className={styles.progressBar}>
                                        <div className={styles.progressFill} style={{ width: `${progression}%` }} />
                                    </div>
                                    <div className={styles.progressSub}>
                                        {modulesCompleted} module{modulesCompleted > 1 ? "s" : ""} sur {modules.length} complété{modulesCompleted > 1 ? "s" : ""}
                                    </div>
                                </div>
                                <button
                                    className={styles.btnContinuer}
                                    onClick={() => navigate(`/apprendre/${id}`)}
                                >
                                    Continuer la formation →
                                </button>
                                <button
                                    className={styles.btnDesinscrire}
                                    onClick={handleDesinscrire}
                                    disabled={actionLoad}
                                >
                                    Se désinscrire
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Contenu */}
            <div className={styles.content}>
                <div>
                    <div className={styles.block}>
                        <h2 className={styles.blockTitle}>À propos de cette formation</h2>
                        <p className={styles.descText}>{formation.description}</p>
                    </div>

                    <div className={styles.block}>
                        <div className={styles.blockTitleRow}>
                            <h2 className={styles.blockTitle} style={{ margin: 0 }}>
                                Contenu de la formation
                            </h2>
                            <span className={styles.blockSubtitle}>{modules.length} modules</span>
                        </div>
                        {/* enrolled=false → modules gris (visiteur)
                            enrolled=true  → modules avec statut coloré */}
                        <ModuleList modules={modules} enrolled={isEnrolled} />
                    </div>
                </div>

                {/* Card formateur */}
                <div>
                    <div className={styles.formateurCard}>
                        <h3 className={styles.blockTitle}>À propos du formateur</h3>
                        <div className={styles.formateurHeader}>
                            <div className={styles.formateurAvatar}>
                                {formation.formateur?.prenom?.charAt(0)}
                            </div>
                            <div>
                                <div className={styles.formateurName}>{formateurNom}</div>
                                <div className={styles.formateurRole}>Formateur SkillHub</div>
                            </div>
                        </div>
                        <p className={styles.formateurBio}>
                            Formateur passionné sur la plateforme SkillHub, partageant son
                            expertise à travers des formations structurées et accessibles.
                        </p>
                        <div className={styles.formateurStats}>
                            <div className={styles.formateurStat}>
                                {/* formations_count non chargé par défaut — à ajouter
                                    dans FormationController.show() si besoin */}
                                <div className={styles.formateurStatNum}>{formation.formateur?.formations_count ?? "—"}</div>
                                <div className={styles.formateurStatLabel}>Formations</div>
                            </div>
                            <div className={styles.formateurStat}>
                                <div className={styles.formateurStatNum}>{formation.enrollments_count ?? 0}</div>
                                <div className={styles.formateurStatLabel}>Apprenants</div>
                            </div>
                            <div className={styles.formateurStat}>
                                <div className={styles.formateurStatNum}>{formation.nombre_vues ?? 0}</div>
                                <div className={styles.formateurStatLabel}>Vues</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}