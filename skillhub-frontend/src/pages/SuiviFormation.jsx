import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import styles from './SuiviFormation.module.css';

function BadgeNiveau({ niveau }) {
    if (niveau === 'Débutant')      return <span className={styles.badgeDebutant}>{niveau}</span>;
    if (niveau === 'Intermédiaire') return <span className={styles.badgeIntermediaire}>{niveau}</span>;
    return <span className={styles.badgeAvance}>{niveau}</span>;
}

export default function SuiviFormation() {
    const { id }   = useParams();
    const navigate = useNavigate();

    const [formation, setFormation] = useState(null);
    const [modules,   setModules]   = useState([]);
    const [completed, setCompleted] = useState([]); // IDs des modules terminés
    const [current,   setCurrent]   = useState(0);  // index du module affiché
    const [loading,   setLoading]   = useState(true);
    const [saving,    setSaving]    = useState(false);

    // useCallback évite de recréer la fonction à chaque render
    // nécessaire car elle est utilisée dans le useEffect
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            // 3 appels en parallèle pour réduire le temps de chargement
            const [resF, resM, resE] = await Promise.all([
                api.get(`/formations/${id}`),
                api.get(`/formations/${id}/modules`),
                api.get('/apprenant/formations'),
            ]);

            setFormation(resF.data);
            setModules(resM.data);

            // Retrouve l'enrollment de l'apprenant pour cette formation
            const enrollments = resE.data.data ?? resE.data;
            const enrollment  = enrollments.find(e => e.formation?.id === parseInt(id));
            const progression = enrollment?.progression ?? 0;

            // Reconstitue les modules complétés depuis le % de progression
            // On suppose que les modules sont complétés dans l'ordre
            if (resM.data.length > 0) {
                const nbCompleted  = Math.round((progression / 100) * resM.data.length);
                const completedIds = resM.data.slice(0, nbCompleted).map(m => m.id);
                setCompleted(completedIds);
                // Positionne sur le premier module non complété
                setCurrent(Math.min(nbCompleted, resM.data.length - 1));
            }
        } catch (err) {
            console.error('Erreur chargement suivi', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const handleComplete = async () => {
        const module = modules[current];
        if (!module || completed.includes(module.id)) return;

        const newCompleted = [...completed, module.id];
        setCompleted(newCompleted);

        // Calcule le nouveau % et le sauvegarde dans Laravel
        const progression = Math.round((newCompleted.length / modules.length) * 100);

        setSaving(true);
        try {
            await api.put(`/formations/${id}/progression`, { progression });
        } catch (err) {
            console.error('Erreur mise à jour progression', err);
        } finally {
            setSaving(false);
        }

        // Passe automatiquement au module suivant après complétion
        if (current < modules.length - 1) {
            setCurrent(current + 1);
        }
    };

    if (loading) return <div className={styles.loading}>Chargement...</div>;
    if (!formation || modules.length === 0) {
        return <div className={styles.loading}>Formation introuvable.</div>;
    }

    const currentModule  = modules[current];
    const isDone         = completed.includes(currentModule?.id);
    const progression    = Math.round((completed.length / modules.length) * 100);
    const completedCount = completed.length;

    const getModuleStatus = (module, index) => {
        if (completed.includes(module.id)) return 'done';
        if (index === current)             return 'current';
        return 'locked';
    };

    return (
        <div className={styles.page}>

            {/* Breadcrumb */}
            <div className={styles.breadcrumb}>
                <button className={styles.breadcrumbLink} onClick={() => navigate('/dashboard/apprenant')}>
                    Mon dashboard
                </button>
                <span className={styles.breadcrumbSep}>›</span>
                <button className={styles.breadcrumbLink} onClick={() => navigate('/formations')}>
                    Formations
                </button>
                <span className={styles.breadcrumbSep}>›</span>
                <span>{formation.titre}</span>
            </div>

            <div className={styles.layout}>

                {/* Colonne gauche */}
                <div className={styles.colLeft}>

                    {/* Header formation avec barre de progression */}
                    <div className={styles.formationHeader}>
                        <div className={styles.formationHeaderTop}>
                            <BadgeNiveau niveau={formation.niveau} />
                            <span className={styles.formationCat}>{formation.categorie}</span>
                        </div>
                        <h1 className={styles.formationTitle}>{formation.titre}</h1>
                        <p className={styles.formationDesc}>{formation.description}</p>
                        <div className={styles.progressRow}>
                            <div className={styles.progressBarDark}>
                                <div
                                    className={styles.progressFillDark}
                                    style={{ width: `${progression}%` }}
                                />
                            </div>
                            <span className={styles.progressPct}>{progression}%</span>
                            <span className={styles.progressLabel}>
                                {completedCount} / {modules.length} modules
                            </span>
                        </div>
                    </div>

                    {/* Contenu du module actif */}
                    <div className={styles.moduleCardWrapper}>
                        <div className={styles.moduleCard}>
                            <div className={styles.moduleCardHeader}>
                                <div className={styles.moduleTag}>
                                    Module {current + 1}
                                    {isDone
                                        ? ' — Complété'
                                        : current === completed.length
                                            ? ' — En cours'
                                            : ' — À venir'
                                    }
                                </div>
                                <h2 className={styles.moduleTitle}>{currentModule?.titre}</h2>
                            </div>

                            <div className={styles.moduleBody}>
                                {/* dangerouslySetInnerHTML permet d'afficher du HTML
                                    stocké dans le champ "contenu" de la BDD
                                    Les \n sont convertis en <br/> pour l'affichage */}
                                <div
                                    className={styles.moduleContent}
                                    dangerouslySetInnerHTML={{
                                        __html: currentModule?.contenu
                                            ? currentModule.contenu.replace(/\n/g, '<br/>')
                                            : '<p style="color:#9ca3af;">Contenu à venir...</p>'
                                    }}
                                />

                                <div className={styles.moduleNav}>
                                    <button
                                        className={styles.btnNav}
                                        onClick={() => setCurrent(c => c - 1)}
                                        disabled={current === 0}
                                    >
                                        ← Précédent
                                    </button>

                                    {/* Grisé si module déjà complété ou sauvegarde en cours */}
                                    <button
                                        className={styles.btnComplete}
                                        onClick={handleComplete}
                                        disabled={isDone || saving}
                                    >
                                        {saving ? 'Sauvegarde...' : isDone ? '✓ Module terminé' : 'Marquer comme terminé ✓'}
                                    </button>

                                    <button
                                        className={styles.btnNav}
                                        onClick={() => setCurrent(c => c + 1)}
                                        disabled={current === modules.length - 1}
                                    >
                                        Suivant →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar modules — cliquable pour naviguer directement */}
                <div className={styles.sidebar}>
                    <div className={styles.sidebarCard}>
                        <div className={styles.sidebarHeader}>
                            <h3 className={styles.sidebarTitle}>Modules</h3>
                            <span className={styles.sidebarCount}>{completedCount} / {modules.length}</span>
                        </div>
                        <div className={styles.sidebarList}>
                            {modules.map((m, i) => {
                                const status   = getModuleStatus(m, i);
                                const isActive = i === current;

                                let itemClass   = styles.sidebarItemDefault;
                                let iconClass   = styles.sidebarIconDefault;
                                let textClass   = styles.sidebarItemTextDefault;
                                let iconContent = i + 1;

                                if (status === 'done') {
                                    itemClass   = styles.sidebarItemDone;
                                    iconClass   = styles.sidebarIconDone;
                                    textClass   = styles.sidebarItemTextDone;
                                    iconContent = '✓';
                                } else if (status === 'current') {
                                    itemClass   = styles.sidebarItemCurrent;
                                    iconClass   = styles.sidebarIconCurrent;
                                    iconContent = '▶';
                                }

                                if (isActive) {
                                    itemClass = `${itemClass} ${styles.sidebarItemActive}`;
                                    textClass = styles.sidebarItemTextActive;
                                }

                                return (
                                    <div
                                        key={m.id}
                                        className={`${styles.sidebarItem} ${itemClass}`}
                                        onClick={() => setCurrent(i)}
                                    >
                                        <div className={`${styles.sidebarIcon} ${iconClass}`}>
                                            {iconContent}
                                        </div>
                                        <span className={`${styles.sidebarItemText} ${textClass}`}>
                                            {m.titre}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}