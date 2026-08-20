import { useState, useEffect } from 'react';
import api from '../../api/axios';
import styles from './ModulesModal.module.css';

const MODULE_INIT = { titre: '', contenu: '' };

// Modal de gestion des modules d'une formation (Dashboard Formateur)
// Permet : lister, ajouter, modifier, supprimer les modules
// Props :
//   formation → objet formation avec id et titre
//   onClose   → ferme la modal
export default function ModulesModal({ onClose, formation }) {
    const [modules,    setModules]    = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [showForm,   setShowForm]   = useState(false);
    const [editModule, setEditModule] = useState(null); // null = mode ajout, objet = mode édition
    const [form,       setForm]       = useState(MODULE_INIT);
    const [saving,     setSaving]     = useState(false);

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/formations/${formation.id}/modules`);
            setModules(res.data);
        } catch (err) {
            console.error('Erreur chargement modules', err);
        } finally {
            setLoading(false);
        }
    };

    // Ouvre le formulaire en mode ajout
    const handleOpenAdd = () => {
        setEditModule(null);
        setForm(MODULE_INIT);
        setShowForm(true);
    };

    // Ouvre le formulaire pré-rempli en mode édition
    const handleOpenEdit = (module) => {
        setEditModule(module);
        setForm({ titre: module.titre, contenu: module.contenu ?? '' });
        setShowForm(true);
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditModule(null);
        setForm(MODULE_INIT);
    };

    const handleSave = async () => {
        if (!form.titre.trim()) return;
        setSaving(true);
        try {
            if (editModule) {
                await api.put(`/modules/${editModule.id}`, form);
            } else {
                // ordre = nb de modules actuels + 1
                // place automatiquement le nouveau module à la fin
                await api.post(`/formations/${formation.id}/modules`, {
                    ...form,
                    ordre: modules.length + 1,
                });
            }
            await fetchModules(); // recharge la liste après sauvegarde
            handleCancelForm();
        } catch (err) {
            console.error('Erreur sauvegarde module', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (moduleId) => {
        // Confirmation native du navigateur — à remplacer
        // par DeleteModal pour plus de cohérence UI
        if (!window.confirm('Supprimer ce module ?')) return;
        try {
            await api.delete(`/modules/${moduleId}`);
            await fetchModules();
        } catch (err) {
            console.error('Erreur suppression module', err);
        }
    };

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3 className={styles.title}>Modules — {formation.titre}</h3>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                <div className={styles.body}>
                    {loading ? (
                        <div className={styles.emptyModules}>Chargement...</div>
                    ) : (
                        <>
                            {modules.length === 0 && !showForm && (
                                <div className={styles.emptyModules}>
                                    Aucun module — ajoute le premier ci-dessous.
                                </div>
                            )}

                            {modules.map((m, i) => (
                                <div key={m.id} className={styles.moduleItem}>
                                    <div className={styles.moduleNum}>{i + 1}</div>
                                    <div className={styles.moduleInfo}>
                                        <div className={styles.moduleTitre}>{m.titre}</div>
                                    </div>
                                    <div className={styles.moduleActions}>
                                        <button
                                            className={styles.btnEditModule}
                                            onClick={() => handleOpenEdit(m)}
                                        >
                                            ✏️ Modifier
                                        </button>
                                        <button
                                            className={styles.btnDeleteModule}
                                            onClick={() => handleDelete(m.id)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Formulaire ajout / édition — affiché à la demande */}
                            {showForm && (
                                <div className={styles.moduleForm}>
                                    <div className={styles.moduleFormTitle}>
                                        {editModule ? '✏️ Modifier le module' : '➕ Nouveau module'}
                                    </div>
                                    <input
                                        className={styles.input}
                                        type="text"
                                        placeholder="Titre du module *"
                                        value={form.titre}
                                        onChange={(e) => setForm({ ...form, titre: e.target.value })}
                                    />
                                    <textarea
                                        className={styles.textarea}
                                        placeholder="Contenu du module (texte, ressources...)"
                                        value={form.contenu}
                                        onChange={(e) => setForm({ ...form, contenu: e.target.value })}
                                    />
                                    <div className={styles.moduleFormActions}>
                                        {/* disabled si titre vide ou sauvegarde en cours */}
                                        <button
                                            className={styles.btnSaveModule}
                                            onClick={handleSave}
                                            disabled={saving || !form.titre.trim()}
                                        >
                                            {saving ? 'Sauvegarde...' : (editModule ? 'Enregistrer' : 'Ajouter le module')}
                                        </button>
                                        <button
                                            className={styles.btnCancelModule}
                                            onClick={handleCancelForm}
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!showForm && (
                                <button className={styles.btnAddModule} onClick={handleOpenAdd}>
                                    + Ajouter un module
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}