// redux/userAuthSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isAuthUser: false, // Stato per gestire l'autenticazione dell'utente
    userDetails: null, // Puoi memorizzare dettagli dell'utente qui
};

const userAuthSlice = createSlice({
    name: 'userAuth',
    initialState,
    reducers: {
        loginUser: (state, action) => {
            state.isAuthUser = true; // Imposta l'autenticazione a true
            state.userDetails = action.payload; // Salva le informazioni dell'utente
        },
        logoutUser: (state) => {
            state.isAuthUser = false; // Imposta l'autenticazione a false
            state.userDetails = null; // Rimuove le informazioni dell'utente
        },
    },
});

// Esporta le azioni e il reducer
export const { loginUser, logoutUser } = userAuthSlice.actions;
export default userAuthSlice.reducer;
