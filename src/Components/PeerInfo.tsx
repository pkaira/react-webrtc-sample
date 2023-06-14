import { Button, TextField } from "@mui/material"
import { Box, Stack } from "@mui/system"
import { useState, useContext } from "react"
import { AppContext } from "../Classes/AppContext"
import Snackbar, {SnackbarOrigin} from '@mui/material/Snackbar';

export const PeerInfo = () => {
    const [callPeerId, setCallPeerId] = useState<string>('')
    const [copied, setCopied] = useState<boolean>(false)

    const {
        myPeerId,
        setPeerId,
        callPeer
        } = useContext(AppContext)

    const onClickCall = () => {
        callPeer(callPeerId)
    }

    const onChangeCallPeer = (event:any) => {
        setCallPeerId(event.target.value)
    }

    const onCopyPeer = () => {
        if(myPeerId)
        {
            navigator.clipboard.writeText(myPeerId)
            setCopied(true)
        }
    }

    const onSnackClose = (event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
          return;
        }
        setCopied(false);
      }

    return (
        <Stack>
            <TextField
                    label="Peer ID"
                    value={myPeerId ? myPeerId : "Loading..."}
                    variant="filled"
                    color="success"
                    onClick={onCopyPeer}
                    focused
                    disabled/>
            <Snackbar 
                anchorOrigin={{vertical:'top',horizontal:'center'} }
                open={copied}
                autoHideDuration={3000}
                onClose={onSnackClose}
                message="Peer ID Copied"
            />
            <Stack direction="row">
                <TextField label="Call Peer"
                    value={callPeerId}
                    onChange={onChangeCallPeer}
                    variant="filled"
                    focused
                    sx={{ flexGrow:1 }}/>
                <Button 
                    variant="contained"
                    onClick={onClickCall}
                    sx={{minWidth:100}}
                    disabled={ (myPeerId && callPeerId.length>1) ? false:true}>
                        Call
                    </Button>
            </Stack>
        </Stack>
    )
}