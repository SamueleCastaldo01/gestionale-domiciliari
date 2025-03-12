import React, { useState, useEffect, useMemo } from "react";
import { Button, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase-config";

const DailySchedule = ({ selectedDate, uid }) => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch degli appuntamenti per la data e l'utente selezionato
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const dateStr = selectedDate.format("YYYY-MM-DD");
        const q = query(
          collection(db, 'bookingTab'),
          where('uid', '==', uid),
          where('giorno', '==', dateStr)
        );
        const querySnapshot = await getDocs(q);
        const bookingsData = [];
        querySnapshot.forEach(docSnap => {
          bookingsData.push({ id: docSnap.id, ...docSnap.data() });
        });
        setBookings(bookingsData);
      } catch (error) {
        console.error("Errore nel fetch delle prenotazioni: ", error);
      } finally {
        setLoading(false);
      }
    };

    if (uid && selectedDate) {
      fetchBookings();
    }
  }, [selectedDate, uid]);

  // Helper per convertire una stringa oraria ("HH:mm") in un oggetto dayjs basato sulla data selezionata
  const parseTime = (timeStr) => {
    const [hour, minute] = timeStr.split(":");
    return selectedDate.hour(Number(hour)).minute(Number(minute)).second(0);
  };

  // Genera gli slot orari in modo dinamico
  const dynamicTimeSlots = useMemo(() => {
    const slots = [];
    // Imposta orari di inizio e fine giornata
    let current = selectedDate.hour(9).minute(0).second(0);
    const endTime = selectedDate.hour(19).minute(0).second(0);
    // Ordina le prenotazioni per ora di inizio
    const sortedBookings = bookings.slice().sort((a, b) => {
      return parseTime(a.ora).diff(parseTime(b.ora));
    });
    // Ciclo fino al termine della giornata
    while (current.isBefore(endTime) || current.isSame(endTime)) {
      slots.push(current);
      // Cerca se esiste una prenotazione che inizia esattamente a questo orario
      const bookingForSlot = sortedBookings.find(
        (booking) => booking.ora === current.format("HH:mm")
      );
      if (bookingForSlot && bookingForSlot.oraFine) {
        // Se esiste, imposta il prossimo slot all'orario di fine dell'appuntamento
        current = parseTime(bookingForSlot.oraFine);
      } else {
        // Altrimenti, aggiungi 45 minuti di default
        current = current.add(45, "minute");
      }
    }
    return slots;
  }, [bookings, selectedDate]);

  // Naviga alla pagina di creazione prenotazione passando data e orario
  const handleAdd = (timeSlot) => {
    navigate(
      `/addbooking?date=${selectedDate.format("YYYY-MM-DD")}&time=${timeSlot.format("HH:mm")}`
    );
  };

  // Imposta il booking da eliminare e apre il dialog
  const handleDelete = (booking) => {
    setBookingToDelete(booking);
    setOpenDeleteDialog(true);
  };

  // Gestione della conferma di eliminazione
  const handleConfirmDelete = async () => {
    try {
      await deleteDoc(doc(db, 'bookingTab', bookingToDelete.id));
      setBookings(bookings.filter(b => b.id !== bookingToDelete.id));
      setOpenDeleteDialog(false);
      setBookingToDelete(null);
    } catch (error) {
      console.error("Errore durante la cancellazione: ", error);
    }
  };

  // Gestione dell'annullamento della cancellazione
  const handleCancelDelete = () => {
    setOpenDeleteDialog(false);
    setBookingToDelete(null);
  };

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      {loading ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <CircularProgress />
        </div>
      ) : (
        dynamicTimeSlots.map((timeSlot) => {
          // Verifica se esiste una prenotazione che inizia in questo slot
          const bookingForSlot = bookings.find(
            (booking) => booking.ora === timeSlot.format("HH:mm")
          );

          return (
            <div
              key={timeSlot.format("HH:mm")}
              className="d-flex align-items-center gap-0 py-1"
              style={{ borderBottom: "1px solid #ccc" }}
            >
              <Typography variant="body1" style={{ width: "80px" }}>
                {timeSlot.format("HH:mm")}
              </Typography>
              {bookingForSlot ? (
                <div className="w-100">
                  <Typography className="fw-bold" style={{ color: "#037e67" }} variant="body1">
                    {bookingForSlot.nomeCompleto}
                  </Typography>
                  <Typography variant="body2">
                    {bookingForSlot.oraFine}
                  </Typography>
                </div>
              ) : (
                <Button
                  className="w-100"
                  variant="outlined"
                  color="primary"
                  onClick={() => handleAdd(timeSlot)}
                >
                  Aggiungi prenotazione
                </Button>
              )}
              {bookingForSlot && (
                <IconButton
                  color="secondary"
                  onClick={() => handleDelete(bookingForSlot)}
                >
                  <Typography variant="body1" style={{ fontWeight: "bold" }}>
                    X
                  </Typography>
                </IconButton>
              )}
            </div>
          );
        })
      )}

      {/* Dialog per la conferma della cancellazione */}
      <Dialog open={openDeleteDialog} onClose={handleCancelDelete}>
        <DialogTitle>Conferma cancellazione</DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler eliminare l'appuntamento per{" "}
            {bookingToDelete ? bookingToDelete.nomeCompleto : ""} alle{" "}
            {bookingToDelete ? bookingToDelete.ora : ""}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Annulla
          </Button>
          <Button onClick={handleConfirmDelete} color="secondary">
            Conferma
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DailySchedule;
