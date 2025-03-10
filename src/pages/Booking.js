import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

  // Imposta la data odierna come valore iniziale (come oggetto dayjs)
  const [selectedDate, setSelectedDate] = useState(dayjs());

  let navigate = useNavigate();

  return (
    <>
      {matches && <NavMobile text="I miei appuntamenti" />}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <div className="px-2 px-lg-0">
          {/* Calendario orizzontale per selezionare la data */}
          <CalendarHorizontal
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />


          <div className="mt-4">
            <DailySchedule selectedDate={selectedDate} />
          </div>
          
        </div>
      </motion.div>
    </>
  );
}

export default Booking;
