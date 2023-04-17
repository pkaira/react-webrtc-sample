import { Component } from "react"
import { 
    Paper, Box
    } from '@mui/material'

import Typography from "@mui/material/Typography/Typography"
import { IMessageRecord } from "../Interfaces/IMessageRecord"


export const MessageCard = () => {}
/*
export class MessageCard extends Component<IMessageRecord> {
    record:IMessageRecord
    constructor({record:IMessageRecord}) {
        super({record:IMessageRecord})
        this.record = record
    }

    render() {
        const variantBg:string = this.record.src==="self" ? "secondary.light" : "primary.light"
        const variantCl:string = this.record.src==="self" ? "secondary.contrastText" : "secondary.contrastText"
        return (
            <Paper sx={{ minWidth: 275, bgcolor: variantBg, color: variantCl}}>
                <Box p={2}>
                    <Typography variant="body1">
                        {this.record.message}
                    </Typography>
                </Box>
            </Paper>
        )
    }
}*/