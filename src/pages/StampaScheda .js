import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ReactToPrint from "react-to-print";
import { db } from "../firebase-config";
import moment from "moment"; // Assicurati di avere moment.js installato

export function StampaScheda() {
    const { id } = useParams();
    const ref = useRef();
    const [infoScheda, setInfoScheda] = useState({});
    const [cliente, setCliente] = useState("");
    const [username, setUsername] = useState("");
    const [dataScheda, setDataScheda] = useState([]);
    const [pagato, setPagato] = useState("");
    const [resta, setResta] = useState(0);
    const [sconto, setSconto] = useState("");
    const [totale, setTotale] = useState(""); 
    const [chilometraggio, setChilometraggio] = useState(0);
    const [manodopera, setManodopera] = useState([
        {
            qt: "1",
            prezzo: "",
            sconto: "0",
            totale: "",
        },
    ]);

    const fetchData = async () => {
        if (!id) return;

        const docRef = doc(db, "schedaDiLavoroTab", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            setInfoScheda(data);
            setPagato(data.pagato);
            
            setCliente(data.cliente);
            setUsername(data.username)
            setResta(data.resto || 0);
            setSconto(data.sconto || 0);
            setTotale(data.totale || 0);
            setChilometraggio(data.chilometraggio || 0);
            setDataScheda(data.dataScheda || []);
            setManodopera(data.manodopera || []);
        } else {
            console.log("Nessun documento trovato!");
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7 }}
            >
                <div className="mt-4 bg-white text-black p-2">
                    {/* Pulsante di Stampa posizionato esternamente */}
                    <ReactToPrint
                        trigger={() => <button className="btn btn-primary mb-4">Stampa</button>}
                        content={() => ref.current}
                    />

                    <div className="stampa px-5" ref={ref}>
                        <h1 className="mt-5">Preventivo</h1>

                        <div className="ps-3">
                            <div className="d-flex gap-3">
                                <p className="mb-0"><strong>Data:</strong> {moment().format("DD/MM/YYYY")}</p>
                                <p className="mb-0"><strong>Cliente:</strong> {cliente}</p>
                                <p className="mb-0"><strong>Username:</strong> {username}</p>
                            </div>
                           
                            <div className="d-flex gap-3 mt-1">
                                <p className="mb-0"><strong>Veicolo:</strong> {infoScheda.veicolo}</p>
                                <p className="mb-0"><strong>Targa:</strong> {infoScheda.targa}</p>
                                <p className="mb-0"><strong>Chilometraggio:</strong> {chilometraggio} km</p>
                            </div>
                          
                        </div>

                        <h2 className="mt-4">Dettagli Scheda</h2>
                        <div className="ps-4">
                            <div className="row">
                                <div className="col-6 border border-1 border-black ps-1" style={{width: "380px"}}>
                                <strong>Descrizione</strong>
                                </div>
                                <div className="col-1 border border-1 border-black ps-1" style={{width: "70px"}}>
                                <strong>Prezzo</strong>
                                </div>
                                <div className="col-1 border border-1 border-black ps-1" style={{width: "40px"}}>
                                <strong>Qt</strong>
                                </div>
                                <div className="col-2 border border-1 border-black ps-1" style={{width: "90px"}}>
                                <strong>Sconto</strong>
                                </div>
                                <div className="col-2 border border-1 border-black ps-1">
                                <strong>Totale</strong>
                                </div>
                            </div>
                            {dataScheda.map((item, index) => (
                                 <div className="row" key={index}>
                                 <div className="col-6 border border-1 border-top-0 border-black ps-1" style={{width: "380px"}}>
                                 {item.descrizione || ""}
                                 </div>
                                 <div className="col-1 border border-1 border-top-0 border-black ps-1" style={{width: "70px"}}>
                                 {item.prezzo || "0"}€
                                 </div>
                                 <div className="col-1 border border-1 border-top-0 border-black ps-1" style={{width: "40px"}}>
                                 {item.qt || "1"}
                                 </div>
                                 <div className="col-2 border border-1 border-top-0 border-black ps-1" style={{width: "90px"}}>
                                 {item.sconto || "0"} %
                                 </div>
                                 <div className="col-2 border border-1 border-top-0 border-black ps-1">
                                 {item.totale || ""}€
                                 </div>
                             </div>
                            ))}
                            {manodopera.map((item, index) => (
                                 <div className="row" key={index}>
                                 <div className="col-6 border border-1 border-top-0 border-black ps-1" style={{width: "380px"}}>
                                 manodopera
                                 </div>
                                 <div className="col-1 border border-1 border-top-0 border-black ps-1" style={{width: "70px"}}>
                                 {item.prezzo || "0"}€
                                 </div>
                                 <div className="col-1 border border-1 border-top-0 border-black ps-1" style={{width: "40px"}}>
                                 {item.qt || "1"}
                                 </div>
                                 <div className="col-2 border border-1 border-top-0 border-black ps-1" style={{width: "90px"}}>
                                 {item.sconto || "0"} %
                                 </div>
                                 <div className="col-2 border border-1 border-top-0 border-black ps-1">
                                 {item.totale || "0.00"}€
                                 </div>
                             </div>
                            ))}
                           
                        </div>
                        
                        <div className="d-flex justify-content-between mt-4">
                            <div className="ps-2">
                                <img style={{width:"100px", height: "100px"}} src="/frame.png"/>
                                <p className="">Usa la nostra app!</p>
                            </div>

                            <div className="row">
                                <div className="col-8">
                                <p className="mb-0"><strong> Totale:</strong></p>
                                <p className="mb-0"><strong> Pagato:</strong></p>
                                <p className="mb-0"><strong>Sconto:</strong></p>
                                <p className="mb-0"><strong>Resto:</strong></p>
                                </div>
                                <div className="col-4">
                                <p className="mb-0">{totale}€</p>
                                <p className="mb-0">{pagato}€</p>
                                <p className="mb-0">{sconto}€</p>
                                <p className="mb-0">{resta}€</p>
                                </div>
                       
                            </div>
                        </div>

              
                    </div>
                </div>
            </motion.div>
        </>
    );
}
