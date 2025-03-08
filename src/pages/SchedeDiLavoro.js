import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  limit,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase-config"; 
import {
  Paper,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  IconButton,
  TextField,
  CircularProgress, // Importa CircularProgress
} from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import { StyledDataGrid, theme } from "../components/StyledDataGrid";
import { ThemeProvider } from "@mui/material/styles";
import { itIT } from "@mui/x-data-grid/locales";

export function SchedeDiLavoro() {
  const navigate = useNavigate();
  const [workCards, setWorkCards] = useState([]);
  const [selectedWorkCardIds, setSelectedWorkCardIds] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [loading, setLoading] = useState(false); // Stato per il caricamento

  const fetchWorkCards = async (search = "") => {
    setLoading(true); // Inizia il caricamento
    try {
      const workCardCollection = collection(db, "schedaDiLavoroTab");
      let workCardQuery;

      if (search) {
        const uppercaseSearch = search.toUpperCase();
        workCardQuery = query(
          workCardCollection,
          where("targa", "==", uppercaseSearch)
        );
      } else {
        workCardQuery = query(workCardCollection, orderBy("dataCreazione", "desc"), limit(100));
      }

      const workCardSnapshot = await getDocs(workCardQuery);
      const workCardList = workCardSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      workCardList.sort((a, b) => {
        const dateA = a.dataCreazione ? a.dataCreazione.toDate() : null;
        const dateB = b.dataCreazione ? b.dataCreazione.toDate() : null;
        return dateB - dateA; 
      });

      setWorkCards(workCardList);
    } catch (error) {
      console.error("Errore nel recupero delle schede di lavoro: ", error);
    } finally {
      setLoading(false); // Ferma il caricamento
    }
  };

  useEffect(() => {
    fetchWorkCards(); // Fetch iniziale senza ricerca
  }, []);

  const handleRowSelectionChange = (newSelection) => {
    setSelectedWorkCardIds(newSelection);
  };

  const handleDelete = async () => {
    const deletePromises = selectedWorkCardIds.map((id) =>
      deleteDoc(doc(db, "schedaDiLavoroTab", id))
    );

    try {
      await Promise.all(deletePromises);
      setWorkCards(
        workCards.filter(
          (workCard) => !selectedWorkCardIds.includes(workCard.id)
        )
      );
      setConfirmOpen(false);
      setSelectedWorkCardIds([]);
      setSnackbarOpen(true); 
    } catch (error) {
      console.error(
        "Errore durante l'eliminazione delle schede di lavoro: ",
        error
      );
    }
  };

  const handleConfirmDelete = () => {
    setConfirmOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleRowClick = (id) => {
    navigate(`/aggiungischeda1/${id}`);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value.toUpperCase());
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchWorkCards(searchTerm); 
  };

  const columns = [
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
    {
      field: "cliente",
      headerName: "Cliente",
      width: 130,
      renderCell: (params) => (
        <span
          className="p-1 rounded-4"
          style={{ cursor: "pointer", textDecoration: "underline" }}
          onClick={() => {
            navigate("/dashboardcustomer/" + params.row.idCustomer);
          }}
        >
          {params.row.username}
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
        const date = params.value ? moment(params.value.toDate()) : null;
        return date && date.isValid() ? date.format("DD/MM/YYYY") : "N/A";
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
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0 titlePage">Schede di Lavoro</h2>
          </div>

          <div className="d-flex align-items-center justify-content-between mt-4">
            <form
              className="d-flex align-items-center"
              onSubmit={handleSearch}
            >
              <TextField
                label="Cerca per Targa"
                variant="outlined"
                value={searchTerm}
                onChange={handleSearchChange}
                className="me-2"
              />
              <Button
                className="me-2"
                type="submit"
                color="primary"
                variant="contained"
              >
                Cerca
              </Button>
            </form>
            <div className="d-flex align-items-center">
              <IconButton variant="contained" onClick={() => {fetchWorkCards()}}>
                <RefreshIcon/>
              </IconButton>
              <Button
                className="me-2"
                color="primary"
                variant="contained"
                onClick={() => {
                  navigate("/aggiungischeda");
                }}
              >
                Aggiungi Schede
              </Button>
              <Button
                color="error"
                variant="contained"
                onClick={handleConfirmDelete}
                disabled={selectedWorkCardIds.length === 0}
              >
                Elimina{" "}
                {selectedWorkCardIds.length > 0 &&
                  `(${selectedWorkCardIds.length})`}
              </Button>
            </div>
          </div>

          <ThemeProvider theme={theme}>
            <Paper
              className="mt-4"
              sx={{ height: "50vh", borderRadius: "8px", overflowX: "auto" }}
            >
              {loading ? ( // Mostra il caricamento se loading è true
                <div className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
                  <CircularProgress />
                </div>
              ) : (
                <StyledDataGrid
                  rows={workCards}
                  columns={columns}
                  checkboxSelection
                  disableRowSelectionOnClick
                  onRowSelectionModelChange={handleRowSelectionChange}
                  localeText={itIT.components.MuiDataGrid.defaultProps.localeText}
                />
              )}
            </Paper>
          </ThemeProvider>
        </div>
      </motion.div>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle style={{ backgroundColor: "#1E1E1E" }}>
          Conferma Eliminazione
        </DialogTitle>
        <DialogContent style={{ backgroundColor: "#1E1E1E" }}>
          <DialogContentText>
            Sei sicuro di voler eliminare {selectedWorkCardIds.length} scheda
            {selectedWorkCardIds.length > 1 ? "e" : ""} selezionata
            {selectedWorkCardIds.length > 1 ? "e" : ""}?
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

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        message="Scheda di lavoro eliminata!"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </>
  );
}
