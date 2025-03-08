import { styled, ThemeProvider } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import {
  Button,
  Paper,
  Dialog,
  DialogActions,
  DialogContentText,
  DialogContent,
  DialogTitle,
  Snackbar,
} from "@mui/material";
import EditVeicolo from "../components/EditVeicolo";
import PostAddIcon from '@mui/icons-material/PostAdd';
import { useParams } from "react-router-dom";
import { db } from "../firebase-config"; // Assicurati che il percorso sia corretto
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  getDoc,
  limit,
} from "firebase/firestore"; // Aggiunto getDoc per ottenere singolo documento
import { StyledDataGrid, theme } from "../components/StyledDataGrid";
import AddVeicolo from "../components/AddVeicolo";
import { itIT } from "@mui/x-data-grid/locales";

export function DashboardCustomer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loading2, setLoading2] = useState(true);
  const [workCards, setWorkCards] = useState([]);
  const { id } = useParams(); // Questo è l'ID del cliente
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false); // Stato per la Snackbar
  const [editVehicleId, setEditVehicleId] = useState(null);
  const [selectedWorkCardIds, setSelectedWorkCardIds] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [username, setUsername] = useState("");

  // Funzione per gestire l'editing del veicolo
  const handleEdit = (vehicleId) => {
    setEditVehicleId(vehicleId);
    setEditOpen(true);
  };

  const vuoto = () => {

  }

  // Funzione per gestire la selezione delle righe
  const handleRowSelectionChange = (newSelection) => {
    setSelectedVehicleIds(newSelection);
  
    if (newSelection.length === 1) {
      const selectedVehicleId = newSelection[0]; // ID del veicolo selezionato
      const selectedVehicle = vehicles.find(vehicle => vehicle.id === selectedVehicleId); // Trova il veicolo corrispondente
  
      if (selectedVehicle) {
        setEditVehicleId(selectedVehicleId); // Setta l'ID del veicolo selezionato
        localStorage.setItem("selectTarga", selectedVehicle.targa); // Salva la targa nel localStorage
      }
    } else {
      setEditVehicleId(null); // Resetta se non è un veicolo singolo
      localStorage.removeItem("selectedVehicleTarga"); // Rimuovi la targa dal localStorage
    }
  };
  

  const handleRowSelectionChange2 = (newSelection) => {
    setSelectedWorkCardIds(newSelection);
  };

  const fetchWorkCards = async () => {
    setLoading(true); // Imposta loading a true all'inizio
    try {
      const workCardCollection = collection(db, "schedaDiLavoroTab");

      // Query come prima
      const workCardQuery = query(
        workCardCollection,
        where("idCustomer", "==", id),
        limit(100)
      );

      const workCardSnapshot = await getDocs(workCardQuery);
      const workCardList = workCardSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Ordinamento come prima
      workCardList.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.seconds - a.createdAt.seconds;
        }
        return 0;
      });

      setWorkCards(workCardList); // Imposta lo stato con le schede ordinate
    } catch (error) {
      console.error("Errore nel recupero delle schede di lavoro: ", error);
    } finally {
      setLoading(false); // Imposta loading a false alla fine
    }
  };

  // Funzione per recuperare i veicoli del cliente
  const fetchVehicles = async () => {
    setLoading2(true); // Imposta loading2 a true all'inizio
    try {
      const vehicleCollection = collection(db, "veicoloTab");
      const vehicleQuery = query(
        vehicleCollection,
        where("idCustomer", "==", id) // Filtro diretto
      );

      const vehicleSnapshot = await getDocs(vehicleQuery);
      const vehicleList = vehicleSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setVehicles(vehicleList);
    } catch (error) {
      console.error("Errore nel recupero dei veicoli: ", error);
    } finally {
      setLoading2(false); // Imposta loading2 a false alla fine
    }
  };

  const fetchCustomerUsername = async () => {
    try {
      const customerDoc = await getDoc(doc(db, "customersTab", id)); // Prendi il documento del cliente
      if (customerDoc.exists()) {
        const customerData = customerDoc.data();
        setUsername(customerData.username);
        setNome(customerData.nome);
        setCognome(customerData.cognome);
      } else {
        console.log("Nessun documento trovato per il cliente con ID:", id);
      }
    } catch (error) {
      console.error("Errore nel recupero dello username:", error);
    }
  };

  // Effetto per recuperare i veicoli e lo username quando il componente viene montato
  useEffect(() => {
    fetchVehicles();
    fetchWorkCards();
    fetchCustomerUsername();
  }, [id]);

  // Funzione per eliminare i veicoli selezionati
  const handleDelete = async () => {
    const deletePromises = selectedVehicleIds.map((id) =>
      deleteDoc(doc(db, "veicoloTab", id))
    );

    try {
      await Promise.all(deletePromises);
      setVehicles(
        vehicles.filter((vehicle) => !selectedVehicleIds.includes(vehicle.id))
      );
      setConfirmOpen(false);
      setSelectedVehicleIds([]);
      setSnackbarOpen(true); // Mostra la Snackbar dopo l'eliminazione
    } catch (error) {
      console.error("Errore durante l'eliminazione dei veicoli: ", error);
    }
  };

  // Funzione per confermare l'eliminazione
  const handleConfirmDelete = () => {
    setConfirmOpen(true);
  };

  // Funzione per chiudere la Snackbar
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "targa", headerName: "Targa", width: 130 },
    { field: "marca", headerName: "Marca", width: 130 },
    { field: "nomeModello", headerName: "Nome Modello", width: 130 },
  ];

  const handleRowClick = (id) => {
    navigate(`/aggiungischeda1/${id}`);
  };

  const columSchede = [
    {
      field: "id",
      headerName: "ID",
      width: 70,
      renderCell: (params) => (
        <span
          className="p-1 rounded-4"
          style={{ cursor: "pointer", backgroundColor: "#224072" }}
          onClick={() => handleRowClick(params.row.id)}
        >
          {params.row.id}
        </span>
      ),
    },
    { field: "targa", headerName: "Targa", width: 130 },
    { field: "veicolo", headerName: "Veicolo", width: 130 },
    { field: "totale", headerName: "Totale", width: 130 },
    { field: "pagato", headerName: "Pagato", width: 130 },
    { field: "resto", headerName: "Resto", width: 130 },
    {
      field: "dataCreazione",
      headerName: "Data",
      width: 130,
      renderCell: (params) => {
        // Se il valore è un oggetto timestamp di Firebase, converti in Date prima di formattare
        const date = params.value ? moment(params.value.toDate()) : null;
        return date && date.isValid() ? date.format("DD/MM/YYYY") : "N/A"; // Formatta in 'dd/mm/yyyy' o mostra 'N/A'
      },
    },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <div className="container-fluid">
          <h2>
            Dashboard Cliente di {nome} {cognome}
          </h2>{" "}
          {/* Visualizza lo username */}
          <div className="mt-2">
            <div className="d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Veicoli</h5>
              <div>
                <Button
                  className="me-2"
                  variant="contained"
                  onClick={() => setOpenAddDialog(true)}
                >
                  Aggiungi Veicolo
                </Button>
                <Button
                  className="me-2"
                  variant="contained"
                  onClick={() => handleEdit(selectedVehicleIds[0])}
                  disabled={selectedVehicleIds.length !== 1}
                >
                  Modifica
                </Button>
                <Button
                  color="error"
                  variant="contained"
                  onClick={handleConfirmDelete}
                  disabled={selectedVehicleIds.length === 0}
                >
                  Elimina{" "}
                  {selectedVehicleIds.length > 0 &&
                    `(${selectedVehicleIds.length})`}
                </Button>
              </div>
            </div>
            <ThemeProvider theme={theme}>
              <Paper
                className="mt-4"
                sx={{ height: "30vh", borderRadius: "8px", overflowX: "auto" }}
              >
                {loading2 ? ( 
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                      }}
                    >
                      <CircularProgress />
                    </div>
                  ) :(
                <StyledDataGrid
                  rows={vehicles}
                  columns={columns}
                  checkboxSelection
                  onRowSelectionModelChange={handleRowSelectionChange}
                  localeText={
                    itIT.components.MuiDataGrid.defaultProps.localeText
                  }
                /> )}
              </Paper>
            </ThemeProvider>

            <div className="mt-5">
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="mb-0">Schede di Lavoro</h5>
                <Button
                  color="primary"
                  variant="contained"
                  disabled={selectedVehicleIds.length !== 1}
                  onClick={() => {navigate("/aggiungischeda")}}
                >
                  Aggiungi una Scheda
                </Button>

              </div>
              
              <ThemeProvider theme={theme}>
                <Paper
                  className="mt-4"
                  sx={{ height: "32vh", borderRadius: "8px", overflowX: "auto" }}
                >
                  {loading ? ( 
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                      }}
                    >
                      <CircularProgress />
                    </div>
                  ) : (
                    <StyledDataGrid
                      rows={workCards}
                      columns={columSchede}
                      checkboxSelection
                      disableRowSelectionOnClick
                      onRowSelectionModelChange={handleRowSelectionChange2}
                      localeText={
                        itIT.components.MuiDataGrid.defaultProps.localeText
                      }
                    />
                  )}
                </Paper>
              </ThemeProvider>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Dialog per aggiungere il veicolo */}
      <AddVeicolo
        username={username}
        open={openAddDialog}
        onTargaSaved={vuoto}
        onClose={() => setOpenAddDialog(false)}
        idCustomer={id}
        fetchVehicles={fetchVehicles}
      />

      {/* Dialog di conferma eliminazione */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle style={{ backgroundColor: "#1E1E1E" }}>
          Conferma Eliminazione
        </DialogTitle>
        <DialogContent style={{ backgroundColor: "#1E1E1E" }}>
          <DialogContentText>
            Sei sicuro di voler eliminare {selectedVehicleIds.length} veicolo
            {(i) => (selectedVehicleIds.length > 1 ? "i" : "")} selezionato
            {(i) => (selectedVehicleIds.length > 1 ? "i" : "")}?
          </DialogContentText>
        </DialogContent>
        <DialogActions style={{ backgroundColor: "#1E1E1E" }}>
          <Button onClick={() => setConfirmOpen(false)} color="primary">
            Annulla
          </Button>
          <Button onClick={handleDelete} color="error">
            Elimina
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar per conferma eliminazione */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        message="Veicolo rimosso!"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />

      {/* Dialog per modificare il veicolo */}
      <EditVeicolo
        open={editOpen}
        onClose={() => setEditOpen(false)}
        vehicleId={editVehicleId}
        fetchVehicles={fetchVehicles}
      />
    </>
  );
}
