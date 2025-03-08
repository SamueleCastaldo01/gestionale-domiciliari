import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, Timestamp, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase-config";
import { successNoty, errorNoty } from "../components/Notify";
import TargaInput from "../components/TargaInput";
import AggiungiScheda from "../components/AggiungiScheda";

export function AddSchede() {
  const navigate = useNavigate();
  const [targa, setTarga] = useState(localStorage.getItem("selectTarga") || "");
  const [veicoloTrovato, setVeicoloTrovato] = useState(false);
  const [messaggio, setMessaggio] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentTarghe, setRecentTarghe] = useState([]);
  const [showAggiungiScheda, setShowAggiungiScheda] = useState(false);
  
  const [idCust, setIdCust] = useState("");
  const [cliente, setCliente] = useState("");
  const [username, setUsername] = useState("");
  const [telefono, setTelefono] = useState("");
  const [veicolo, setVeicolo] = useState("");
  const [idScheda, setIdScheda] = useState("");
  const [dataScheda, setDataScheda] = useState([]);

  useEffect(() => {
    const storedTarghe = JSON.parse(localStorage.getItem("recentTarghe")) || [];
    setRecentTarghe(storedTarghe);
  }, []);

  //serve per resettare il local store della targa poi quando vado a cambiare pagina
  useEffect(() => {
    localStorage.setItem("selectTarga", "");
  },[targa])

  // Funzione per cercare il veicolo
  const handleCercaVeicolo = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "veicoloTab"),
        where("targa", "==", targa.toUpperCase())
      );
      const querySnapshot = await getDocs(q);
      setLoading(false);
  
      if (querySnapshot.empty) {
        setVeicoloTrovato(false);
        setMessaggio("Veicolo non trovato");
        errorNoty("Veicolo non trovato");
      } else {
        const veicoloData = querySnapshot.docs[0].data();
        const { idCustomer, marca, nomeModello } = veicoloData;
        setVeicolo(`${marca} ${nomeModello}`);
  
        setIdCust(idCustomer);
        const customerDocRef = doc(db, "customersTab", idCustomer);
        const customerDoc = await getDoc(customerDocRef);
  
        if (customerDoc.exists()) {
          const customerData = customerDoc.data();
          setUsername(customerData.username);
          setTelefono(customerData.telefono);
          setCliente(customerData.nome + " " + customerData.cognome)
        } else {
          setCliente("Cliente non trovato");
          setTelefono("");
        }
  
        setVeicoloTrovato(true);
        setMessaggio("Veicolo trovato");
        saveRecentTarga(targa.toUpperCase());
      }
    } catch (error) {
      setLoading(false);
      errorNoty("Errore durante la ricerca.");
    }
  };
//----------------------------------------------------------------------------
  const saveRecentTarga = (targa) => {
    const storedTarghe = JSON.parse(localStorage.getItem("recentTarghe")) || [];
    if (!storedTarghe.includes(targa)) {
      storedTarghe.unshift(targa);
      const uniqueTarghe = [...new Set(storedTarghe)];
      const recentTarghe = uniqueTarghe.slice(0, 10);
      localStorage.setItem("recentTarghe", JSON.stringify(recentTarghe));
      setRecentTarghe(recentTarghe);
    }
  };
//----------------------------------------------------------------------------
  const handleTargaChange = (newInputValue) => {
    setTarga(newInputValue);
    setVeicoloTrovato(false);
    setMessaggio("");
  };
//----------------------------------------------------------------------------
  const handleCreaSchedaClick = async () => {
    try {
      const dataScheda = [{
        descrizione: "",
        note: "",
        qt: "1",
        prezzo: "",
        sconto: "0",
        totale: "",
      }];
  
      // Aggiungi l'array di manodopera con un oggetto vuoto
      const manodopera = [{
        qt: "",
        prezzo: "",
        sconto: "",
        totale: "",
      }];

      const dataLocale = new Date();
  
      const nuovaScheda = {
        idCustomer: idCust,
        targa,
        username,
        cliente,
        telefono,
        veicolo,
        chilometraggio: 0,
        dataCreazione: Timestamp.fromDate(dataLocale),
        dataScheda,
        manodopera, 
        totale: "0",
        pagato: "0",
        sconto: "0",
        resto: "0"
      };
  
      const docRef = await addDoc(collection(db, "schedaDiLavoroTab"), nuovaScheda);
      successNoty("Scheda creata con successo!");
      localStorage.setItem("selectTarga", "");
      // Resetta i campi
      setIdScheda(docRef.id);
      navigate("/aggiungischeda1/" + docRef.id)
    } catch (error) {
      errorNoty("Errore durante la creazione della scheda.");
      console.error("Errore: ", error);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
      <div className="container-fluid">
        <h2 className="titlePage">Aggiungi Scheda di Lavoro</h2>
        {!showAggiungiScheda ? (
          <TargaInput
            targa={targa}
            setTarga={setTarga}
            handleTargaChange={handleTargaChange}
            handleCercaVeicolo={handleCercaVeicolo}
            loading={loading}
            veicoloTrovato={veicoloTrovato}
            messaggio={messaggio}
            recentTarghe={recentTarghe}
            onCreaScheda={() => {
              setShowAggiungiScheda(true);
              handleCreaSchedaClick(); // Crea scheda
            }}
          />
        ) : (
          <div>
            <AggiungiScheda idScheda={idScheda} targa={targa} cliente={cliente} telefono={telefono} veicolo={veicolo} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
