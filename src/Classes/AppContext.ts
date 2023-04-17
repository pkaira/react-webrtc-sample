import { createContext } from "react"
import { IAppContext } from "../Interfaces/IAppContext"
import { IMediaStream } from "../Interfaces/IMediaStream"
import { ResolutionClass } from "../Classes/SharedEnums"

export const AppContext = createContext<IAppContext>({
    remoteResolutionClass: ResolutionClass.DYNAMIC,
    localMediaStreams: [],
    remoteMediaStreams: [],
    publishers: [],
    incomingMessages: [],
    outgoingMessages: [],
    changeRemoteResolutionClass:  (newResolution:ResolutionClass) => {},
    appendStream: (newStream:IMediaStream) => {},
    removeStream: (removeId:string) => {},
    initLocalStreams: () => {},
    addPublishers: () => {},
    removePublishers: () => {},
    setPeerId: (newPeerId:string|undefined) => {},
    callPeer: (peerId:string) => {},
    sendDataMessage: (msg:string) => {},
    addRecvDataMessage: (msg:string, src:string) => {}
})