import React, { useState } from "react";
import { ScrollMenu } from "react-horizontal-scrolling-menu";
import "react-horizontal-scrolling-menu/dist/styles.css";
import dayjs from "dayjs";
import "dayjs/locale/it";
import { Button, Box, Typography } from "@mui/material";

dayjs.locale("it");

const days = Array.from({ length: 14 }, (_, i) => dayjs().add(i, "day"));

const CalendarHorizontal = ({ onDateSelect }) => {
  const [selectedDate, setSelectedDate] = useState(null);

  const handleSelect = (date) => {
    setSelectedDate(date);
    onDateSelect(date);
  };

  return (
    <div className="hidden-scrollbar" style={{ padding: "0px", display: "flex", gap: "5px" }}>
      {days.map((date) => (
        <Button
          key={date.format("YYYY-MM-DD")}
          variant={selectedDate?.isSame(date, "day") ? "contained" : "outlined"}
          onClick={() => handleSelect(date)}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "70px", minHeight: "80px", padding: "10px" }}
        >
          <h6  fontWeight="bold">
            {date.format("ddd")} {/* Giorno della settimana in italiano (lun, mar, mer, ...) */}
          </h6>
          <h6 >
            {date.format("DD")} {/* Numero del giorno (01, 02, 03, ...) */}
          </h6>
        </Button>
      ))}
    </div>
  );
};

export default CalendarHorizontal;