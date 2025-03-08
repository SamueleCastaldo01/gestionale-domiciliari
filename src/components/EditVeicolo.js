import { useState, useEffect } from "react";
import moment from 'moment';
import 'moment/locale/it'; 
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField, MenuItem, Select, FormControl, InputLabel, Button, Collapse, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"; // Importa l'icona
import { db } from "../firebase-config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { successNoty, errorNoty } from "../components/Notify";

const EditVeicolo = ({ open, onClose, vehicleId, fetchVehicles }) => {
    const [targa, setTarga] = useState("");
    const [marca, setMarca] = useState("");
    const [nomeModello, setNomeModello] = useState("");
    const [numeroTelaio, setNumeroTelaio] = useState("");
    const [annoImmatricolazione, setAnnoImmatricolazione] = useState("");
    const [tipoAlimentazione, setTipoAlimentazione] = useState("");
    const [potenza, setPotenza] = useState("");
    const [showOptionalFields, setShowOptionalFields] = useState(false); // Stato per i campi facoltativi
    const [showScadenzarioFields, setShowScadenzarioFields] = useState(false); // Stato per i campi scadenzario

    // Stati per lo scadenzario
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
            conferma: dates.conferma || false,
        };
    };

    //come calcoare----------------------------------------------------------
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

    const handleScadenzarioChange = (section, field, value) => {
        switch (section) {
            case 'revisione':
                setRevisione((prev) => ({
                    ...prev,
                    [field]: value,
                    conferma: field === 'dataScadenza' ? false : prev.conferma, // Resetta `conferma` solo se si modifica `dataScadenza`
                }));
                break;
            case 'tassaCircolazione':
                setTassaCircolazione((prev) => ({
                    ...prev,
                    [field]: value,
                }));
                break;
            case 'tagliando':
                setTagliando((prev) => ({
                    ...prev,
                    [field]: value,
                    conferma: field === 'dataScadenza' ? false : prev.conferma,
                }));
                break;
            case 'gpl':
                setGpl((prev) => ({
                    ...prev,
                    [field]: value,
                }));
                break;
            case 'metano':
                setMetano((prev) => ({
                    ...prev,
                    [field]: value,
                }));
                break;
            case 'assicurazione':
                setAssicurazione((prev) => ({
                    ...prev,
                    [field]: value,
                }));
                break;
            default:
                console.error('Sezione non valida:', section);
        }
    };
    

    //-------------------------------------------------------------------------------
    useEffect(() => {
        const fetchVehicleData = async () => {
            const vehicleDoc = await getDoc(doc(db, "veicoloTab", vehicleId));
            if (vehicleDoc.exists()) {
                const vehicleData = vehicleDoc.data();
                setTarga(vehicleData.targa);
                setMarca(vehicleData.marca);
                setNomeModello(vehicleData.nomeModello);
                setNumeroTelaio(vehicleData.numeroTelaio || "");
                setAnnoImmatricolazione(vehicleData.annoImmatricolazione || "");
                setTipoAlimentazione(vehicleData.tipoAlimentazione || "");
                setPotenza(vehicleData.potenza || "");

                // Popolare gli stati dello scadenzario se i dati esistono
                setRevisione({
                    dataEffettuata: vehicleData.scadenzario?.revisione?.dataEffettuata
                        ? moment(vehicleData.scadenzario.revisione.dataEffettuata.toDate()).format("YYYY-MM-DD")
                        : "",
                    dataScadenza: vehicleData.scadenzario?.revisione?.dataScadenza
                        ? moment(vehicleData.scadenzario.revisione.dataScadenza.toDate()).format("YYYY-MM-DD")
                        : "",
                    conferma: vehicleData.scadenzario?.revisione?.conferma,
                });
                setTassaCircolazione({
                    dataEffettuata: vehicleData.scadenzario?.tassaCircolazione?.dataEffettuata
                        ? moment(vehicleData.scadenzario.tassaCircolazione.dataEffettuata.toDate()).format("YYYY-MM-DD")
                        : "",
                    dataScadenza: vehicleData.scadenzario?.tassaCircolazione?.dataScadenza
                        ? moment(vehicleData.scadenzario.tassaCircolazione.dataScadenza.toDate()).format("YYYY-MM-DD")
                        : "",
                });
                setTagliando({
                    dataEffettuata: vehicleData.scadenzario?.tagliando?.dataEffettuata
                        ? moment(vehicleData.scadenzario.tagliando.dataEffettuata.toDate()).format("YYYY-MM-DD")
                        : "",
                    dataScadenza: vehicleData.scadenzario?.tagliando?.dataScadenza
                        ? moment(vehicleData.scadenzario.tagliando.dataScadenza.toDate()).format("YYYY-MM-DD")
                        : "",
                    conferma: vehicleData.scadenzario?.revisione?.conferma,
                });
                setGpl({
                    dataEffettuata: vehicleData.scadenzario?.gpl?.dataEffettuata
                        ? moment(vehicleData.scadenzario.gpl.dataEffettuata.toDate()).format("YYYY-MM-DD")
                        : "",
                    dataScadenza: vehicleData.scadenzario?.gpl?.dataScadenza
                        ? moment(vehicleData.scadenzario.gpl.dataScadenza.toDate()).format("YYYY-MM-DD")
                        : "",
                });
                setMetano({
                    dataEffettuata: vehicleData.scadenzario?.metano?.dataEffettuata
                        ? moment(vehicleData.scadenzario.metano.dataEffettuata.toDate()).format("YYYY-MM-DD")
                        : "",
                    dataScadenza: vehicleData.scadenzario?.metano?.dataScadenza
                        ? moment(vehicleData.scadenzario.metano.dataScadenza.toDate()).format("YYYY-MM-DD")
                        : "",
                });
                setAssicurazione({
                    dataEffettuata: vehicleData.scadenzario?.assicurazione?.dataEffettuata
                        ? moment(vehicleData.scadenzario.assicurazione.dataEffettuata.toDate()).format("YYYY-MM-DD")
                        : "",
                    dataScadenza: vehicleData.scadenzario?.assicurazione?.dataScadenza
                        ? moment(vehicleData.scadenzario.assicurazione.dataScadenza.toDate()).format("YYYY-MM-DD")
                        : "",
                });
                console.log(revisione)
                console.log(tagliando)
            }
        };

        if (open) {
            fetchVehicleData();
        }
    }, [open, vehicleId]);


    const handleEditVehicle = async () => {
        if (!marca || !nomeModello) {
            errorNoty("Compila i campi obbligatori");
            return;
        }

        try {
            await updateDoc(doc(db, "veicoloTab", vehicleId), {
                marca,
                nomeModello,
                numeroTelaio: numeroTelaio || null,
                annoImmatricolazione: annoImmatricolazione || null,
                tipoAlimentazione: tipoAlimentazione || null,
                potenza: potenza || null,
                scadenzario: {
                    revisione: convertDatesToTimestamp(revisione),
                    tassaCircolazione : convertDatesToTimestamp(tassaCircolazione),
                    tagliando: convertDatesToTimestamp(tagliando),
                    gpl: convertDatesToTimestamp(gpl),
                    metano: convertDatesToTimestamp(metano),
                    assicurazione: convertDatesToTimestamp(assicurazione),
                },
            });
            successNoty("Veicolo modificato con successo");
            onClose(); // Chiudi il dialogo dopo la modifica
            fetchVehicles(); // Aggiorna la lista dei veicoli
        } catch (error) {
            console.error("Errore durante la modifica del veicolo: ", error);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md">
            <DialogTitle style={{ backgroundColor: "#1E1E1E" }}>Modifica Veicolo</DialogTitle>
            <DialogContent style={{ backgroundColor: "#1E1E1E" }}>
                <div className="container-fluid">
                    <form>
                        <div className="row">
                            <div className="col-lg-6 col-md-6 col-sm-12 mt-4">
                                <TextField
                                    color="tertiary"
                                    className="w-100"
                                    required
                                    label="Targa"
                                    variant="outlined"
                                    value={targa}
                                    InputProps={{ readOnly: true }} // Targa non modificabile
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
                                        <h6 style={{backgroundColor: "#224072"}} className="mt-4 py-1">Revisione</h6>
                                        <div className="col-lg-6 col-md-6 col-sm-12">
                                            <TextField
                                                color="tertiary"
                                                className="w-100"
                                                label="Revisione - Data Effettuata"
                                                variant="outlined"
                                                type="date"
                                                InputLabelProps={{ shrink: true }}
                                                value={revisione.dataEffettuata}
                                                onChange={(e) => handleScadenzarioChange('revisione', 'dataEffettuata', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-lg-6 col-md-6 col-sm-12 d-flex align-items-center gap-2">
                                            <TextField
                                                color="tertiary"
                                                className="w-100"
                                                label="Revisione - Data Scadenza"
                                                variant="outlined"
                                                type="date"
                                                InputLabelProps={{ shrink: true }}
                                                value={revisione.dataScadenza}
                                                onChange={(e) => handleScadenzarioChange('revisione', 'dataScadenza', e.target.value)}
                                            />
                                            <Button onClick={() => {handleCalcoloScadenzaRevisione()}} variant="contained">Calcola </Button>
                                        </div>
                                        <h6 style={{backgroundColor: "#224072"}} className="mt-4 py-1">Tassa Circolazione</h6>
                                        <div className="col-lg-6 col-md-6 col-sm-12">
                                            <TextField
                                                color="tertiary"
                                                className="w-100"
                                                label="Tassa Circolazione - Data Effettuata"
                                                variant="outlined"
                                                type="date"
                                                InputLabelProps={{ shrink: true }}
                                                value={tassaCircolazione.dataEffettuata}
                                                onChange={(e) => handleScadenzarioChange('tassaCircolazione', 'dataEffettuata', e.target.value)}
                                            />
                                         </div>
                                         <div className="col-lg-6 col-md-6 col-sm-12 d-flex align-items-center gap-2">
                                            <TextField
                                                color="tertiary"
                                                className="w-100"
                                                label="Tassa Circolazione - Data Scadenza"
                                                variant="outlined"
                                                type="date"
                                                InputLabelProps={{ shrink: true }}
                                                value={tassaCircolazione.dataScadenza}
                                                onChange={(e) => handleScadenzarioChange('tassaCircolazione', 'dataScadenza', e.target.value)}
                                            />
                                              <Button onClick={() => {handleCalcoloScadenzaTassaDiCircolazione()}} variant="contained">Calcola </Button>
                                       </div>
                                       <h6 style={{backgroundColor: "#224072"}} className="mt-4 py-1">Tagliando</h6>
                                        <div className="col-lg-6 col-md-6 col-sm-12">
                                            <TextField
                                                color="tertiary"
                                                className="w-100"
                                                label="Tagliando - Data Effettuata"
                                                variant="outlined"
                                                type="date"
                                                InputLabelProps={{ shrink: true }}
                                                value={tagliando.dataEffettuata}
                                                onChange={(e) => handleScadenzarioChange('tagliando', 'dataEffettuata', e.target.value)}
                                            />
                                         </div>
                                         <div className="col-lg-6 col-md-6 col-sm-12 d-flex align-items-center gap-2">
                                            <TextField
                                                color="tertiary"
                                                className="w-100"
                                                label="Tagliando - Data Scadenza"
                                                variant="outlined"
                                                type="date"
                                                InputLabelProps={{ shrink: true }}
                                                value={tagliando.dataScadenza}
                                                onChange={(e) => handleScadenzarioChange('tagliando', 'dataScadenza', e.target.value)}
                                            />
                                              <Button onClick={() => {handleCalcoloScadenzaTagliando()}} variant="contained">Calcola </Button>
                                            </div>
                                        <h6 style={{backgroundColor: "#224072"}} className="mt-4 py-1">Serbatoio Gpl</h6>
                                        <div className="col-lg-6 col-md-6 col-sm-12">
                                            <TextField
                                                color="tertiary"
                                                className="w-100"
                                                label="Serbatoio Gpl - Data Effettuata"
                                                variant="outlined"
                                                type="date"
                                                InputLabelProps={{ shrink: true }}
                                                value={gpl.dataEffettuata}
                                                onChange={(e) => handleScadenzarioChange('gpl', 'dataEffettuata', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-lg-6 col-md-6 col-sm-12 d-flex align-items-center gap-2">
                                            <TextField
                                                color="tertiary"
                                                className="w-100"
                                                label="Serbatoio Gpl - Data Scadenza"
                                                variant="outlined"
                                                type="date"
                                                InputLabelProps={{ shrink: true }}
                                                value={gpl.dataScadenza}
                                                onChange={(e) => handleScadenzarioChange('gpl', 'dataScadenza', e.target.value)}
                                            />
                                            <Button onClick={() => {handleCalcoloScadenzaGpl()}} variant="contained">Calcola </Button>
                                        </div>
                                        <h6 style={{backgroundColor: "#224072"}} className="mt-4 py-1">Bombola Metano</h6>
                                        <div className="col-lg-6 col-md-6 col-sm-12">
                                            <TextField
                                                color="tertiary"
                                                className="w-100"
                                                label="Bombola Metano - Data Effettuata"
                                                variant="outlined"
                                                type="date"
                                                InputLabelProps={{ shrink: true }}
                                                value={metano.dataEffettuata}
                                                onChange={(e) => handleScadenzarioChange('metano', 'dataEffettuata', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-lg-6 col-md-6 col-sm-12 d-flex align-items-center gap-2">
                                            <TextField
                                                color="tertiary"
                                                className="w-100"
                                                label="Bombola Metano - Data Scadenza"
                                                variant="outlined"
                                                type="date"
                                                InputLabelProps={{ shrink: true }}
                                                value={metano.dataScadenza}
                                                onChange={(e) => handleScadenzarioChange('metano', 'dataScadenza', e.target.value)}
                                            />
                                            <Button onClick={() => {handleCalcoloScadenzaMetano()}} variant="contained">Calcola </Button>
                                         </div>
                                         <h6 style={{backgroundColor: "#224072"}} className="mt-4 py-1">Assicurazione</h6>
                                        <div className="col-lg-6 col-md-6 col-sm-12">
                                            <TextField
                                                color="tertiary"
                                                className="w-100"
                                                label="Assicurazione - Data Effettuata"
                                                variant="outlined"
                                                type="date"
                                                InputLabelProps={{ shrink: true }}
                                                value={assicurazione.dataEffettuata}
                                                onChange={(e) => handleScadenzarioChange('assicurazione', 'dataEffettuata', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-lg-6 col-md-6 col-sm-12 d-flex align-items-center gap-2">
                                            <TextField
                                                color="tertiary"
                                                className="w-100"
                                                label="Assicurazione - Data Scadenza"
                                                variant="outlined"
                                                type="date"
                                                InputLabelProps={{ shrink: true }}
                                                value={assicurazione.dataScadenza}
                                                onChange={(e) => handleScadenzarioChange('assicurazione', 'dataScadenza', e.target.value)}
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
                <Button onClick={onClose} variant="contained" color="error">
                    Annulla
                </Button>
                <Button onClick={handleEditVehicle} variant="contained" color="primary">
                    Modifica
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditVeicolo;
