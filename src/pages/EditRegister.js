import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useSelector } from 'react-redux';
import { FormControl, InputLabel, MenuItem, Select, Collapse, Typography, Autocomplete, CircularProgress, Box, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { db } from '../firebase-config';
import { collection, doc, getDoc, updateDoc, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
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

export function EditRegister() {
  const matches = useMediaQuery("(max-width:920px)");
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const idRegister = queryParams.get("idregister");
  const user = useSelector((state) => state.auth.user);
  const uid = user?.uid;

  // Stato per il caricamento del documento da modificare
  const [loadingRegister, setLoadingRegister] = useState(true);

  // State per i campi del form
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [selectedTime, setSelectedTime] = useState(getCurrentTime());
  const [durata, setDurata] = useState(30);
  const [note, setNote] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedPrestazioniId, setSelectedPrestazioniId] = useState(null);

  // Array per gli autocomplete
  const [pazienti, setPazienti] = useState([]);
  const [prestazioni, setPrestazioni] = useState([]);
  const [loadingAutoComplete, setLoadingAutocomplete] = useState(true);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Funzione per calcolare l'ora di fine a partire dall'ora di inizio e dalla durata
  const calculateEndTime = (startTime, duration) => {
    if (!startTime) return "";
    return moment(startTime, "HH:mm").add(duration, "minutes").format("HH:mm");
  };

  // Fetch del documento di registerTab da modificare
  const fetchRegister = async () => {
    if (!idRegister) {
      notifyError("ID registro mancante");
      navigate("/registerlist");
      return;
    }
    setLoadingRegister(true);
    try {
      const docRef = doc(db, "registerTab", idRegister);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSelectedDate(data.giorno || getCurrentDate());
        setSelectedTime(data.ora || getCurrentTime());
        setDurata(data.durata || 30);
        setNote(data.note || "");
        setSelectedCustomerId(data.pazienteId || null);
        setSelectedPrestazioniId(data.prestazioniId || null);
      } else {
        notifyError("Registro non trovato");
        navigate("/registerlist");
      }
    } catch (error) {
      console.error("Errore nel recupero del registro: ", error);
    } finally {
      setLoadingRegister(false);
    }
  };

  // Fetch per i pazienti (customers)
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

  // Fetch per le prestazioni
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

  useEffect(() => {
    fetchRegister();
    fetchCustomers();
    fetchPrestazioni();
  }, [idRegister]);

  const handledurataChange = (event) => {
    setDurata(event.target.value);
  };

  const handleChangeDate = (event) => {
    setSelectedDate(event.target.value);
  };

  const handleChangeTime = (event) => {
    setSelectedTime(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validazione: controlla se i campi obbligatori sono compilati
    if (!selectedCustomerId) {
      notifyError("Aggiungi il paziente");
      return;
    }
    if (!selectedPrestazioniId) {
      notifyError("Aggiungi la prestazione");
      return;
    }

    const oraFine = calculateEndTime(selectedTime, durata);
    const dataToUpdate = {
      durata,
      giorno: selectedDate,
      ora: selectedTime,
      oraFine,
      note,
      // Non aggiorniamo dataCreazione; potresti aggiungere un campo updatedAt se lo desideri
    };

    // Aggiorna i dati relativi a paziente e prestazione
    const selectedCustomer = pazienti.find(p => p.id === selectedCustomerId);
    dataToUpdate.pazienteId = selectedCustomerId;
    dataToUpdate.nomeCompleto = selectedCustomer ? `${selectedCustomer.nome} ${selectedCustomer.cognome}` : "";
    dataToUpdate.linkIndirizzo = selectedCustomer ? selectedCustomer.linkIndirizzo : "";
    const selectedPrestazione = prestazioni.find(p => p.id === selectedPrestazioniId);
    dataToUpdate.prestazioniId = selectedPrestazioniId;
    dataToUpdate.nomePrestazione = selectedPrestazione ? selectedPrestazione.prestazioni : "";

    try {
      const docRef = doc(db, "registerTab", idRegister);
      await updateDoc(docRef, dataToUpdate);
      successNoty("Appuntamento aggiornato!");
      navigate("/registerlist");
    } catch (error) {
      console.error("Errore nell'aggiornamento dell'appuntamento: ", error);
    }
  };

  // Mostra un loader se i dati del registro non sono ancora stati caricati
  if (loadingRegister) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <>
      {matches && <NavMobile text="Modifica Registro" />}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}    
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="overflow-auto"
        style={{ minHeight: "80vh" }}
        >
        <div className="container-fluid">
          {!matches && <h2 className="titlePage">Modifica Appuntamento/Registro</h2>}
          <IconButton className="p-0" onClick={() => navigate("/registerlist")}>
            <ArrowBackIosIcon fontSize="small" style={{ color: "black" }} />
          </IconButton>
          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* Autocomplete per la selezione del paziente */}
              <div className="mt-3 col-lg-4 col-md-6 col-sm-12">
                <Autocomplete
                  options={pazienti}
                  loading={loadingAutoComplete}
                  getOptionLabel={(option) => `${option.nome} ${option.cognome}`}
                  value={pazienti.find(p => p.id === selectedCustomerId) || null}
                  onChange={(event, value) => {
                    if (value) setSelectedCustomerId(value.id);
                  }}
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
              {/* Autocomplete per la selezione della prestazione */}
              <div className="mt-4 col-lg-4 col-md-6 col-sm-12">
                <Autocomplete
                  options={prestazioni}
                  loading={loadingAutoComplete}
                  getOptionLabel={(option) => `${option.prestazioni}`}
                  value={prestazioni.find(p => p.id === selectedPrestazioniId) || null}
                  onChange={(event, value) => {
                    if (value) setSelectedPrestazioniId(value.id);
                  }}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography variant="body1">
                          {option.prestazioni}
                        </Typography>
                      </Box>
                    </li>
                  )}
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
              {/* Campi per data e orario */}
              <h6 className="mb-0 mt-4">Dettagli della Visita</h6>
              <div className="mt-4 col-lg-4 col-md-6 col-sm-12 d-flex justify-content-between gap-3">
                <TextField
                  className="w-100"
                  label="Giorno"
                  type="date"
                  value={selectedDate}
                  onChange={handleChangeDate}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  className="w-100"
                  label="Ora"
                  type="time"
                  value={selectedTime}
                  onChange={handleChangeTime}
                  InputLabelProps={{ shrink: true }}
                />
              </div>
              {/* Selezione della durata */}
              <div className="mt-4 col-lg-4 col-md-6 col-sm-12">
                <FormControl fullWidth color="primary">
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
              {/* Campo per le note */}
              <div className="mt-4 col-lg-4 col-md-6 col-sm-12">
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
              <div className="mt-4 col-lg-12">
                <Typography
                  variant="h6"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  Campi Facoltativi {showOptionalFields ?
                    <ExpandMoreIcon style={{ marginLeft: '8px', transform: 'rotate(180deg)' }} /> :
                    <ExpandMoreIcon style={{ marginLeft: '8px' }} />}
                </Typography>
                <Collapse in={showOptionalFields}>
                  <div className="row">
                    <div className="mt-4 col-lg-4 col-md-6 col-sm-12">
                      {/* Eventuali campi facoltativi */}
                    </div>
                  </div>
                </Collapse>
              </div>
            </div>
            <Button className="mt-4 w-100 py-2" type="submit" variant="contained">Aggiorna</Button>
          </form>
        </div>
      </motion.div>
    </>
  );
}
