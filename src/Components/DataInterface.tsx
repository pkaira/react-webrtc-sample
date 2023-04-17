import { useContext, useState } from "react"
import { Box, Button, TextField } from "@mui/material"
import { Stack } from "@mui/system"
import { AppContext } from "../Classes/AppContext"
import { MessageCard } from "./MessageCard"
import Grid2 from "@mui/material/Unstable_Grid2/Grid2"

export const DataInterface = () => {
    const {
        incomingMessages,
        sendDataMessage
        } = useContext(AppContext)

    const [outMessage, setOutMessage] = useState<string>('')

    return (
        <Stack direction="row" gap={1}>
            <Box style={{height: '20vh', overflow:'auto'}} flexGrow={1}>
                <Stack gap={1} flexGrow={1}>
                    {incomingMessages.map((record) => 
                        <TextField
                            id={record.id}
                            key={record.id}
                            multiline
                            focused
                            InputProps={{
                                readOnly: true
                            }}
                            label={record.src}
                            value={record.message}
                            color={ record.src == "self" ? "primary" : "secondary"}
                        />)
                    }
                </Stack>
            </Box>
            <Stack>
                <TextField
                    sx={{width:'200'}}
                        id="send-message"
                        key="send-message"
                        multiline
                        label="Message"
                        value={outMessage}
                        onChange={(e) => setOutMessage(e.target.value)}/>
                <Button onClick={() => { 
                    sendDataMessage(outMessage)
                    setOutMessage('')
                }} variant="contained">
                    Send
                </Button> 
            </Stack>
        </Stack>
    )
}