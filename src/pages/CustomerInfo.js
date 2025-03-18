import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import { useSelector } from 'react-redux';
import { FormControl, InputLabel, MenuItem, Select, Collapse, Typography, InputAdornment, IconButton, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { Box } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Import dropdown icon
import { db } from '../firebase-config';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import moment from 'moment';
import useMediaQuery from "@mui/material/useMediaQuery";
import { notifyErrorAddCliente, successNoty } from '../components/Notify';
import { NavMobile } from '../components/NavMobile';
import { useSearchParams } from "react-router-dom";

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
    const [indirizzo, setIndirizzo] = useState('');
    const [dataInizioPai, setDataInizioPai] = useState('');
    const [dataFinePai, setDataFinePai] = useState('');
    const [dataNascita, setDataNascita] = useState('');
    const [codiceFiscale, setCodiceFiscale] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');
    const [showOptionalFields, setShowOptionalFields] = useState(false); // State for optional fields
    const [customerUid, setCustomerUid] = useState(''); // State to store the uid of the customer

    // States for dialog
    const [openDialog, setOpenDialog] = useState(false); // For showing the confirmation dialog

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
                setCustomerUid(customer.uid); // Save customer uid for comparison
                // Check if the logged-in user is the same as the customer
                if (customer.uid !== uid) {
                    // Redirect the user if the uid doesn't match
                    notifyErrorAddCliente("Non hai i permessi per modificare questo paziente.");
                    navigate("/customerlist"); // Or any other redirect path
                } else {
                    // Continue setting up the customer data if uid matches
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
            });
            handleReset();
            navigate("/customerlist");
            successNoty("Paziente aggiornato!");
        } catch (error) {
            console.error('Errore nell\'aggiornamento del cliente: ', error);
        }
    };

    // Function to handle delete
    const handleDelete = async () => {
        try {
            const docRef = doc(db, 'customersTab', customerId);
            await deleteDoc(docRef); // Deletes the customer document from Firestore
            navigate("/customerlist"); // Navigate back to customer list
            successNoty("Paziente eliminato!");
        } catch (error) {
            console.error('Errore nell\'eliminazione del cliente: ', error);
        }
    };

    const handleDialogClose = () => {
        setOpenDialog(false); // Close the confirmation dialog
    };

    const handleDialogOpen = () => {
        setOpenDialog(true); // Open the confirmation dialog
    };

    return (
        <>
            {matches && <NavMobile text= "Modifica Paziente" />}

            <motion.div
                initial={{ x: -20, opacity: 0 }}  
                animate={{ x: 0, opacity: 1 }}   
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <div className='container-fluid mb-4'>
                    {!matches && <h2 className='titlePage'>Modifica Paziente</h2>}

                    {/* Render the form only if the uid matches */}
                    {customerUid === uid && (
                        <form onSubmit={handleSubmit}>
                            <div className='row'>
                                <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                    <TextField className='w-100' required label="Nome" variant="outlined" color='primary' value={nome}   
                                        onChange={(e) => setNome(e.target.value)}  
                                    />
                                </div>
                                <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                    <TextField className='w-100' required label="Cognome" variant="outlined" color='primary' value={cognome} 
                                        onChange={(e) => setCognome(e.target.value)}   
                                    />
                                </div>
                                <div className='d-flex mt-4 col-lg-4 col-md-6 col-sm-12'>
                                    <TextField className='w-100' label="Codice Fiscale" variant="outlined" required color='primary' value={codiceFiscale}  
                                        onChange={(e) => setCodiceFiscale(e.target.value)}    
                                    />
                                </div>
                                <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                    <TextField className='w-100' type='number' label="Numero di Telefono" variant="outlined" color='primary' value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                                </div>
                                <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                    <TextField className='w-100' type='date' label="Inizio Pai" variant="outlined" color='primary' value={dataInizioPai} onChange={(e) => setDataInizioPai(e.target.value)} InputLabelProps={{ shrink: true }} />
                                </div>
                                <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                    <TextField className='w-100' type='date' label="Fine Pai" variant="outlined" color='primary' value={dataFinePai} onChange={(e) => setDataFinePai(e.target.value)} InputLabelProps={{ shrink: true }} />
                                </div>

                                {/* Optional Fields Section */}
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
                                                        <ContentPasteIcon fontSize='small' style={{color: "black"}}/>
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
                                                <TextField className='w-100' type='date' label="Data di nascita" variant="outlined" color='primary' value={dataNascita} onChange={(e) => setDataNascita(e.target.value)} InputLabelProps={{ shrink: true }} />
                                            </div>
                                            <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                                <TextField className='w-100' label="Email" variant="outlined" color='primary' value={email} onChange={(e) => setEmail(e.target.value)} />
                                            </div>
                                        </div>
                                    </Collapse>
                                </div>
                            </div>

                            <Button type="submit" className="w-100 mt-4" variant="contained" color="primary">
                                Modifica Paziente
                            </Button>
                            {/* Delete Button */}
                            <Button
                                className="w-100 mt-4"
                                variant="contained"
                                color="error"
                                onClick={handleDialogOpen} // Opens the confirmation dialog
                            >
                                Elimina Paziente
                            </Button>
                        </form>
                    )}

                    {/* Delete Confirmation Dialog */}
                    <Dialog
                        open={openDialog}
                        onClose={handleDialogClose}
                    >
                        <DialogTitle>Conferma Eliminazione</DialogTitle>
                        <DialogContent>
                            <Typography>Sei sicuro di voler eliminare questo paziente?</Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleDialogClose} color="primary">
                                Annulla
                            </Button>
                            <Button onClick={handleDelete} color="error">
                                Elimina
                            </Button>
                        </DialogActions>
                    </Dialog>
                </div>
            </motion.div>
        </>
    );
}
