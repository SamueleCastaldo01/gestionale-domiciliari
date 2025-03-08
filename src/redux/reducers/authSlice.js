// redux/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isAuth: false,
    user: null, // Puoi anche memorizzare informazioni sull'utente qui, includendo uid
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginU: (state, action) => { // Azione per il login
            state.isAuth = true; // Imposta l'autenticazione a true
            state.user = action.payload; // Salva le informazioni dell'utente (email, uid, etc.)
        },
        logoutU: (state) => { // Azione per il logout
            state.isAuth = false; // Imposta l'autenticazione a false
            state.user = null; // Rimuove le informazioni dell'utente
        },
    },
});

// Esporta le azioni e il reducer
export const { loginU, logoutU } = authSlice.actions;
export default authSlice.reducer;
