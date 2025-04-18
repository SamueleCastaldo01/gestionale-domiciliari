import React from 'react'
import { useState, useEffect } from "react";
import Homepage from '../pages/Homepage'
import Booking from '../pages/Booking'
import { useSelector } from 'react-redux'; 
import { CustomerList } from '../pages/CustomerList';
import Page_per from '../pages/Page_per';
import { BrowserRouter as Router, Routes, Route, Link, useLocation} from "react-router-dom";
import {PrivateRoutes, PrivatePerm, PrivateRoutesUser} from '../components/PrivateRoutes';
import { AnimatePresence } from 'framer-motion';
import moment from 'moment/moment';
import 'moment/locale/it'
import { AddCliente } from '../pages/AddCliente';
import Login from '../pages/Login';
import { AddBooking } from '../pages/AddBooking';
import { AddPrestazioni } from '../pages/AddPrestazioni';
import { RegisterList } from '../pages/RegisterList';
import { AddRegister } from '../pages/AddRegister';
import { EditRegister } from '../pages/EditRegister';
import { AssessmentList } from '../pages/AssessmentList';
import { CustomerInfo } from '../pages/CustomerInfo';
import AppointmentViewer from '../pages/AppointmentViewer';
import ViewRegister from '../pages/ViewRegister';
import { Autodichiarazione } from '../pages/Autodichiarazione';
import { WorkHoursList } from '../pages/WorkHoursList';
import DocumentList from '../pages/DocumentsList';


function AnimateRoutes ()  {
  
    const location = useLocation();
    //const [isAuth, setIsAuth] = useState(localStorage.getItem("isAuth"));
    const isAuth = useSelector((state) => state.auth.isAuth);
    const isAuthUser = useSelector((state) => state.userAuth.isAuthUser); //questo per gli utenti


    const timeElapsed = Date.now();  //prende la data attuale in millisecondi
    const today = new Date(timeElapsed);    //converte nel tipo data
    var formattedDate = moment(today).format('DD-MM-YYYY');  //coverte nel formato richiesto
    localStorage.setItem("today", formattedDate);
    const [todayC, setTodayC] = useState(localStorage.getItem("today"));  //variabile che andiamo ad utilizzare



return (

    <AnimatePresence>
    <Routes location={location} key={location.pathname}>
      {/**qui ci vanno quelli che non servono i permessi, o se ne creano degli altri */}

    <Route element={<PrivateRoutes isAuth={isAuth} isAuthUser={isAuthUser}/>}> 
    <Route path="/" element={<Homepage />} /> 
    <Route path="/customerlist" element={<CustomerList />} /> 
    <Route path="/customerinfo" element={<CustomerInfo />} /> 
    <Route path="/addcustomer" element={<AddCliente />} /> 
    <Route path="/appuntamenti" element={<Booking />} /> 
    <Route path="/bookingview" element={<AppointmentViewer />} /> 
    <Route path="/addbooking" element={<AddBooking />} />
    <Route path="/registerlist" element={<RegisterList />} /> 
    <Route path="/addregister" element={<AddRegister />} /> 
    <Route path="/editregister" element={<EditRegister />} /> 
    <Route path="/viewregister" element={<ViewRegister />} /> 
    <Route path="/addprestazioni" element={<AddPrestazioni />} />
    <Route path="/assessmentList" element={<AssessmentList />} /> 
    <Route path="/autodichiarazione" element={<Autodichiarazione />} /> 
    <Route path="/workhours" element={<WorkHoursList />} /> 
    <Route path="/documents" element={<DocumentList />} /> 

    </Route>



    <Route path="/login" element={<Login  />} />
    <Route path="/block" element={<Page_per/>} />
    {isAuth ? <Route path="*" element={<Page_per /> }/> :
              <Route path="*" element={<Login  />}/>    }



    </Routes>


    </AnimatePresence>

    )

}

export default AnimateRoutes 