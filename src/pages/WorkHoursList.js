import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import useMediaQuery from "@mui/material/useMediaQuery";
import { db } from "../firebase-config";
import { collection, getDocs, query, where, updateDoc, doc, getDoc, setDoc } from "firebase/firestore";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import { Button, TextField } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { NavMobile } from "../components/NavMobile";
import { successNoty } from "../components/Notify";
import CircularProgress from "@mui/material/CircularProgress"; // Importa CircularProgress

export function WorkHoursList() {
  const user = useSelector((state) => state.auth.user);
  const uid = user?.uid;

  const [workHoursData, setWorkHoursData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchMonth, setSearchMonth] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 7); // "YYYY-MM"
  });

  // Stato per il nome operatore, inizializzato dal localStorage (se presente)
  const [operatorName, setOperatorName] = useState(() => {
    return localStorage.getItem("operatorName") || "";
  });

  const fetchWorkHoursData = async () => {
    if (!uid) return;
    setLoading(true);

    try {
      const workHoursCollection = collection(db, "workHoursTab");
      const q = query(workHoursCollection, where("uid", "==", uid), where("mese", "==", searchMonth));
      const snapshot = await getDocs(q);

      const fetchedData = snapshot.docs.map((doc) => doc.data());
      setWorkHoursData(fetchedData);
    } catch (error) {
      console.error("Errore nel recupero dei dati:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (dayData) => {
    const count30 = dayData?.count30 || 0;
    const count45 = dayData?.count45 || 0;
    const count60 = dayData?.count60 || 0;

    // Calcola il totale dei minuti
    const totalMinutes = count30 * 30 + count45 * 45 + count60 * 60;

    // Converti i minuti in ore e minuti
    const hours = Math.floor(totalMinutes / 60); // Ore intere
    const minutes = totalMinutes % 60; // Minuti rimanenti

    return { count30, count45, count60, totalHours: `${hours} ore e ${minutes} minuti` };
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const [year, month] = searchMonth.split("-");

    // Colonne della tabella
    const tableColumns = ["Giorno", "30 min", "45 min", "60 min", "Totale ore"];

    let total30 = 0;
    let total45 = 0;
    let total60 = 0;

    // Righe della tabella
    const tableRows = [];

    const daysInMonth = new Date(year, month, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayKey = `${searchMonth}-${String(day).padStart(2, "0")}`;
      const dayData = workHoursData.find((item) => item.giorno === dayKey);

      const count30 = dayData?.count30 || 0;
      const count45 = dayData?.count45 || 0;
      const count60 = dayData?.count60 || 0;

      const totalHours = count30 * 0.5 + count45 * 0.75 + count60;

      tableRows.push([day, count30, count45, count60, totalHours.toFixed(2)]);

      total30 += count30;
      total45 += count45;
      total60 += count60;
    }

    const totalHoursOverall = total30 * 0.5 + total45 * 0.75 + total60;

    tableRows.push(["Totale", total30, total45, total60, totalHoursOverall.toFixed(2)]);

    // Aggiungi il titolo
    doc.setFontSize(12);
    doc.text("Scheda Riepilogativa Accessi/Ore", 105, 10, { align: "center" });

    const titleSpacing = 10; 

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 20 + titleSpacing, 
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 160, 133] },
      bodyStyles: { fillColor: [255, 255, 255] },
      footStyles: { fillColor: [22, 160, 133], textColor: [255, 255, 255] },
      didDrawPage: (data) => {
        doc.setFontSize(10);
        doc.text(
          `Nome Operatore: ${operatorName} | Mese: ${month} | Anno: ${year}`,
          14,
          20
        );
      },
      didDrawCell: (data) => {
        if (data.row.index === tableRows.length - 1) {
          data.cell.styles.fillColor = [22, 160, 133];
          data.cell.styles.textColor = [255, 255, 255];
        }
      },
    });

    doc.save(`Ore_Lavorate_${operatorName}_${month}_${year}.pdf`);
  };

  const calculateWorkHours = async () => {
    if (!uid) return;
  
    setLoading(true);
  
    const [year, month] = searchMonth.split("-");
    const daysInMonth = new Date(year, month, 0).getDate();
  
    for (let day = 1; day <= daysInMonth; day++) {
      const giornoKey = `${searchMonth}-${String(day).padStart(2, "0")}`;
  
      try {
        const workHoursDocRef = doc(db, "workHoursTab", `${uid}_${giornoKey}`);
        const workHoursDocSnap = await getDoc(workHoursDocRef);
  
        if (workHoursDocSnap.exists()) {
          console.log(`Giorno ${giornoKey} già presente in workHoursTab.`);
          continue;
        }
  
        const registerQuery = query(
          collection(db, "registerTab"),
          where("uid", "==", uid),
          where("giorno", "==", giornoKey)
        );
        const registerSnapshot = await getDocs(registerQuery);
  
        if (registerSnapshot.empty) {
          console.log(`Nessun registro trovato per il giorno ${giornoKey}.`);
          continue;
        }
  
        let count30 = 0;
        let count45 = 0;
        let count60 = 0;
  
        registerSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.durata === 30) count30++;
          if (data.durata === 45) count45++;
          if (data.durata === 60) count60++;
        });
  
        await setDoc(workHoursDocRef, {
          uid,
          giorno: giornoKey,
          mese: searchMonth,
          count30,
          count45,
          count60,
        });
      } catch (error) {
        console.error(`Errore nel calcolo delle ore per il giorno ${giornoKey}:`, error);
      }
    }
  
    setLoading(false);
    successNoty("Calcolo completato!");
  
    fetchWorkHoursData();
  };

  useEffect(() => {
    fetchWorkHoursData();
  }, [uid, searchMonth]);

  return (
    <>
 <NavMobile text="Ore di lavoro" page="workhourslist" />
    <div className="container-fluid">
      <div style={{ marginBottom: "1rem" }}>
        <TextField
          type="month"
          label="Seleziona Mese"
          value={searchMonth}
          onChange={(e) => setSearchMonth(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <TextField
          label="Nome Operatore PDF"
          value={operatorName}
          onChange={(e) => {
            setOperatorName(e.target.value);
            localStorage.setItem("operatorName", e.target.value);
          }}
          fullWidth
        />
      </div>

      {loading && <p>Caricamento...</p>}
      {!loading && (
        <>
          <div className="totals-summary">
  {(() => {
    let total30 = 0;
    let total45 = 0;
    let total60 = 0;
    let totalMinutesOverall = 0;

    workHoursData.forEach((dayData) => {
      total30 += dayData?.count30 || 0;
      total45 += dayData?.count45 || 0;
      total60 += dayData?.count60 || 0;

      // Calcola i minuti totali per il mese
      totalMinutesOverall += (dayData?.count30 || 0) * 30;
      totalMinutesOverall += (dayData?.count45 || 0) * 45;
      totalMinutesOverall += (dayData?.count60 || 0) * 60;
    });

    // Converti i minuti totali in ore e minuti
    const totalHours = Math.floor(totalMinutesOverall / 60);
    const totalMinutes = totalMinutesOverall % 60;

    return (
      <div>
        <h5 style={{ fontWeight: "500" }}>Totali del mese:</h5>
        <p style={{ margin: 0, fontSize: "14px" }}>
          30: {total30} | 45: {total45} | 60: {total60} | Totale ore: {totalHours} ore e {totalMinutes} minuti
        </p>
      </div>
    );
  })()}
</div>

        <div className="mt-3 d-flex justify-content-between px-3">
        <Button
            variant="contained"
            color="primary"
            onClick={generatePDF}
            disabled={!operatorName.trim()} // Disabilita il pulsante se il nome operatore è vuoto
          >
            Genera PDF
          </Button>

          <Button
            variant="contained"
            color="primary"
            onClick={calculateWorkHours}
            disabled={loading} // Disabilita il pulsante durante il caricamento
            startIcon={loading && <CircularProgress size={20} color="inherit" />} // Mostra il cerchio che gira
          >
            {loading ? "Calcolo in corso..." : "Calcola le ore"}
          </Button>
        </div>
        

          <div className="div-customer mt-3 overflow-auto pb-4" style={{ maxHeight: "75vh", overflowY: "auto" }}>
            {Array.from({ length: new Date(searchMonth.split("-")[0], searchMonth.split("-")[1], 0).getDate() }, (_, i) => {
              const day = i + 1;
              const dayKey = `${searchMonth}-${String(day).padStart(2, "0")}`;
              const dayData = workHoursData.find((item) => item.giorno === dayKey);
              const { count30, count45, count60, totalHours } = calculateTotals(dayData);

              return (
                <div key={day} className="customer d-flex align-items-center justify-content-between py-3">
                  <div>
                    <h5 style={{ fontSize: "17px", fontWeight: "400" }} className="mb-0">
                      Giorno {day}
                    </h5>
                    <p className="mb-0" style={{ color: "gray", fontSize: "14px" }}>
                      30: {count30} | 45: {count45} | 60: {count60} | Totale ore: {totalHours}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
    </>
  );
}
