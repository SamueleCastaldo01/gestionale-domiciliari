import { styled, ThemeProvider } from '@mui/material/styles';
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { itIT } from "@mui/x-data-grid/locales";
import CircularProgress from '@mui/material/CircularProgress';
import { Paper, IconButton, Snackbar, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from "@mui/material";
import { useState, useEffect } from "react";
import { db } from "../firebase-config";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import useMediaQuery from "@mui/material/useMediaQuery";
import { collection, getDocs, deleteDoc, doc, orderBy, query, where, getDoc, updateDoc } from "firebase/firestore";
import RefreshIcon from '@mui/icons-material/Refresh';
import { StyledDataGrid, theme } from '../components/StyledDataGrid';
import { EditCliente } from '../components/EditCliente';
import { NavMobile } from '../components/NavMobile';
import { useSelector } from 'react-redux';

export function CustomerList() {
  const matches = useMediaQuery("(max-width:920px)");
  const user = useSelector((state) => state.auth.user);
  const uid = user?.uid;
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();
  const [editCustomerId, setEditCustomerId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [searchPhone, setSearchPhone] = useState(''); 
  const [searchNome, setSearchNome] = useState('');  
  const [searchCognome, setSearchCognome] = useState(''); 
  const [searchCf, setSearchCf] = useState(''); 
  const [searchType, setSearhType] = useState('nome'); 

  const handleEdit = (customerId) => {
    setEditCustomerId(customerId);
    setEditOpen(true);
  };

  const fetchCustomers = async (searchType) => {
    try {
      setLoading(true); // Inizia il caricamento
      const customerCollection = collection(db, "customersTab");
  
      let customerQuery;
      if (searchPhone && searchType == "phone") {
        // Filtro per numero di telefono
        customerQuery = query(customerCollection,where("uid", "==", uid), where("telefono", "==", searchPhone));
      } else if(searchNome && searchType == "nome") {
        customerQuery = query(customerCollection,where("uid", "==", uid), where("nome", "==", searchNome));
      } else if(searchCognome && searchType == "cognome") {
        customerQuery = query(customerCollection, where("uid", "==", uid), where("cognome", "==", searchCognome));
      } else if(searchCf && searchType == "cf") {
        customerQuery = query(customerCollection, where("uid", "==", uid), where("codiceFiscale", "==", searchCf));
      }
      else {
        // Crea una query per ordinare per dataCreazione in ordine decrescente se non c'è il filtro
        customerQuery = query(customerCollection,where("uid", "==", uid), orderBy("cognome", "asc"));
      }
  
      const customerSnapshot = await getDocs(customerQuery);
      const customerList = customerSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      setCustomers(customerList);
    } catch (error) {
      console.error("Errore nel recupero dei dati dei clienti: ", error);
    } finally {
      setLoading(false); // Termina il caricamento
    }
  };
  

  useEffect(() => {
    fetchCustomers();
  }, []);

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

  const handleRowSelectionChange = (newSelection) => {
    console.log("Selected Customer IDs:", newSelection);
    setSelectedCustomerIds(newSelection);
  };

  const handleDelete = async () => {
    const deletePromises = selectedCustomerIds.map(async (id) => {
        await deleteDoc(doc(db, "customersTab", id));

        const vehiclesRef = collection(db, "veicoloTab");
        const vehiclesQuery = query(vehiclesRef, where("idCustomer", "==", id));
        const vehiclesSnapshot = await getDocs(vehiclesQuery);
        
        const vehicleDeletePromises = vehiclesSnapshot.docs.map(vehicleDoc => 
            deleteDoc(doc(vehiclesRef, vehicleDoc.id))
        );

        await Promise.all(vehicleDeletePromises);
    });

    try {
        await Promise.all(deletePromises);
        setCustomers(customers.filter(customer => !selectedCustomerIds.includes(customer.id)));
        setSnackbarOpen(true);
    } catch (error) {
        console.error("Errore durante l'eliminazione dei clienti: ", error);
    } finally {
        setConfirmOpen(false);
        setSelectedCustomerIds([]);
    }
  };

  const handleConfirmDelete = () => {
    setConfirmOpen(true);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers("phone");
  };

  const handleSearchNome = (e) => {
    e.preventDefault();
    fetchCustomers("nome");
  };

  const handleSearchCognome = (e) => {
    e.preventDefault();
    fetchCustomers("cognome");
  };

  const handleSearchCf = (e) => {
    e.preventDefault();
    fetchCustomers("cf");
  };


  const handleResetSearch = () => {
    setSearchCognome("");
    setSearchNome("");
    setSearchPhone("");
  }
 
  const columns = [
    { field: "nome", headerName: "Nome", width: 130 },
    { field: "cognome", headerName: "Cognome", width: 130 },
    { field: "codiceFiscale", headerName: "Codice Fiscale", width: 130 },
    { field: "telefono", headerName: "Telefono", width: 130 },
    { field: "email", headerName: "Email", width: 130 },
  ];

  return (
    <>
    {matches && <NavMobile text= "I miei pazienti" page= "customerlist"/>}
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
      <div className="container-fluid">
      {/**Mobile */}
      {matches &&
      <>
      <div className='ricerca'>
      <div className='d-flex align-items-center gap-2 mb-3'>
              <p className='mb-0'><strong>Cerca per:</strong></p>
              <p className={`pSearch ${searchType === "nome" ? "active" : ""}`}  onClick={() => {setSearhType("nome")}}>Nome</p> 
              <p className={`pSearch ${searchType === "cognome" ? "active" : ""}`} onClick={() => {setSearhType("cognome")}}>Cognome</p>
              <p className={`pSearch ${searchType === "telefono" ? "active" : ""}`} onClick={() => {setSearhType("telefono")}}>Telefono</p>
              <p className={`pSearch ${searchType === "cf" ? "active" : ""}`} onClick={() => {setSearhType("cf")}}>CF</p>
        </div>
        {searchType == "telefono" &&
          <form className="d-flex align-items-center" onSubmit={handleSearch}>
            <TextField
              style={{width: "75%"}}
              label="Cerca per Telefono"
              variant="outlined"
              className="me-2"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)} // Aggiorna lo stato con il valore inserito
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
          }
          {searchType == "nome" &&
          <form className="d-flex align-items-center" onSubmit={handleSearchNome}>
            <TextField
              style={{width: "75%"}}
              label="Cerca per Nome"
              variant="outlined"
              className="me-2"
              value={searchNome}
              onChange={(e) => {
                const formattedName = capitalizeWords(e.target.value); // Capitalizza il valore inserito
                setSearchNome(formattedName); // Aggiorna lo stato con il valore formattato
              }}  // Aggiorna lo stato con il valore inserito
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
          }
          {searchType == "cognome" &&
          <form className="d-flex align-items-center" onSubmit={handleSearchCognome}>
            <TextField
              style={{width: "75%"}}
              label="Cerca per Cognome"
              variant="outlined"
              className="me-2"
              value={searchCognome}
              onChange={(e) => {
                const formattedCognome = capitalizeWords(e.target.value); // Capitalizza il valore inserito
                setSearchCognome(formattedCognome); // Aggiorna lo stato con il valore formattato
              }}  // Aggiorna lo stato con il valore inserito
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
          }
        {searchType == "cf" &&
          <form className="d-flex align-items-center" onSubmit={handleSearchCf}>
            <TextField
              style={{width: "75%"}}
              label="Cerca per Codice Fiscale"
              variant="outlined"
              className="me-2"
              value={searchCf}
              onChange={(e) => {
                const formattedName = toUpperCaseWords(e.target.value);
                setSearchCf(formattedName);
              }} 
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
          }
      </div>

        <div
          className='div-customer mt-3 overflow-auto pb-4'
          style={{ 
            maxHeight: "75vh", // Imposta un'altezza massima per abilitare lo scroll
            overflowY: "auto" // Abilita lo scroll solo verticalmente
          }}
        >
        {customers.map((customer) => (
              <div 
              key={customer.id} 
              className="customer d-flex align-items-center justify-content-between py-3"
              onClick={() => { navigate(`/customerinfo?id=${customer.id}`); }}
            >
            <div>
              <h5 style={{fontSize: "17px", fontWeight: "400"}} className='mb-1'>{customer.cognome} {customer.nome}</h5>
              {customer.telefono && <p className='mb-0' style={{color: "gray", fontSize: "14px"}}>Tel: {customer.telefono}</p>}
            </div>
            <div>
            <ArrowForwardIosIcon/>
            </div>
            
          </div>
        ))}
      </div>
      </>}

      {/**Computer */}
      {!matches &&
      <>
        <h2 className='titlePage'>Anagrafica Pazienti</h2>
        <div className='d-flex justify-content-between align-items-center mt-4'>
          <div className='d-flex flex-column  gap-2'>
            <div className='d-flex align-items-center gap-2'>
              <p className='mb-0'><strong>Ricerca per:</strong></p>
              <p className={`pSearch ${searchType === "nome" ? "active" : ""}`}  onClick={() => {setSearhType("nome")}}>Nome</p> 
              <p className={`pSearch ${searchType === "cognome" ? "active" : ""}`} onClick={() => {setSearhType("cognome")}}>Cognome</p>
              <p className={`pSearch ${searchType === "telefono" ? "active" : ""}`} onClick={() => {setSearhType("telefono")}}>Telefono</p>
            </div>
          {searchType == "telefono" &&
          <form className="d-flex align-items-center" onSubmit={handleSearch}>
            <TextField
              style={{width: "180px"}}
              label="Cerca per Telefono"
              variant="outlined"
              className="me-2"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)} // Aggiorna lo stato con il valore inserito
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
          }
          {searchType == "nome" &&
          <form className="d-flex align-items-center" onSubmit={handleSearchNome}>
            <TextField
              style={{width: "180px"}}
              label="Cerca per Nome"
              variant="outlined"
              className="me-2"
              value={searchNome}
              onChange={(e) => {
                const formattedName = capitalizeWords(e.target.value); // Capitalizza il valore inserito
                setSearchNome(formattedName); // Aggiorna lo stato con il valore formattato
              }}  // Aggiorna lo stato con il valore inserito
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
          }
          {searchType == "cognome" &&
          <form className="d-flex align-items-center" onSubmit={handleSearchCognome}>
            <TextField
              style={{width: "180px"}}
              label="Cerca per Cognome"
              variant="outlined"
              className="me-2"
              value={searchCognome}
              onChange={(e) => {
                const formattedCognome = capitalizeWords(e.target.value); // Capitalizza il valore inserito
                setSearchCognome(formattedCognome); // Aggiorna lo stato con il valore formattato
              }}  // Aggiorna lo stato con il valore inserito
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
          }
          {searchType == "cf" &&
          <form className="d-flex align-items-center" onSubmit={handleSearchCf}>
            <TextField
              style={{width: "180px"}}
              label="Cerca per Codice Fiscale"
              variant="outlined"
              className="me-2"
              value={searchCf}
              onChange={(e) => {
                const formattedCognome = toUpperCaseWords(e.target.value); // Capitalizza il valore inserito
                setSearchCf(formattedCognome); // Aggiorna lo stato con il valore formattato
              }}  // Aggiorna lo stato con il valore inserito
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
          }
          </div>
          <div>
            <IconButton variant="contained" onClick={() => {fetchCustomers(""); handleResetSearch()}}>
              <RefreshIcon/>
            </IconButton>
            <Button
              variant="contained"
              color='primary'
              className='me-2'
              onClick={() => navigate("/addcustomer")}
            >
              Aggiungi Paziente
            </Button>
            <Button
              variant="contained"
              color='primary'
              className='me-2'
              onClick={() => handleEdit(selectedCustomerIds[0])}
              disabled={selectedCustomerIds.length !== 1}
            >
              Modifica
            </Button>
            <Button color='error' variant="contained" onClick={handleConfirmDelete} disabled={selectedCustomerIds.length === 0}>
              Elimina {selectedCustomerIds.length > 0 && `(${selectedCustomerIds.length})`}
            </Button>
          </div>
        </div>
        <ThemeProvider theme={theme}>
          <Paper className='mt-4' sx={{ height: "50vh", borderRadius: '8px', overflowX: "auto", position: "relative" }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </div>
            ) : (
              <StyledDataGrid
                onCellClick={() => {}}
                rows={customers}
                columns={columns}
                checkboxSelection
                disableRowSelectionOnClick
                onRowSelectionModelChange={handleRowSelectionChange}
                localeText={itIT.components.MuiDataGrid.defaultProps.localeText}
              />
            )}
          </Paper>
        </ThemeProvider>
        <Snackbar open={snackbarOpen} autoHideDuration={2000} onClose={() => setSnackbarOpen(false)} message="Cliente eliminato!" anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />

        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <DialogTitle style={{backgroundColor: "#1E1E1E" }}>Conferma Eliminazione</DialogTitle>
          <DialogContent style={{backgroundColor: "#1E1E1E" }}>
            <DialogContentText>
              Sei sicuro di voler eliminare {selectedCustomerIds.length} cliente{i => (selectedCustomerIds.length > 1 ? 'i' : '')} selezionato{i => (selectedCustomerIds.length > 1 ? 'i' : '')}?
            </DialogContentText>
          </DialogContent >
          <DialogActions style={{backgroundColor: "#1E1E1E" }}>
            <Button onClick={() => setConfirmOpen(false)} color="primary">Annulla</Button>
            <Button onClick={handleDelete} color="error">Elimina</Button>
          </DialogActions>
        </Dialog>

        <Dialog maxWidth="md" open={editOpen} onClose={() => setEditOpen(false)}>
          <DialogTitle style={{backgroundColor: "#1E1E1E" }}>Modifica Cliente</DialogTitle>
          <DialogContent style={{backgroundColor: "#1E1E1E" }}>
              <EditCliente fetchCustomers={fetchCustomers} customerId={editCustomerId} onClose={() => setEditOpen(false)} />
          </DialogContent>
        </Dialog>
      </>
      }
      </div>
    </motion.div>
    </>
  );
}
