import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import FormationModal from '../components/modals/FormationModal';
import DeleteModal    from '../components/modals/DeleteModal';
import ModulesModal   from '../components/modals/ModulesModal';
import styles from './DashboardFormateur.module.css';

function BadgeNiveau({ niveau }) {
    if (niveau === 'Débutant')      return <span className={styles.badgeDebutant}>{niveau}</span>;
    if (niveau === 'Intermédiaire') return <span className={styles.badgeIntermediaire}>{niveau}</span>;
    return <span className={styles.badgeAvance}>{niveau}</span>;
}

export default function DashboardFormateur() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [formations, setFormations] = useState([]);
    const [loading,    setLoading]    = useState(true);

    // 3 modals indépendantes — une seule ouverte à la fois
    // null = fermée | 'create' = création | objet formation = édition/suppression
    const [modalFormation, setModalFormation] = useState(null);
    const [modalDelete,    setModalDelete]    = useState(null);
    const [modalModules,   setModalModules]   = useState(null);

    const fetchFormations = async () => {
        try {
            setLoading(true);
            const res = await api.get('/formateur/formations');
            setFormations(res.data.data ?? res.data);
        } catch (err) {
            console.error('Erreur chargement formations', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFormations();
    }, []);

    const handleDelete = async () => {
        try {
            await api.delete(`/formations/${modalDelete.id}`);
            setModalDelete(null);
            fetchFormations();
        } catch (err) {
            console.error('Erreur suppression', err);
        }
    };

    // Stats agrégées depuis les formations déjà chargées
    const totalApprenants = formations.reduce((acc, f) => acc + (f.enrollments_count ?? 0), 0);
    const totalVues       = formations.reduce((acc, f) => acc + (f.nombre_vues ?? 0), 0);

    return (
        <div className={styles.page}>

            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerInner}>
                    <div>
                        <span className={styles.headerBadge}>Tableau de bord</span>
                        <h1 className={styles.headerTitle}>Bonjour, {user?.prenom} 👋</h1>
                        <p className={styles.headerSub}>Gérez vos formations et suivez vos statistiques.</p>
                    </div>
                    <button className={styles.btnCreate} onClick={() => setModalFormation('create')}>
                        <span style={{ fontSize: 18 }}>+</span> Créer une formation
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className={styles.statsBar}>
                <div className={styles.statsInner}>
                    <div className={styles.statItem}>
                        <div className={styles.statNum}>{formations.length}</div>
                        <div className={styles.statLabel}>Formations créées</div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={styles.statNum}>{totalApprenants}</div>
                        <div className={styles.statLabel}>Apprenants au total</div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={styles.statNum}>{totalVues}</div>
                        <div className={styles.statLabel}>Vues au total</div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={`${styles.statNum} ${styles.statNumGreen}`}>
                            {formations.length > 0 ? '✓' : '—'}
                        </div>
                        <div className={styles.statLabel}>Statut</div>
                    </div>
                </div>
            </div>

            {/* Formations */}
            <div className={styles.content}>
                <div className={styles.contentHeader}>
                    <h2 className={styles.contentTitle}>Mes formations</h2>
                    <span className={styles.contentCount}>
                        {formations.length} formation{formations.length > 1 ? 's' : ''}
                    </span>
                </div>

                {loading && <div className={styles.loading}>Chargement...</div>}

                {!loading && formations.length === 0 && (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyEmoji}>📚</div>
                        <div className={styles.emptyTitle}>Aucune formation pour l'instant</div>
                        <div className={styles.emptyDesc}>
                            Crée ta première formation et partage ton expertise !
                        </div>
                        <button
                            className={styles.btnCreate}
                            onClick={() => setModalFormation('create')}
                        >
                            + Créer ma première formation
                        </button>
                    </div>
                )}

                {!loading && formations.length > 0 && (
                    <div className={styles.grid}>
                        {formations.map(f => (
                            <div key={f.id} className={styles.card}>
                                <div className={styles.cardBody}>
                                    <div className={styles.cardTopRow}>
                                        <BadgeNiveau niveau={f.niveau} />
                                        <span className={styles.cardCat}>{f.categorie}</span>
                                    </div>
                                    <h3 className={styles.cardTitle}>{f.titre}</h3>
                                    <p className={styles.cardDesc}>{f.description}</p>

                                    <div className={styles.cardStats}>
                                        <div className={styles.cardStat}>
                                            <div className={styles.cardStatNum}>{f.enrollments_count ?? 0}</div>
                                            <div className={styles.cardStatLabel}>Apprenants</div>
                                        </div>
                                        <div className={styles.cardStat}>
                                            <div className={styles.cardStatNum}>{f.nombre_vues ?? 0}</div>
                                            <div className={styles.cardStatLabel}>Vues</div>
                                        </div>
                                        <div className={styles.cardStat}>
                                            {/* modules_count ajouté par withCount() dans Laravel */}
                                            <div className={styles.cardStatNum}>{f.modules_count ?? '—'}</div>
                                            <div className={styles.cardStatLabel}>Modules</div>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.cardFooter}>
                                    <button
                                        className={styles.btnDetail}
                                        onClick={() => navigate(`/formation/${f.id}`)}
                                    >
                                        Voir
                                    </button>
                                    <button
                                        className={styles.btnEdit}
                                        onClick={() => setModalFormation(f)}
                                    >
                                        ✏️ Modifier
                                    </button>
                                    <button
                                        className={styles.btnModules}
                                        onClick={() => setModalModules(f)}
                                    >
                                        📚 Modules
                                    </button>
                                    <button
                                        className={styles.btnDelete}
                                        onClick={() => setModalDelete(f)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal création/modification
                formation=null → mode création
                formation=objet → mode édition */}
            {modalFormation && (
                <FormationModal
                    onClose={() => setModalFormation(null)}
                    onSuccess={fetchFormations}
                    formation={modalFormation === 'create' ? null : modalFormation}
                />
            )}

            {/* Modal suppression avec confirmation */}
            {modalDelete && (
                <DeleteModal
                    onClose={() => setModalDelete(null)}
                    onConfirm={handleDelete}
                    title="Supprimer la formation ?"
                    message={`Tu es sur le point de supprimer "${modalDelete.titre}"`}
                    warning="Cette action est irréversible. Tous les modules associés seront supprimés."
                />
            )}

            {/* Modal gestion des modules */}
            {modalModules && (
                <ModulesModal
                    onClose={() => setModalModules(null)}
                    formation={modalModules}
                />
            )}
        </div>
    );
}