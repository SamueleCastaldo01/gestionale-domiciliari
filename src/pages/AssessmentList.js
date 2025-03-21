import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import useMediaQuery from "@mui/material/useMediaQuery";
import { db } from "../firebase-config";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import { Button, TextField } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { NavMobile } from "../components/NavMobile";
import { successNoty } from "../components/Notify";

export function AssessmentList() {
  const matches = useMediaQuery("(max-width:920px)");
  const user = useSelector((state) => state.auth.user);
  const uid = user?.uid;

  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nfcValues, setNfcValues] = useState({});
  const [totalNfc, setTotalNfc] = useState(0);
  const [totalAccessi, setTotalAccessi] = useState(0);

  const [searchMonth, setSearchMonth] = useState(() => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return now.toISOString().slice(0, 7);
  });
  
  // Stato per il nome operatore, inizializzato dal localStorage (se presente)
  const [operatorName, setOperatorName] = useState(() => {
    return localStorage.getItem("operatorName") || "";
  });

  const fetchSummaryData = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const summaryCollection = collection(db, "summaryTab");
      const q = query(summaryCollection, where("uid", "==", uid), where("mese", "==", searchMonth));
      const snapshot = await getDocs(q);
      const fetchedData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSummaryData(fetchedData);

      // Inizializza i valori NFC per ogni record
      const initialNfcValues = {};
      let totalNfcCount = 0;
      let totalAccessiCount = 0;

      fetchedData.forEach(item => {
        initialNfcValues[item.id] = item.nfc !== undefined ? item.nfc : "";
        totalNfcCount += item.nfc ? Number(item.nfc) : 0;
        totalAccessiCount += item.numeroAccessi ? Number(item.numeroAccessi) : 0;
      });

      setNfcValues(initialNfcValues);
      setTotalNfc(totalNfcCount);
      setTotalAccessi(totalAccessiCount);
    } catch (error) {
      console.error("Errore nel recupero dei dati:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id, newNfc) => {
    if (newNfc === "") newNfc = 0;
    try {
      const docRef = doc(db, "summaryTab", id);
      await updateDoc(docRef, { nfc: newNfc });
      successNoty("NFC aggiornato con successo!");
      fetchSummaryData();
    } catch (error) {
      console.error("Errore nell'aggiornamento del NFC:", error);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const [year, month] = searchMonth.split("-");
  
    // Titolo con font più grande
    doc.setFontSize(14);
    doc.text(`${operatorName} - ${month}/${year}`, 14, 15);
  
    // Riduzione font e miglior posizionamento
    doc.setFontSize(10);
    doc.text(`Totale NFC: ${totalNfc}    Totale Accessi: ${totalAccessi}`, 14, 22);
  
    const tableColumn = [
      "Nome Paziente",
      "Codice Fiscale",
      "NFC",
      "30 min",
      "45 min",
      "60 min",
    ];
    const tableRows = summaryData.map((row) => [
      row.nomeCompleto,
      row.codiceFiscale,
      row.nfc !== undefined ? row.nfc : "0",
      row.count30,
      row.count45,
      row.count60,
    ]);
  
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28, // Ridotto per diminuire lo spazio tra il testo e la tabella
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 160, 133] },
    });
  
    // Salva il file con il formato nome_operatore_data.pdf
    doc.save(`${operatorName}_${month}_${year}.pdf`);
  };
  

  useEffect(() => {
    fetchSummaryData();
  }, [uid, searchMonth]);

  return (
    <>
      {matches && <NavMobile text="Riepilogo Mensile" page="" />}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
        <div className="container-fluid">
          {/* TextField per inserire il nome operatore */}
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
              label="Nome Operatore pdf"
              value={operatorName}
              onChange={(e) => {
                setOperatorName(e.target.value);
                localStorage.setItem("operatorName", e.target.value);
              }}
              fullWidth
            />
          </div>

          {loading && <p>Caricamento...</p>}
          {!loading && matches && (
            <>
              {summaryData.length > 0 && (
                <div>
                  <div className="d-flex justify-content-between align-items-center">
                    <p className="mb-0">Totale NFC: {totalNfc}</p>
                    <p className="mb-0">Totale Accessi: {totalAccessi}</p>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={generatePDF}
                      startIcon={<DownloadIcon />}
                    >
                      PDF
                    </Button>
                  </div>
                </div>
              )}
              <div className="div-customer mt-3 overflow-auto pb-4" style={{ maxHeight: "75vh", overflowY: "auto" }}>
                {summaryData.map((item) => (
                  <div key={item.pazienteId} className="customer d-flex align-items-center justify-content-between py-3">
                    <div className="d-flex flex-column align-content-center justify-content-center">
                      <h5 style={{ fontSize: "17px", fontWeight: "400" }} className="mb-0">{item.nomeCompleto}</h5>
                      <h5 style={{ fontSize: "15px", fontWeight: "400", color: "gray" }} className="mt-1 mb-0">C.F. = {item.codiceFiscale}</h5>
                      <h5 style={{ fontSize: "15px", fontWeight: "400", color: "gray" }} className="mt-1 mb-0">Numero Accessi = {item.numeroAccessi}</h5>
                      <p className="mb-0" style={{ color: "gray", fontSize: "14px" }}>
                        30'= {item.count30} | 45'= {item.count45} | 60'= {item.count60}
                      </p>
                    </div>
                    <div style={{ top: "6px" }} className="d-flex flex-column justify-content-center align-items-center position-relative">
                      <form
                        className="d-flex flex-column justify-content-center align-items-center"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleEdit(item.id, nfcValues[item.id]);
                        }}
                      >
                        <TextField 
                          style={{ width: "60px" }} 
                          type="number"
                          label="NFC" 
                          value={nfcValues[item.id] !== undefined ? nfcValues[item.id] : ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setNfcValues(prev => ({ ...prev, [item.id]: value }));
                          }} 
                        />
                        <Button type="submit" className="pb-0">Aggiungi</Button>
                      </form>
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
