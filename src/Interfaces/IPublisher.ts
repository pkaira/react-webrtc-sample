import { Stream } from "stream"
import { ResolutionClass } from "../Classes/SharedEnums"

export default interface IPublisher {
    index: number
    deviceId: string
    streamId: string
    resolution: ResolutionClass
    audioEnabled: boolean
    audioDeviceId?: string
    audioMuted?: boolean
    stream?: HTMLVideoElement
    tracks?: MediaStreamTrack[]
}