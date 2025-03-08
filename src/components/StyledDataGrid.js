import { styled, createTheme } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';

// Definizione del tema specifico per la tabella
const theme = createTheme({
    palette: {
      mode: 'light', // Imposta il tema su scuro
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
        pinnedBackground: '#037E67', // Colore di sfondo per le sezioni appuntate
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

  '& .MuiDataGrid-row': {
    backgroundColor: '#037E67',
    '&:hover': {
      backgroundColor: '#037E67',
    },
    '&.Mui-selected': {
      backgroundColor: '#037E67',
      '&:hover': {
        backgroundColor: '#037E67',
      },
    },
  },
  '& .MuiDataGrid-cell': {
    outline: 'none',
    backgroundColor: 'inherit',
  },
  '& .MuiDataGrid-cell:focus': {
    outline: 'none',
  },
  '& .MuiDataGrid-footerContainer': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#037E67',
    padding: '0 10px',
  },
  '& .MuiDataGrid-footer .MuiTypography-root': {
    margin: 0,
  },
  '& .MuiDataGrid-footer': {
    borderTop: 'none',
  },
  '& .MuiDataGrid-filterIcon': {
    zIndex: 10,
  },
  '& .MuiDataGrid-menu': {},
}));


export { StyledDataGrid, theme };
