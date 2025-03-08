import { Outlet, Navigate } from 'react-router-dom'
import { tutti, dipen, guid, supa } from './utenti';


export function PrivateRoutes({ isAuth, isAuthUser }) {
    console.log(isAuthUser);
    if (!isAuth && !isAuthUser) {
        return <Navigate to="/loginuser" />;
    }
    
    // Se l'utente è autenticato e non è un utente normale, mostra l'Outlet per le rotte protette
    return <Outlet />;
}

export function PrivateRoutesUser ({isAuthUser})  {
    return(
        isAuthUser ? <Outlet/> : <Navigate to="/loginuser"/>
    );
}

export function PrivatePerm({}) {
    let ta= tutti.includes(localStorage.getItem("uid"))  //questo è un ulteriore controllo, solo per gli utenti supervisori, per i permessi
    return (
        ta ? <Outlet/> : <Navigate to="/block"/>
    );
}
