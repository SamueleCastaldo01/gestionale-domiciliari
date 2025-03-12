import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import { useSelector } from 'react-redux';
import { FormControl, InputLabel, MenuItem, Select, Collapse, Typography, InputAdornment, IconButton  } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Import dropdown icon
import { db } from '../firebase-config';
import { collection, addDoc, query, where, getDocs, Timestamp  } from 'firebase/firestore';
import moment from 'moment';
import useMediaQuery from "@mui/material/useMediaQuery";
import CodiceFiscale from 'codice-fiscale-js';
import { notifyErrorAddCliente, successNoty } from '../components/Notify';
import { NavMobile } from '../components/NavMobile';

export function AddCliente() {
    const matches = useMediaQuery("(max-width:920px)");
    const user = useSelector((state) => state.auth.user);
    const uid = user?.uid;
    const navigate = useNavigate();
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

      // Funzione per incollare dagli appunti
        const handlePasteClick = async () => {
            try {
            const text = await navigator.clipboard.readText();
            setLinkIndirizzo(text);
            } catch (error) {
            console.error("Errore nell'incollare dagli appunti:", error);
            }
        };

    const capitalizeWords = (str) => {
        return str
          .toLowerCase() // Converte l'intera stringa in minuscolo
          .split(' ') // Divide la stringa in parole
          .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalizza la prima lettera di ogni parola
          .join(' '); // Riunisce le parole in una stringa
      };

      
    const toUpperCaseWords = (str) => {
        return str.toUpperCase(); 
    };

    const isGoogleMapsLink = (link) => {
        const regex = /https:\/\/www\.google\.com\/maps/;
        return regex.test(link);  // Restituisce true se il link è un URL di Google Maps
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const cfExists = await checkCfExists(codiceFiscale);
        if (cfExists) {
            notifyErrorAddCliente("Questo codice fiscale è già inserito");
            return;
        }

        if (linkIndirizzo && !isGoogleMapsLink(linkIndirizzo)) {
            notifyErrorAddCliente("Il link inserito non è un link valido di Google Maps");
            return;
        }
    
        const formattedDataNascita = moment(dataNascita).format('DD-MM-YYYY');
        const formattedDataFinePai = moment(dataFinePai).format('DD-MM-YYYY');
        const formattedDataInizioPai = moment(dataInizioPai).format('DD-MM-YYYY');
    
        try {
            await addDoc(collection(db, 'customersTab'), {
                nome,
                uid,
                cognome,
                gender,
                linkIndirizzo,
                dataInizioPai: formattedDataInizioPai,
                dataFinePai: formattedDataFinePai,
                dataNascita: formattedDataNascita,
                codiceFiscale,
                telefono,
                email,
                dataCreazione: Timestamp.fromDate(new Date()), // Aggiungi la data di creazione
            });
            handleReset();
            navigate("/customerlist");
            successNoty("Paziente Aggiunto!");
        } catch (error) {
            console.error('Errore nell\'aggiunta del cliente: ', error);
        }
    };

    const checkCfExists = async (codiceFiscale) => {
        const q = query(collection(db, 'customersTab'), where('codiceFiscale', '==', codiceFiscale));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    };


    return (
        <>
        {matches && <NavMobile text= "Aggiungi un paziente" />}
       
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
            className='overflow-auto'
            style={{ minHeight: "100vh" }}  // Assicura lo scrolling
        >
            <div className='container-fluid'>
                {!matches && <h2 className='titlePage'>Aggiungi un nuovo Paziente</h2>}

                <form onSubmit={handleSubmit}>
                    <div className='row'>
                        <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                            <TextField className='w-100' required label="Nome" variant="outlined" color='primary' value={nome}   
                                onChange={(e) => {
                                const formattedNome = capitalizeWords(e.target.value); 
                                setNome(formattedNome); }}  
                            />
                        </div>
                        <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                            <TextField className='w-100' required label="Cognome" variant="outlined" color='primary' value={cognome} 
                                onChange={(e) => {
                                const formattedCognome = capitalizeWords(e.target.value); 
                                setCognome(formattedCognome); }}   
                            />
                        </div>
                        <div className='d-flex mt-4 col-lg-4 col-md-6 col-sm-12'>
                            <TextField className='w-100' label="Codice Fiscale" variant="outlined" required color='primary' value={codiceFiscale}  onChange={(e) => {
                                const formattedCognome = toUpperCaseWords(e.target.value); 
                                setCodiceFiscale(formattedCognome); }}    />
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
                                            <IconButton className='pe-0' onClick={handlePasteClick}>
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
                    <Button className='mt-4 w-100 py-2' type="submit" variant="contained">Aggiungi Paziente</Button>
                </form>
            </div>
        </motion.div>
    </>
    );
}
