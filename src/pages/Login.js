//pagina di login
import React from 'react'
import { useRef } from 'react';
import {auth, providerGoogle, providerFacebook} from "../firebase-config";
import {signInWithPopup} from 'firebase/auth';
import {useNavigate} from "react-router-dom";
import { login } from '../firebase-config';
import { useDispatch } from 'react-redux';
import { loginU } from '../redux/reducers/authSlice';
import { supa } from '../components/utenti';
import { logoutUser } from '../redux/reducers/userAuthSlice';

function Login({}) {
  const dispatch = useDispatch();
  let navigate = useNavigate();  

  const emailRef = useRef();      //attributes
  const passwordRef = useRef();
 //_______________________________________________________________________________________

//_______________________________________________________________________________________
const signInwithGoogle = () => {
  signInWithPopup(auth, providerGoogle).then((result) => {
      const email = result.user.email;
      const profilePic = result.user.photoURL;
      const uid = result.user.uid;

      // Salvataggio delle informazioni in localStorage
      localStorage.setItem("email", email);
      localStorage.setItem("profilePic", profilePic);
      localStorage.setItem("isAuth", true);
      localStorage.setItem("uid", uid);

      // Aggiorna lo stato Redux con email e uid
      dispatch(loginU({ email, uid })); // Passa email e uid all'azione Redux
      dispatch(logoutUser()); // In caso di logout precedente, disconnetti l'utente
      navigate("/");  // Reindirizza alla home page
  }).catch((error) => {
      console.error("Errore durante il login con Google: ", error.message);
  });
};

//___________________________________________________________________________________________
  async function handelLogin () {    //login function
    try {
      await login(emailRef.current.value, passwordRef.current.value).then((result) => {
        const email = result.user.email;
  
        localStorage.setItem("email", email);
        localStorage.setItem("isAuth", true);
        dispatch(loginU({ email }));
        navigate("/");  //returns it to the home page
      })
    } catch{
    }

  }
//_____________________________________________________________________________________________
const singup = () => {
  navigate("/signup");   //I report it to the sign up page
}

const forgotPassword = () => {
  navigate("/recoverpassword");  //I report it to the recover password page
}
//___________________________________________________________________________________________
  return (
    <>
    <div className='Page'>  
    <div className="ciao container">
  <section className="gradient-custom">
  <div className="container py-1">
    <div className="row d-flex justify-content-center align-items-center h-70">
      <div className="col-12 col-md-8 col-lg-6 col-xl-5">
        <div className="card bg-dark text-white" style={{borderRadius: "2rem"}}>
          <div className="card-body p-5 text-center">

            <div className="mb-md-5 mt-md-4 pb-5">

              <h2 className="fw-bold mb-2 text-uppercase">Login</h2>
              <h2 className="fw-bold mb-2 text-uppercase">Supervisore</h2>
              <p className="text-white-50 mb-5">Please enter your email and password</p>

              <div className="form-outline form-white mb-4">
                <label class="form-label" htmlFor="typeEmailX">Email</label>
                <input ref={emailRef} type="email" id="typeEmailX" className="form-control form-control-lg" placeholder="Inserisci email"/>
              </div>

              <div className="form-outline form-white mb-4">
                <label class="form-label" htmlFor="typePasswordX"> Password</label>
                <input ref={passwordRef} type="password" id="typePasswordX" className="form-control form-control-lg" placeholder="Inserisci password"/>
              </div>

              <p className="small mb-5 pb-lg-2" onClick={forgotPassword}><a className="text-white-50">Forgot password?</a></p>

              <button className="btn btn-outline-light btn-lg px-5" type="submit" onClick={handelLogin}>Login</button>

              <div className="d-flex justify-content-center text-center mt-4 pt-1">
                <a onClick={signInwithGoogle} className="text-white"><i className="bi bi-google">
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-google" viewBox="0 0 16 16">
                <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z"/>
                </svg>
                </i></a>
              </div>
            </div>
            <div>
            <p className="mb-0">Accedi come utente <a style={{ cursor: 'pointer' }} onClick={() => {navigate("/loginuser")}} className="text-white-50 fw-bold">Accedi</a></p>
            {/** <p className="mb-0">Do not have an account? <a onClick={singup} className="text-white-50 fw-bold">SignUp</a>
              </p> */}
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</section>
    </div>
    </div>
    </>
  )

}

export default Login