import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import useMediaQuery from "@mui/material/useMediaQuery";
import { db } from "../firebase-config";
import { collection, getDocs, query, where } from "firebase/firestore";

import { TextField } from "@mui/material";
import { StyledDataGrid } from "../components/StyledDataGrid";
import { itIT } from "@mui/x-data-grid/locales";
import { NavMobile } from "../components/NavMobile";

export function AssessmentList() {
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

  // Funzione per recuperare i dati dalla tabella summaryTab
  const fetchSummaryData = async () => {
    if (!uid) return;
    
    setLoading(true);
    try {
      const summaryCollection = collection(db, "summaryTab");
      const q = query(summaryCollection, where("uid", "==", uid), where("mese", "==", searchMonth));
      const snapshot = await getDocs(q);

      const fetchedData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSummaryData(fetchedData);
    } catch (error) {
      console.error("Errore nel recupero dei dati:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryData();
  }, [uid, searchMonth]);

  // Colonne per la DataGrid
  const columns = [
    { field: "nomeCompleto", headerName: "Nome Paziente", width: 200 },
    { field: "Codice Fiscale", headerName: "Codice Fiscale", width: 200 },
    { field: "numeroAccessi", headerName: "N. Accessi", width: 120 },
    { field: "count30", headerName: "30 min", width: 100 },
    { field: "count45", headerName: "45 min", width: 100 },
    { field: "count60", headerName: "60 min", width: 100 },
  ];

  return (
    <>
      {matches && <NavMobile text="Riepilogo Mensile" page="" />}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
        <div className="container-fluid">
          <div style={{ marginBottom: "1rem" }}>
            <TextField
              type="month"
              label="Seleziona Mese"
              value={searchMonth}
              onChange={(e) => setSearchMonth(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </div>

          {loading && <p>Caricamento...</p>}
          {!loading && matches && (
            <div className="div-customer mt-3 overflow-auto pb-4" style={{ maxHeight: "75vh", overflowY: "auto" }}>
              {summaryData.map((item) => (
                <div key={item.pazienteId} className="customer d-flex align-items-center justify-content-between py-3">
                  <div>
                    <h5 style={{ fontSize: "17px", fontWeight: "400" }} className="mb-0">{item.nomeCompleto}</h5>
                    <h5 style={{ fontSize: "15px", fontWeight: "400", color: "gray" }} className="mt-1 mb-0">Codice Fiscale: {item.codiceFiscale}</h5>
                    <p className="mb-0" style={{ color: "gray", fontSize: "14px" }}>NFC: {item.numeroAccessi}</p>
                    <p className="mb-0" style={{ color: "gray", fontSize: "14px" }}>
                      30': {item.count30} | 45': {item.count45} | 60': {item.count60}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !matches && (
            <div style={{ height: 500, width: "100%" }}>
              <StyledDataGrid rows={summaryData} columns={columns} getRowId={(row) => row.pazienteId} localeText={itIT.components.MuiDataGrid.defaultProps.localeText} />
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
