import React from 'react'
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate} from "react-router-dom";
import moment from 'moment/moment';
import 'moment/locale/it'
import { useSelector } from 'react-redux';
import Paper from '@mui/material/Paper';
import MuiBottomNavigationAction from "@mui/material/BottomNavigationAction";
import TaskIcon from '@mui/icons-material/Task';
import ContactPageIcon from '@mui/icons-material/ContactPage';
import { BottomNavigation } from '@mui/material';
import { styled } from "@mui/material/styles";
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import HistoryIcon from '@mui/icons-material/History';



function BottomNavi ()  {
    
    const navigate = useNavigate();

    const location = useLocation();
    const isAuth = useSelector((state) => state.auth.isAuth);
    const isAuthUser = useSelector((state) => state.userAuth.isAuthUser);
    const username = useSelector((state) => state.userAuth.userDetails?.username);

    const timeElapsed = Date.now();  //prende la data attuale in millisecondi
    const today = new Date(timeElapsed);    //converte nel tipo data
    var formattedDate = moment(today).format('DD-MM-YYYY');  //coverte nel formato richiesto
    localStorage.setItem("today", formattedDate);
    const [todayC, setTodayC] = useState(localStorage.getItem("today"));  //variabile che andiamo ad utilizzare

    const BottomNavigationAction = styled(MuiBottomNavigationAction)(`
    color: #f6f6f6;
  `);
  

return (
  <>
{(isAuth || isAuthUser) && 
<Paper 
  sx={{ 
    position: 'fixed', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.3)' // Ombra sopra la Navbar
  }} 
  elevation={3}
>
<BottomNavigation 
  sx={{
    bgcolor: 'white',
    '& .MuiBottomNavigationAction-root': {
      color: '#9BA5AD', // Colore icone non selezionate (grigio)
    },
    '& .Mui-selected, & .MuiBottomNavigationAction-root[data-selected="true"]': {
      '& .MuiBottomNavigationAction-label, & .MuiSvgIcon-root': {
        color: '#037E67', // Cambia colore icona e testo se selezionato
      },
      '& .MuiBottomNavigationAction-label': {
        fontWeight: 'bold', // Testo in grassetto se selezionato
      }
    }
  }} 
  showLabels
>
    {isAuth && (
      <BottomNavigationAction
        component={Link}
        className="linq"
        value="home"
        to="/"
        label="Home"
        icon={<HomeIcon />}
        data-selected={location.pathname === '/'} // Aggiunge un attributo per il selezionato
      />
    )}
{isAuth && (
  <BottomNavigationAction
    component={Link}
    className="linq"
    value="Sched"
    to="/customerlist"
    label="Pazienti"
    icon={<ContactPageIcon />}
    data-selected={location.pathname === '/customerlist' || location.pathname === '/addcustomer'}
  />
)}
    {isAuth && (
      <BottomNavigationAction
        component={Link}
        className="linq"
        value="Schede"
        to="/schededilavoro"
        label="Schede"
        icon={<TaskIcon />}
        data-selected={location.pathname === '/schededilavoro'}
      />
    )}
</BottomNavigation>
</Paper>

}
</>
    )

}

export default BottomNavi 