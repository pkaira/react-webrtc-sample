import { useEffect, useRef, useContext } from "react"
import Box from '@mui/material/Box'
import { AppContext } from "../Classes/AppContext"
import "../video.css"

type Props = {
    isAudioAvailable:boolean
    stream:MediaStream
    isLocal?: boolean
}

export const VideoContainer = (props:Props) => {

    const {
        remoteResolutionClass
        } = useContext(AppContext)
    /*static contextType = AppContext
    constructor(props:Props) {
        super(props)
    }

    componentDidMount() {
        const appCon = this.context
    }*/
    const videoElement = useRef<HTMLVideoElement>(null)
    useEffect(()=> {
        videoElement.current!.srcObject = props.stream
    })
    
    //render() {
        return (
            <>
                <Box p={2}>
                    <video autoPlay playsInline muted
                    ref={videoElement} className={ props.isLocal ? 'qhd-res' : remoteResolutionClass}/>
                </Box>
            </>
        )
    //}
}