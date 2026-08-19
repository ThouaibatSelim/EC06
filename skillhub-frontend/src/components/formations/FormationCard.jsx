import { useNavigate } from "react-router-dom";
import styles from "./FormationCard.module.css";

function BadgeNiveau({ niveau }) {
    if (niveau === "Débutant")      return <span className={styles.badgeDebutant}>{niveau}</span>;
    if (niveau === "Intermédiaire") return <span className={styles.badgeIntermediaire}>{niveau}</span>;
    return <span className={styles.badgeAvance}>{niveau}</span>;
}

export default function FormationCard({ formation }) {
    const navigate = useNavigate();

    return (
        <div className={styles.card}>
            <div className={styles.cardBody}>
                <BadgeNiveau niveau={formation.niveau} />
                <div className={styles.cardCat}>{formation.categorie}</div>
                <h4 className={styles.cardTitle}>{formation.titre}</h4>
                <p className={styles.cardDesc}>{formation.description}</p>
            </div>

            <div className={styles.cardFooter}>
                {/* Nom du formateur — optionnel chain car peut être null
                    si la relation n'est pas chargée par Laravel */}
                <div className={styles.cardAuthor}>
                    {formation.formateur?.prenom} {formation.formateur?.nom}
                </div>

                <div className={styles.cardMeta}>
                    {/* ?? 0 évite d'afficher "undefined" si Laravel
                        ne renvoie pas ces champs */}
                    <span>👤 {formation.enrollments_count ?? 0}</span>
                    <span>👁 {formation.nombre_vues ?? 0}</span>
                </div>

                <button
                    className={styles.btnDetail}
                    onClick={() => navigate(`/formation/${formation.id}`)}
                >
                    Voir détail
                </button>
            </div>
        </div>
    );
}