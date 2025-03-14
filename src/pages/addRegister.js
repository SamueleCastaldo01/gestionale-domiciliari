import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useSelector } from 'react-redux';
import { FormControl, InputLabel, MenuItem, Select, Collapse, Typography, Autocomplete, CircularProgress, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { db } from '../firebase-config';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import moment from 'moment';
import useMediaQuery from "@mui/material/useMediaQuery";
import { notifyError, successNoty } from '../components/Notify';
import { NavMobile } from '../components/NavMobile';

// Funzioni per ottenere data e ora correnti
const getCurrentDate = () => new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
const getCurrentTime = () => {
  const now = new Date();
  return now.toTimeString().split(" ")[0].slice(0, 5); // "HH:MM"
};

export function AddRegister() {
  const matches = useMediaQuery("(max-width:920px)");
  const user = useSelector((state) => state.auth.user);
  const uid = user?.uid;
  const location = useLocation();
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [selectedTime, setSelectedTime] = useState(getCurrentTime());
  
  // Stati per il form "Nuovo"
  const [pazienti, setPazienti] = useState([]);
  const [prestazioni, setPrestazioni] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedPrestazioniId, setSelectedPrestazioniId] = useState(null);
  
  // Stati per il form in modalità "Appuntamento"
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Altri campi condivisi
  const [durata, setDurata] = useState(30);
  const [note, setNote] = useState("");
  const [loadingAutoComplete, setLoadingAutocomplete] = useState(true);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  
  // Stato per la modalità: null (ancora da scegliere), "nuovo" oppure "appuntamento"
  const [mode, setMode] = useState(null);
  const navigate = useNavigate();

  // --- Fetch per il form "Nuovo" ---
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
      const prestazioniCollection = collection(db, "prestazioneTab");
      const prestazioniQuery = query(prestazioniCollection, where("uid", "==", uid));
      const prestazioniSnapshot = await getDocs(prestazioniQuery);
      const prestazioniList = prestazioniSnapshot.docs.map((doc) => ({
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

  // --- Fetch per la modalità "Appuntamento" ---
  const fetchAppointments = async () => {
    try {
      setLoadingAppointments(true);
      const appointmentCollection = collection(db, "bookingTab");
      const appointmentQuery = query(appointmentCollection, where("uid", "==", uid), where("giorno", "==", selectedDate));
      const appointmentSnapshot = await getDocs(appointmentQuery);
      const appointmentList = appointmentSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAppointments(appointmentList);
    } catch (error) {
      console.error("Errore nel recupero degli appuntamenti: ", error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Se l'utente sceglie "Nuovo" partiamo a caricare pazienti e prestazioni
  useEffect(() => {
      fetchCustomers();
      fetchPrestazioni();
  }, [mode]);

  const handledurataChange = (event) => {
    setDurata(event.target.value);
  };

  const handleChangeDate = (event) => {
    setSelectedDate(event.target.value);
  };

  const handleChangeTime = (event) => {
    setSelectedTime(event.target.value);
  };

  const handleReset = () => {
    setDurata(30);
    setNote("");
    setSelectedCustomerId(null);
    setSelectedPrestazioniId(null);
    setSelectedBooking(null);
    setSelectedDate(getCurrentDate());
    setSelectedTime(getCurrentTime());
  };

  // Calcola l'ora di fine a partire dall'ora di inizio e dalla durata (in minuti)
  const calculateEndTime = (startTime, duration) => {
    if (!startTime) return "";
    return moment(startTime, "HH:mm").add(duration, "minutes").format("HH:mm");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Controllo conflitti (per evitare doppie prenotazioni nello stesso orario)
    const newStart = selectedTime.split(':').reduce((acc, t) => acc * 60 + parseInt(t), 0);
    const q = query(
      collection(db, 'registerTab'),
      where('uid', '==', uid),
      where('giorno', '==', selectedDate)
    );
    const querySnapshot = await getDocs(q);
    let conflict = false;
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const existingStart = data.ora && data.ora.split(':').reduce((acc, t) => acc * 60 + parseInt(t), 0);
      const existingEnd = data.oraFine && data.oraFine.split(':').reduce((acc, t) => acc * 60 + parseInt(t), 0);
      if (newStart >= existingStart && newStart < existingEnd) {
        conflict = true;
      }
    });
    if (conflict) {
      notifyError("Orario già occupato da un altro appuntamento");
      return;
    }

    const oraFine = calculateEndTime(selectedTime, durata);
    const dataToAdd = {
      uid,
      durata,
      giorno: selectedDate,
      ora: selectedTime,
      oraFine,
      note,
      dataCreazione: Timestamp.fromDate(new Date()),
    };

    if (mode === "nuovo") {
      if (!selectedCustomerId) {
        notifyError("Aggiungi il paziente");
        return;
      }
      if (!selectedPrestazioniId) {
        notifyError("Aggiungi la prestazione");
        return;
      }
      const selectedCustomer = pazienti.find(p => p.id === selectedCustomerId);
      dataToAdd.pazienteId = selectedCustomerId;
      dataToAdd.nomeCompleto = selectedCustomer ? `${selectedCustomer.nome} ${selectedCustomer.cognome}` : "";
      dataToAdd.linkIndirizzo = selectedCustomer ? selectedCustomer.linkIndirizzo : "";
      const selectedPrestazione = prestazioni.find(p => p.id === selectedPrestazioniId);
      dataToAdd.prestazioniId = selectedPrestazioniId;
      dataToAdd.nomePrestazione = selectedPrestazione ? selectedPrestazione.prestazioni : "";
    } else if (mode === "appuntamento") {
      if (!selectedBooking) {
        notifyError("Seleziona un appuntamento");
        return;
      }
      // Utilizza i dati dell'appuntamento selezionato per precompilare il form
      dataToAdd.pazienteId = selectedBooking.pazienteId;
      dataToAdd.nomeCompleto = selectedBooking.nomeCompleto;
      dataToAdd.linkIndirizzo = selectedBooking.linkIndirizzo;
      dataToAdd.prestazioniId = selectedBooking.prestazioniId;
      dataToAdd.nomePrestazione = selectedBooking.nomePrestazione;
    }

    try {
      await addDoc(collection(db, 'registerTab'), dataToAdd);
      handleReset();
      navigate("/registerlist");
      successNoty("Appuntamento Aggiunto!");
    } catch (error) {
      console.error('Errore nell\'aggiunta dell\'appuntamento: ', error);
    }
  };

  return (
    <>
      {matches && <NavMobile text="Aggiungi al Registro" />}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className='overflow-auto'
        style={{ minHeight: "80vh" }}
      >
        <div className='container-fluid'>
          {!matches && <h2 className='titlePage'>Aggiungi un nuovo Appuntamento/Registro</h2>}

          {/* Se nessuna modalità è stata scelta, mostra i due bottoni */}
          {!mode && (
            <div className="d-flex flex-column gap-2 text-center my-4">
              <Button variant='contained' onClick={() => { setMode("appuntamento"); fetchAppointments(); }}>
                Appuntamento
              </Button>
              <Typography variant="h6">o</Typography>
              <Button variant='contained' onClick={() => setMode("nuovo")}>
                Nuovo
              </Button>
            </div>
          )}

          {/* Se la modalità è "Appuntamento", mostra l'autocomplete per selezionare un appuntamento */}
          {mode === "appuntamento" && !selectedBooking && (
            <div className='my-4'>
              <Autocomplete
                options={appointments}
                loading={loadingAppointments}
                getOptionLabel={(option) => `${option.nomeCompleto} (${option.ora} - ${option.oraFine})`}
                onChange={(event, value) => {
                  if (value) {
                    setSelectedBooking(value);
                    // Precompila i campi condivisi
                    setDurata(value.durata || 30);
                    setNote(value.note || "");
                    setSelectedCustomerId(value.pazienteId);
                    setSelectedPrestazioniId(value.prestazioniId);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Seleziona Appuntamento"
                    variant="outlined"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingAppointments ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
              />
            </div>
          )}

          {/* Mostra il form se in modalità "Nuovo" oppure se in modalità "Appuntamento" e l'appuntamento è stato selezionato */}
          {(mode === "nuovo" || (mode === "appuntamento" && selectedBooking)) && (
            <form onSubmit={handleSubmit}>
              <div className='row'>
                {/* In modalità "Nuovo" mostriamo gli autocomplete per Paziente e Prestazioni */}
                {mode === "nuovo" && (
                  <>
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
                          if (value) setSelectedCustomerId(value.id);
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
                              )
                            }}
                          />
                        )}
                      />
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
                          if (value) setSelectedPrestazioniId(value.id);
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
                              )
                            }}
                          />
                        )}
                      />
                    </div>
                  </>
                )}

                {/* In modalità "Appuntamento", se l'appuntamento è stato selezionato, mostriamo i dettagli in sola lettura */}
                {mode === "appuntamento" && selectedBooking && (
                  <>
                    <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                      <TextField label="Paziente" value={selectedBooking.nomeCompleto} variant="outlined" fullWidth disabled />
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
                          if (value) setSelectedPrestazioniId(value.id);
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
                              )
                            }}
                          />
                        )}
                      />
                    </div>
                  </>
                )}

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

                {/* Sezione campi facoltativi */}
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
                        {/* Eventuali campi facoltativi */}
                      </div>
                    </div>
                  </Collapse>
                </div>
              </div>
              <Button className='mt-4 w-100 py-2' type="submit" variant="contained">Aggiungi</Button>
            </form>
          )}
        </div>
      </motion.div>
    </>
  );
}
