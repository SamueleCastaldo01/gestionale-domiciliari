import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";

function Page_per({ getColId }) {
    const navigate = useNavigate()
  //*************************************************************** */
  //************************************************************** */
  //          INTERFACE                                             /
  //************************************************************** */
  return (
    <>
      {" "}
      <div className="wrapper">
        <h2>Non hai il permesso di accesso</h2>
        <Button variant="contained" onClick={() => {navigate("/login")}}>Login</Button>
      </div>
    </>
  );
}
export default Page_per;
