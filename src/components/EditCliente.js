import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { FormControl, InputLabel, MenuItem, Select, Collapse, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"; // Importa l'icona
import { db } from "../firebase-config";
import { doc, updateDoc, getDoc, query, collection, where, getDocs, Timestamp } from "firebase/firestore";
import moment from "moment";
import { notifyErrorAddCliente, successUpdateCliente, notifyErrorAddUsername } from "./Notify";

export function EditCliente({ customerId, onClose, fetchCustomers }) {
  const [gender, setGender] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [dataNascita, setDataNascita] = useState("");
  const [cittaNascita, setCittaNascita] = useState("");
  const [provinciaNascita, setProvinciaNascita] = useState("");
  const [codiceFiscale, setCodiceFiscale] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [showOptionalFields, setShowOptionalFields] = useState(false); // Stato per i campi facoltativi

  useEffect(() => {
    const fetchCustomer = async () => {
      const customerDoc = await getDoc(doc(db, "customersTab", customerId));
      if (customerDoc.exists()) {
        const customerData = customerDoc.data();
        setUsername(customerData.username);
        setPassword(customerData.password);
        setNome(customerData.nome);
        setCognome(customerData.cognome);
        setGender(customerData.gender);
        setDataNascita(
          moment(customerData.dataNascita, "DD-MM-YYYY").format("YYYY-MM-DD")
        );
        setCittaNascita(customerData.cittaNascita);
        setProvinciaNascita(customerData.provinciaNascita);
        setCodiceFiscale(customerData.codiceFiscale);
        setTelefono(customerData.telefono);
        setEmail(customerData.email);
      }
    };

    fetchCustomer();
  }, [customerId]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const usernameExists = await checkUsernameExists(username);

    if (telefono.length <= 9) {
      notifyErrorAddCliente("Inserisci correttamente il numero di telefono");
      return;
    }

    try {
      await updateDoc(doc(db, "customersTab", customerId), {
        password,
        nome,
        cognome,
        gender,
        dataNascita: moment(dataNascita).format("DD-MM-YYYY"),
        cittaNascita,
        provinciaNascita,
        codiceFiscale,
        telefono,
        email,
        dataCreazione: Timestamp.fromDate(new Date()),
      });
      successUpdateCliente();
      fetchCustomers();
      onClose();
    } catch (error) {
      console.error("Errore nell'aggiornamento del cliente: ", error);
    }
  };

  const checkUsernameExists = async (username) => {
    const q = query(collection(db, 'customersTab'), where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      <div className="container-fluid">
        <h2>Modifica Cliente</h2>

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="mt-4 col-lg-4 col-md-6 col-sm-12">
              <TextField
                className="w-100"
                required
                label="Username"
                variant="outlined"
                value={username}
                disabled
              />
            </div>
            <div className="d-flex mt-4 col-lg-4 col-md-6 col-sm-12">
              <TextField
                className="w-100"
                required
                label="Password"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="mt-4 col-lg-4 col-md-6 col-sm-12">
              <TextField
                className="w-100"
                required
                label="Numero di Telefono"
                variant="outlined"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
            <div className="mt-4 col-lg-4 col-md-6 col-sm-12">
              <TextField
                className="w-100"
                required
                label="Nome"
                variant="outlined"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div className="mt-4 col-lg-4 col-md-6 col-sm-12">
              <TextField
                className="w-100"
                required
                label="Cognome"
                variant="outlined"
                value={cognome}
                onChange={(e) => setCognome(e.target.value)}
              />
            </div>

            {/* Sezione Campi Facoltativi */}
            <div className="mt-4 col-lg-12">
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
                  <div className="mt-4 col-lg-4 col-md-6 col-sm-12">
                    <FormControl fullWidth>
                      <InputLabel id="gender-select-label">Genere</InputLabel>
                      <Select
                        labelId="gender-select-label"
                        id="gender-select"
                        value={gender}
                        label="Genere"
                        onChange={(e) => setGender(e.target.value)}
                      >
                        <MenuItem value="maschio">Maschio</MenuItem>
                        <MenuItem value="femmina">Femmina</MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                  <div className="mt-4 col-lg-4 col-md-6 col-sm-12">
                    <TextField
                      className="w-100"
                      type="date"
                      label="Data di nascita"
                      variant="outlined"
                      value={dataNascita}
                      onChange={(e) => setDataNascita(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </div>
                  <div className="mt-4 col-lg-4 col-md-6 col-sm-12">
                    <TextField
                      className="w-100"
                      label="Città di nascita"
                      variant="outlined"
                      value={cittaNascita}
                      onChange={(e) => setCittaNascita(e.target.value)}
                    />
                  </div>
                  <div className="mt-4 col-lg-4 col-md-6 col-sm-12">
                    <TextField
                      className="w-100"
                      label="Provincia di nascita"
                      variant="outlined"
                      value={provinciaNascita}
                      onChange={(e) => setProvinciaNascita(e.target.value)}
                    />
                  </div>
                  <div className="mt-4 col-lg-4 col-md-6 col-sm-12">
                    <TextField
                      className="w-100"
                      label="Codice Fiscale"
                      variant="outlined"
                      value={codiceFiscale}
                      onChange={(e) => setCodiceFiscale(e.target.value)}
                    />
                  </div>
                  <div className="mt-4 col-lg-4 col-md-6 col-sm-12">
                    <TextField
                      className="w-100"
                      label="Email"
                      variant="outlined"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </Collapse>
            </div>
          </div>
          <Button className="mt-4" type="submit" variant="contained">
            Aggiorna Cliente
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
