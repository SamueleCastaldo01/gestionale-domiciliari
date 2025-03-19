import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from '../firebase-config';
import { NavMobile } from '../components/NavMobile';
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { IconButton } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';

// Funzione per formattare la data in YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}


// Funzione per ottenere le date della settimana corrente (da lunedì a domenica)
function getCurrentWeekDates(referenceDate = new Date()) {
  const current = new Date(referenceDate);
  const day = current.getDay(); // Domenica = 0, Lunedì = 1, ecc.
  const dayNumber = day === 0 ? 7 : day;
  const diffToMonday = dayNumber - 1;
  const monday = new Date(current);
  monday.setDate(current.getDate() - diffToMonday);
  let weekDates = [];
  for (let i = 0; i < 7; i++) {
    let d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(d);
  }
  return weekDates;
}

// Funzione per formattare la data per il selettore settimana: "3 - 9 mar"
function formatWeekRange(dates) {
  const startDay = dates[0].getDate();
  const endDay = dates[6].getDate();
  const month = dates[0].toLocaleDateString('it-IT', { month: 'short' });
  return `${startDay} - ${endDay} ${month}`;
}

// Funzione per formattare la data per ogni giorno: "3 lunedì"
function formatDayLabel(date) {
    return {
      dayNumber: date.getDate(),
      dayName: date.toLocaleDateString('it-IT', { weekday: 'long' })
    };
  }

function AppointmentViewer() {
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeekDates());
  const [appointments, setAppointments] = useState({});
  const [loading, setLoading] = useState(true);
  const [openDays, setOpenDays] = useState({});
  const user = useSelector((state) => state.auth.user);
  const uid = user?.uid;
  const navigate = useNavigate();


  const handleEdit = (idBooking) => {
    navigate(
      `/addbooking?idbooking=${idBooking}`
    );
  };

  useEffect(() => {
    async function fetchAppointments() {
      setLoading(true);
      try {
        const startDateStr = formatDate(currentWeek[0]);
        const endDateStr = formatDate(currentWeek[6]);
        const q = query(
          collection(db, "bookingTab"),
          where("giorno", ">=", startDateStr),
          where("giorno", "<=", endDateStr),
          where("uid", "==", uid)
        );
        const querySnapshot = await getDocs(q);
        let appointmentsData = {};
        currentWeek.forEach(date => {
          const dStr = formatDate(date);
          appointmentsData[dStr] = [];
        });
  
        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (appointmentsData[data.giorno]) {
            appointmentsData[data.giorno].push({
              id: doc.id,
              ...data
            });
          }
        });
  
        for (const key in appointmentsData) {
          appointmentsData[key].sort((a, b) => a.ora.localeCompare(b.ora));
        }
  
        setAppointments(appointmentsData);
      } catch (error) {
        console.error("Errore nel recupero degli appuntamenti: ", error);
      }
      setLoading(false);
    }
    fetchAppointments();
  }, [currentWeek]);

  useEffect(() => {
    let newOpenDays = {};
    currentWeek.forEach(date => {
      const dStr = formatDate(date);
      newOpenDays[dStr] = appointments[dStr] && appointments[dStr].length > 0;
    });
    setOpenDays(newOpenDays);
  }, [currentWeek, appointments]);

  const handlePrevWeek = () => {
    const newWeek = currentWeek.map(date => {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
    setCurrentWeek(newWeek);
  };

  const handleNextWeek = () => {
    const newWeek = currentWeek.map(date => {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
    setCurrentWeek(newWeek);
  };

  const toggleDay = (dateStr) => {
    setOpenDays(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr]
    }));
  };

  return (
    <>
      <NavMobile text="I miei appuntamenti" page="appoimentviewer" />

      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="overflow-auto"
        style={{ minHeight: "80vh" }}
      >
        {/* Selettore della settimana */}
        <div className="week-selector px-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '15px', borderBottom: '1px solid #ccc'  }}>
          <IconButton onClick={handlePrevWeek}><ArrowBackIosIcon/></IconButton>
          <span style={{ margin: '0 20px', fontWeight: 'bold', fontSize: '18px' }}>
            {formatWeekRange(currentWeek)}
          </span>
          <IconButton onClick={handleNextWeek}><ArrowForwardIosIcon/></IconButton>
        </div>

        {loading ? (
          <p>Caricamento degli appuntamenti...</p>
        ) : (
          <div className="appointments">
            {currentWeek.map(date => {
                const dateStr = formatDate(date);
                const { dayNumber, dayName } = formatDayLabel(date);
                const dayAppointments = appointments[dateStr] || [];
                return (
                    <div key={dateStr} className="day-appointments mb-0 p-0 my-2" style={{ borderBottom: '1px solid #ccc' }}>
                    <div
                        className="day-header d-flex justify-content-between align-items-center mb-2"
                        style={{ padding: '10px 8px', cursor: 'pointer' }}
                        onClick={() => toggleDay(dateStr)}
                    >
                        <div>
                        <span className="day-number" 
                        style={{fontSize: '18px', backgroundColor: "#EDEDF1", borderRadius: "50%", padding: "12px" }}>{dayNumber}</span>
                        <span className="day-name fw-bolder ms-2" style={{ fontSize: '18px' }}>{dayName}</span>
                        </div>
                        <div>
                            {openDays[dateStr] ? <KeyboardArrowUpIcon/> : <KeyboardArrowDownIcon/>}
                        </div>
                    </div>
                    {openDays[dateStr] && dayAppointments.length > 0 && (
                        <div className='mb-0'
                         style={{ listStyle: 'none', padding: '10px 15px 2px 20px', backgroundColor: "#EDEDF1" }}>
                        {dayAppointments.map((appointment, index) => (
                            <div className="d-flex justify-content-between mb-2 align-items-center" key={index}>
                                <p className='mb-0'><strong>{appointment.ora}</strong> - {appointment.nomeCompleto}</p>
                                <IconButton onClick={()=> {handleEdit(appointment.id)}}>
                                    <EditIcon/>
                                </IconButton>
                            </div>
                        ))}
                        </div>
                    )}
                    </div>
                );
                })}
          </div>
        )}
      </motion.div>
    </>
  );
}

export default AppointmentViewer;
