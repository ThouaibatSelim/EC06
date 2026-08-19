import { useState } from 'react';
import styles from './DeleteModal.module.css';

// Modal de confirmation générique — réutilisée pour :
//   - suppression d'une formation (DashboardFormateur)
//   - désinscription d'une formation (DashboardApprenant)
//
// Props :
//   onClose   → ferme la modal sans action
//   onConfirm → fonction async à exécuter si confirmé
//   title     → titre de la modal
//   message   → description de l'action
//   warning   → message d'avertissement optionnel (en rouge)
export default function DeleteModal({ onClose, onConfirm, title, message, warning }) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        await onConfirm();
        setLoading(false);
    };

    return (
        // Clic sur l'overlay (fond) ferme la modal
        // e.target === e.currentTarget évite de fermer
        // si on clique à l'intérieur de la modal
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.body}>
                    <div className={styles.iconWrapper}>🗑️</div>
                    <h3 className={styles.title}>{title}</h3>
                    <p className={styles.sub}>{message}</p>
                    {warning && <div className={styles.warning}>⚠️ {warning}</div>}
                </div>

                <div className={styles.footer}>
                    <button className={styles.btnCancel} onClick={onClose}>
                        Annuler
                    </button>
                    {/* disabled pendant le chargement pour éviter
                        les doubles clics et soumissions multiples */}
                    <button
                        className={styles.btnDelete}
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Suppression...' : 'Oui, supprimer'}
                    </button>
                </div>
            </div>
        </div>
    );
}