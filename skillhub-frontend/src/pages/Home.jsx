import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import styles from './Home.module.css';

// Données statiques pour l'aperçu catalogue — à remplacer
// par un appel API si le catalogue doit être dynamique
const FORMATIONS_PREVIEW = [
    { id: 1, titre: 'Introduction à React',     niveau: 'Débutant',      auteur: 'Marie L.',  apprenants: 42, vues: 320, progression: 68 },
    { id: 2, titre: 'API REST avec Laravel',     niveau: 'Intermédiaire', auteur: 'Thomas R.', apprenants: 28, vues: 180, progression: 42 },
    { id: 3, titre: 'UI/UX Design fondamentaux', niveau: 'Avancé',        auteur: 'Sofia M.',  apprenants: 61, vues: 510, progression: 85 },
];

const CONCEPT_CARDS = [
    { emoji: '🎯', bg: 'rgba(45,138,110,.2)',   titre: 'Notre objectif', texte: 'Faciliter le partage de compétences et rendre l\'apprentissage en ligne simple, accessible et interactif pour tous.' },
    { emoji: '🤝', bg: 'rgba(255,140,105,.15)', titre: 'Collaboratif',   texte: 'Formateurs et apprenants évoluent ensemble sur une plateforme pensée pour le partage et la progression mutuelle.' },
    { emoji: '⚡', bg: 'rgba(108,63,197,.2)',   titre: 'Structuré',      texte: 'Chaque formation est organisée en modules progressifs pour garantir une expérience d\'apprentissage claire et efficace.' },
];

const VALEURS = [
    { emoji: '🌍', titre: 'Accessibilité', desc: 'L\'apprentissage pour tous, sans barrière financière.' },
    { emoji: '💡', titre: 'Innovation',    desc: 'Une expérience moderne et intuitive pour apprendre autrement.' },
    { emoji: '🤝', titre: 'Communauté',   desc: 'Formateurs et apprenants grandissent ensemble.' },
    { emoji: '🏆', titre: 'Excellence',   desc: 'Des contenus de qualité, vérifiés et structurés.' },
];

const AVANTAGES_APPRENANTS = [
    { titre: 'Accès gratuit à toutes les formations', desc: 'Aucun frais, aucune carte bancaire requise.' },
    { titre: 'Suivi de progression automatique',      desc: 'Visualise ton avancement module par module.' },
    { titre: 'Apprends à ton rythme',                 desc: 'Pas de deadline, reprends où tu t\'es arrêté.' },
    { titre: 'Catalogue varié et filtrable',           desc: 'Dev, Design, Data, Marketing, DevOps et plus.' },
];

const AVANTAGES_FORMATEURS = [
    { titre: 'Créez vos formations librement', desc: 'Interface intuitive, modules organisables facilement.' },
    { titre: 'Statistiques en temps réel',     desc: 'Vues, nombre d\'apprenants, taux de progression.' },
    { titre: 'Gestion complète des modules',   desc: 'Ajoutez, modifiez, réorganisez à tout moment.' },
    { titre: 'Partagez votre expertise',        desc: 'Touchez des milliers d\'apprenants motivés.' },
];

function getBadgeClass(niveau, styles) {
    if (niveau === 'Débutant')      return styles.badgeDebutant;
    if (niveau === 'Intermédiaire') return styles.badgeIntermediaire;
    return styles.badgeAvance;
}

