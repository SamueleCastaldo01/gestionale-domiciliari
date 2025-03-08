import React, { useEffect, useState } from "react";
import { TextField, Button, Checkbox, CircularProgress, } from "@mui/material";
import { db } from "../firebase-config";
import { motion } from "framer-motion";
import moment from "moment";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import InputAdornment from "@mui/material/InputAdornment";
import { useNavigate, useParams } from "react-router-dom";

const AggiungiScheda = ({  }) => {
  const { id } = useParams();
  const [dataScheda, setDataScheda] = useState([]);
  const [manodopera, setManodopera] = useState([
    {
      qt: "1",
      prezzo: "",
      sconto: "0",
      totale: "",
    },
  ]);
  const [infoScheda, setInfoScheda] = useState({});
  const [dataCorrente, setDataCorrente] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [pagato, setPagato] = useState("");
  const [loading, setLoading] = useState(true);
  const [resta, setResta] = useState(0);
  const [sconto, setSconto] = useState("");
  const [chilometraggio, setChilometraggio] = useState(0);
  const [note, setNote] = useState("");
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    if (!id) return;
  
    const docRef = doc(db, "schedaDiLavoroTab", id);
    const docSnap = await getDoc(docRef);
  
    if (docSnap.exists()) {
      const data = docSnap.data();
      setInfoScheda(data);
      setPagato(data.pagato);
      setResta(data.resta || 0);
      setSconto(data.sconto || 0);
      
      // Usa moment per formattare il timestamp
      const formattedDate = data.dataCreazione ? moment(data.dataCreazione.toDate()).format("DD/MM/YYYY") : "";
      setDataCorrente(formattedDate);
      
      setChilometraggio(data.chilometraggio || 0);
      setDataScheda(data.dataScheda || []);
      setManodopera(data.manodopera || []);
      setLoading(false);
    } else {
      console.log("Nessun documento trovato!");
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);


  const handleAddDescription = async () => {
    const newItem = {
      descrizione: "",
      note: "",
      qt: "1",
      prezzo: "",
      sconto: "0",
      totale: "",
    };

    const docRef = doc(db, "schedaDiLavoroTab", id);
    await updateDoc(docRef, {
      dataScheda: [...dataScheda, newItem],
    });

    fetchData();
  };

  const handlePagatoChange = async (value) => {
    const newPagato = value === "" ? "" : value; // Rimuovi la conversione in numero
    setPagato(newPagato);
    await updatePagatoInDatabase(newPagato);
  
    const resto = ((calculateTotal(manodopera, dataScheda) - pagato) - sconto).toFixed(2); // Usa Number solo se newPagato non è vuoto
    await updateRestoInDatabase(resto);
  };

  const handleScontoChange = async (value) => {
    const newSconto = value === "" ? "" : value; // Mantieni come stringa
  
    // Calcola il nuovo valore di resto
    const currentSconto = newSconto === "" ? 0 : Number(newSconto); // Converti in numero solo per il calcolo
    const totaleComplessivo = calculateTotal(manodopera, dataScheda) - pagato;
    const newResto = (totaleComplessivo - currentSconto).toFixed(2); // Sottrai il valore dello sconto

  
    // Aggiorna lo stato
    setSconto(newSconto);
    setResta(newResto);
  
    // Aggiorna anche il database
    await updateDoc(doc(db, "schedaDiLavoroTab", id), {
      sconto: newSconto,
      resto: newResto,
    });
  };

  const updatePagatoInDatabase = async (newPagato) => {
    const docRef = doc(db, "schedaDiLavoroTab", id);
    await updateDoc(docRef, {
      pagato: newPagato,
    });
  };

  const updateRestoInDatabase = async (resto) => {
    const docRef = doc(db, "schedaDiLavoroTab", id);
    await updateDoc(docRef, {
      resto: resto,
    });
  };

  const handleChilometraggioChange = async (value) => {
    const newChilometraggio = value === "" ? "" : value; // Mantieni come stringa
    setChilometraggio(newChilometraggio);
  
    const docRef = doc(db, "schedaDiLavoroTab", id);
    await updateDoc(docRef, {
      chilometraggio: newChilometraggio,
    });
  };





  //----------------------------------------------------
  //mi serve sarebbe input riga descrizione, me lo salva anche nel database
  const handleLocalFieldChange = (index, field, value) => {
    const updatedDataScheda = [...dataScheda];
    updatedDataScheda[index][field] = value; // Aggiorna solo lo stato locale
    setDataScheda(updatedDataScheda);
  };

  const handleFieldSave = async (index, field, value) => {
    const updatedDataScheda = [...dataScheda];
    updatedDataScheda[index][field] = value;
  
    const qt = Number(updatedDataScheda[index].qt) || 0;
    const prezzo = Number(updatedDataScheda[index].prezzo) || 0;
    const sconto = Number(updatedDataScheda[index].sconto) || 0;
    updatedDataScheda[index].totale = (
      prezzo *
      qt *
      (1 - sconto / 100)
    ).toFixed(2);
  
    setDataScheda(updatedDataScheda);
    
    // Salvataggio nel database
    await updateDataSchedaInDatabase(updatedDataScheda);
  
    const totaleComplessivo = calculateTotal(manodopera, updatedDataScheda);
    await updateTotalInDatabase(totaleComplessivo);
  };
 //------------------------------------------------------------  
  //qui sarebbe la stessa cosa di sopra solamente che riguarda
  const handleLocalManodoperaChange = (index, field, value) => {
    const updatedManodopera = [...manodopera];
    updatedManodopera[index][field] = value; // Aggiorna lo stato locale
    setManodopera(updatedManodopera);
  };

  const handleManodoperaFieldSave = async (index, field, value) => {
    const updatedManodopera = [...manodopera];
    updatedManodopera[index][field] = value;

    const qt = Number(updatedManodopera[index].qt) || 0;
    const prezzo = Number(updatedManodopera[index].prezzo) || 0;
    const sconto = Number(updatedManodopera[index].sconto) || 0;
    updatedManodopera[index].totale = (
      prezzo *
      qt *
      (1 - sconto / 100)
    ).toFixed(2);

    setManodopera(updatedManodopera);

    // Salvataggio nel database
    await updateManodoperaInDatabase(updatedManodopera);

    const totaleComplessivo = calculateTotal(updatedManodopera, dataScheda);
    await updateTotalInDatabase(totaleComplessivo);
  };

  const updateManodoperaInDatabase = async (updatedManodopera) => {
    const docRef = doc(db, "schedaDiLavoroTab", id);
    await updateDoc(docRef, {
      manodopera: updatedManodopera,
    });
  };
 //------------------------------------------------------------  

  const handleCheckboxChange = (index) => {
    const updatedSelectedItems = [...selectedItems];
    if (updatedSelectedItems.includes(index)) {
      updatedSelectedItems.splice(updatedSelectedItems.indexOf(index), 1);
    } else {
      updatedSelectedItems.push(index);
    }
    setSelectedItems(updatedSelectedItems);
  };

  const handleDeleteSelected = async () => {
    const updatedDataScheda = dataScheda.filter(
      (_, index) => !selectedItems.includes(index)
    );

    const docRef = doc(db, "schedaDiLavoroTab", id);
    await updateDoc(docRef, {
      dataScheda: updatedDataScheda,
    });

    setDataScheda(updatedDataScheda);
    setSelectedItems([]);

    const totaleComplessivo = calculateTotal(manodopera, updatedDataScheda);
    await updateTotalInDatabase(totaleComplessivo);
  };

  // Calcolo del totale
  const calculateTotal = (manodoperaData, dataSchedaData) => {
    const dataTotale = dataSchedaData.reduce(
      (acc, item) => acc + (Number(item.totale) || 0),
      0
    );
    const manodoperaTotale = manodoperaData.reduce(
      (acc, item) => acc + (Number(item.totale) || 0),
      0
    );
    return (dataTotale + manodoperaTotale).toFixed(2);
  };

  const updateDataSchedaInDatabase = async (updatedDataScheda) => {
    const docRef = doc(db, "schedaDiLavoroTab", id);
    await updateDoc(docRef, {
      dataScheda: updatedDataScheda,
    });
  };

  const updateTotalInDatabase = async (totaleComplessivo) => {
    const docRef = doc(db, "schedaDiLavoroTab", id);
    await updateDoc(docRef, {
      totale: totaleComplessivo,
      resto: (totaleComplessivo - pagato - sconto).toFixed(2)
    });
  };

  const { cliente, veicolo, telefono, targa } = infoScheda;

  return (
    <>
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
    <div className="mt-4">
      <div className="d-flex align-items-center justify-content-between">
        <TextField
          className="w-100"
          required
          label="Cliente"
          value={cliente || ""}
          disabled
          variant="outlined"
          color="tertiary"
        />
        <TextField
          className="w-100"
          required
          label="Veicolo"
          value={veicolo || ""}
          disabled
          variant="outlined"
          color="tertiary"
        />
        <TextField
          style={{ width: "75%" }}
          required
          label="Data"
          value={dataCorrente}
          disabled
          variant="outlined"
          color="tertiary"
        />
        <TextField
          style={{ width: "75%" }}
          required
          label="Telefono"
          value={telefono || ""}
          disabled
          variant="outlined"
          color="tertiary"
        />
        <TextField
          style={{ width: "75%" }}
          required
          label="Targa"
          value={targa || ""}
          disabled
          variant="outlined"
          color="tertiary"
        />
        <TextField
          className="w-100"
          required
          label="Chilometraggio"
          value={chilometraggio}
          onChange={(e) => handleChilometraggioChange(e.target.value)}
          variant="outlined"
          color="tertiary"
          InputProps={{
            endAdornment: <InputAdornment position="end">Km</InputAdornment>,
          }}
        />
      </div>

      <div className="mt-5 d-flex justify-content-center">
        <Button
          className="me-2"
          variant="contained"
          onClick={handleAddDescription}
        >
          Aggiungi Descrizione
        </Button>
        <Button
          className="me-2"
          variant="contained"
          color="error"
          onClick={handleDeleteSelected}
          disabled={selectedItems.length === 0}
        >
          Elimina {selectedItems.length > 0 && `(${selectedItems.length})`}
        </Button>
        <Button
          className="me-2"
          variant="contained"
          onClick={() => {window.open("/stampascheda/" +id, '_blank')}}
        >
          Stampa
        </Button>
        <div>
          <h6
            className="p-3 rounded-5 mb-0"
            style={{ backgroundColor: "#1E1E1E" }}
          >
            Totale: € {calculateTotal(manodopera, dataScheda)}
          </h6>
        </div>
      </div>

      <div className="row mt-1">
        <div className="descrizione pe-0 col-1 text-center">
          <h5 className="mb-0"></h5>
        </div>
        <div className="descrizione pe-0 col-4 text-center">
          <h5 className="mb-0">Descrizione</h5>
        </div>
        <div className="descrizione pe-0 col-3 text-center">
          <h5 className="mb-0">Nota</h5>
        </div>
        <div className="qt px-0 col-1 text-center">
          <h5 className="mb-0">QtA'</h5>
        </div>
        <div className="prezzo px-0 col-1 text-center">
          <h5 className="mb-0">Prezzo</h5>
        </div>
        <div className="sconto % px-0 col-1 text-center">
          <h5 className="mb-0">Sconto</h5>
        </div>
        <div className="totale ps-0 col-1 text-center">
          <h5 className="mb-0">Totale</h5>
        </div>
      </div>

      {loading && <div className="text-center"><CircularProgress/></div>}

      {dataScheda.map((item, index) => (
        <div className="row d-flex align-items-center" key={index}>
          <div className="descrizione pe-0 col-1 text-center">
            <Checkbox
              checked={selectedItems.includes(index)}
              onChange={() => handleCheckboxChange(index)}
            />
          </div>
          {/**DESCRIZIONE ----------------------------------------------------------------------------------------------------- */}
          <div className="descrizione px-0 col-4 text-center">
            <TextField
              className="w-100 h-100 mt-2"
              variant="outlined"
              color="tertiary"
              value={item.descrizione || ""}
              onChange={(e) => handleLocalFieldChange(index, "descrizione", e.target.value)}
              onBlur={(e) => handleFieldSave(index, "descrizione", e.target.value)}
            />
          </div>
          <div className="note px-0 col-3 text-center">
            <TextField
              className="w-100 h-100 mt-2"
              variant="outlined"
              color="tertiary"
              value={item.note || ""}
              onChange={(e) => handleLocalFieldChange(index, "note", e.target.value)}
              onBlur={(e) => handleFieldSave(index, "note", e.target.value)}
            />
          </div>
          <div className="qt px-0 col-1 text-center">
            <TextField
              className="w-100 mt-2"
              variant="outlined"
              color="tertiary"
              type="number"
              value={item.qt || ""}
              onChange={(e) => handleLocalFieldChange(index, "qt", e.target.value)}
              onBlur={(e) => handleFieldSave(index, "qt", e.target.value)}
            />
          </div>
          <div className="prezzo px-0 col-1 text-center">
            <TextField
              className="w-100 mt-2"
              variant="outlined"
              color="tertiary"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">€</InputAdornment>
                ),
              }}
              type="number"
              value={item.prezzo || ""}
              onChange={(e) => handleLocalFieldChange(index, "prezzo", e.target.value)}
              onBlur={(e) => handleFieldSave(index, "prezzo", e.target.value)}
            />
          </div>
          <div className="sconto % px-0 col-1 text-center">
            <TextField
              className="w-100 mt-2"
              variant="outlined"
              color="tertiary"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">%</InputAdornment>
                ),
              }}
              type="number"
              value={item.sconto || ""}
              onChange={(e) => handleLocalFieldChange(index, "sconto", e.target.value)}
              onBlur={(e) => handleFieldSave(index, "sconto", e.target.value)}
            />
          </div>
          <div className="totale ps-0 col-1 text-center">
            <TextField
              className="w-100 mt-2"
              variant="outlined"
              color="tertiary"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">€</InputAdornment>
                ),
              }}
              value={item.totale || ""}
              disabled
            />
          </div>
        </div>
      ))}

      {manodopera.map((item, index) => (
        <div className="row d-flex align-items-center" key={index}>
          <div className="descrizione pe-0 col-1 text-center"></div>
      {/**MANODOPERA ----------------------------------------------------------------------------------------------------- */}
          <div className="descrizione px-0 col-7 text-center">
            <TextField
              className="w-100 h-100 mt-2"
              variant="outlined"
              color="tertiary"
              value="Manodopera"
              disabled
            />
          </div>
          <div className="qt px-0 col-1 text-center">
            <TextField
              className="w-100 mt-2"
              variant="outlined"
              color="tertiary"
              type="number"
              value={item.qt || ""}
              onChange={(e) => handleLocalManodoperaChange(index, "qt", e.target.value)}
              onBlur={(e) => handleManodoperaFieldSave(index, "qt", e.target.value)}
            />
          </div>
          <div className="prezzo px-0 col-1 text-center">
            <TextField
              className="w-100 mt-2"
              variant="outlined"
              color="tertiary"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">€</InputAdornment>
                ),
              }}
              type="number"
              value={item.prezzo || ""}
              onChange={(e) => handleLocalManodoperaChange(index, "prezzo", e.target.value)}
              onBlur={(e) => handleManodoperaFieldSave(index, "prezzo", e.target.value)}
            />
          </div>
          <div className="sconto % px-0 col-1 text-center">
            <TextField
              className="w-100 mt-2"
              variant="outlined"
              color="tertiary"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">%</InputAdornment>
                ),
              }}
              type="number"
              value={item.sconto || ""}
              onChange={(e) => handleLocalManodoperaChange(index, "sconto", e.target.value)}
              onBlur={(e) => handleManodoperaFieldSave(index, "sconto", e.target.value)}
            />
          </div>
          <div className="totale ps-0 col-1 text-center">
            <TextField
              className="w-100 mt-2"
              variant="outlined"
              color="tertiary"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">€</InputAdornment>
                ),
              }}
              value={item.totale || ""}
              disabled
            />
          </div>
        </div>
      ))}

      <div className="row">
         {/**TOTALI ----------------------------------------------------------------------------------------------------- */}
        <div className="col-8 pe-0"></div>
        <div className="col-4 ps-0">
          <TextField
            className="w-100 mt-2"
            variant="outlined"
            color="tertiary"
            disabled
            value={calculateTotal(manodopera, dataScheda)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">Totale: €</InputAdornment>
              ),
            }}
            type="number"
          />
          <TextField
            className="w-100 mt-2"
            variant="outlined"
            color="tertiary"
            value={pagato} // Assicurati che questo sia il valore corretto
            onChange={(e) => handlePagatoChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">Pagato: €</InputAdornment>
              ),
            }}
            type="number"
          />
          <TextField
            className="w-100 mt-2"
            variant="outlined"
            color="tertiary"
            value={sconto}
            onChange={(e) => handleScontoChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">Sconto: €</InputAdornment>
              ),
            }}
            type="number"
          />
          <TextField
            className="w-100 mt-2"
            variant="outlined"
            color="tertiary"
            disabled
            value={((calculateTotal(manodopera, dataScheda) - pagato) - sconto).toFixed(2)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">Resta: €</InputAdornment>
              ),
            }}
            type="number"
          />
        </div>
      </div>
    </div>
    </motion.div>

    </>
  );
};

export default AggiungiScheda;
