import { createContext } from "react"
import { IAppContext } from "../Interfaces/IAppContext"
import { IMediaStream } from "../Interfaces/IMediaStream"
import IPublisher from "../Interfaces/IPublisher"
import { ResolutionClass } from "../Classes/SharedEnums"

export const AppContext = createContext<IAppContext>({
    remoteResolutionClass: ResolutionClass.DYNAMIC,
    localMediaStreams: [],
    remoteMediaStreams: [],
    publishers: [],
    incomingMessages: [],
    changeRemoteResolutionClass:  (newResolution:ResolutionClass) => {},
    appendStream: (newStream:IMediaStream) => {},
    removeStream: (removeId:string) => {},
    initLocalStreams: () => {},
    addPublishers: () => {},
    removePublishers: () => {},
    setPeerId: (newPeerId:string|undefined) => {},
    callPeer: (peerId:string) => {},
    sendDataMessage: (msg:string) => {},
    addRecvDataMessage: (msg:string, src:string) => {},
    updatePublishers: (publishers:IPublisher[]) => {}
})