import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useSelector } from 'react-redux';
import { Checkbox, FormControlLabel, FormLabel } from "@mui/material";
import { FormControl, InputLabel, MenuItem, Select, Collapse, Typography, Autocomplete, CircularProgress, Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { db } from '../firebase-config';
import { collection, doc, getDoc, updateDoc, deleteDoc, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
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
  const [selectedTimeEnd, setSelectedTimeEnd] = useState();
  const [durata, setDurata] = useState(30);
  const [note, setNote] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedPrestazioniId, setSelectedPrestazioniId] = useState(null);

  // Array per gli autocomplete
  const [pazienti, setPazienti] = useState([]);
  const [prestazioni, setPrestazioni] = useState([]);
  const [loadingAutoComplete, setLoadingAutocomplete] = useState(true);
  const [flagAutodichiarazione, setFlagAutodichiarazione] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Stato per il dialog di eliminazione
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // Funzione per calcolare l'ora di fine a partire dall'ora di inizio e dalla durata
  const calculateEndTime = (startTime, duration) => {
    if (!startTime) return "";
    return moment(startTime, "HH:mm").add(duration, "minutes").format("HH:mm");
  };

  const handleChange = () => {
    setFlagAutodichiarazione(!flagAutodichiarazione);
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
        setSelectedTimeEnd(data.oraFine);
        setFlagAutodichiarazione(data.flagAutodichiarazione || false);
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
    const newDurata = event.target.value;
    setDurata(newDurata);
    setSelectedTimeEnd(calculateEndTime(selectedTime, newDurata));
  };

  const handleChangeDate = (event) => {
    setSelectedDate(event.target.value);
  };

  const handleChangeTime = (event) => {
    setSelectedTime(event.target.value);
  };


  const handleChangeTimeEnd = (event) => {
    const newTime = event.target.value;
    // Converte l'orario in minuti (ore * 60 + minuti) per il confronto
    const selectedTimeInMinutes = selectedTime.split(':').reduce((acc, time) => acc * 60 + parseInt(time), 0);
    const newTimeInMinutes = newTime.split(':').reduce((acc, time) => acc * 60 + parseInt(time), 0);
    
    if (newTimeInMinutes < selectedTimeInMinutes) {
      setSelectedTimeEnd(selectedTime);
    } else {
      setSelectedTimeEnd(newTime);
    }
  };
  
  //----------------------------------------------------------
  const updateWorkHoursTabOnEdit = async (oldData, newData) => {
    const { giorno } = newData;
    const oldDurata = oldData.durata;
    const newDurata = newData.durata;

    const dateObj = new Date(giorno);
    const giornoKey = dateObj.toISOString().split("T")[0]; // "YYYY-MM-DD"

    const workHoursDocRef = doc(db, "workHoursTab", `${uid}_${giornoKey}`);

    try {
        const docSnap = await getDoc(workHoursDocRef);

        if (docSnap.exists()) {
            const workHoursData = docSnap.data();

            // Inizializza updateData con i valori esistenti
            let updateData = {
                count30: workHoursData.count30 || 0,
                count45: workHoursData.count45 || 0,
                count60: workHoursData.count60 || 0,
            };

            // Rimuovi la vecchia durata
            if (oldDurata === 30) updateData.count30 = Math.max(updateData.count30 - 1, 0);
            if (oldDurata === 45) updateData.count45 = Math.max(updateData.count45 - 1, 0);
            if (oldDurata === 60) updateData.count60 = Math.max(updateData.count60 - 1, 0);

            // Aggiungi la nuova durata
            if (newDurata === 30) updateData.count30 += 1;
            if (newDurata === 45) updateData.count45 += 1;
            if (newDurata === 60) updateData.count60 += 1;

            // Aggiorna il documento
            await updateDoc(workHoursDocRef, updateData);
        } else {
            console.error("Documento workHoursTab non trovato per il giorno:", giornoKey);
        }
    } catch (error) {
        console.error("Errore nell'aggiornare workHoursTab durante la modifica:", error);
    }
};
  //----------------------------------------------------------
  const updateWorkHoursTabOnDelete = async (oldData) => {
    const { uid, giorno, durata: oldDurata } = oldData;

    const dateObj = new Date(giorno);
    const giornoKey = dateObj.toISOString().split("T")[0]; // "YYYY-MM-DD"
    const workHoursDocRef = doc(db, "workHoursTab", `${uid}_${giornoKey}`);

    try {
        const docSnap = await getDoc(workHoursDocRef);

        if (docSnap.exists()) {
            const workHoursData = docSnap.data();
            let updateData = {};

            if (oldDurata === 30) updateData.count30 = Math.max((workHoursData.count30 || 0) - 1, 0);
            if (oldDurata === 45) updateData.count45 = Math.max((workHoursData.count45 || 0) - 1, 0);
            if (oldDurata === 60) updateData.count60 = Math.max((workHoursData.count60 || 0) - 1, 0);

            await updateDoc(workHoursDocRef, updateData);
        }
    } catch (error) {
        console.error("Errore nell'aggiornare workHoursTab durante l'eliminazione:", error);
    }
};

  //----------------------------------------------------------
  const updateSummaryTabOnEdit = async (oldData, newData) => {
    const { pazienteId, giorno } = newData;
    const oldDurata = oldData.durata;
    const newDurata = newData.durata;
    
    const dateObj = new Date(giorno);
    const mese = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const summaryDocRef = doc(db, "summaryTab", `${pazienteId}_${mese}`);
  
    try {
      const docSnap = await getDoc(summaryDocRef);
  
      if (docSnap.exists()) {
        const summaryData = docSnap.data();
        let updateData = {};

        if (oldDurata === 30) updateData.count30 = Math.max((summaryData.count30 || 0) - 1, 0);
        if (oldDurata === 45) updateData.count45 = Math.max((summaryData.count45 || 0) - 1, 0);
        if (oldDurata === 60) updateData.count60 = Math.max((summaryData.count60 || 0) - 1, 0);
  
        if (newDurata === 30) updateData.count30 = (updateData.count30 || summaryData.count30 || 0) + 1;
        if (newDurata === 45) updateData.count45 = (updateData.count45 || summaryData.count45 || 0) + 1;
        if (newDurata === 60) updateData.count60 = (updateData.count60 || summaryData.count60 || 0) + 1;
  
        await updateDoc(summaryDocRef, updateData);
      }
  
    } catch (error) {
      console.error("Errore nell'aggiornare summaryTab:", error);
    }
  };
  //----------------------------------------------------------
  const updateSummaryTabOnDelete = async (oldData) => {
    const { pazienteId, giorno, durata: oldDurata } = oldData;
    const dateObj = new Date(giorno);
    const mese = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
    const summaryDocRef = doc(db, "summaryTab", `${pazienteId}_${mese}`);

    try {
        const summarySnap = await getDoc(summaryDocRef);
        if (summarySnap.exists()) {
            const summaryData = summarySnap.data();
            let updateData = {};

            updateData.numeroAccessi = Math.max((summaryData.numeroAccessi || 0) - 1, 0);

            if (oldDurata === 30) {
                updateData.count30 = Math.max((summaryData.count30 || 0) - 1, 0);
            } else if (oldDurata === 45) {
                updateData.count45 = Math.max((summaryData.count45 || 0) - 1, 0);
            } else if (oldDurata === 60) {
                updateData.count60 = Math.max((summaryData.count60 || 0) - 1, 0);
            }

            await updateDoc(summaryDocRef, updateData);
        }
    } catch (error) {
        console.error("Errore nell'aggiornare summaryTab durante l'eliminazione:", error);
    }
};
  //----------------------------------------------------------
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
    const docRef = doc(db, "registerTab", idRegister);
  
    try {
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        notifyError("Errore: appuntamento non trovato!");
        return;
      }
  
      const oldData = docSnap.data();
  
      const newStart = selectedTime.split(':').reduce((acc, t) => acc * 60 + parseInt(t), 0);
      const newEnd = oraFine.split(':').reduce((acc, t) => acc * 60 + parseInt(t), 0);
      
      const q = query(
        collection(db, 'registerTab'),
        where('uid', '==', uid),
        where('giorno', '==', selectedDate)
      );
      const querySnapshot = await getDocs(q);
      let conflict = false;
      querySnapshot.forEach(docSnap => {
        if (docSnap.id === idRegister) return;
        const data = docSnap.data();
        const existingStart = data.ora && data.ora.split(':').reduce((acc, t) => acc * 60 + parseInt(t), 0);
        const existingEnd = data.oraFine && data.oraFine.split(':').reduce((acc, t) => acc * 60 + parseInt(t), 0);
        if (newStart < existingEnd && newEnd > existingStart) {
          conflict = true;
        }
      });
      if (conflict) {
        notifyError("Orario già occupato da un altro appuntamento. Verifica la durata e/o l'orario.");
        return;
      }
  
      const dataToUpdate = {
        durata,
        giorno: selectedDate,
        ora: selectedTime,
        oraFine: selectedTimeEnd,
        note,
      };
  
      const selectedCustomer = pazienti.find(p => p.id === selectedCustomerId);
      dataToUpdate.pazienteId = selectedCustomerId;
      dataToUpdate.flagAutodichiarazione = flagAutodichiarazione;
      dataToUpdate.nomeCompleto = selectedCustomer ? `${selectedCustomer.nome} ${selectedCustomer.cognome}` : "";
      dataToUpdate.linkIndirizzo = selectedCustomer ? selectedCustomer.linkIndirizzo : "";
      
      const selectedPrestazione = prestazioni.find(p => p.id === selectedPrestazioniId);
      dataToUpdate.prestazioniId = selectedPrestazioniId;
      dataToUpdate.nomePrestazione = selectedPrestazione ? selectedPrestazione.prestazioni : "";
  
      await updateDoc(docRef, dataToUpdate);

      await updateWorkHoursTabOnEdit(oldData, dataToUpdate);
  
      await updateSummaryTabOnEdit(oldData, dataToUpdate);
  
      successNoty("Prestazione Aggiornata!");
      navigate("/registerlist");
    } catch (error) {
      console.error("Errore nell'aggiornamento dell'appuntamento: ", error);
    }
  };

  const handleDelete = async () => {
    try {
      const docRef = doc(db, "registerTab", idRegister);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        notifyError("Registro non trovato");
        setOpenDeleteDialog(false);
        return;
      }
      const oldData = docSnap.data();
      await updateWorkHoursTabOnDelete(oldData);
      await updateSummaryTabOnDelete(oldData);
      await deleteDoc(docRef);
      successNoty("Registro eliminato con successo!");
      navigate("/registerlist");
    } catch (error) {
      console.error("Errore nell'eliminazione del registro: ", error);
      notifyError("Errore nell'eliminazione del registro");
    } finally {
      setOpenDeleteDialog(false);
    }
  };

  //----------------------------------------------------------
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
                  disabled
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
              <h6 className="mb-0 mt-4">Dettagli della Visita</h6>
              <div className="mt-4 col-lg-4 col-md-6 col-sm-12 d-flex justify-content-between gap-3">
                <TextField
                  className="w-100"
                  label="Ora Ingresso"
                  type="time"
                  value={selectedTime}
                  onChange={handleChangeTime}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                    className="w-100"
                    label="Ora Uscita"
                    type="time"
                    value={selectedTimeEnd}
                    onChange={handleChangeTimeEnd}
                    InputLabelProps={{ shrink: true }}
                  />
              </div>
              <div className="mt-4 col-lg-4 col-md-6 col-sm-12 d-flex gap-3">
              <TextField
                  disabled
                  className="w-100"
                  label="Giorno"
                  type="date"
                  value={selectedDate}
                  onChange={handleChangeDate}
                  InputLabelProps={{ shrink: true }}
                />
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
              <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={flagAutodichiarazione}
                      onChange={handleChange}
                      color="primary"
                    />
                  }
                  label={"Autodichiarazione"} 
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
            <Button className="mt-4 w-100 py-2" type="submit" variant="contained">Modifica</Button>
            {/* Pulsante per eliminare la registrazione */}
            <Button
              className="mt-2 w-100 py-2"
              variant="contained"
              color="error"
              onClick={() => setOpenDeleteDialog(true)}
            >
              Elimina Registrazione
            </Button>
          </form>
        </div>
      </motion.div>

      {/* Dialog di conferma per eliminare la registrazione */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Conferma Eliminazione</DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler eliminare questa registrazione? L'operazione non potrà essere annullata.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Annulla</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Elimina
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
