import {
  TextField,
  Button,
  Typography,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase-config"; // Assicurati che il percorso sia corretto
import AddVeicolo from "./AddVeicolo";

const TargaInput = ({
  targa,
  setTarga,
  handleTargaChange,
  handleCercaVeicolo,
  loading,
  veicoloTrovato,
  messaggio,
  recentTarghe,
  onCreaScheda,
}) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState(""); // Stato per l'username
  const [idCustomer, setIdCustomer] = useState(""); // Stato per l'ID del cliente
  const [loadingUser, setLoadingUser] = useState(false); // Stato per il caricamento dell'utente
  const [userFound, setUserFound] = useState(false); // Stato per sapere se l'utente è stato trovato
  const [userMessage, setUserMessage] = useState(""); // Messaggio di stato per l'utente
  const [clienti, setClienti] = useState([]); // Stato per la lista dei clienti
  const [booVeic, setBooVeic] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [showButtonVeic, setShowButtonVeic] = useState(false);
  const [loading2, setLoading2] = useState(true);

  const vuota = () => {};

  const handleTargaSaved = (newTarga) => {
    setTarga(newTarga); // Imposta la nuova targa quando un veicolo è aggiunto
  };

  // Funzione per caricare i clienti dal database
  const fetchClienti = async () => {
    setLoading2(true); // Inizia il caricamento
    try {
      const customerCollection = collection(db, "customersTab");
      const customerSnapshot = await getDocs(customerCollection);
      const customerList = customerSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setClienti(customerList);
    } catch (error) {
      console.error("Errore nel recupero dei clienti: ", error);
    } finally {
      setLoading2(false); // Termina il caricamento
    }
  };

  useEffect(() => {
    if (booVeic) {
      //fa la fetch solamente see, preme il pulsante e quindi diventa vero
      fetchClienti();
    }
  }, [booVeic]);

  const handleCercaUtente = (event, value) => {
    if (value) {
      setIdCustomer(value.id); // Salva l'ID del cliente nello stato
      setUserFound(true);
      setShowButtonVeic(true);
      setUsername(value.username);
    } else {
      setUserFound(false);
      setIdCustomer("");
      setShowButtonVeic(false);
      setUsername("");
    }
  };

  return (
    <>
      <div className="mt-4 d-flex">
      <Autocomplete
        options={recentTarghe}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Targa"
            variant="outlined"
            onChange={(e) => handleTargaChange(e.target.value.toUpperCase())} // Converti a Uppercase
            style={{ marginRight: "10px", width: "200px" }}
          />
        )}
        value={targa}
        onInputChange={(event, newInputValue) => {
          handleTargaChange(newInputValue.toUpperCase()); // Converti a Uppercase
        }}
        freeSolo
      />
        <Button
          className="me-2"
          variant="contained"
          color="primary"
          onClick={handleCercaVeicolo}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Cerca Targa"}
        </Button>
        {veicoloTrovato && (
          <Button
            variant="contained"
            color="success"
            style={{ backgroundColor: "#07BC0C" }}
            onClick={onCreaScheda} // Aggiungi onClick per chiamare onCreaScheda
          >
            Crea Scheda
          </Button>
        )}
      </div>

      {/* Sezione di ricerca dell'utente */}

      {/* Messaggio per l'utente trovato o meno */}
      {userMessage && (
        <Typography
          style={{ marginTop: "10px", color: userFound ? "#07BC0C" : "error" }}
        >
          {userMessage}
        </Typography>
      )}

      <div>
        {veicoloTrovato && (
          <Typography style={{ marginTop: "10px", color: "#07BC0C" }}>
            {messaggio}
          </Typography>
        )}
        {!veicoloTrovato && (
          <>
            <Typography color="error" style={{ marginTop: "10px" }}>
              {messaggio}
            </Typography>

            <div className="mt-5 d-flex align-items-center">
              <Button
                className="me-4"
                variant="contained"
                color="primary"
                onClick={() => {
                  navigate("/addcustomer");
                }}
              >
                Aggiungi Nuovo Cliente
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setBooVeic(true);
                }}
              >
                Aggiungi Veicolo Cliente già Esistente
              </Button>
            </div>

            {booVeic && (
              <>
                {loading2 ? (
                  <div className="mt-4">
                    <CircularProgress size={24} color="inherit" />
                  </div>
                ) : (
                  <>
                    <div className="mt-4 d-flex">
                      <Autocomplete
                        options={clienti}
                        getOptionLabel={(option) => option.username || ""} // Utilizza il campo username
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Seleziona Cliente"
                            variant="outlined"
                            style={{ marginRight: "10px", width: "200px" }}
                          />
                        )}
                        onChange={handleCercaUtente} // Gestisce la selezione del cliente
                        freeSolo
                      />
                      {showButtonVeic && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => {
                            setOpenAddDialog(true);
                          }}
                        >
                          Crea Veicolo
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      <AddVeicolo
        username={username}
        open={openAddDialog}
        onClose={() => {
          setOpenAddDialog(false);
          setBooVeic(false);
          setShowButtonVeic(false);
        }}
        onTargaSaved={handleTargaSaved}
        idCustomer={idCustomer}
        fetchVehicles={vuota}
      />
    </>
  );
};

export default TargaInput;
