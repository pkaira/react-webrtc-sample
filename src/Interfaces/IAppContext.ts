import { IMediaStream } from "./IMediaStream"

import { ResolutionClass }  from "../Classes/SharedEnums"
import IPublisher from "./IPublisher"
import { PeerConnection } from "../Classes/PeerConnection"
import { IMessageRecord } from "./IMessageRecord"

export interface IAppContext {
    myPeerId?: string
    remoteResolutionClass: ResolutionClass
    remoteMediaStreams:IMediaStream[]
    localMediaStreams: IMediaStream[]
    publishers: IPublisher[]

    incomingMessages: IMessageRecord[]
    outgoingMessages: IMessageRecord[]

    addRecvDataMessage: (msg:string, src:string) => void
    sendDataMessage: (msg:string) => void

    changeRemoteResolutionClass: (newResolution:ResolutionClass) => void
    appendStream: (newStream:IMediaStream) => void
    removeStream: (removeId:string) => void

    initLocalStreams: () => void

    setPeerId: (newPeerId:string|undefined) => void
    callPeer: (perrId:string) => void

    addPublishers: () => void
    removePublishers: () => void
}