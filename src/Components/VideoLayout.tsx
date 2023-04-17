import { useContext } from "react"
import Box from '@mui/material/Box'
import { VideoContainer } from "./VideoContainer"
import { AppContext } from "../Classes/AppContext"
import { Container, Stack } from "@mui/system"
import IPublisher from "../Interfaces/IPublisher"
import { IMediaStream } from "../Interfaces/IMediaStream"

export const VideoLayout = () => {
    const {
        localMediaStreams, 
        remoteResolutionClass,
        remoteMediaStreams
    } = useContext(AppContext)
    
    return (
        <Container>
            <Box sx={{ flexDirection:'row', flexWrap:'wrap', justifyContent:'center' }}>
                {remoteMediaStreams.map((mediaStream) =>
                    <VideoContainer isAudioAvailable={true} key={mediaStream.videoStream.id}
                        stream={mediaStream.videoStream}/>
                )}           
            </Box>
            <Stack direction="row" sx={{ flexDirection:'row', flexWrap:'wrap'}}>
                    {localMediaStreams.map(stream => 
                        <VideoContainer 
                            isAudioAvailable={stream.isAudioAvailable} 
                            key={stream.id} stream={stream.videoStream}
                            isLocal={true}/>)}
            </Stack>
        </Container>
    )
}