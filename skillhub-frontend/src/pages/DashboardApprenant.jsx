import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import DeleteModal from '../components/modals/DeleteModal';
import styles from './DashboardApprenant.module.css';

function BadgeNiveau({ niveau }) {
    if (niveau === 'Débutant')      return <span className={styles.badgeDebutant}>{niveau}</span>;
    if (niveau === 'Intermédiaire') return <span className={styles.badgeIntermediaire}>{niveau}</span>;
    return <span className={styles.badgeAvance}>{niveau}</span>;
}

export default function DashboardApprenant() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [enrollments, setEnrollments] = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [filter,      setFilter]      = useState('all');
    const [modalUnsub,  setModalUnsub]  = useState(null); // enrollment à désinscrire ou null

    // Charge les formations de l'apprenant depuis Laravel
    // data ?? data gère les deux formats de réponse possibles
    const fetchEnrollments = async () => {
        try {
            setLoading(true);
            const res = await api.get('/apprenant/formations');
            setEnrollments(res.data.data ?? res.data);
        } catch (err) {
            console.error('Erreur chargement formations', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEnrollments();
    }, []);

    const handleDesinscrire = async () => {
        try {
            await api.delete(`/formations/${modalUnsub.formation.id}/inscription`);
            setModalUnsub(null);
            fetchEnrollments(); // rafraîchit la liste et les stats
        } catch (err) {
            console.error('Erreur désinscription', err);
        }
    };

    // Filtrage local — pas de nouvel appel API
    const filtered = enrollments.filter(e => {
        if (filter === 'done')     return e.progression === 100;
        if (filter === 'progress') return e.progression < 100;
        return true;
    });

    // Stats calculées depuis les enrollments déjà chargés
    const total      = enrollments.length;
    const terminees  = enrollments.filter(e => e.progression === 100).length;
    const enCours    = enrollments.filter(e => e.progression < 100).length;
    const moyennePct = total > 0
        ? Math.round(enrollments.reduce((acc, e) => acc + (e.progression ?? 0), 0) / total)
        : 0;

    return (
        <div className={styles.page}>

            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerInner}>
                    <div>
                        <span className={styles.headerBadge}>Tableau de bord</span>
                        <h1 className={styles.headerTitle}>Bonjour, {user?.prenom} 👋</h1>
                        <p className={styles.headerSub}>Retrouve ici toutes les formations que tu suis.</p>
                    </div>
                    <button className={styles.btnDiscover} onClick={() => navigate('/formations')}>
                        Découvrir des formations →
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className={styles.statsBar}>
                <div className={styles.statsInner}>
                    <div className={styles.statItem}>
                        <div className={styles.statNum}>{total}</div>
                        <div className={styles.statLabel}>Formations suivies</div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={`${styles.statNum} ${styles.statNumGreen}`}>{terminees}</div>
                        <div className={styles.statLabel}>Formations terminées</div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={`${styles.statNum} ${styles.statNumOrange}`}>{enCours}</div>
                        <div className={styles.statLabel}>En cours</div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={styles.statNum}>{moyennePct}%</div>
                        <div className={styles.statLabel}>Progression moyenne</div>
                    </div>
                </div>
            </div>

            {/* Formations */}
            <div className={styles.content}>
                <div className={styles.contentHeader}>
                    <h2 className={styles.contentTitle}>Mes formations</h2>
                    <div className={styles.filters}>
                        {[
                            { key: 'all',      label: 'Toutes'    },
                            { key: 'progress', label: 'En cours'  },
                            { key: 'done',     label: 'Terminées' },
                        ].map(f => (
                            <button
                                key={f.key}
                                className={`${styles.filterBtn} ${filter === f.key ? styles.filterBtnActive : ''}`}
                                onClick={() => setFilter(f.key)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading && <div className={styles.loading}>Chargement...</div>}

                {!loading && (
                    <div className={styles.grid}>
                        {filtered.length === 0 ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyEmoji}>📚</div>
                                <div className={styles.emptyTitle}>Aucune formation ici</div>
                                <div className={styles.emptyDesc}>
                                    {filter === 'all'
                                        ? 'Tu n\'es inscrit à aucune formation pour l\'instant.'
                                        : 'Aucune formation dans cette catégorie.'}
                                </div>
                                {filter === 'all' && (
                                    <button
                                        className={styles.btnDiscover}
                                        onClick={() => navigate('/formations')}
                                    >
                                        Découvrir le catalogue
                                    </button>
                                )}
                            </div>
                        ) : (
                            filtered.map(e => {
                                const f   = e.formation;
                                const isDone = e.progression === 100;
                                const pct    = e.progression ?? 0;

                                // Nom du formateur — fallback si relation non chargée
                                const formateurNom = f.formateur
                                    ? `${f.formateur.prenom} ${f.formateur.nom}`
                                    : 'Formateur';

                                return (
                                    <div
                                        key={e.enrollment_id}
                                        className={`${styles.card} ${isDone ? styles.cardDone : ''}`}
                                    >
                                        <div className={styles.cardBody}>
                                            <div className={styles.cardTopRow}>
                                                <BadgeNiveau niveau={f.niveau} />
                                                {isDone
                                                    ? <span className={styles.badgeDone}>✓ Terminée</span>
                                                    : <span className={styles.badgeEnCours}>En cours</span>
                                                }
                                            </div>
                                            <div className={styles.cardCat}>{f.categorie}</div>
                                            <h3 className={styles.cardTitle}>{f.titre}</h3>
                                            <div className={styles.cardAuthor}>Par {formateurNom}</div>

                                            <div className={styles.progressSection}>
                                                <div className={styles.progressHeader}>
                                                    <span className={styles.progressLabel}>Progression</span>
                                                    <span className={`${styles.progressPct} ${isDone ? styles.progressPctDone : styles.progressPctActive}`}>
                                                        {pct}%
                                                    </span>
                                                </div>
                                                <div className={styles.progressBar}>
                                                    <div
                                                        className={`${styles.progressFill} ${isDone ? styles.progressFillDone : styles.progressFillActive}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles.cardFooter}>
                                            <button
                                                className={styles.btnContinue}
                                                onClick={() => navigate(`/apprendre/${f.id}`)}
                                            >
                                                {isDone ? 'Revoir la formation' : 'Continuer →'}
                                            </button>
                                            <button
                                                className={styles.btnQuitter}
                                                onClick={() => setModalUnsub(e)}
                                            >
                                                Quitter
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Modal désinscription — s'ouvre au clic sur "Quitter" */}
            {modalUnsub && (
                <DeleteModal
                    onClose={() => setModalUnsub(null)}
                    onConfirm={handleDesinscrire}
                    title="Ne plus suivre cette formation ?"
                    message={`Tu es sur le point de te désinscrire de "${modalUnsub.formation?.titre}"`}
                    warning="Ta progression sera perdue. Tu pourras te réinscrire à tout moment."
                />
            )}
        </div>
    );
}