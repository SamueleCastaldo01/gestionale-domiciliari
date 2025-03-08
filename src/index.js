import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css'; 
import { store, persistor } from './redux/store/store';
import { Provider } from 'react-redux'; // Importa il Provider
import { PersistGate } from 'redux-persist/integration/react';

const darkTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#037E67',
    },
    secondary: {
      main: '#333',
    },
    tertiary: {
      main: '#000000', 
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
  },
});


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}> {/* Avvolgi con Provider */}
    <ThemeProvider theme={darkTheme}>
      <PersistGate loading={null} persistor={persistor}>
        <CssBaseline />
        <App />
      </PersistGate>
    </ThemeProvider>
  </Provider>
);

// Registrazione del service worker
serviceWorkerRegistration.register();

// Misurazione delle performance
reportWebVitals();
