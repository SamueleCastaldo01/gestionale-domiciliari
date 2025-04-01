import React from 'react'
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from '@mui/material/Button';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useDispatch, useSelector } from "react-redux";
import { motion } from 'framer-motion';
import { logoutUser } from '../redux/reducers/userAuthSlice';
import { logoutU } from '../redux/reducers/authSlice';
import { NavMobile } from '../components/NavMobile';
import { useMediaQuery } from '@mui/material';

function DocumentList ()  {
    const matches = useMediaQuery("(max-width:920px)");
    const [flagCont, setFlagCont] = React.useState(false);
    const [open, setOpen] = React.useState(false);
    const auth = getAuth();
    const dispatch = useDispatch();
    localStorage.setItem("naviBottom", 0);

    let navigate = useNavigate();
  
    const buttonStyle = {
        width: '80%', // Personalizza la larghezza del bottone
        height: "120px",
        marginBottom: "20px",
        textColor: "#333"
      };

    return (
        <>
{/**************NAVBAR MOBILE*************************************** */}
   {matches && <NavMobile text= "Documenti"/>}

      <motion.div
        initial= {{opacity: 0}}
        animate= {{opacity: 1}}
        transition={{ duration: 0.7 }}>
      <div className='px-4 px-lg-0'>
        <h1 className='titlePage'>Documenti</h1>
        <div className='mt-4 d-flex flex-column gap-3 justify-content-start'>
          <div className='d-flex gap-3'>
            <Button style={{width: "200px", height: "70px"}} variant="contained" onClick={()=> {navigate("/assessmentList")}}>Riepilogo</Button>
            <Button style={{width: "200px", height: "70px"}} variant="contained" onClick={()=> {navigate("/autodichiarazione")}}>Dichiarazione Sostitutiva</Button>
          </div>
          <div className='d-flex gap-3'>
          <Button style={{width: "200px", height: "70px"}} variant="contained" onClick={()=> {navigate("/workhours")}}>Ore di Lavoro</Button>
          </div>
        
        </div>
      
      </div>

      </motion.div>
        </>
    )

}

export default DocumentList 