export default function Home({ onOpenLogin, onOpenRegister }) {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    // Stats calculées depuis les vraies données Laravel
    const [stats, setStats] = useState({
        formations:  '...',
        apprenants:  '...',
        formateurs:  '...',
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // On charge toutes les formations pour calculer les stats
                // enrollments_count et formateur_id sont inclus par Laravel
                const res = await api.get('/formations');
                const formations = res.data.data ?? res.data;

                // Nb total de formations
                const nbFormations = formations.length;

                // Nb total d'apprenants inscrits (somme des enrollments)
                const nbApprenants = formations.reduce(
                    (acc, f) => acc + (f.enrollments_count ?? 0), 0
                );

                // Nb de formateurs uniques (Set déduplique les IDs)
                const formateursIds = new Set(
                    formations.map(f => f.formateur_id).filter(Boolean)
                );
                const nbFormateurs = formateursIds.size;

                setStats({
                    formations: nbFormations,
                    apprenants: nbApprenants,
                    formateurs: nbFormateurs,
                });
            } catch (err) {
                // En cas d'erreur, on affiche des tirets
                setStats({ formations: '—', apprenants: '—', formateurs: '—' });
                console.error('Erreur chargement stats', err);
            }
        };

        fetchStats();
    }, []);

    return (
        <div>

            {/* Hero */}
            <section className={styles.hero}>
                <div className={styles.heroBlobGreen} />
                <div className={styles.heroBlobOrange} />
                <div className={styles.heroContent}>
                    <span className={styles.heroBadge}>Plateforme d'apprentissage collaborative</span>
                    <h1 className={styles.heroTitle}>
                        Développe tes<br />
                        <span className={styles.heroTitleAccent}>compétences,</span><br />
                        à ton rythme.
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Des formations structurées créées par des experts passionnés.
                        Apprends ce qui te passionne, quand tu veux, où tu veux.
                    </p>
                    <div className={styles.heroActions}>
                        <button
                            className={styles.btnHeroPrimary}
                            onClick={() => navigate('/formations')}
                        >
                            Voir les formations
                        </button>
                        <button
                            className={styles.btnHeroSecondary}
                            onClick={() => isAuthenticated ? navigate('/dashboard/formateur') : onOpenRegister()}
                        >
                            Devenir formateur
                        </button>
                    </div>
                </div>
            </section>

            {/* Stats bar — chiffres réels depuis Laravel */}
            <div className={styles.statsBar}>
                <div className={styles.statItem}>
                    <p className={styles.statNumber}>{stats.formations}</p>
                    <div className={styles.statLabel}>Formations disponibles</div>
                </div>
                <div className={styles.statItem}>
                    <p className={styles.statNumber}>{stats.apprenants}</p>
                    <div className={styles.statLabel}>Apprenants actifs</div>
                </div>
                <div className={styles.statItem}>
                    <p className={styles.statNumber}>{stats.formateurs}</p>
                    <div className={styles.statLabel}>Formateurs experts</div>
                </div>
                <div className={styles.statItem}>
                    <p className={`${styles.statNumber} ${styles.statNumberGreen}`}>100%</p>
                    <div className={styles.statLabel}>Gratuit</div>
                </div>
            </div>

            {/* Concept */}
            <section className={styles.sectionGreen}>
                <div className={styles.sectionHeader}>
                    <span className={`${styles.sectionBadge} ${styles.sectionBadgeGreen}`}>Notre concept</span>
                    <h2 className={styles.sectionTitle}>Qu'est-ce que SkillHub ?</h2>
                    <p className={styles.sectionSubtitle}>
                        SkillHub est une plateforme collaborative qui connecte des formateurs passionnés
                        et des apprenants motivés autour de formations en ligne structurées et gratuites.
                    </p>
                </div>
                <div className={styles.conceptGrid}>
                    {CONCEPT_CARDS.map((c) => (
                        <div key={c.titre} className={styles.conceptCard}>
                            <div className={styles.conceptIcon} style={{ background: c.bg }}>{c.emoji}</div>
                            <h3 className={styles.conceptCardTitle}>{c.titre}</h3>
                            <p className={styles.conceptCardText}>{c.texte}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Avantages */}
            <section className={styles.sectionWhite}>
                <div className={styles.sectionHeader}>
                    <span className={`${styles.sectionBadge} ${styles.sectionBadgeGreenSolid}`}>Pourquoi SkillHub ?</span>
                    <h2 className={styles.sectionTitle}>Une plateforme pensée pour vous</h2>
                    <p className={styles.sectionSubtitle}>Que vous soyez apprenant ou formateur, SkillHub s'adapte à vos besoins.</p>
                </div>
                <div className={styles.avantagesGrid}>
                    <div className={`${styles.avantageCard} ${styles.avantageCardLight}`}>
                        <div className={styles.avantageCardHeader}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#E8F5EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🎓</div>
                            <h3 className={styles.avantageCardTitleLight}>Pour les apprenants</h3>
                        </div>
                        <div className={styles.avantageList}>
                            {AVANTAGES_APPRENANTS.map((a) => (
                                <div key={a.titre} className={styles.avantageItem}>
                                    <div className={styles.avantageBulletGreen}>✓</div>
                                    <div>
                                        <div className={`${styles.avantageItemTitle} ${styles.avantageItemTitleLight}`}>{a.titre}</div>
                                        <div className={`${styles.avantageItemDesc} ${styles.avantageItemDescLight}`}>{a.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            className={`${styles.btnAvantage} ${styles.btnAvantageGreen}`}
                            onClick={() => isAuthenticated ? navigate('/formations') : onOpenRegister()}
                        >
                            Commencer à apprendre
                        </button>
                    </div>

                    <div className={`${styles.avantageCard} ${styles.avantageCardDark}`}>
                        <div className={styles.avantageCardHeader}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,140,105,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🧑‍🏫</div>
                            <h3 className={styles.avantageCardTitleDark}>Pour les formateurs</h3>
                        </div>
                        <div className={styles.avantageList}>
                            {AVANTAGES_FORMATEURS.map((a) => (
                                <div key={a.titre} className={styles.avantageItem}>
                                    <div className={styles.avantageBulletOrange}>✓</div>
                                    <div>
                                        <div className={`${styles.avantageItemTitle} ${styles.avantageItemTitleDark}`}>{a.titre}</div>
                                        <div className={`${styles.avantageItemDesc} ${styles.avantageItemDescDark}`}>{a.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            className={`${styles.btnAvantage} ${styles.btnAvantageOrange}`}
                            onClick={() => isAuthenticated ? navigate('/dashboard/formateur') : onOpenRegister()}
                        >
                            Devenir formateur
                        </button>
                    </div>
                </div>
            </section>

            {/* Valeurs */}
            <section className={styles.sectionGreen}>
                <div className={styles.sectionHeader}>
                    <span className={`${styles.sectionBadge} ${styles.sectionBadgeGreen}`}>Nos valeurs</span>
                    <h2 className={styles.sectionTitle}>Ce qui nous guide</h2>
                </div>
                <div className={styles.valeursGrid}>
                    {VALEURS.map((v) => (
                        <div key={v.titre} className={styles.valeurCard}>
                            <div className={styles.valeurEmoji}>{v.emoji}</div>
                            <div className={styles.valeurTitle}>{v.titre}</div>
                            <div className={styles.valeurDesc}>{v.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Catalogue aperçu */}
            <section className={styles.sectionWhite}>
                <div className={styles.catalogueHeader}>
                    <div>
                        <span className={`${styles.sectionBadge} ${styles.sectionBadgeGreenSolid}`}>Catalogue</span>
                        <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Formations populaires</h2>
                    </div>
                    <button className={styles.btnVoirTout} onClick={() => navigate('/formations')}>
                        Voir toutes les formations →
                    </button>
                </div>
                <div className={styles.catalogueGrid}>
                    {FORMATIONS_PREVIEW.map((f) => (
                        <div key={f.id} className={styles.formationCard}>
                            <div className={styles.formationCardBody}>
                                <span className={getBadgeClass(f.niveau, styles)}>{f.niveau}</span>
                                <h3 className={styles.formationTitle}>{f.titre}</h3>
                                <p className={styles.formationDesc}>Formation dispensée par {f.auteur}</p>
                            </div>
                            <div className={styles.formationCardFooter}>
                                <div className={styles.formationAuthor}>{f.auteur}</div>
                                <div className={styles.formationMeta}>
                                    <span>👤 {f.apprenants} apprenants</span>
                                    <span>👁 {f.vues} vues</span>
                                </div>
                                <div className={styles.progressBar}>
                                    <div className={styles.progressFill} style={{ width: `${f.progression}%` }} />
                                </div>
                                <button
                                    className={styles.btnVoirDetail}
                                    onClick={() => navigate(`/formation/${f.id}`)}
                                >
                                    Voir détail
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Banner */}
            <section className={styles.ctaBanner}>
                <h2 className={styles.ctaTitle}>Prêt à commencer ton aventure ?</h2>
                <p className={styles.ctaSubtitle}>Rejoins des milliers d'apprenants et de formateurs sur SkillHub. C'est gratuit.</p>
                <div className={styles.ctaActions}>
                    <button className={styles.btnCtaPrimary} onClick={onOpenRegister}>
                        S'inscrire gratuitement
                    </button>
                    <button className={styles.btnCtaSecondary} onClick={() => navigate('/formations')}>
                        Voir les formations
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerGrid}>
                    <div>
                        <div className={styles.footerLogo}>Skill<span style={{ color: 'var(--color-accent)' }}>Hub</span></div>
                        <p className={styles.footerDesc}>La plateforme collaborative d'apprentissage en ligne, gratuite et accessible à tous.</p>
                    </div>
                    <div>
                        <div className={styles.footerColTitle}>Plateforme</div>
                        <div className={styles.footerLinks}>
                            <span className={styles.footerLink} onClick={() => navigate('/formations')}>Formations</span>
                            <span className={styles.footerLink} onClick={onOpenRegister}>Devenir formateur</span>
                            <span className={styles.footerLink} onClick={onOpenRegister}>S'inscrire</span>
                            <span className={styles.footerLink} onClick={onOpenLogin}>Se connecter</span>
                        </div>
                    </div>
                    <div>
                        <div className={styles.footerColTitle}>Catégories</div>
                        <div className={styles.footerLinks}>
                            {['Développement web', 'Data & IA', 'Design', 'DevOps', 'Marketing'].map(c => (
                                <span key={c} className={styles.footerLink} onClick={() => navigate('/formations')}>{c}</span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className={styles.footerColTitle}>Légal</div>
                        <div className={styles.footerLinks}>
                            <span className={styles.footerLink}>Mentions légales</span>
                            <span className={styles.footerLink}>Confidentialité</span>
                            <span className={styles.footerLink}>CGU</span>
                        </div>
                    </div>
                </div>
                <div className={styles.footerBottom}>
                    <span className={styles.footerCopy}>© 2026 SkillHub. Tous droits réservés.</span>
                    <span className={styles.footerCopy}>Fait avec ❤️ pour les apprenants</span>
                </div>
            </footer>

        </div>
    );
}