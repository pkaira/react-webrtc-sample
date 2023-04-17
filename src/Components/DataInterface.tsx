import { useContext, useState } from "react"
import { Button, TextField } from "@mui/material"
import { Stack } from "@mui/system"
import { AppContext } from "../Classes/AppContext"
import { MessageCard } from "./MessageCard"

export const DataInterface = () => {
    const {
        incomingMessages,
        sendDataMessage
        } = useContext(AppContext)

    const [outMessage, setOutMessage] = useState<string>('')

    return (
        <Stack direction="row">
            <Stack>
                {incomingMessages.map((record) => 
                    <TextField
                        id={record.id}
                        key={record.id}
                        multiline
                        disabled
                        label={record.src}
                        value={record.message}
                    />)
                }
            </Stack>
            <Stack>
                <TextField
                        id="send-message"
                        key="send-message"
                        multiline
                        label="Message"
                        value={outMessage}
                        onChange={(e) => setOutMessage(e.target.value)}/>
                <Button onClick={() => { 
                    sendDataMessage(outMessage)
                    setOutMessage('')
                }}>
                    Send
                </Button> 
            </Stack>
        </Stack>
    )
}