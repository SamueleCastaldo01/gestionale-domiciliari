import { toast, Slide } from 'react-toastify';

export function notifyError () {
    toast.error('Inserisci una data', {
        position: "top-center",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        transition: Slide,
        theme: "dark",
        className: "rounded-4"
        });
}

//------------------------------------------------------------------------
export function notifyErrorAddCliente (text) {
    toast.error(text, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        transition: Slide,
        theme: "dark",
        className: "rounded-4"
        });
}

//------------------------------------------------------------------------
export function notifyErrorAddUsername () {
    toast.error('Questo Username già esiste', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        transition: Slide,
        theme: "dark",
        className: "rounded-4"
        });
}

//------------------------------------------------------------------------
export function successAddCliente (text) {
    toast.success("Cliente aggiunto con successo", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        transition: Slide,
        progress: undefined,
        theme: "dark",
        className: "rounded-4"
        });
}

export function successUpdateCliente (text) {
    toast.success("Cliente aggiornato con successo", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        transition: Slide,
        progress: undefined,
        theme: "dark",
        className: "rounded-4"
        });
}

export function successNoty (text) {
    toast.success(text, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        transition: Slide,
        progress: undefined,
        theme: "dark",
        className: "rounded-4"
        });
}

export function errorNoty(text) {
    toast.error(text, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        transition: Slide,
        theme: "dark",
        className: "rounded-4"
        });
}

//________________________________________________________________________
export function notiUploadImage () {
    toast.success("Image uploaded successfully", {
        position: "top-center",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        transition: Slide,
        progress: undefined,
        theme: "dark",
        className: "rounded-4"
        });
}
//________________________________________________________________________
export function notiUpdateScalet () {
    toast.success("Aggiornato con successo", {
        position: "top-center",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        transition: Slide,
        progress: undefined,
        theme: "dark",
        className: "rounded-4"
        });
}
//_____________________________________________________________________________________
export function errorRegi() {
    toast.error("Account already registered or weak password", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        transition: Slide,
        theme: "dark",
        })
}
//_____________________________________________________________________________________
export function errorLogin() {
    toast.error("Wrong email or password", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        transition: Slide,
        theme: "dark",
        })
}
//_____________________________________________________________________________________
export function errorRecover() {
    toast.error("Email not found", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        transition: Slide,
        theme: "dark",
        })
}
//_____________________________________________________________________________________
export function successRecover () {
    toast.success("Check your inbox, even spam", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        transition: Slide,
        progress: undefined,
        theme: "dark",
        className: "rounded-4"
        });
}