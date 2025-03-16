import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useSelector } from 'react-redux';
import { FormControl, InputLabel, MenuItem, Select, Collapse, Typography, Autocomplete, CircularProgress, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Import dropdown icon
import { db } from '../firebase-config';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy} from 'firebase/firestore';
import moment from 'moment';
import useMediaQuery from "@mui/material/useMediaQuery";
import { useLocation } from "react-router-dom";
import { notifyError, successNoty } from '../components/Notify';
import { NavMobile } from '../components/NavMobile';

export function AddBooking() {
    const matches = useMediaQuery("(max-width:920px)");
    const user = useSelector((state) => state.auth.user);
    const uid = user?.uid;
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const date = queryParams.get("date");
    const time = queryParams.get("time");
    const [selectedDate, setSelectedDate] = useState(date);
    const [selectedTime, setSelectedTime] = useState(time);
    const [pazienti, setPazienti] = useState([]);
    const [prestazioni, setPrestazioni] = useState([]);
    const [note, setNote] = useState("");
    const [loadingAutoComplete, setLoadingAutocomplete] = useState(true);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [selectedPrestazioniId, setSelectedPrestazioniId] = useState(null);
    const navigate = useNavigate();
    const [durata, setDurata] = useState(30);
    const [showOptionalFields, setShowOptionalFields] = useState(false); // State for optional fields

    const handledurataChange = (event) => {
        setDurata(event.target.value);
    };

    const handleChange = (event) => {
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
          setLoadingAutocomplete(true); // Inizia il caricamento
          const customerCollection = collection(db, "customersTab");
      
          let customerQuery;
            customerQuery = query(customerCollection,where("uid", "==", uid), orderBy("nome", "asc"));
          const customerSnapshot = await getDocs(customerQuery);
          const customerList = customerSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
      
          setPazienti(customerList);
        } catch (error) {
          console.error("Errore nel recupero dei dati dei pazienti: ", error);
        } finally {
          setLoadingAutocomplete(false); // Termina il caricamento
        }
      };

      const fetchPrestazioni = async () => {
        try {
          setLoadingAutocomplete(true); // Inizia il caricamento
          const customerCollection = collection(db, "prestazioneTab");
      
          let customerQuery;
            customerQuery = query(customerCollection,where("uid", "==", uid));
          const customerSnapshot = await getDocs(customerQuery);
          const prestazioniList = customerSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
      
          setPrestazioni(prestazioniList);
        } catch (error) {
          console.error("Errore nel recupero delle prestazioni: ", error);
        } finally {
          setLoadingAutocomplete(false); // Termina il caricamento
        }
      };

      useEffect(() => {
        fetchPrestazioni();
        fetchCustomers();
      }, [])



    const handleReset = () => {
       setDurata(30);
    };


    const calculateEndTime = (startTime, duration) => {
        if (!startTime) return "";
        return moment(startTime, "HH:mm").add(duration, "minutes").format("HH:mm");
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
        const codiceFiscale = selectedCustomer ? `${selectedCustomer.codiceFiscale}` : "";
        const linkIndirizzo = selectedCustomer ? selectedCustomer.linkIndirizzo : "";
        const selectedPrestazione = prestazioni.find(prestazione => prestazione.id === selectedPrestazioniId);
        const nomePrestazione = selectedPrestazione ? selectedPrestazione.prestazioni : "";
    
        // Funzione per convertire una stringa "HH:mm" in minuti
        const convertTimeToMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };
    
        const newStart = convertTimeToMinutes(selectedTime);
    
        const q = query(
            collection(db, 'bookingTab'),
            where('uid', '==', uid),
            where('giorno', '==', selectedDate)
        );

    
        const querySnapshot = await getDocs(q);
        let conflict = false;
    
        querySnapshot.forEach(doc => {
            const data = doc.data();
            // Assumendo che gli orari siano salvati in formato "HH:mm"
            const existingStart = convertTimeToMinutes(data.ora);
            const existingEnd = convertTimeToMinutes(data.oraFine);
    
            // Verifica se il nuovo orario di inizio cade nell'intervallo di un appuntamento esistente
            if (newStart >= existingStart && newStart < existingEnd) {
                conflict = true;
            }
        });
    
        if (conflict) {
            notifyError("Orario già occupato da un altro appuntamento");
            return;
        }
    
        try {
            await addDoc(collection(db, 'bookingTab'), {
                uid,
                durata,
                codiceFiscale,
                pazienteId: selectedCustomerId,
                nomeCompleto,
                linkIndirizzo,
                prestazioniId: selectedPrestazioniId,
                nomePrestazione,
                giorno: selectedDate,
                ora: selectedTime,
                oraFine,
                note,
                dataCreazione: Timestamp.fromDate(new Date()),
            });
    
            handleReset();
            navigate("/appuntamenti");
            successNoty("Appuntamento Aggiunto!");
        } catch (error) {
            console.error('Errore nell\'aggiunta dell\'appuntamento: ', error);
        }
    };
    

    return (
        <>
        {matches && <NavMobile text= "Aggiungi un appuntamento" />}
       
        <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}    
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="overflow-auto"
        style={{ minHeight: "80vh" }}
        >
            <div className='container-fluid'>
                {!matches && <h2 className='titlePage'>Aggiungi un nuovo Paziente</h2>}

                <form onSubmit={handleSubmit}>
                    <div className='row'>
                        <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                        <Autocomplete
                            options={pazienti}
                            loading={loadingAutoComplete}
                            getOptionLabel={(option) => `${option.nome} ${option.cognome}`}
                            renderOption={(props, option) => (
                                <li {...props} key={option.id}>
                                <Box>
                                    <Typography variant="body1">
                                    {option.nome} {option.cognome}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                    {option.codiceFiscale}
                                    </Typography>
                                </Box>
                                </li>
                            )}
                            onChange={(event, value) => {
                                if (value) {
                                onCustomerSelect(value.id);
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                {...params}
                                label="Seleziona paziente"
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
                        <h6 className='mb-0 mt-4'>Dettagli della Visita</h6>
                        <div className='mt-4 col-lg-4 col-md-6 col-sm-12 d-flex justify-content-between gap-3'>
                            <TextField className='w-100' label="Giorno" type="date" value={selectedDate} onChange={handleChange}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                            <TextField className='w-100' label="Ora" type="time" value={selectedTime} onChange={handleChangeTime}
                                InputLabelProps={{
                                    shrink: true,
                                }}
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
                                Campi Facoltativi 
                                {showOptionalFields ? 
                                    <ExpandMoreIcon style={{ marginLeft: '8px', transform: 'rotate(180deg)' }} /> : 
                                    <ExpandMoreIcon style={{ marginLeft: '8px' }} />
                                }
                            </Typography>
                            <Collapse in={showOptionalFields}>
                                <div className='row'>
                                    <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                    </div>
                                </div>
                            </Collapse>
                        </div>
                    </div>
                    <Button className='mt-4 w-100 py-2' type="submit" variant="contained">Aggiungi Appuntamento</Button>
                </form>
            </div>
        </motion.div>
    </>
    );
}
