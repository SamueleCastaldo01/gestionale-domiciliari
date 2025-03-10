import React, { useState, useEffect } from "react";
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
  const [loading, setLoading] = useState(true); // Aggiungi lo stato per il loading

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
        setLoading(false); // Disattiva il loading quando la fetch è terminata
      }
    };

    if (uid && selectedDate) {
      fetchBookings();
    }
  }, [selectedDate, uid]);

  // Genera le fasce orarie da start a end con un intervallo in minuti
  const generateTimeSlots = (start, end, interval) => {
    const slots = [];
    let current = start;
    while (current.isBefore(end) || current.isSame(end)) {
      slots.push(current);
      current = current.add(interval, "minute");
    }
    return slots;
  };

  // Imposta l’orario di inizio e fine della giornata selezionata
  const startTime = selectedDate.hour(9).minute(0).second(0);
  const endTime = selectedDate.hour(19).minute(0).second(0);
  const timeSlots = generateTimeSlots(startTime, endTime, 45);

  // Funzione per navigare alla pagina di creazione appuntamento
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
      // Aggiorna lo stato filtrando via il booking eliminato
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
        // Mostra il CircularProgress quando la fetch è in corso
        <div style={{ textAlign: "center", padding: "50px" }}>
          <CircularProgress />
        </div>
      ) : (
        timeSlots.map((timeSlot) => {
          // Controlla se esiste un appuntamento che inizia in questa fascia oraria
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
                // Se esiste una prenotazione, mostra i dettagli:
                // il nome del paziente e l'orario di fine dell'appuntamento
                <div className="w-100">
                  <Typography className="fw-bold" style={{ color: "#037e67" }} variant="body1">
                    {bookingForSlot.nomeCompleto}
                  </Typography>
                  <Typography variant="body2">
                    {bookingForSlot.oraFine}
                  </Typography>
                </div>
              ) : (
                // Se non esiste, mostra il pulsante per aggiungere la prenotazione
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
