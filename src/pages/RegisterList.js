import { styled, ThemeProvider } from '@mui/material/styles';
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { itIT } from "@mui/x-data-grid/locales";
import CircularProgress from '@mui/material/CircularProgress';
import { Paper, IconButton, Snackbar, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from "@mui/material";
import { useState, useEffect } from "react";
import moment from 'moment';
import { db } from "../firebase-config";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import useMediaQuery from "@mui/material/useMediaQuery";
import { collection, getDocs, deleteDoc, doc, orderBy, query, where, getDoc, updateDoc } from "firebase/firestore";
import RefreshIcon from '@mui/icons-material/Refresh';
import { StyledDataGrid, theme } from '../components/StyledDataGrid';
import { EditCliente } from '../components/EditCliente';
import { NavMobile } from '../components/NavMobile';
import { useSelector } from 'react-redux';

export function RegisterList() {
  const matches = useMediaQuery("(max-width:920px)");
  const user = useSelector((state) => state.auth.user);
  const todayForQuery = new Date().toISOString().split('T')[0]; 
  const todayFormatted = moment().format('DD-MM-YYYY');
  const uid = user?.uid;
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();


  const fetchCustomers = async () => {
    try {
        setLoading(true);
        const customerCollection = collection(db, "registerTab");
        let customerQuery = query(customerCollection, where("uid", "==", uid), where("giorno", "==", todayForQuery));
  
        const customerSnapshot = await getDocs(customerQuery);
        let customerList = customerSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        customerList.sort((a, b) => {
            return a.ora.localeCompare(b.ora);
        });

        setCustomers(customerList);
    } catch (error) {
        console.error("Errore nel recupero dei dati dei clienti: ", error);
    } finally {
        setLoading(false);
    }
};

  useEffect(() => {
    fetchCustomers();
  }, []);


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
        console.error("Errore durante l'eliminazione della prestazione: ", error);
    } finally {
        setConfirmOpen(false);
        setSelectedCustomerIds([]);
    }
  };


  return (
    <>
    {matches && <NavMobile text= "Registro Prestazioni" page= "registerlist"/>}
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
      <div className="container-fluid">
        <h5>{todayFormatted}</h5>
      {matches &&
      <>
        {/*data */}

        <div
          className='div-customer mt-3 overflow-auto pb-4'
          style={{ 
            maxHeight: "75vh",
            overflowY: "auto" 
          }}
        >
        {customers.map((customer) => (
          <div key={customer.id} className='customer d-flex align-items-center justify-content-between py-3'
          onClick={() => {navigate(`/editregister?idregister=${customer.id}`)}}>
            <div>
              <h5 style={{fontSize: "17px", fontWeight: "400"}} className='mb-0'>{customer.cognome} {customer.nome}</h5>
              <h5 style={{fontSize: "15px", fontWeight: "400", color:"gray"}} className='mt-1 mb-1'>Codice Fiscale: {customer.codiceFiscale}</h5>
              <p className='mb-0' style={{color: "gray", fontSize: "14px"}}>{customer.ora} - {customer.oraFine} 
                <span className='ms-4 fw-medium'>Durata: {customer.durata}m</span> </p>
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
        
      </>
      }
      </div>
    </motion.div>
    </>
  );
}
