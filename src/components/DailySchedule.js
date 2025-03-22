import React, { useState, useEffect, useMemo } from "react";
import { Button, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import EditIcon from '@mui/icons-material/Edit';
import MapIcon from '@mui/icons-material/Map';
import PlaceIcon from '@mui/icons-material/Place';
import DeleteIcon from '@mui/icons-material/Delete';
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
    const [hour, minute] = timeStr.split(":").map(Number);
    return selectedDate.hour(hour).minute(minute).second(0);
  };

  // Genera gli slot orari in modo dinamico
  const dynamicTimeSlots = useMemo(() => {
    // Orario inizio e fine giornata
    const startDay = selectedDate.clone().hour(9).minute(0).second(0);
    const endDay = selectedDate.clone().hour(19).minute(0).second(0);
  
    // Raccolgo tutti gli orari di interesse: inizio e fine degli appuntamenti
    const bookingTimes = bookings.flatMap(booking => {
      // Se sono presenti ora e oraFine, li includiamo
      if (booking.ora && booking.oraFine) {
        return [parseTime(booking.ora), parseTime(booking.oraFine)];
      }
      return [];
    });
  
    // Aggiungo anche l'inizio e la fine della giornata
    const allTimes = [startDay, endDay, ...bookingTimes];
  
    // Rimuovo eventuali duplicati (basandomi sulla stringa formattata in "HH:mm")
    const uniqueTimesMap = {};
    allTimes.forEach(t => {
      uniqueTimesMap[t.format("HH:mm")] = t;
    });
    let uniqueTimes = Object.values(uniqueTimesMap);
  
    // Ordino tutti gli orari in ordine crescente
    uniqueTimes.sort((a, b) => a.diff(b));
  
    // Ora riempio i gap maggiori di 45 minuti: 
    // Per ogni coppia di orari adiacenti, se il gap è maggiore di 45 minuti, inserisco slot a scaglioni di 45 minuti.
    const finalSlots = [];
    for (let i = 0; i < uniqueTimes.length - 1; i++) {
      const current = uniqueTimes[i];
      const next = uniqueTimes[i + 1];
      finalSlots.push(current.clone());
      
      // Calcola il gap in minuti
      let gap = next.diff(current, "minute");
      // Se il gap è maggiore di 45, inserisco slot ogni 45 minuti
      let temp = current.clone();
      while (gap > 45) {
        temp = temp.add(45, "minute");
        // Inserisco il nuovo slot se è inferiore a quello successivo
        if (temp.isBefore(next)) {
          finalSlots.push(temp.clone());
        }
        gap = next.diff(temp, "minute");
      }
    }
    // Aggiungo l'ultimo orario (fine giornata)
    finalSlots.push(uniqueTimes[uniqueTimes.length - 1].clone());
  
    // Riordino il tutto (potrebbero non essere in ordine a causa degli inserti)
    finalSlots.sort((a, b) => a.diff(b));
    return finalSlots;
  }, [bookings, selectedDate]);

  const handleAdd = (timeSlot) => {
    navigate(
      `/addbooking?date=${selectedDate.format("YYYY-MM-DD")}&time=${timeSlot.format("HH:mm")}`
    );
  };

  const handleEdit = (idBooking) => {
    navigate(
      `/addbooking?idbooking=${idBooking}`
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
                <div className="w-100" onClick={() => handleEdit(bookingForSlot.id)}>
                  <h6 className="fw-bold mb-0" style={{ color: "#037e67" }}>
                    {bookingForSlot.cognome} {bookingForSlot.nome}
                  </h6>
                  <p className="mb-0" style={{color: "gray", fontSize: "14px", marginTop: "1px"}}>
                    CF: {bookingForSlot.codiceFiscale}
                  </p>
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
                <>
                {bookingForSlot.linkIndirizzo &&
                <IconButton color="secondary" onClick={() => {window.open(bookingForSlot.linkIndirizzo, "_blank")}}>
                  <PlaceIcon />
                </IconButton>
                }
                <IconButton color="error" onClick={() => handleDelete(bookingForSlot)}>
                  <DeleteIcon/>
                </IconButton>
                </>
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
