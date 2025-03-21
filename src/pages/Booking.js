import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useSelector } from "react-redux";
import { NavMobile } from "../components/NavMobile";
import CalendarHorizontal from "../components/CalendarHorizontal";
import DailySchedule from "../components/DailySchedule";
import dayjs from "dayjs";

function Booking() {
  const matches = useMediaQuery("(max-width:920px)");
  const user = useSelector((state) => state.auth.user);
  const uid = user?.uid;
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const giornoSelezionato = params.get('giorno');

  // Imposta la data odierna come valore iniziale (oggetto dayjs)
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const navigate = useNavigate();

  useEffect(() => {
    if (giornoSelezionato) {
      // Interpretiamo il parametro come una data nel formato "YYYY-MM-DD"
      const paramDate = dayjs(giornoSelezionato, "YYYY-MM-DD");
      // Se il parametro è una data precedente a oggi, usiamo dayjs() (oggi)
      if (paramDate.isBefore(dayjs(), "day")) {
        setSelectedDate(dayjs());
      } else {
        setSelectedDate(paramDate);
      }
    }
  }, [giornoSelezionato]);

  return (
    <>
      {matches && <NavMobile text="I miei appuntamenti" page="bookinglist" />}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <div className="px-2 px-lg-0">
          {/* Il calendario orizzontale mostra sempre le date a partire da oggi */}
          <CalendarHorizontal
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />

          <div className="mt-4">
            <DailySchedule selectedDate={selectedDate} uid={uid} />
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default Booking;
