import { useState, useContext } from "react"
import { 
    Container, 
    Stack,
    Box
    } from "@mui/system"
import { 
    Button, 
    FormGroup,
    FormControlLabel, 
    Switch } from "@mui/material"
import IPublisher from "../Interfaces/IPublisher"
import { ResolutionClass } from "../Classes/SharedEnums"
import { DeviceSelector } from "./DeviceSelector"
import { AppContext } from "../Classes/AppContext"

export const Header = () =>{
    const [publishVideo, setPublishVideo] = useState<boolean>(true)
    const [publishAudio, setPublishAudio] = useState<boolean>(true)
    const [renderAudio, setRenderAudio] = useState<boolean>(true)
    
    const {
        publishers,
        addPublishers,
        removePublishers,
        updatePublishers
    } = useContext(AppContext)
    

    const updatePublisherDevice = (id:string, deviceId:string) => {
        if(id==='audio-input-device') {
            publishers[0].audioDeviceId = deviceId
        } else if(id==='audio-output-device') {
            // nothing to do
        } else {
            publishers.map((publisher:IPublisher) => {
                if(publisher.streamId == id)
                    publisher.deviceId = deviceId
            })
        }
        updatePublishers(publishers)
    }

    const updatePublisherResolution = (id:string, resolution:ResolutionClass) => {
        publishers.map((publisher:IPublisher) => {
            if(publisher.streamId == id)
                publisher.resolution = resolution
        })
        updatePublishers(publishers)
    }

    const videoToggle = (event:any) => {
        setPublishVideo(event.target.checked)
    }

    const micToggle = (event:any) => {
        setPublishAudio(event.target.checked)
    }

    const speakerToggle = (event:any) => {
        setRenderAudio(event.target.checked)
    }

    return (
        <Box sx={{ p:3 }}>
            <FormGroup>
                <Stack direction="row" gap={2}>
                    <Box sx={{ width: 250, border:1, borderRadius:1, p:2 }}>
                        <Stack>
                            <FormControlLabel control={<Switch checked={publishVideo} onChange={videoToggle}/>}
                                label="Video"/>
                            { publishVideo && (
                            <Box>
                                <Stack direction="row">
                                    <Button variant="outlined" size="small"
                                        disabled={publishers.length==4 ? true : false} onClick={addPublishers}>
                                        Add
                                    </Button>
                                    <Button variant="outlined" color="error" size="small"
                                        disabled={publishers.length==1 ? true : false} onClick={removePublishers}>
                                        Remove
                                    </Button>
                                </Stack>
                                <Stack sx={{pt:1}}>
                                    {
                                        publishers.map((publisher:IPublisher) =>
                                        <DeviceSelector
                                            key={publisher.streamId}
                                            id={publisher.streamId}
                                            index={publisher.index}
                                            deviceKind="videoinput"
                                            onDeviceSelectChange={updatePublisherDevice}
                                            onChangeDeviceResolution={updatePublisherResolution}
                                        />
                                        )
                                    }
                                </Stack>
                                
                            </Box>) }
                        </Stack>
                    </Box>
                    <Box sx={{ width: 250, border:1, borderRadius:1, p:2 }}>
                        <Stack>
                            <FormControlLabel control={<Switch checked={publishAudio} onChange={micToggle}/>}
                                label="Audio"/>
                            { publishAudio && (
                            <Stack>
                                <DeviceSelector
                                        id='audio-input-device'
                                        index={0}
                                        deviceKind="audioinput"
                                        onDeviceSelectChange={updatePublisherDevice}
                                    />
                            </Stack>) }
                        </Stack>
                    </Box>
                    <Box sx={{ width: 250, border:1, borderRadius:1, p:2 }}>
                        <Stack>
                            <FormControlLabel control={<Switch checked={renderAudio} onChange={speakerToggle}/>}
                                label="Speaker"/>
                            { renderAudio && (
                            <Stack>
                                <DeviceSelector
                                        id='audio-output-device'
                                        index={0}
                                        deviceKind="audiooutput"
                                        onDeviceSelectChange={updatePublisherDevice}
                                />
                            </Stack>) }
                        </Stack>
                    </Box>
                </Stack>
            </FormGroup>
        </Box>
    )
}