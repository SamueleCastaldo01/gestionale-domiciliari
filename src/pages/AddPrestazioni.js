import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useSelector } from 'react-redux';
import { db } from '../firebase-config';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import useMediaQuery from "@mui/material/useMediaQuery";
import { notifyErrorAddCliente, successNoty } from '../components/Notify';
import { NavMobile } from '../components/NavMobile';
import { IconButton, Dialog, DialogTitle, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export function AddPrestazioni() {
    const matches = useMediaQuery("(max-width:920px)");
    const user = useSelector((state) => state.auth.user);
    const uid = user?.uid;
    const navigate = useNavigate();
    const [prestazioni, setPrestazioni] = useState('');
    const [listaPrestazioni, setListaPrestazioni] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    useEffect(() => {
        fetchPrestazioni();
    }, []);

    const fetchPrestazioni = async () => {
        if (!uid) return;
        const q = query(collection(db, 'prestazioneTab'), where("uid", "==", uid));
        const querySnapshot = await getDocs(q);
        const prestazioniList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setListaPrestazioni(prestazioniList);
    };

    const handleReset = () => {
        setPrestazioni("");
    };

    const capitalizeWords = (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!prestazioni.trim()) return;
        const cPrestazioni = await checkPrestazioni(prestazioni);
        if (cPrestazioni) {
            notifyErrorAddCliente("Questa prestazione già esiste");
            return;
        }
        try {
            await addDoc(collection(db, 'prestazioneTab'), {
                prestazioni,
                uid,
                dataCreazione: Timestamp.fromDate(new Date()),
            });
            handleReset();
            successNoty("Prestazione Aggiunta!");
            fetchPrestazioni();
        } catch (error) {
            console.error('Errore nell\'aggiunta della prestazione: ', error);
        }
    };

    const checkPrestazioni = async (prestazioni) => {
        const q = query(collection(db, 'prestazioneTab'), where('prestazioni', '==', prestazioni));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    };

    const handleOpenDialog = (id) => {
        setSelectedId(id);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedId(null);
    };

    const handleDelete = async () => {
        if (!selectedId) return;
        try {
            await deleteDoc(doc(db, 'prestazioneTab', selectedId));
            successNoty("Prestazione eliminata!");
            fetchPrestazioni();
        } catch (error) {
            console.error("Errore durante l'eliminazione della prestazione: ", error);
        }
        handleCloseDialog();
    };

    return (
        <>
            {matches && <NavMobile text="Prestazioni" />}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }} className='overflow-auto' style={{ minHeight: "80vh" }}>
                <div className='container-fluid'>
                    {!matches && <h2 className='titlePage'>Aggiungi una nuova Prestazione</h2>}
                    <form onSubmit={handleSubmit}>
                        <div className='row'>
                            <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                <TextField className='w-100' required label="Prestazioni" variant="outlined" color='primary' value={prestazioni}   
                                    onChange={(e) => setPrestazioni(capitalizeWords(e.target.value))}  
                                />
                            </div>
                        </div>
                        <Button className='mt-4 w-100 py-2' type="submit" variant="contained">Aggiungi Prestazione</Button>
                    </form>
                    
                    <h3 className='mt-5 w-100'>Lista Prestazioni</h3>
                    <div className='mt-4 w-100' style={{ 
                        maxHeight: "400px", 
                        overflowY: "auto",
                        overflowX: "hidden"
                    }}>
                        {listaPrestazioni.map((item) => (
                            <div key={item.id} className='d-flex justify-content-between w-100'>
                                <h6>{item.prestazioni}</h6>
                                <IconButton edge="end" aria-label="delete" onClick={() => handleOpenDialog(item.id)}>
                                    <DeleteIcon style={{color: "#037E67"}}/>
                                </IconButton>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Dialog di conferma */}
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Sei sicuro di voler eliminare questa prestazione?</DialogTitle>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">Annulla</Button>
                    <Button onClick={handleDelete} color="secondary">Elimina</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
