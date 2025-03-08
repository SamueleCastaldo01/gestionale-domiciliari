import { useState } from "react";
import moment from 'moment';
import 'moment/locale/it'; 
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField, MenuItem, Select, FormControl, InputLabel, Button, Collapse, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"; // Importa l'icona
import { db, storage } from "../firebase-config";
import { addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { successNoty, errorNoty } from "../components/Notify";

const AddVeicolo = ({ open, onClose, idCustomer, fetchVehicles, username, onTargaSaved }) => {
    const [targa, setTarga] = useState("");
    const [marca, setMarca] = useState("");
    const [nomeModello, setNomeModello] = useState("");
    const [numeroTelaio, setNumeroTelaio] = useState("");
    const [annoImmatricolazione, setAnnoImmatricolazione] = useState("");
    const [tipoAlimentazione, setTipoAlimentazione] = useState("");
    const [potenza, setPotenza] = useState("");
    const [showOptionalFields, setShowOptionalFields] = useState(false); // Stato per i campi facoltativi
    const [showScadenzarioFields, setShowScadenzarioFields] = useState(false); // Stato per il Scadenzario
    const [showImageFields, setShowImageFields] = useState(false); // Stato per il Scadenzario

    //questo riguarda il caricamento dei documenti per il veicolo
    const [files, setFiles] = useState([]); // Array di file selezionati
    const [uploadStatus, setUploadStatus] = useState(""); // Stato del caricamento
    const [uploadedImages, setUploadedImages] = useState([]);

    // Stati per il scadenzario
    const [revisione, setRevisione] = useState({ dataEffettuata: "", dataScadenza: "", conferma: false });
    const [tassaCircolazione, setTassaCircolazione] = useState({ dataEffettuata: "", dataScadenza: "" });
    const [tagliando, setTagliando] = useState({ dataEffettuata: "", dataScadenza: "", conferma: false });
    const [gpl, setGpl] = useState({ dataEffettuata: "", dataScadenza: "" });
    const [metano, setMetano] = useState({ dataEffettuata: "", dataScadenza: "" });
    const [assicurazione, setAssicurazione] = useState({ dataEffettuata: "", dataScadenza: "" });

    
    const convertDatesToTimestamp = (dates) => {
        return {
            dataEffettuata: dates.dataEffettuata ? new Date(dates.dataEffettuata) : null,
            dataScadenza: dates.dataScadenza ? new Date(dates.dataScadenza) : null,
            conferma: dates.conferma || false
        };
    };

    const handleAddVehicle = async () => {
        if (!targa || !marca || !nomeModello) {
            errorNoty("Compila i campi obbligatori");
            return;
        }

        const upperCaseTarga = targa.toUpperCase(); // Converti la targa in maiuscolo
        const isUnique = await isTargaUnique(upperCaseTarga);
        if (!isUnique) {
            errorNoty("La targa deve essere univoca");
            return;
        }

        let uploadedFiles = []; // Array per memorizzare gli URL delle immagini caricate

        try {
            await addDoc(collection(db, "veicoloTab"), {
                idCustomer,
                targa: upperCaseTarga, // Salva la targa in maiuscolo
                marca,
                nomeModello,
                numeroTelaio: numeroTelaio || null,
                annoImmatricolazione: annoImmatricolazione ? new Date(annoImmatricolazione) : null,
                tipoAlimentazione: tipoAlimentazione || null,
                potenza: potenza || null,
                scadenzario: {
                    revisione: convertDatesToTimestamp(revisione),
                    tassaCircolazione: convertDatesToTimestamp(tassaCircolazione),
                    tagliando: convertDatesToTimestamp(tagliando),
                    gpl: convertDatesToTimestamp(gpl),
                    metano: convertDatesToTimestamp(metano),
                    assicurazione: convertDatesToTimestamp(assicurazione)
                },
                immagini: uploadedFiles
            });
            successNoty("Veicolo aggiunto con successo");
            fetchVehicles();
            onTargaSaved(upperCaseTarga);
            onClose(); // Chiudi il dialogo dopo l'aggiunta
            resetCampi();
        } catch (error) {
            console.error("Errore durante l'aggiunta del veicolo: ", error);
        }
    };
    const resetCampi = () => {
        setTarga("");
        setMarca("");
        setNomeModello("");
        setNumeroTelaio("");
        setAnnoImmatricolazione("");
        setTipoAlimentazione("");
        setPotenza("");
        setRevisione({ dataEffettuata: "", dataScadenza: "" });
        setTassaCircolazione({ dataEffettuata: "", dataScadenza: "" });
        setTagliando({ dataEffettuata: "", dataScadenza: "" });
        setGpl({ dataEffettuata: "", dataScadenza: "" });
        setMetano({ dataEffettuata: "", dataScadenza: "" });
        setAssicurazione({ dataEffettuata: "", dataScadenza: "" });
    };

    const isTargaUnique = async (targa) => {
        const q = query(collection(db, "veicoloTab"), where("targa", "==", targa));
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty; // Restituisce true se la targa è unica
    };

    const handleCalcoloScadenzaRevisione = () => {
        if (revisione.dataEffettuata) {
            const dataEffettuata = moment(revisione.dataEffettuata);
            const dataScadenza = dataEffettuata.add(2, 'years').format('YYYY-MM-DD'); // Formato della data

            setRevisione({ ...revisione, dataScadenza });
        }
    }

    const handleCalcoloScadenzaTassaDiCircolazione = () => {
        if (tassaCircolazione.dataEffettuata) {
            const dataEffettuata = moment(tassaCircolazione.dataEffettuata);
            const dataScadenza = dataEffettuata.add(1, 'years').add(1, 'months').format('YYYY-MM-DD'); // Formato della data
            setTassaCircolazione({ ...tassaCircolazione, dataScadenza });
        }
    }

    const handleCalcoloScadenzaTagliando = () => {
        if (tagliando.dataEffettuata) {
            const dataEffettuata = moment(tagliando.dataEffettuata);
            const dataScadenza = dataEffettuata.add(1, 'years').format('YYYY-MM-DD'); // Formato della data
            setTagliando({ ...tagliando, dataScadenza });
        }
    }

    const handleCalcoloScadenzaGpl = () => {
        if (gpl.dataEffettuata) {
            const dataEffettuata = moment(gpl.dataEffettuata);
            const dataScadenza = dataEffettuata.add(10, 'years').format('YYYY-MM-DD'); // Formato della data
            setGpl({ ...gpl, dataScadenza });
        }
    }

    const handleCalcoloScadenzaMetano = () => {
        if (metano.dataEffettuata) {
            const dataEffettuata = moment(metano.dataEffettuata);
            const dataScadenza = dataEffettuata.add(4, 'years').format('YYYY-MM-DD'); // Formato della data
            setMetano({ ...metano, dataScadenza });
        }
    }

    const handleCalcoloScadenzaAssicurazione = () => {
        if (assicurazione.dataEffettuata) {
            const dataEffettuata = moment(assicurazione.dataEffettuata);
            const dataScadenza = dataEffettuata.add(1, 'years').format('YYYY-MM-DD'); // Formato della data
            setAssicurazione({ ...assicurazione, dataScadenza });
        }
    }


    return (
        <Dialog open={open} onClose={onClose} maxWidth="md">
            <DialogTitle style={{ backgroundColor: "#1E1E1E" }}>Aggiungi Veicolo di {username}</DialogTitle>
            <DialogContent style={{ backgroundColor: "#1E1E1E" }}>
                <div className="container-fluid">
                    <form>
                        {/* Campi obbligatori */}
                        <div className="row">
                            <div className="col-lg-6 col-md-6 col-sm-12 mt-4">
                                <TextField
                                    color="tertiary"
                                    className="w-100"
                                    required
                                    label="Targa"
                                    variant="outlined"
                                    value={targa.toUpperCase()} // Mostra sempre in maiuscolo
                                    onChange={(e) => setTarga(e.target.value.toUpperCase())} // Converti in maiuscolo
                                />
                            </div>
                            <div className="col-lg-6 col-md-6 col-sm-12 mt-4">
                                <TextField
                                    color="tertiary"
                                    className="w-100"
                                    required
                                    label="Marca"
                                    variant="outlined"
                                    value={marca}
                                    onChange={(e) => setMarca(e.target.value.toUpperCase())}
                                />
                            </div>
                            <div className="col-lg-6 col-md-6 col-sm-12 mt-4">
                                <TextField
                                    color="tertiary"
                                    className="w-100"
                                    required
                                    label="Nome Modello"
                                    variant="outlined"
                                    value={nomeModello}
                                    onChange={(e) => setNomeModello(e.target.value.toUpperCase())}
                                />
                            </div>

                            {/* Sezione Campi Facoltativi */}
                            <div className="col-lg-12 mt-4">
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
                                    {/* Contenuto Campi Facoltativi */}
                                    <div className="row">
                                        <div className="col-lg-6 col-md-6 col-sm-12 mt-4">
                                            <TextField
                                                color="tertiary"
                                                className="w-100"
                                                label="Numero Telaio"
                                                variant="outlined"
                                                value={numeroTelaio}
                                                onChange={(e) => setNumeroTelaio(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-lg-6 col-md-6 col-sm-12 mt-4">
                                            <TextField
                                                color="tertiary"
                                                className="w-100"
                                                label="Anno di Immatricolazione"
                                                variant="outlined"
                                                type="number"
                                                value={annoImmatricolazione}
                                                onChange={(e) => setAnnoImmatricolazione(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-lg-6 col-md-6 col-sm-12 mt-4">
                                            <FormControl className="w-100">
                                                <InputLabel id="tipo-alimentazione-label">Tipo di Alimentazione</InputLabel>
                                                <Select
                                                    labelId="tipo-alimentazione-label"
                                                    value={tipoAlimentazione}
                                                    label="Tipo di Alimentazione"
                                                    onChange={(e) => setTipoAlimentazione(e.target.value)}
                                                >
                                                    <MenuItem value="benzina">Benzina</MenuItem>
                                                    <MenuItem value="diesel">Diesel</MenuItem>
                                                    <MenuItem value="elettrico">Elettrico</MenuItem>
                                                    <MenuItem value="ibrido">Ibrido</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </div>
                                        <div className="col-lg-6 col-md-6 col-sm-12 mt-4">
                                            <TextField
                                                color="tertiary"
                                                className="w-100"
                                                label="Potenza (kW)"
                                                variant="outlined"
                                                type="number"
                                                value={potenza}
                                                onChange={(e) => setPotenza(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </Collapse>
                            </div>

                            {/* Sezione Campi Facoltativi */}
                            <div className="col-lg-12 mt-4">
                                <Typography
                                    variant="h6"
                                    onClick={() => setShowImageFields(!showImageFields)}
                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                >
                                    Aggiungi Documenti
                                    {showImageFields ? 
                                        <ExpandMoreIcon style={{ marginLeft: '8px', transform: 'rotate(180deg)' }} /> : 
                                        <ExpandMoreIcon style={{ marginLeft: '8px' }} />
                                    }
                                </Typography>
                                <Collapse in={showImageFields}>
                                    {/* Contenuto Campi Facoltativi */}
                                    <div className="row">
                                        <div className="col-lg-6 col-md-6 col-sm-12 mt-4">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={(e) => setFiles(Array.from(e.target.files))}
                                            />
                                        </div>
                                     
                                     
                 
                                    </div>
                                </Collapse>
                            </div>

                            {/* Sezione Scadenzario */}
                            <div className="col-lg-12 mt-4">
                                <Typography
                                    variant="h6"
                                    onClick={() => setShowScadenzarioFields(!showScadenzarioFields)}
                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                >
                                    Scadenzario
                                    {showScadenzarioFields ? 
                                        <ExpandMoreIcon style={{ marginLeft: '8px', transform: 'rotate(180deg)' }} /> : 
                                        <ExpandMoreIcon style={{ marginLeft: '8px' }} />
                                    }
                                </Typography>
                                <Collapse in={showScadenzarioFields}>
                                    <div className="row">
                                        {/* Revisione */}
                                        <h6 style={{backgroundColor: "#224072"}} className="mt-4 py-1">Revisione</h6>
                                        <div className="col-lg-6 col-md-6 col-sm-12">
                                            <TextField
                                                label="Revisione - Data Effettuata"
                                                type="date"
                                                variant="outlined"
                                                className="w-100"
                                                InputLabelProps={{ shrink: true }}
                                                value={revisione.dataEffettuata}
                                                onChange={(e) => setRevisione({ ...revisione, dataEffettuata: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-lg-6 col-md-6 col-sm-12 d-flex align-items-center gap-2">
                                            <TextField
                                                label="Revisione - Data Scadenza"
                                                type="date"
                                                variant="outlined"
                                                className="w-100"
                                                InputLabelProps={{ shrink: true }}
                                                value={revisione.dataScadenza}
                                                onChange={(e) => setRevisione({ ...revisione, dataScadenza: e.target.value })}
                                            />
                                            <Button onClick={() => {handleCalcoloScadenzaRevisione()}} variant="contained">Calcola </Button>
                                        </div>

                                        {/* Tassa di Circolazione */}
                                        <h6 style={{backgroundColor: "#224072"}} className="mt-4 py-1">Tassa di Circolazione</h6>
                                        <div className="col-lg-6 col-md-6 col-sm-12">
                                            <TextField
                                                label="Tassa di Circolazione - Data Effettuata"
                                                type="date"
                                                variant="outlined"
                                                className="w-100"
                                                InputLabelProps={{ shrink: true }}
                                                value={tassaCircolazione.dataEffettuata}
                                                onChange={(e) => setTassaCircolazione({ ...tassaCircolazione, dataEffettuata: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-lg-6 col-md-6 col-sm-12 d-flex align-items-center gap-2">
                                            <TextField
                                                label="Tassa di Circolazione - Data Scadenza"
                                                type="date"
                                                variant="outlined"
                                                className="w-100"
                                                InputLabelProps={{ shrink: true }}
                                                value={tassaCircolazione.dataScadenza}
                                                onChange={(e) => setTassaCircolazione({ ...tassaCircolazione, dataScadenza: e.target.value })}
                                            />
                                            <Button onClick={() => {handleCalcoloScadenzaTassaDiCircolazione()}} variant="contained">Calcola </Button>
                                        </div>

                                        {/* Tagliando */}
                                        <h6 style={{backgroundColor: "#224072"}} className="mt-4 py-1">Tagliando</h6>
                                        <div className="col-lg-6 col-md-6 col-sm-12">
                                            <TextField
                                                label="Tagliando - Data Effettuata"
                                                type="date"
                                                variant="outlined"
                                                className="w-100"
                                                InputLabelProps={{ shrink: true }}
                                                value={tagliando.dataEffettuata}
                                                onChange={(e) => setTagliando({ ...tagliando, dataEffettuata: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-lg-6 col-md-6 col-sm-12 d-flex align-items-center gap-2">
                                            <TextField
                                                label="Tagliando - Data Scadenza"
                                                type="date"
                                                variant="outlined"
                                                className="w-100"
                                                InputLabelProps={{ shrink: true }}
                                                value={tagliando.dataScadenza}
                                                onChange={(e) => setTagliando({ ...tagliando, dataScadenza: e.target.value })}
                                            />
                                             <Button onClick={() => {handleCalcoloScadenzaTagliando()}} variant="contained">Calcola </Button>
                                        </div>

                                        {/* Serbatoio GPL */}
                                        <h6 style={{backgroundColor: "#224072"}} className="mt-4 py-1">Serbatoio GPL</h6>
                                        <div className="col-lg-6 col-md-6 col-sm-12">
                                            <TextField
                                                label="Serbatoio GPL - Data Effettuata"
                                                type="date"
                                                variant="outlined"
                                                className="w-100"
                                                InputLabelProps={{ shrink: true }}
                                                value={gpl.dataEffettuata}
                                                onChange={(e) => setGpl({ ...gpl, dataEffettuata: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-lg-6 col-md-6 col-sm-12 d-flex align-items-center gap-2">
                                            <TextField
                                                label="Serbatoio GPL - Data Scadenza"
                                                type="date"
                                                variant="outlined"
                                                className="w-100"
                                                InputLabelProps={{ shrink: true }}
                                                value={gpl.dataScadenza}
                                                onChange={(e) => setGpl({ ...gpl, dataScadenza: e.target.value })}
                                            />
                                              <Button onClick={() => {handleCalcoloScadenzaGpl()}} variant="contained">Calcola </Button>
                                        </div>

                                        {/* Bombola Metano */}
                                        <h6 style={{backgroundColor: "#224072"}} className="mt-4 py-1">Bombola Metano</h6>
                                        <div className="col-lg-6 col-md-6 col-sm-12 ">
                                            <TextField
                                                label="Bombola Metano - Data Effettuata"
                                                type="date"
                                                variant="outlined"
                                                className="w-100"
                                                InputLabelProps={{ shrink: true }}
                                                value={metano.dataEffettuata}
                                                onChange={(e) => setMetano({ ...metano, dataEffettuata: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-lg-6 col-md-6 col-sm-12 d-flex align-items-center gap-2">
                                            <TextField
                                                label="Bombola Metano - Data Scadenza"
                                                type="date"
                                                variant="outlined"
                                                className="w-100"
                                                InputLabelProps={{ shrink: true }}
                                                value={metano.dataScadenza}
                                                onChange={(e) => setMetano({ ...metano, dataScadenza: e.target.value })}
                                            />
                                            <Button onClick={() => {handleCalcoloScadenzaMetano()}} variant="contained">Calcola </Button>
                                        </div>

                                        {/* Assicurazione */}
                                        <h6 style={{backgroundColor: "#224072"}} className="mt-4 py-1">Assicurazione</h6>
                                        <div className="col-lg-6 col-md-6 col-sm-12">
                                            <TextField
                                                label="Assicurazione - Data Effettuata"
                                                type="date"
                                                variant="outlined"
                                                className="w-100"
                                                InputLabelProps={{ shrink: true }}
                                                value={assicurazione.dataEffettuata}
                                                onChange={(e) => setAssicurazione({ ...assicurazione, dataEffettuata: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-lg-6 col-md-6 col-sm-12 d-flex align-items-center gap-2">
                                            <TextField
                                                label="Assicurazione - Data Scadenza"
                                                type="date"
                                                variant="outlined"
                                                className="w-100"
                                                InputLabelProps={{ shrink: true }}
                                                value={assicurazione.dataScadenza}
                                                onChange={(e) => setAssicurazione({ ...assicurazione, dataScadenza: e.target.value })}
                                            />
                                            <Button onClick={() => {handleCalcoloScadenzaAssicurazione()}} variant="contained">Calcola </Button>
                                        </div>
                                    </div>
                                </Collapse>
                            </div>
                        </div>
                    </form>
                </div>
            </DialogContent>
            <DialogActions style={{ backgroundColor: "#1E1E1E" }}>
                <Button onClick={onClose} color="error" variant="contained">
                    Annulla
                </Button>
                <Button onClick={handleAddVehicle} variant="contained" color="primary">
                    Aggiungi
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddVeicolo;
