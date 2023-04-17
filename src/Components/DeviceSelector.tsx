import { Component, useState } from "react"
import { 
    Stack,
    InputLabel,
    Box } from "@mui/material"
import Select, {SelectChangeEvent} from "@mui/material/Select"
import MenuItem from "@mui/material/MenuItem"
import FormControl from "@mui/material/FormControl"
import IDeviceInfo from "../Interfaces/IDeviceInfo"

type DeviceSelectorProps = {
    index: number
    id: string
    deviceKind: string
    onDeviceSelectChange: (id:string, deviceId:string) => void
    onChangeDeviceResolution?: (id:string, newResolution:string) => void
}

type DeviceSelectorState = {
    devices: IDeviceInfo[]
    deviceId: string
}

export class DeviceSelector extends Component<DeviceSelectorProps> {
    state:DeviceSelectorState = { 
        devices: [],
        deviceId: ''
    }

    constructor(props: DeviceSelectorProps) {
        super(props)
    }

    componentDidMount(): void {
        navigator.mediaDevices.enumerateDevices()
            .then((deviceInfo) => {
                let deviceList:IDeviceInfo[] = []
                deviceInfo.map((device) => {
                    let deviceLabel = ''
                    if(this.props.deviceKind === device.kind && device.kind === "videoinput")
                    {
                        deviceLabel = device.label || `camera ${(deviceList.length+1).toString()}`
                    }
                    else if(this.props.deviceKind === device.kind && device.kind === "audioinput")
                    {
                        deviceLabel = device.label || `microphone ${(deviceList.length+1).toString()}`
                    }
                    else if(this.props.deviceKind === device.kind && device.kind === "audiooutput")
                    {
                        deviceLabel = device.label || `speaker ${(deviceList.length+1).toString()}`
                    }
                    if(deviceLabel!='')
                        deviceList.push({
                            label: deviceLabel,
                            id: device.deviceId
                        })
                })
                this.setState({
                    devices: deviceList,
                    deviceId: deviceList[0].id
                })
                this.props.onDeviceSelectChange(this.props.id, this.state.deviceId)
            })
            .catch(e => { console.log('Unable to enumrate devices.', e.message)});
    }

    private handleDeviceChange = (event:SelectChangeEvent) => {
        this.setState({ deviceId: event.target.value})
        this.props.onDeviceSelectChange(this.props.id, this.state.deviceId)
    }
    

    render() {
        

        const label = this.props.deviceKind+"-"+this.props.index.toString()
        let name = "Microphone "
        if(this.props.deviceKind==='videoinput')
        {
            name = "Video Camera " + (this.props.index+1).toString()
        }
        else if(this.props.deviceKind==='audiooutput')
        {
            name = "Speaker"
        } 

        return (
            <Stack direction="row" spacing={2}>
                <FormControl fullWidth size="small" variant="standard">
                    <InputLabel id={"label-"+label}>{name}</InputLabel>
                    <Select
                        labelId={"label-"+label}
                        id={"vds_"+label}
                        value={this.state.deviceId}
                        onChange={e => this.handleDeviceChange(e)}
                    >
                        <MenuItem value="">None</MenuItem>
                        { this.state.devices.map( (device:IDeviceInfo) =>
                            <MenuItem key={device.id} value={device.id}>{device.label}</MenuItem>
                        )}
                    </Select>
                </FormControl>
            </Stack>
        )
    }
}