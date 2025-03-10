import React, { useState, useEffect } from "react";
import "./App.css";
import moment from "moment/moment";
import "moment/locale/it";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import Box from '@mui/material/Box';
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import AnimateRoutes from "./components/AnimateRoutes";
import { ToastContainer } from 'react-toastify';
import BottomNavi from "./components/BottomNavigation";
import MiniDrawer from "./components/MiniDrawer";
import useMediaQuery from "@mui/material/useMediaQuery";
import { styled } from "@mui/material/styles";
import MuiBottomNavigationAction from "@mui/material/BottomNavigationAction";
import { tutti, supa } from './components/utenti';
import { useDispatch, useSelector } from "react-redux";
import { loginU, logoutU } from './redux/reducers/authSlice'; 
import { loginUser, logoutUser } from './redux/reducers/userAuthSlice';
import { Button, Snackbar } from '@mui/material'; // Importa Snackbar e Button

// Styled BottomNavigationAction
const BottomNavigationAction = styled(MuiBottomNavigationAction)(`
  color: #f6f6f6;
`);

function App() {
  const matches = useMediaQuery("(max-width:920px)");
  const auth = getAuth();
  const dispatch = useDispatch();
  const isAuth = useSelector(state => state.auth.isAuth);

  // Stato per gestire il prompt di installazione
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Monitoraggio dello stato di autenticazione
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Se l'utente è autenticato, dispatch loginU
        dispatch(loginU({ email: user.email, uid: user.uid })); // Usa loginU qui
      } else {
        dispatch(logoutU()); // Se l'utente esce, dispatch logoutU
      }
    });

    // Aggiungi un event listener per intercettare il prompt di installazione
    const handleBeforeInstallPrompt = (e) => {
      // Previeni il prompt automatico
      e.preventDefault();
      // Salva l'evento in deferredPrompt
      setDeferredPrompt(e);
      // Mostra il pulsante o il popup per l'installazione
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      unsubscribe(); // Cleanup all'unmount del componente
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [auth, dispatch]);

  // Funzione per gestire l'installazione
  const handleInstallClick = () => {
    if (deferredPrompt) {
      // Mostra il prompt di installazione nativo del browser
      deferredPrompt.prompt();
      // Controlla il risultato della scelta dell'utente
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        // Reset della variabile deferredPrompt
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      });
    }
  };

  // SignOut function
  const signUserOut = () => {
    signOut(auth).then(() => {
      dispatch(logoutU()); // Usa logoutU qui
      dispatch(logoutUser());  // Logout per l'utente
    });
  };

  return (
    <Router>
      <Box sx={{ display: "flex", padding: 0 }}>
        {/* AppContent renderizzato con i suoi parametri */}
        <AppContent signUserOut={signUserOut} matches={matches} />
      </Box>

      {/* Mostra BottomNavi solo su schermi piccoli */}
      {matches && <BottomNavi />}
      
      {/* Mostra il popup di installazione se disponibile */}
    <Snackbar
        open={showInstallPrompt}
        onClose={() => setShowInstallPrompt(false)}
        message="Vuoi installare questa app?"
        action={
          <Button color="primary" onClick={handleInstallClick}>
            Installa
          </Button>
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} // Posizione sopra
        sx={{
          position: 'fixed',
          top: '50%', // Posiziona al centro verticale
          left: '50%', // Posiziona al centro orizzontale
          transform: 'translate(-50%, -50%)', // Centra perfettamente
          zIndex: 1300,
        }} // Imposta la posizione
    />

    </Router>
  );
}

// Componente per il contenuto principale
function AppContent({ signUserOut, matches }) {
  const location = useLocation(); // Usa useLocation per ottenere l'URL corrente

  // Verifica se l'utente si trova nelle pagine di login o block
  const isLoginPage = location.pathname === "/login";
  const isBlockPage = location.pathname === "/block";
  const isAuth = useSelector(state => state.auth.isAuth);

  return (
    <>
      {/* Mostra MiniDrawer solo se non è la pagina di login o block e lo schermo è grande */}
      {!matches && !isLoginPage && !isBlockPage && isAuth && <MiniDrawer signUserOut={signUserOut} />}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          padding: matches ? 0 : "24px",
          paddingTop: "24px",
          overflowX: "hidden", // Impedisce lo scroll orizzontale
        }}
      >
        <ToastContainer limit={1} />
        {/* Render delle rotte animate */}
        <div style={{ marginTop: !matches && "50px" }}>
          <AnimateRoutes />
        </div>
      </Box>
    </>
  );
}

export default App;
