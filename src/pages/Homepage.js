import React from 'react'
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from '@mui/material/Button';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useDispatch, useSelector } from "react-redux";
import { motion } from 'framer-motion';
import { logoutUser } from '../redux/reducers/userAuthSlice';
import { logoutU } from '../redux/reducers/authSlice';

function Homepage ()  {

    const [flagCont, setFlagCont] = React.useState(false);
    const [open, setOpen] = React.useState(false);
    const auth = getAuth();
    const dispatch = useDispatch();
    localStorage.setItem("naviBottom", 0);

    let navigate = useNavigate();

      const signUserOut = () => {
        signOut(auth).then(() => {
          dispatch(logoutU()); // Usa logoutU qui
          dispatch(logoutUser());  // Logout per l'utente
        });
      };
  
    const handleClickOpen = () => {
        setOpen(true);
      };
    
      const handleClose = () => {
        setOpen(false);
      };

    const buttonStyle = {
        width: '80%', // Personalizza la larghezza del bottone
        height: "120px",
        marginBottom: "20px",
        textColor: "#333"
      };

    return (
        <>
{/**************NAVBAR MOBILE*************************************** */}


      <motion.div
        initial= {{opacity: 0}}
        animate= {{opacity: 1}}
        transition={{ duration: 0.7 }}>
      <div className='px-4 px-lg-0'>
        <h1 className='titlePage'>Gestionale Domiciliari</h1>
        <div className='mt-4 d-flex flex-column gap-3 justify-content-start'>
          <div className='d-flex gap-3'>
            <Button style={{width: "200px", height: "70px"}} variant="contained" onClick={()=> {navigate("/customerlist")}}>Clienti</Button>
            <Button style={{width: "200px", height: "70px"}} variant="contained" onClick={()=> {navigate("/schededilavoro")}}>Schede</Button>
          </div>
          <div className='d-flex gap-3'>
          <Button style={{width: "200px", height: "70px"}} variant="contained" onClick={()=> {navigate("/addprestazioni")}}>Prestazioni</Button>
          <Button style={{width: "200px", height: "70px"}} variant="contained" onClick={()=> {navigate("/workhours")}}>Ore di Lavoro</Button>
          </div>
          
          <Button color='error' style={{width: "100%", height: "70px"}} variant="contained" onClick={()=> {signUserOut()}}>Esci</Button>
        </div>
      
      </div>

      </motion.div>
        </>
    )

}

export default Homepage 
