import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import useMediaQuery from "@mui/material/useMediaQuery";
import { db } from "../firebase-config";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import { Button, TextField, Modal, Box } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { NavMobile } from "../components/NavMobile";
import { successNoty } from "../components/Notify";
import { Select, MenuItem, FormControl, InputLabel } from "@mui/material";

export function Autodichiarazione() {
  const matches = useMediaQuery("(max-width:920px)");
  const user = useSelector((state) => state.auth.user);
  const uid = user?.uid;

  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchMonth, setSearchMonth] = useState(() => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return now.toISOString().slice(0, 7);
  });
  
  const [operatorName, setOperatorName] = useState(() => localStorage.getItem("nomeOperatore") || "");
  const [luogoDiNascita, setLuogoDiNascita] = useState(() => localStorage.getItem("luogoDiNascita") || "");
  const [luogoResidenza, setLuogoResidenza] = useState(() => localStorage.getItem("luogoResidenza") || "");
  const [dataDiNascita, setDataDiNascita] = useState(() => localStorage.getItem("dataDiNascita") || "");
  const [codiceFiscaleOperatore, setCodiceFiscaleOperatore] = useState(() => localStorage.getItem("codiceFiscaleOperatore") || "");
  const [ruoloOperatore, setRuoloOperatore] = useState(() => localStorage.getItem("ruoloOperatore") || "");

  const [openModal, setOpenModal] = useState(false);

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  const handleSaveAutodichiarazione = () => {
    localStorage.setItem("nomeOperatore", operatorName);
    localStorage.setItem("luogoDiNascita", luogoDiNascita);
    localStorage.setItem("luogoResidenza", luogoResidenza);
    localStorage.setItem("dataDiNascita", dataDiNascita);
    localStorage.setItem("codiceFiscaleOperatore", codiceFiscaleOperatore);
    localStorage.setItem("ruoloOperatore", ruoloOperatore);
    successNoty("Dati autodichiarazione salvati correttamente!");
    handleCloseModal();
  };

  const fetchSummaryData = async () => {
    if (!uid) return;
    setLoading(true);
  
    try {
      const registerCollection = collection(db, "registerTab");
  
      const lowerBound = searchMonth + "-01";
      const [year, month] = searchMonth.split("-");
      let nextYear = parseInt(year, 10);
      let nextMonth = parseInt(month, 10) + 1;
      if (nextMonth === 13) {
        nextMonth = 1;
        nextYear += 1;
      }
      const nextMonthStr = nextMonth < 10 ? `0${nextMonth}` : `${nextMonth}`;
      const upperBound = `${nextYear}-${nextMonthStr}-01`;
  
      // Query: filtra per uid e per il campo "giorno" compreso nel range
      const q = query(
        registerCollection,
        where("uid", "==", uid),
        where("giorno", ">=", lowerBound),
        where("giorno", "<", upperBound),
        where("flagAutodichiarazione", "==", true)
      );
  
      const snapshot = await getDocs(q);
      let fetchedData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  
      // Ordinamento: prima per cognome, poi per ora (assumendo ora in formato "HH:mm")
      fetchedData.sort((a, b) => {
        const cognomeA = (a.cognome || "").toLowerCase();
        const cognomeB = (b.cognome || "").toLowerCase();
        const compareCognome = cognomeA.localeCompare(cognomeB);
        if (compareCognome !== 0) return compareCognome;
        return (a.ora || "").localeCompare(b.ora || "");
      });
  
      setSummaryData(fetchedData);
    } catch (error) {
      console.error("Errore nel recupero dei dati:", error);
    } finally {
      setLoading(false);
    }
  };

  const isFormComplete = () => {
    return (
      operatorName.trim() !== "" &&
      luogoDiNascita.trim() !== "" &&
      luogoResidenza.trim() !== "" &&
      dataDiNascita.trim() !== "" &&
      codiceFiscaleOperatore.trim() !== "" &&
      ruoloOperatore.trim() !== ""
    );
  };
  


