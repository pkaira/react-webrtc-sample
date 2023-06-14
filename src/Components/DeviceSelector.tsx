import { Component, useState } from "react"
import { 
    Stack,
    InputLabel,
    Box } from "@mui/material"
import Select, {SelectChangeEvent} from "@mui/material/Select"
import MenuItem from "@mui/material/MenuItem"
import FormControl from "@mui/material/FormControl"
import IDeviceInfo from "../Interfaces/IDeviceInfo"
import { getAVPermissions } from "../Classes/Helper"
import { ResolutionClass } from "../Classes/SharedEnums"

type DeviceSelectorProps = {
    index: number
    id: string
    deviceKind: string
    onDeviceSelectChange: (id:string, deviceId:string) => void
    onChangeDeviceResolution?: (id:string, newResolution:ResolutionClass) => void
}

type DeviceSelectorState = {
    devices: IDeviceInfo[]
    deviceId: string
    res: ResolutionClass
}

type ResolutionSelector = {
    label: string
    value: ResolutionClass
}

enum CheckState {
    INIT,
    PENDING,
    COMPLETED
}

export class DeviceSelector extends Component<DeviceSelectorProps> {
    state:DeviceSelectorState = { 
        devices: [],
        deviceId: '',
        res: ResolutionClass.DYNAMIC
    }

    private permissionsCheckedState:CheckState

    private resolutions:ResolutionSelector[] = [
        {
            label: "Dynamic",
            value: ResolutionClass.DYNAMIC
        },
        {
            label: "1080p",
            value: ResolutionClass.FHD
        },
        {
            label: "720p",
            value: ResolutionClass.HD
        },
        {
            label: "360p",
            value: ResolutionClass.HHD
        }
    ]

    constructor(props: DeviceSelectorProps) {
        super(props)
        this.permissionsCheckedState= CheckState.INIT
    }

    componentDidMount(): void {
        this.enumrateDevices()
    }
    
    private checkForPermissions = async () => {
        const res = await getAVPermissions()
        if(res)
        this.permissionsCheckedState = CheckState.COMPLETED
        this.enumrateDevices()
    }

    private enumrateDevices = () => {
        navigator.mediaDevices.enumerateDevices()
            .then((deviceInfo) => {
                let deviceList:IDeviceInfo[] = []
                deviceInfo.map((device) => {
                    let deviceLabel = ''
                    if(device.label || this.permissionsCheckedState == CheckState.COMPLETED)
                    {
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
                    }
                    else if (this.permissionsCheckedState==CheckState.INIT)
                    {
                        this.permissionsCheckedState = CheckState.PENDING
                        this.checkForPermissions()
                    }
                })
                this.setState({
                    devices: deviceList,
                    deviceId: deviceList[0].id
                })
                this.props.onDeviceSelectChange(this.props.id, deviceList[0].id)
            })
            .catch(e => { console.log('Unable to enumrate devices.', e.message)});
    }

    private handleDeviceChange = (event:SelectChangeEvent) => {
        this.setState({ deviceId: event.target.value})
        this.props.onDeviceSelectChange(this.props.id, this.state.deviceId)
    }

    private handleResolutionChange = (event:SelectChangeEvent) => {
        this.setState({ res: event.target.value})
        if (this.props.onChangeDeviceResolution)
            this.props.onChangeDeviceResolution(this.props.id, event.target.value as ResolutionClass)
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
                    { this.props.deviceKind==='videoinput' && 
                        <Select
                            labelId={"label-resolution-"+label}
                            id={"vdr_"+label}
                            value={this.state.res}
                            onChange={e => this.handleResolutionChange(e)}
                        >
                            { this.resolutions.map( (resolution:ResolutionSelector) =>
                                <MenuItem key={"rs-"+resolution.label} value={resolution.value}>{resolution.label}</MenuItem>
                            )}
                        </Select>
                    }
                </FormControl>
            </Stack>
        )
    }
}