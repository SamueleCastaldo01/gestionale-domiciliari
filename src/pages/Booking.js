import React from 'react'
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from '@mui/material/Button';
import { motion } from 'framer-motion';
import useMediaQuery from "@mui/material/useMediaQuery";
import { useSelector } from 'react-redux';
import { NavMobile } from '../components/NavMobile';
import CalendarHorizontal from '../components/CalendarHorizontal';

function Homepage ()  {
    const matches = useMediaQuery("(max-width:920px)");
    const user = useSelector((state) => state.auth.user);
    const uid = user?.uid;
    const [selectedDate, setSelectedDate] = useState(null);

    let navigate = useNavigate();
  

    return (
        <>
 
    {matches && <NavMobile text= "I miei appuntamenti" />}

      <motion.div
        initial= {{opacity: 0}}
        animate= {{opacity: 1}}
        transition={{ duration: 0.7 }}>
      <div className='px-3 px-lg-0'>
      <CalendarHorizontal onDateSelect={setSelectedDate} />
    
      </div>

      </motion.div>
        </>
    )

}

export default Homepage 
