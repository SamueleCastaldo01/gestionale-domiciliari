import React, { useState, useEffect } from "react";
import { ScrollMenu } from "react-horizontal-scrolling-menu";
import "react-horizontal-scrolling-menu/dist/styles.css";
import dayjs from "dayjs";
import "dayjs/locale/it";
import { Button } from "@mui/material";

dayjs.locale("it");

const days = Array.from({ length: 21 }, (_, i) => dayjs().add(i, "day"));

const CalendarHorizontal = ({ selectedDate: initialSelectedDate, onDateSelect }) => {
  // Inizializza lo stato con la data passata dal componente genitore
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate || null);

  // Se la prop cambia, aggiorna lo stato locale
  useEffect(() => {
    setSelectedDate(initialSelectedDate);
  }, [initialSelectedDate]);

  const handleSelect = (date) => {
    setSelectedDate(date);
    onDateSelect(date);
  };

  return (
    <div className="hidden-scrollbar" style={{ padding: "0px", display: "flex", gap: "5px" }}>
      {days.map((date) => (
        <Button
          className="rounded-4"
          key={date.format("YYYY-MM-DD")}
          variant={selectedDate?.isSame(date, "day") ? "contained" : "outlined"}
          onClick={() => handleSelect(date)}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "70px", minHeight: "80px", padding: "10px" }}
        >
          <h6 style={{ fontWeight: "bold" }}>
            {date.format("ddd")} {/* Giorno della settimana in italiano */}
          </h6>
          <h6>
            {date.format("DD")} {/* Numero del giorno */}
          </h6>
        </Button>
      ))}
    </div>
  );
};

export default CalendarHorizontal;
