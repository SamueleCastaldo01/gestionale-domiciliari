import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import { IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function NavMobile({text, page}) {
    const navigate = useNavigate();
    return(
        <>
        <div style={{height:"56px", backgroundColor: "white", zIndex: "2", boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)"}} 
                className="position-fixed top-0 w-100 p-1 d-flex align-items-center justify-content-between">
            <div className='d-flex align-items-center text-start'>
                <IconButton onClick={() => {navigate(-1)}}>
                    <ArrowBackIcon style={{fontSize: "24px", color: "black"}}/>
                </IconButton>
                <h5 className="mb-0">{text}</h5>
            </div>
            <div className='d-flex align-items-center text-end'>
                {page == "customerlist" &&
                    <IconButton onClick={() => {navigate("/addcustomer")}}>
                        <PersonAddAlt1Icon style={{fontSize: "24px", color: "black"}}/>
                    </IconButton>
                }
                {page == "registerlist" &&
                    <IconButton onClick={() => {navigate("/addregister")}}>
                        <BookmarkAddIcon style={{fontSize: "24px", color: "black"}}/>
                    </IconButton>
                }
            </div>
              
        </div>

        <div className='mb-5'></div>
        </>
    )
}