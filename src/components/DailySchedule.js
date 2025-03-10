import React from "react";
import { Box, Button, Typography, IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const DailySchedule = ({ selectedDate }) => {
  const navigate = useNavigate();

  // Funzione per generare le fasce orarie da start a end con un intervallo in minuti
  const generateTimeSlots = (start, end, interval) => {
    const slots = [];
    let current = start;
    while (current.isBefore(end) || current.isSame(end)) {
      slots.push(current);
      current = current.add(interval, "minute");
    }
    return slots;
  };

  // Imposta l’orario di inizio e fine per la giornata selezionata
  const startTime = selectedDate.hour(9).minute(0).second(0);
  const endTime = selectedDate.hour(19).minute(0).second(0);
  const timeSlots = generateTimeSlots(startTime, endTime, 45);

  // Funzione per navigare alla pagina di creazione appuntamento
  const handleAdd = (timeSlot) => {
    navigate(`/addbooking?date=${selectedDate.format("YYYY-MM-DD")}&time=${timeSlot.format("HH:mm")}`);
  };

  // Funzione per gestire la rimozione dell'appuntamento (demo)
  const handleDelete = (timeSlot) => {
    alert(`Elimina prenotazione per ${timeSlot.format("HH:mm")}`);
  };

  return (
    <div
      style={{
        height: "100%", // Puoi modificare l'altezza massima secondo le tue necessità
        overflowY: "auto",
      }}
    >
      {timeSlots.map((timeSlot) => (
        <div
          key={timeSlot.format("HH:mm")}
          className="d-flex align-items-center gap-0 py-1"
          style={{borderBottom: "1px solid #ccc"}}
        >
          {/* Orario */}
          <Typography variant="body1" style={{ width: "80px" }}>
            {timeSlot.format("HH:mm")}
          </Typography>
          {/* Pulsante per aggiungere prenotazione */}
          <Button
           className="w-100"
            variant="contained"
            color="primary"
            onClick={() => handleAdd(timeSlot)}
          >
            Aggiungi prenotazione
          </Button>
          {/* Pulsante per eliminare l'appuntamento */}
          <IconButton color="secondary" onClick={() => handleDelete(timeSlot)}>
            <Typography variant="body1" style={{ fontWeight: "bold" }}>
              X
            </Typography>
          </IconButton>
        </div>
      ))}
    </div>
  );
};

export default DailySchedule;
