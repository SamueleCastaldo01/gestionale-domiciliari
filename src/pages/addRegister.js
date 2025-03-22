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
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
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
   const [selectedPaiDate, setSelectedPaiDate] = useState("");
   const [isPaiExpired, setIsPaiExpired] = useState(false);
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

  const onCustomerSelect = (id) => {
    setSelectedCustomerId(id);
};

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

  const fetchAppointments = async () => {
    try {
      setLoadingAppointments(true);
      const appointmentCollection = collection(db, "bookingTab");
      const appointmentQuery = query(appointmentCollection, where("uid", "==", uid), where("giorno", "==", selectedDate), where("stateRegister", "==", false));
      const appointmentSnapshot = await getDocs(appointmentQuery);
      const appointmentList = appointmentSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      appointmentList.sort((a, b) => {
        const timeToMinutes = (time) => {
          const [hours, minutes] = time.split(":").map(Number);
          return hours * 60 + minutes;
        };
        return timeToMinutes(a.ora) - timeToMinutes(b.ora);
      });
  
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

  //---------------------------------------------------------------
  const updateSummaryTab = async (dataToAdd) => {
    const { uid, pazienteId, nomeCompleto, codiceFiscale, durata, giorno } = dataToAdd;
    const dateObj = new Date(giorno);
    const mese = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
  
    const summaryDocRef = doc(db, "summaryTab", `${pazienteId}_${mese}`);
  
    try {
      const docSnap = await getDoc(summaryDocRef);
  
      if (docSnap.exists()) {
        // Se il riepilogo esiste già, aggiorniamo i conteggi
        const summaryData = docSnap.data();
        let updateData = {
          numeroAccessi: summaryData.numeroAccessi + 1,
        };
  
        if (durata === 30) updateData.count30 = (summaryData.count30 || 0) + 1;
        if (durata === 45) updateData.count45 = (summaryData.count45 || 0) + 1;
        if (durata === 60) updateData.count60 = (summaryData.count60 || 0) + 1;
  
        await updateDoc(summaryDocRef, updateData);
      } else {
        // Se non esiste, creiamo un nuovo riepilogo
        const newSummaryData = {
          uid,
          mese,
          pazienteId,
          nfc: "0",
          nomeCompleto,
          codiceFiscale, 
          numeroAccessi: 1,
          count30: durata === 30 ? 1 : 0,
          count45: durata === 45 ? 1 : 0,
          count60: durata === 60 ? 1 : 0,
        };
  
        await setDoc(summaryDocRef, newSummaryData);
      }
  
    } catch (error) {
      console.error("Errore nell'aggiornare summaryTab:", error);
    }
  };
  


  //---------------------------------------------------------------
  const handleSubmit = async (event) => {
    event.preventDefault();
  
    const newStart = selectedTime.split(':').reduce((acc, t) => acc * 60 + parseInt(t), 0);
    const oraFine = calculateEndTime(selectedTime, durata);
    const newEnd = oraFine.split(':').reduce((acc, t) => acc * 60 + parseInt(t), 0);
  
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
      // Verifica se l'intervallo [newStart, newEnd) si sovrappone a quello [existingStart, existingEnd)
      if (newStart < existingEnd && newEnd > existingStart) {
        conflict = true;
      }
    });
    if (conflict) {
      notifyError("Orario già occupato da un altro appuntamento. Verifica la durata e/o l'orario.");
      return;
    }
  
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
      dataToAdd.nome = selectedCustomer ? `${selectedCustomer.nome}` : "";
      dataToAdd.cognome = selectedCustomer ? `${selectedCustomer.cognome}` : "";
      dataToAdd.linkIndirizzo = selectedCustomer ? selectedCustomer.linkIndirizzo : "";
      dataToAdd.codiceFiscale = selectedCustomer ? selectedCustomer.codiceFiscale : "";  // 👈 Aggiunto codice fiscale
  
      const selectedPrestazione = prestazioni.find(p => p.id === selectedPrestazioniId);
      dataToAdd.prestazioniId = selectedPrestazioniId;
      dataToAdd.nomePrestazione = selectedPrestazione ? selectedPrestazione.prestazioni : "";
    } else if (mode === "appuntamento") {
      if (!selectedBooking) {
        notifyError("Seleziona un appuntamento");
        return;
      }
  
      dataToAdd.pazienteId = selectedBooking.pazienteId;
      dataToAdd.nomeCompleto = selectedBooking.nomeCompleto;
      dataToAdd.nome = selectedBooking.nome;
      dataToAdd.cognome = selectedBooking.cognome;
      dataToAdd.linkIndirizzo = selectedBooking.linkIndirizzo;
      dataToAdd.prestazioniId = selectedBooking.prestazioniId;
      dataToAdd.nomePrestazione = selectedBooking.nomePrestazione;
      dataToAdd.codiceFiscale = selectedBooking.codiceFiscale;
    }
  
    try {
      await addDoc(collection(db, 'registerTab'), dataToAdd);
      await updateSummaryTab(dataToAdd);
  
      if (selectedBooking) {
        const bookingDocRef = doc(db, 'bookingTab', selectedBooking.id);
        await updateDoc(bookingDocRef, { stateRegister: true });
      }
  
      handleReset();
      navigate("/registerlist");
      successNoty("Prestazione Aggiunta!");
    } catch (error) {
      console.error('Errore nell\'aggiunta dell\'appuntamento: ', error);
    }
  };
  
  

  return (
    <>
      {matches && <NavMobile text="Aggiungi al Registro" />}
      <motion.div
        initial={{ x: -20, opacity: 0 }}  // Parte da sinistra fuori schermo
        animate={{ x: 0, opacity: 1 }}     // Arriva alla posizione normale
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="overflow-auto"
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
            <div className='mb-4'>
            <IconButton className='p-0 mb-3' onClick={() => {setMode(null); setSelectedBooking(null)}}>
            <ArrowBackIosIcon fontSize='small' style={{color: "black"}}/>
            </IconButton>
              <Autocomplete className='mt-0'
                options={appointments}
                loading={loadingAppointments}
                getOptionLabel={(option) => `${option.cognome} ${option.nome} (${option.ora} - ${option.oraFine})`}
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
            <IconButton className='p-0' onClick={() => {setMode(null); setSelectedBooking(null)}}>
                <ArrowBackIosIcon fontSize='small' style={{color: "black"}}/>
            </IconButton>
              <div className='row'>
                {/* In modalità "Nuovo" mostriamo gli autocomplete per Paziente e Prestazioni */}
                {mode === "nuovo" && (
                  <>
                    <div className='mt-3 col-lg-4 col-md-6 col-sm-12'>
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
                            <p style={{fontSize: "14px"}} className='mb-0'>Il Pai è scaduto il: <span style={{color: "red"}}>{selectedPaiDate}</span></p>
                            :
                            <p style={{fontSize: "14px"}} className='mb-0'>Il Pai scade il: {selectedPaiDate}</p>
                          )}
                        </div>
                        <Autocomplete
                        className='mt-3'
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
                      <TextField label="Paziente"  value={`${selectedBooking.cognome || ""} ${selectedBooking.nome || ""}`.trim()} 
                       variant="outlined" fullWidth disabled />
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
