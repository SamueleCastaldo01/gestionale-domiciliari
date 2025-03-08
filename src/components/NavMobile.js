import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function NavMobile({text}) {
    const navigate = useNavigate();
    return(
        <>
           <div style={{height:"56px", backgroundColor: "white", zIndex: "2", boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)"}} className="position-fixed top-0 w-100 p-1 text-start d-flex align-items-center">
                <IconButton onClick={() => {navigate(-1)}}>
                    <ArrowBackIcon style={{fontSize: "24px", color: "black"}}/>
                </IconButton>
            <h5 className="mb-0">{text}</h5>
        </div>
        <div className='mb-5'></div>
        </>
    )
}