const generatePDF = () => {
    const doc = new jsPDF();
    const [year, month] = searchMonth.split("-");
  
    let yPos = 15;
    const marginLeft = 5;
    const pageWidth = doc.internal.pageSize.getWidth();
  
    const autodichText = [
      { text: "Dichiarazione sostitutiva di certificazione", bold: true },
      { text: "(art. 46 D.P.R. Dicembre 2000 n. 445)", bold: true },
      { text: "" },
      { 
        text: `Il/La sottoscritto/a ${operatorName || "Simone Savignano"}, nato/a a ${luogoDiNascita || "Ariano Irpino"} il ${dataDiNascita || "23/02/1992"}, Codice fiscale ${codiceFiscaleOperatore || "SVGSMN92B23A399K"}, in qualità di: ${ruoloOperatore} ` 
      },
      { 
        text: "consapevole che chiunque rilascia dichiarazioni mendaci è punito ai sensi del codice penale e delle leggi speciali in materia, ai sensi e per gli effetti dell'art. 46 D.P.R. n. 445/2000" 
      },
      { text: "dichiara", bold: true },
      { text: "che sui pazienti di seguito indicati, alle date ed agli orari sotto riportati, non ha effettuato la registrazione degli accessi mediante il rilevatore elettronico di presenze (gong)." },
    ];

    doc.setFontSize(7);
    autodichText.forEach((line) => {
      doc.setFont("helvetica", line.bold ? "bold" : "normal");
      const splitted = doc.splitTextToSize(line.text, pageWidth - 2 * marginLeft);
      doc.text(splitted, pageWidth / 2, yPos, { align: "center" });
      yPos += splitted.length * 5;
    });
  
    yPos += 5;
  
    const tableColumns = ["Data", "Dalle ore", "Ora fine", "Durata", "Paziente", "DS/PS", "Motivazione"];
  
    const tableRows = summaryData.map((row) => {
      const formattedData = row.giorno ? row.giorno.split("-").reverse().join("-") : "";
      return [
        formattedData,
        row.ora || "",
        row.oraFine || "",
        row.durata || "",
        `${row.cognome || ""} ${row.nome || ""}`.trim(),
        "", // DS/PS vuoto
        "apparente funzionamento del gong"
      ];
    });
  
    // Aggiungi la tabella con autoTable, includendo il piè di pagina
    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: yPos,
      styles: { fontSize: 9 }, // Testo più piccolo nella tabella
      headStyles: { fillColor: [22, 160, 133] },
      margin: { left: marginLeft, right: marginLeft }, // Riduci i margini
      didDrawPage: function (data) {
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(8);
    
        const luogoText = `Luogo: ${luogoResidenza || "Luogo non inserito"}`;
        const dataText = `Data: ${new Date().toLocaleDateString()}`;
        const firmaText = "Firma: ____________________________";
    
        // Margini per il testo
        const marginLeft = 10;
        const marginRight = 10;
    
        // Stampa data e luogo sul lato sinistro
        doc.text(`${luogoText} - ${dataText}`, marginLeft, pageHeight - 8);
    
        // Stampa la firma sul lato destro
        const firmaWidth = doc.getTextWidth(firmaText);
        doc.text(firmaText, pageWidth - firmaWidth - marginRight, pageHeight - 8);
    }
    
    });
  
    // Salva il file con nome dinamico
    doc.save(`${operatorName || "Operatore"}_Autodichiarazione_${month}_${year}.pdf`);
};
 
  useEffect(() => {
    fetchSummaryData();
  }, [uid, searchMonth]);

  return (
    <>
      {matches && <NavMobile text="Autodichiarazione" page="" />}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
        <div className="container-fluid">
          {/* Modal per inserire i dati */}
          <Modal
            open={openModal}
            onClose={handleCloseModal}
            aria-labelledby="modal-autodichiarazione-title"
            aria-describedby="modal-autodichiarazione-description"
          >
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: matches ? "90%" : 400,
                bgcolor: "background.paper",
                borderRadius: 2,
                boxShadow: 24,
                p: 4,
              }}
            >
              <h2 id="modal-autodichiarazione-title">Inserisci dati autodichiarazione</h2>
              <TextField
                fullWidth
                label="Nome Operatore"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Luogo di Nascita"
                value={luogoDiNascita}
                onChange={(e) => setLuogoDiNascita(e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Data di Nascita"
                type="date"
                value={dataDiNascita}
                onChange={(e) => setDataDiNascita(e.target.value)}
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Codice Fiscale Operatore"
                value={codiceFiscaleOperatore}
                onChange={(e) => setCodiceFiscaleOperatore(e.target.value)}
                margin="normal"
              />
              <FormControl className="mt-3" fullWidth color='primary'>
                <InputLabel >Ruolo Operatore</InputLabel>
                <Select
                    labelId="durata-select-label"
                    id="durata-select"
                    value={ruoloOperatore}
                    label="Ruolo Operatore"
                    onChange={(e) => setRuoloOperatore(e.target.value)}
                >
                      <MenuItem value="infermiere">Infermiere</MenuItem>
                    <MenuItem value="fisioterapista">Fisioterapista</MenuItem>
                    <MenuItem value="logopedista">Logopedista</MenuItem>
                    <MenuItem value="OSS">OSS</MenuItem>
                    <MenuItem value="Psicologo">Psicologo</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                fullWidth
                label="Luogo Residenza"
                value={luogoResidenza}
                onChange={(e) => setLuogoResidenza(e.target.value)}
                margin="normal"
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button onClick={handleCloseModal} sx={{ mr: 1 }}>Annulla</Button>
                <Button variant="contained" onClick={handleSaveAutodichiarazione}>Salva</Button>
              </Box>
            </Box>
          </Modal>

          {/* TextField per selezionare il mese */}
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

          {/* Visualizzazione nome operatore (utilizzato anche nel PDF) */}
          <div className="d-flex justify-content-center" style={{ marginBottom: "1rem" }}>
            <Button variant="contained" color="primary" onClick={handleOpenModal}>
              Inserisci dati autodichiarazione
            </Button>
          </div>

          {loading && <p>Caricamento...</p>}
          {!loading && matches && (
            <>
            {summaryData.length > 0 && (
              <div className="d-flex justify-content-center align-items-center">
                {isFormComplete() ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={generatePDF}
                    startIcon={<DownloadIcon />}
                  >
                    PDF
                  </Button>
                ) : (
                  <p style={{ color: "red", fontWeight: "bold", textAlign: "center" }}>
                    Compila tutti i campi per poter scaricare il PDF
                  </p>
                )}
              </div>
            )}

              <div className="div-customer mt-3 overflow-auto pb-4" style={{ maxHeight: "75vh", overflowY: "auto" }}>
                {summaryData.map((item) => (
                  <div key={item.pazienteId} className="customer d-flex align-items-center justify-content-between py-3">
                    <div className="d-flex flex-column align-content-center justify-content-center">
                      <h5 style={{ fontSize: "17px", fontWeight: "400" }} className="mb-0">{item.cognome} {item.nome}</h5>
                      <h5 style={{ fontSize: "15px", fontWeight: "400", color: "gray" }} className="mt-1 mb-0">
                        C.F. = {item.codiceFiscale}
                      </h5>
                      <p className="mb-0" style={{ color: "gray", fontSize: "14px" }}>
                        Giorno = {item.giorno.split("-").reverse().join("-")}
                      </p>
                      <p className="mb-0" style={{ color: "gray", fontSize: "14px" }}>
                        Ora Inizio = {item.ora} <span className="ms-3">Ora Fine = {item.oraFine}</span>
                      </p>
                      <p className="mb-0" style={{ color: "gray", fontSize: "14px" }}>
                        durata = {item.durata}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}
