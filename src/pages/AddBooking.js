import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useSelector } from 'react-redux';
import { FormControl, InputLabel, MenuItem, Select, Collapse, Typography, Autocomplete, CircularProgress, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { db } from '../firebase-config';
import { collection, addDoc, query, where, getDocs, getDoc, updateDoc, doc, Timestamp, orderBy, deleteDoc } from 'firebase/firestore';
import moment from 'moment';
import useMediaQuery from "@mui/material/useMediaQuery";
import { notifyError, successNoty } from '../components/Notify';
import { NavMobile } from '../components/NavMobile';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

export function AddBooking() {
    const matches = useMediaQuery("(max-width:920px)");
    const [openDialog, setOpenDialog] = useState(false);
    const user = useSelector((state) => state.auth.user);
    const uid = user?.uid;
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const date = queryParams.get("date");
    const time = queryParams.get("time");
    const idbooking = queryParams.get("idbooking"); // Se presente, modalità modifica

    const [selectedDate, setSelectedDate] = useState(date || "");
    const [selectedTime, setSelectedTime] = useState(time || "");
    const [selectedPaiDate, setSelectedPaiDate] = useState("");
    const [isPaiExpired, setIsPaiExpired] = useState(false);
    const [pazienti, setPazienti] = useState([]);
    const [prestazioni, setPrestazioni] = useState([]);
    const [note, setNote] = useState("");
    const [loadingAutoComplete, setLoadingAutocomplete] = useState(true);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [selectedPrestazioniId, setSelectedPrestazioniId] = useState(null);
    const [durata, setDurata] = useState(30);
    const [showOptionalFields, setShowOptionalFields] = useState(false);

    const navigate = useNavigate();

    const handledurataChange = (event) => {
        setDurata(event.target.value);
    };

    const handleChangeDate = (event) => {
        setSelectedDate(event.target.value);
    };

    const handleChangeTime = (event) => {
        setSelectedTime(event.target.value);
    };

    const onCustomerSelect = (id) => {
        setSelectedCustomerId(id);
    };

    const onPrestazioniSelect = (id) => {
        setSelectedPrestazioniId(id);
    };

    const fetchCustomers = async () => {
        try {
            setLoadingAutocomplete(true);
            const customerCollection = collection(db, "customersTab");
            const customerQuery = query(customerCollection, where("uid", "==", uid), orderBy("nome", "asc"));
            const customerSnapshot = await getDocs(customerQuery);
            const customerList = customerSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setPazienti(customerList);
        } catch (error) {
            console.error("Errore nel recupero dei dati dei pazienti: ", error);
        } finally {
            setLoadingAutocomplete(false);
        }
    };

    const fetchPrestazioni = async () => {
        try {
            setLoadingAutocomplete(true);
            const prestazioneCollection = collection(db, "prestazioneTab");
            const prestazioneQuery = query(prestazioneCollection, where("uid", "==", uid));
            const prestazioneSnapshot = await getDocs(prestazioneQuery);
            const prestazioniList = prestazioneSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setPrestazioni(prestazioniList);
        } catch (error) {
            console.error("Errore nel recupero delle prestazioni: ", error);
        } finally {
            setLoadingAutocomplete(false);
        }
    };

    // Se idbooking esiste, siamo in modalità modifica: fetch del documento
    const fetchBooking = async (id) => {
        try {
            const bookingDocRef = doc(db, 'bookingTab', id);
            const bookingDocSnap = await getDoc(bookingDocRef);
            if (bookingDocSnap.exists()) {
                const data = bookingDocSnap.data();
                setSelectedDate(data.giorno);
                setSelectedTime(data.ora);
                setDurata(data.durata);
                setNote(data.note || "");
                setSelectedCustomerId(data.pazienteId);
                setSelectedPrestazioniId(data.prestazioniId);
            } else {
                notifyError("Appuntamento non trovato");
            }
        } catch (error) {
            console.error("Errore nel recupero della prenotazione: ", error);
        }
    };

    useEffect(() => {
        fetchPrestazioni();
        fetchCustomers();
        if (idbooking) {
            fetchBooking(idbooking);
        }
    }, [idbooking]);

    const handleReset = () => {
        setDurata(30);
        // Altri reset se necessario
    };

    const calculateEndTime = (startTime, duration) => {
        if (!startTime) return "";
        return moment(startTime, "HH:mm").add(duration, "minutes").format("HH:mm");
    };

    // Funzione per convertire una stringa "HH:mm" in minuti
    const convertTimeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

//-----------------------------------------------------------------
    const handleDelete = async () => {
        try {
            await deleteDoc(doc(db, 'bookingTab', idbooking));
            successNoty("Appuntamento eliminato!");
            navigate("/appuntamenti");
        } catch (error) {
            console.error("Errore nella cancellazione dell'appuntamento: ", error);
            notifyError("Errore nella cancellazione dell'appuntamento.");
        } finally {
            setOpenDialog(false);
        }
    };


    const handleSubmit = async (event) => {
        event.preventDefault();
    
        if (!selectedCustomerId) {
            notifyError("Aggiungi il paziente");
            return;
        }
        if (!selectedPrestazioniId) {
            notifyError("Aggiungi la prestazione");
            return;
        }
    
        const oraFine = calculateEndTime(selectedTime, durata);
        const selectedCustomer = pazienti.find(paziente => paziente.id === selectedCustomerId);
        const nomeCompleto = selectedCustomer ? `${selectedCustomer.nome} ${selectedCustomer.cognome}` : "";
        const nome = selectedCustomer ? `${selectedCustomer.nome}` : "";
        const cognome = selectedCustomer ? `${selectedCustomer.cognome}` : "";
        const codiceFiscale = selectedCustomer ? selectedCustomer.codiceFiscale || "" : "";
        const linkIndirizzo = selectedCustomer ? selectedCustomer.linkIndirizzo || "" : "";
        const selectedPrestazione = prestazioni.find(prestazione => prestazione.id === selectedPrestazioniId);
        const nomePrestazione = selectedPrestazione ? selectedPrestazione.prestazioni : "";
    
        // Converti orario di inizio e fine in minuti
        const newStart = convertTimeToMinutes(selectedTime);
        const newEnd = convertTimeToMinutes(oraFine);
    
        // Verifica conflitti
        const q = query(
            collection(db, 'bookingTab'),
            where('uid', '==', uid),
            where('giorno', '==', selectedDate)
        );
        const querySnapshot = await getDocs(q);
        let conflict = false;
        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            // Escludi il documento corrente in modalità modifica
            if (idbooking && docSnap.id === idbooking) return;
            const existingStart = convertTimeToMinutes(data.ora);
            const existingEnd = convertTimeToMinutes(data.oraFine);
            // Controlla se gli intervalli si sovrappongono
            if (newStart < existingEnd && newEnd > existingStart) {
                conflict = true;
            }
        });
    
        if (conflict) {
            notifyError("Orario già occupato da un altro appuntamento. Verifica la durata e/o l'orario.");
            return;
        }
    
        const dataToSubmit = {
            uid,
            durata,
            codiceFiscale,
            pazienteId: selectedCustomerId,
            nomeCompleto,
            nome,
            cognome,
            stateRegister: false,
            linkIndirizzo,
            prestazioniId: selectedPrestazioniId,
            nomePrestazione,
            giorno: selectedDate,
            ora: selectedTime,
            oraFine,
            note,
            dataCreazione: Timestamp.fromDate(new Date()),
        };
    
        try {
            if (idbooking) {
                // Modalità modifica: aggiorna il documento esistente
                const bookingDocRef = doc(db, 'bookingTab', idbooking);
                await updateDoc(bookingDocRef, dataToSubmit);
                successNoty("Appuntamento aggiornato!");
            } else {
                // Modalità aggiunta: crea un nuovo documento
                await addDoc(collection(db, 'bookingTab'), dataToSubmit);
                successNoty("Appuntamento aggiunto!");
            }
            handleReset();
            navigate(`/appuntamenti?giorno=${selectedDate}`);
        } catch (error) {
            console.error('Errore nell\'aggiunta/aggiornamento dell\'appuntamento: ', error);
        }
    };
    

    return (
        <>
            {matches && (
                <NavMobile text={idbooking ? "Modifica Appuntamento" : "Aggiungi Appuntamento"} />
            )}
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="overflow-auto"
                style={{ minHeight: "80vh" }}
            >
                <div className='container-fluid'>
                    {!matches && <h2 className='titlePage'>{idbooking ? "Modifica Appuntamento" : "Aggiungi Appuntamento"}</h2>}
                    <form onSubmit={handleSubmit}>
                        <div className='row'>
                            <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                            <Autocomplete
                                options={pazienti}
                                value={pazienti.find(option => option.id === selectedCustomerId) || null}
                                loading={loadingAutoComplete}
                                getOptionLabel={(option) => `${option.nome} ${option.cognome}`}
                                renderOption={(props, option) => {
                                    let isExpired = false;
                                    if (!option.dataFinePai) {
                                    isExpired = true;
                                    } else {
                                    const parts = option.dataFinePai.split("-");
                                    if (parts.length === 3) {
                                        const parsedDate = new Date(parts[2], parts[1] - 1, parts[0]);
                                        const compareDate = new Date(selectedDate);
                                        if (parsedDate < compareDate) {
                                        isExpired = true;
                                        }
                                    }
                                    }

                                    return (
                                    <li {...props} key={option.id}>
                                        <Box>
                                        <Typography variant="body1" sx={{ color: isExpired ? 'red' : 'inherit' }}>
                                            {option.nome} {option.cognome}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {option.codiceFiscale}
                                        </Typography>
                                        </Box>
                                    </li>
                                    );
                                }}
                                onChange={(event, value) => {
                                    if (value) {
                                    onCustomerSelect(value.id);
                                    setSelectedPaiDate(value.dataFinePai || "N/A");

                                    // Controllo se il Pai è scaduto
                                    let expired = false;
                                    if (!value.dataFinePai) {
                                        expired = true;
                                    } else {
                                        const parts = value.dataFinePai.split("-");
                                        if (parts.length === 3) {
                                        const parsedDate = new Date(parts[2], parts[1] - 1, parts[0]);
                                        const compareDate = new Date(selectedDate);
                                        if (parsedDate < compareDate) {
                                            expired = true;
                                        }
                                        }
                                    }
                                    setIsPaiExpired(expired);
                                    }
                                }}
                                renderInput={(params) => {
                                    const selectedOption = pazienti.find(option => option.id === selectedCustomerId);
                                    let isExpired = false;
                                    if (selectedOption) {
                                    if (!selectedOption.dataFinePai) {
                                        isExpired = true;
                                    } else {
                                        const parts = selectedOption.dataFinePai.split("-");
                                        if (parts.length === 3) {
                                        const parsedDate = new Date(parts[2], parts[1] - 1, parts[0]);
                                        const compareDate = new Date(selectedDate);
                                        if (parsedDate < compareDate) {
                                            isExpired = true;
                                        }
                                        }
                                    }
                                    }

                                    return (
                                    <TextField
                                        {...params}
                                        label="Seleziona paziente"
                                        variant="outlined"
                                        fullWidth
                                        InputProps={{
                                        ...params.InputProps,
                                        style: { color: isExpired ? 'red' : 'inherit' },
                                        endAdornment: (
                                            <>
                                            {loadingAutoComplete ? <CircularProgress color="inherit" size={20} /> : null}
                                            {params.InputProps.endAdornment}
                                            </>
                                        ),
                                        }}
                                    />
                                    );
                                }}
                                />
                              <div className='mt-2'>
                                {selectedCustomerId && selectedPaiDate !== "N/A" && (
                                    isPaiExpired ? 
                                    <p className='mb-0'>Il Pai è scaduto il: <span style={{color: "red"}}>{selectedPaiDate}</span></p>
                                    :
                                    <p className='mb-0'>Il Pai scade il: {selectedPaiDate}</p>
                                )}
                                </div>
                            </div>
                            <h6 className='mb-0 mt-4'>Dettagli della Visita</h6>
                            <div className='mt-4 col-lg-4 col-md-6 col-sm-12 d-flex justify-content-between gap-3'>
                                <TextField
                                    className='w-100'
                                    label="Giorno"
                                    type="date"
                                    value={selectedDate}
                                    onChange={handleChangeDate}
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    className='w-100'
                                    label="Ora"
                                    type="time"
                                    value={selectedTime}
                                    onChange={handleChangeTime}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </div>
                            <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                <FormControl fullWidth color='primary'>
                                    <InputLabel id="durata-select-label">Durata</InputLabel>
                                    <Select
                                        labelId="durata-select-label"
                                        id="durata-select"
                                        value={durata}
                                        label="Durata"
                                        onChange={handledurataChange}
                                    >
                                        <MenuItem value={30}>30 min</MenuItem>
                                        <MenuItem value={45}>45 min</MenuItem>
                                        <MenuItem value={60}>60 min</MenuItem>
                                    </Select>
                                </FormControl>
                            </div>
                            <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                            <Autocomplete
                            options={prestazioni}
                            value={prestazioni.find(option => option.id === selectedPrestazioniId) || null}
                            loading={loadingAutoComplete}
                            getOptionLabel={(option) => `${option.prestazioni}`}
                            renderOption={(props, option) => (
                                <li {...props} key={option.id}>
                                <Box>
                                    <Typography variant="body1">
                                    {option.prestazioni}
                                    </Typography>
                                </Box>
                                </li>
                            )}
                            onChange={(event, value) => {
                                if (value) {
                                onPrestazioniSelect(value.id);
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                {...params}
                                label="Prestazioni"
                                variant="outlined"
                                fullWidth
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                    <>
                                        {loadingAutoComplete ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                    ),
                                }}
                                />
                            )}
                            />
                            </div>
                            <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                <TextField
                                    label="Note"
                                    variant="outlined"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>

                            {/* Optional Fields Section */}
                            <div className='mt-4 col-lg-12'>
                                <Typography
                                    variant="h6"
                                    onClick={() => setShowOptionalFields(!showOptionalFields)}
                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                >
                                    Campi Facoltativi{" "}
                                    {showOptionalFields ? (
                                        <ExpandMoreIcon style={{ marginLeft: '8px', transform: 'rotate(180deg)' }} />
                                    ) : (
                                        <ExpandMoreIcon style={{ marginLeft: '8px' }} />
                                    )}
                                </Typography>
                                <Collapse in={showOptionalFields}>
                                    <div className='row'>
                                        <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                            {/* Altri campi facoltativi */}
                                        </div>
                                    </div>
                                </Collapse>
                            </div>
                        </div>
                        <Button className='mt-4 w-100 py-2' type="submit" variant="contained">
                            {idbooking ? "Aggiorna Appuntamento" : "Aggiungi Appuntamento"}
                        </Button>
                    </form>


                    {idbooking && (
                        <>
                            <Button 
                                className='mt-2 w-100 py-2' 
                                variant="contained" 
                                color="error" 
                                onClick={() => setOpenDialog(true)}
                            >
                                Elimina Appuntamento
                            </Button>

                            {/* Dialog di conferma eliminazione */}
                            <Dialog
                                open={openDialog}
                                onClose={() => setOpenDialog(false)}
                            >
                                <DialogTitle>Conferma Eliminazione</DialogTitle>
                                <DialogContent>
                                    <DialogContentText>
                                        Sei sicuro di voler eliminare questo appuntamento? Questa azione non può essere annullata.
                                    </DialogContentText>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => setOpenDialog(false)} color="primary">
                                        Annulla
                                    </Button>
                                    <Button onClick={handleDelete} color="error">
                                        Elimina
                                    </Button>
                                </DialogActions>
                            </Dialog>
                        </>
                    )}

                </div>
            </motion.div>
        </>
    );
}
