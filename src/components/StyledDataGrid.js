import { styled, createTheme } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';

// Definizione del tema specifico per la tabella
const theme = createTheme({
  palette: {
    mode: 'light', // Imposta il tema su chiaro
    background: {
      default: '#FFFFFF', // Colore di sfondo principale
      paper: '#FFFFFF', // Colore di sfondo per i componenti Paper
    },
    text: {
      primary: '#000000', // Colore del testo primario
    },
  },
  mixins: {
    MuiDataGrid: {
      pinnedBackground: '#FFFFFF', // Colore di sfondo per le sezioni appuntate
      containerBackground: '#037E67', // Colore di sfondo per l'intestazione e le righe fisse
    },
  },
});

// Definizione di StyledDataGrid
const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  border: '3px solid #037E67',
  boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px', // Aggiunge un'ombra intorno alla tabella
  borderRadius: '8px', // Bordo arrotondato per un design più pulito
  overflow: 'hidden', // Per evitare che i bordi vengano coperti dall'overflow
  backgroundColor: '#FFFFFF', // Sfondo chiaro

  // Personalizzazione delle righe
  '& .MuiDataGrid-row': {
    backgroundColor: '#FFFFFF',
    '&:hover': {
      backgroundColor: '#037E67',
      color: "#FFFFFF",
    },
    '&.Mui-selected': {
      backgroundColor: '#037E67',
      color: "white",
      '&:hover': {
        backgroundColor: '#037E67',
      },
    },
  },

  // Personalizzazione delle celle
  '& .MuiDataGrid-cell': {
    outline: 'none',
    backgroundColor: 'inherit',
  },
  '& .MuiDataGrid-cell:focus': {
    outline: 'none',
  },

  // Personalizzazione dell'intestazione delle colonne
  '& .MuiDataGrid-columnHeader': {
    backgroundColor: '#037E67', // Colore di sfondo dell'intestazione
    color: '#FFFFFF', // Colore del testo nell'intestazione (bianco)
    fontWeight: 'bold', // Rende il testo in grassetto
  },

  // Personalizzazione del footer
  '& .MuiDataGrid-footerContainer': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#037E67',
    color: "#FFFFFF",
    padding: '0 10px',
  },

  '& .MuiDataGrid-footer .MuiTypography-root': {
    margin: 0,
  },
  '& .MuiDataGrid-footer': {
    borderTop: 'none',
  },

  // Aggiusta il colore dell'icona del filtro
  '& .MuiDataGrid-filterIcon': {
    zIndex: 10,
  },

  '& .MuiDataGrid-menu': {},

  // Personalizzazione dei checkbox
  '& .MuiCheckbox-root': {
    color: '#000000', // Colore del checkbox non selezionato (verde)
  },
  '& .MuiCheckbox-root.Mui-checked': {
    color: '#FFFFFF', // Colore del checkbox selezionato (nero)
  },
}));

export { StyledDataGrid, theme };
