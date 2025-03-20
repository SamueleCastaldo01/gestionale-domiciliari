import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import CallIcon from '@mui/icons-material/Call';
import { useSelector } from 'react-redux';
import { FormControl, InputLabel, MenuItem, Select, Collapse, Typography, InputAdornment, IconButton, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { Box } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { db } from '../firebase-config';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import moment from 'moment';
import useMediaQuery from "@mui/material/useMediaQuery";
import { notifyErrorAddCliente, successNoty } from '../components/Notify';
import { NavMobile } from '../components/NavMobile';

export function CustomerInfo() {
    const matches = useMediaQuery("(max-width:920px)");
    const user = useSelector((state) => state.auth.user);
    const uid = user?.uid;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const customerId = searchParams.get("id");

    const [gender, setGender] = useState('');
    const [nome, setNome] = useState('');
    const [cognome, setCognome] = useState('');
    const [linkIndirizzo, setLinkIndirizzo] = useState('');
    const [dataInizioPai, setDataInizioPai] = useState('');
    const [dataFinePai, setDataFinePai] = useState('');
    const [dataNascita, setDataNascita] = useState('');
    const [codiceFiscale, setCodiceFiscale] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');
    const [showOptionalFields, setShowOptionalFields] = useState(false);
    const [customerUid, setCustomerUid] = useState('');

    // Stato per i contatti aggiuntivi
    const [additionalContacts, setAdditionalContacts] = useState([]);

    // Stato per il dialog di conferma eliminazione
    const [openDialog, setOpenDialog] = useState(false);

    useEffect(() => {
        if (customerId) {
            fetchCustomerData();
        }
    }, [customerId]);

    const fetchCustomerData = async () => {
        try {
            const docRef = doc(db, 'customersTab', customerId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const customer = docSnap.data();
                setCustomerUid(customer.uid);
                // Verifica se l'utente loggato è lo stesso del paziente
                if (customer.uid !== uid) {
                    notifyErrorAddCliente("Non hai i permessi per modificare questo paziente.");
                    navigate("/customerlist");
                } else {
                    setNome(customer.nome);
                    setCognome(customer.cognome);
                    setGender(customer.gender);
                    setLinkIndirizzo(customer.linkIndirizzo || '');
                    setDataInizioPai(moment(customer.dataInizioPai, 'DD-MM-YYYY').format('YYYY-MM-DD'));
                    setDataFinePai(moment(customer.dataFinePai, 'DD-MM-YYYY').format('YYYY-MM-DD'));
                    setDataNascita(moment(customer.dataNascita, 'DD-MM-YYYY').format('YYYY-MM-DD'));
                    setCodiceFiscale(customer.codiceFiscale);
                    setTelefono(customer.telefono);
                    setEmail(customer.email);
                    // Inizializza i contatti aggiuntivi se esistono, altrimenti array vuoto
                    setAdditionalContacts(customer.additionalContacts || []);
                }
            } else {
                console.log("Cliente non trovato!");
            }
        } catch (error) {
            console.error("Errore nel recupero dei dati:", error);
        }
    };

    const handleGenderChange = (event) => {
        setGender(event.target.value);
    };

    const handleReset = () => {
        setNome("");
        setCognome("");
        setGender("");
        setDataNascita("");
        setCodiceFiscale("");
        setTelefono("");
        setEmail("");
        setLinkIndirizzo("");
        setAdditionalContacts([]);
    };

    const handleAddContact = () => {
        // Se esiste almeno un contatto e uno dei campi dell'ultimo è vuoto, non aggiungiamo un nuovo contatto
        if (additionalContacts.length > 0) {
            const lastContact = additionalContacts[additionalContacts.length - 1];
            if (!lastContact.nomeContatto || !lastContact.telefonoContatto) {
                alert("Compila il contatto precedente prima di aggiungerne un altro.");
                return;
            }
        }
        setAdditionalContacts(prevContacts => [
            ...prevContacts,
            { nomeContatto: "", telefonoContatto: "" }
        ]);
    };

    const handleContactChange = (index, field, value) => {
        // Aggiorna il contatto in base all'indice e al campo specifico
        setAdditionalContacts(prevContacts => {
            const updatedContacts = [...prevContacts];
            updatedContacts[index] = {
                ...updatedContacts[index],
                [field]: value
            };
            return updatedContacts;
        });
    };

    // Funzione per avviare una chiamata
    const handleCall = (phoneNumber) => {
        if (phoneNumber && phoneNumber.trim() !== "") {
            window.location.href = `tel:${phoneNumber}`;
        } else {
            alert("Numero di telefono non valido.");
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const formattedDataNascita = moment(dataNascita).format('DD-MM-YYYY');
        const formattedDataFinePai = moment(dataFinePai).format('DD-MM-YYYY');
        const formattedDataInizioPai = moment(dataInizioPai).format('DD-MM-YYYY');

        try {
            const docRef = doc(db, 'customersTab', customerId);
            await updateDoc(docRef, {
                nome,
                cognome,
                gender,
                linkIndirizzo,
                dataInizioPai: formattedDataInizioPai,
                dataFinePai: formattedDataFinePai,
                dataNascita: formattedDataNascita,
                codiceFiscale,
                telefono,
                email,
                additionalContacts, // Invia anche i contatti aggiuntivi
            });
            handleReset();
            navigate("/customerlist");
            successNoty("Paziente aggiornato!");
        } catch (error) {
            console.error('Errore nell\'aggiornamento del cliente: ', error);
        }
    };

    const handleDelete = async () => {
        try {
            const docRef = doc(db, 'customersTab', customerId);
            await deleteDoc(docRef);
            navigate("/customerlist");
            successNoty("Paziente eliminato!");
        } catch (error) {
            console.error('Errore nell\'eliminazione del cliente: ', error);
        }
    };

    const handleDialogClose = () => {
        setOpenDialog(false);
    };

    const handleDialogOpen = () => {
        setOpenDialog(true);
    };

    return (
        <>
            {matches && <NavMobile text="Modifica Paziente" />}
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <div className='container-fluid mb-4'>
                    {!matches && <h2 className='titlePage'>Modifica Paziente</h2>}
                    {customerUid === uid && (
                        <form onSubmit={handleSubmit}>
                            <div className='row'>
                                <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                    <TextField
                                        className='w-100'
                                        required
                                        label="Nome"
                                        variant="outlined"
                                        color='primary'
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                    />
                                </div>
                                <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                    <TextField
                                        className='w-100'
                                        required
                                        label="Cognome"
                                        variant="outlined"
                                        color='primary'
                                        value={cognome}
                                        onChange={(e) => setCognome(e.target.value)}
                                    />
                                </div>
                                <div className='d-flex mt-4 col-lg-4 col-md-6 col-sm-12'>
                                    <TextField
                                        className='w-100'
                                        label="Codice Fiscale"
                                        variant="outlined"
                                        required
                                        color='primary'
                                        value={codiceFiscale}
                                        onChange={(e) => setCodiceFiscale(e.target.value)}
                                    />
                                </div>
                                <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                    <TextField
                                        className='w-100'
                                        type='number'
                                        label="Numero di Telefono"
                                        variant="outlined"
                                        color='primary'
                                        value={telefono}
                                        onChange={(e) => setTelefono(e.target.value)}
                                    
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => handleCall(telefono)}>
                                                        <CallIcon />
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                </div>
                                <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                    <TextField
                                        className='w-100'
                                        type='date'
                                        label="Inizio Pai"
                                        variant="outlined"
                                        color='primary'
                                        value={dataInizioPai}
                                        onChange={(e) => setDataInizioPai(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </div>
                                <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                    <TextField
                                        className='w-100'
                                        type='date'
                                        label="Fine Pai"
                                        variant="outlined"
                                        color='primary'
                                        value={dataFinePai}
                                        onChange={(e) => setDataFinePai(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </div>

                                {/* Sezione per contatti aggiuntivi */}
                                <div className="mt-4 col-lg-12">
                                    <Typography variant="h6">Contatti Aggiuntivi</Typography>
                                    {additionalContacts.map((contact, index) => (
                                        <Box key={index} className="row mb-2">
                                            <div className="col-lg-6 col-md-6 col-sm-12 mb-3 mt-3">
                                                <TextField
                                                    className="w-100"
                                                    label="Nome Contatto"
                                                    variant="outlined"
                                                    value={contact.nomeContatto}
                                                    onChange={(e) =>
                                                        handleContactChange(index, "nomeContatto", e.target.value)
                                                    }
                                                />
                                            </div>
                                            <div className="col-lg-6 col-md-6 col-sm-12">
                                                <TextField
                                                    className="w-100"
                                                    label="Numero di Telefono"
                                                    variant="outlined"
                                                    value={contact.telefonoContatto}
                                                    onChange={(e) =>
                                                        handleContactChange(index, "telefonoContatto", e.target.value)
                                                    }
                                                    InputProps={{
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <IconButton onClick={() => handleCall(contact.telefonoContatto)}>
                                                                    <CallIcon />
                                                                </IconButton>
                                                            </InputAdornment>
                                                        )
                                                    }}
                                                />
                                            </div>
                                        </Box>
                                    ))}
                                    <Button className='mt-3' variant="outlined" onClick={handleAddContact}>
                                        Aggiungi Contatto
                                    </Button>
                                </div>
                                
                                {/* Sezione Campi Facoltativi */}
                                <div className='mt-4 col-lg-12'>
                                    <Typography
                                        variant="h6"
                                        onClick={() => setShowOptionalFields(!showOptionalFields)}
                                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    >
                                        Campi Facoltativi 
                                        {showOptionalFields ? 
                                            <ExpandMoreIcon style={{ marginLeft: '8px', transform: 'rotate(180deg)' }} /> : 
                                            <ExpandMoreIcon style={{ marginLeft: '8px' }} />
                                        }
                                    </Typography>
                                    <Collapse in={showOptionalFields}>
                                        <div className='row'>
                                            <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                                <TextField
                                                    className="w-100"
                                                    label="Link Indirizzo Google Maps"
                                                    variant="outlined"
                                                    color="primary"
                                                    value={linkIndirizzo}
                                                    onChange={(e) => setLinkIndirizzo(e.target.value)}
                                                    InputProps={{
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <IconButton className='pe-0'>
                                                                    <ContentPasteIcon fontSize='small' style={{ color: "black" }} />
                                                                </IconButton>
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                            </div>
                                            <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                                <FormControl fullWidth color='primary'>
                                                    <InputLabel id="gender-select-label">Genere</InputLabel>
                                                    <Select
                                                        labelId="gender-select-label"
                                                        id="gender-select"
                                                        value={gender}
                                                        label="Genere"
                                                        onChange={handleGenderChange}
                                                    >
                                                        <MenuItem value="maschio">Maschio</MenuItem>
                                                        <MenuItem value="femmina">Femmina</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </div>
                                            <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                                <TextField
                                                    className='w-100'
                                                    type='date'
                                                    label="Data di nascita"
                                                    variant="outlined"
                                                    color='primary'
                                                    value={dataNascita}
                                                    onChange={(e) => setDataNascita(e.target.value)}
                                                    InputLabelProps={{ shrink: true }}
                                                />
                                            </div>
                                            <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                                <TextField
                                                    className='w-100'
                                                    label="Email"
                                                    variant="outlined"
                                                    color='primary'
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </Collapse>
                                </div>
                            </div>
                            <Button type="submit" className="w-100 mt-4" variant="contained" color="primary">
                                Modifica Paziente
                            </Button>
                            <Button
                                className="w-100 mt-4"
                                variant="contained"
                                color="error"
                                onClick={handleDialogOpen}
                            >
                                Elimina Paziente
                            </Button>
                        </form>
                    )}
                    <Dialog open={openDialog} onClose={handleDialogClose}>
                        <DialogTitle>Conferma Eliminazione</DialogTitle>
                        <DialogContent>
                            <Typography>Sei sicuro di voler eliminare questo paziente?</Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleDialogClose} color="primary">Annulla</Button>
                            <Button onClick={handleDelete} color="error">Elimina</Button>
                        </DialogActions>
                    </Dialog>
                </div>
            </motion.div>
        </>
    );
}
