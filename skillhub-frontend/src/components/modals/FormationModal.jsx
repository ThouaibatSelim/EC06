import { useState, useEffect } from 'react';
import api from '../../api/axios';
import styles from './FormationModal.module.css';

const FORM_INIT = {
    titre: '', description: '', categorie: '', niveau: '',
};

// Modal réutilisée pour créer ET modifier une formation
// Si "formation" est passé en prop → mode édition
// Si "formation" est null/undefined → mode création
export default function FormationModal({ onClose, onSuccess, formation }) {
    const isEdit = !!formation;

    const [form,    setForm]    = useState(FORM_INIT);
    const [error,   setError]   = useState('');
    const [loading, setLoading] = useState(false);

    // Pré-remplit le formulaire en mode édition
    // ?? '' évite les inputs "uncontrolled" si une valeur est null
    useEffect(() => {
        if (formation) {
            setForm({
                titre:       formation.titre       ?? '',
                description: formation.description ?? '',
                categorie:   formation.categorie   ?? '',
                niveau:      formation.niveau      ?? '',
            });
        }
    }, [formation]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // PUT si édition, POST si création
            if (isEdit) {
                await api.put(`/formations/${formation.id}`, form);
            } else {
                await api.post('/formations', form);
            }
            onSuccess(); // recharge la liste dans le dashboard
            onClose();
        } catch (err) {
            // Laravel renvoie { errors: { champ: ['message'] } }
            // on affiche la première erreur de validation
            const errors = err.response?.data?.errors;
            if (errors) {
                setError(Object.values(errors)[0][0]);
            } else {
                setError(err.response?.data?.message || 'Une erreur est survenue.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3 className={styles.title}>
                        {isEdit ? 'Modifier la formation' : 'Créer une formation'}
                    </h3>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                <form className={styles.body} onSubmit={handleSubmit}>
                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.field}>
                        <label className={styles.label}>Titre *</label>
                        <input
                            className={styles.input}
                            type="text"
                            name="titre"
                            placeholder="Ex: Introduction à React"
                            value={form.titre}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Description *</label>
                        <textarea
                            className={styles.textarea}
                            name="description"
                            placeholder="Décris le contenu et les objectifs..."
                            value={form.description}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label}>Catégorie *</label>
                            <select
                                className={styles.select}
                                name="categorie"
                                value={form.categorie}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Choisir...</option>
                                <option>Développement web</option>
                                <option>Data & IA</option>
                                <option>Design</option>
                                <option>Marketing</option>
                                <option>DevOps</option>
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Niveau *</label>
                            <select
                                className={styles.select}
                                name="niveau"
                                value={form.niveau}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Choisir...</option>
                                <option>Débutant</option>
                                <option>Intermédiaire</option>
                                <option>Avancé</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <button type="button" className={styles.btnCancel} onClick={onClose}>
                            Annuler
                        </button>
                        {/* Texte du bouton adapté selon le mode et l'état */}
                        <button type="submit" className={styles.btnSubmit} disabled={loading}>
                            {loading
                                ? (isEdit ? 'Modification...'  : 'Création...')
                                : (isEdit ? 'Enregistrer les modifications' : 'Créer la formation')
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}