import React, { useState, useEffect } from 'react'
import { AppContext } from '../Classes/AppContext'
import { initLocalStream } from '../Classes/Helper'
import { PeerConnection } from '../Classes/PeerConnection'

import { ResolutionClass } from '../Classes/SharedEnums'
import { IMediaStream } from '../Interfaces/IMediaStream'
import { IMessageRecord } from '../Interfaces/IMessageRecord'
import IPublisher from '../Interfaces/IPublisher'
import uuid from 'react-uuid'

let peerCon:PeerConnection|null = null

export const AppContextProvider = ({children}: {children: React.ReactNode}) => {
    const [myPeerId, setMyPeerId] = useState<string|undefined>(undefined)
    const [remoteResolutionClass, setRemoteResolutionClass] = 
        useState<ResolutionClass>(ResolutionClass.DYNAMIC)
    const [localMediaStreams, setLocalMediaStreams] = useState<IMediaStream[]>([])
    const [remoteMediaStreams, setRemoteMediaStreams] = useState<IMediaStream[]>([])
    const [incomingMessages, setIncomingMessages] = useState<IMessageRecord[]>([])

    const [publishers, setPublishers] = useState<IPublisher[]>([{
        index: 0,
        deviceId: '',
        streamId: crypto.randomUUID(),
        resolution: ResolutionClass.HD,
        audioEnabled: true,
        audioDeviceId: ''
    }])

    const setPeerId = (newPeerId:string|undefined) => {
        setMyPeerId(newPeerId)
    }

    const callPeer = (peerId:string) => {
        if(peerCon)
        {
            initLocalStreams()
            peerCon.connectToPeer(peerId)
        }
    }

    const appendStream = (newStream:IMediaStream) => {
        setRemoteMediaStreams([... remoteMediaStreams, newStream])
    }

    const removeStream = (removeId:string ='') => {
        for(let i=0; i< remoteMediaStreams.length; i++)
        {
            if(remoteMediaStreams[i].id==removeId)
            {
                remoteMediaStreams.splice(i,1);
                i--;
            }
        }
    }

    const sendDataMessage = (msg:string) => {
        if(peerCon?.rtcConn)
        {
            peerCon.sendDataChannelMessage(msg)
            addRecvDataMessage(msg,"self")
        }
    }

    const addRecvDataMessage = (msg:string, src:string) => {
        const newRecord:IMessageRecord = {
            id:uuid(), 
            message:msg, 
            src: src
        }
        incomingMessages.push(newRecord)
        setIncomingMessages([...incomingMessages])
    }

    const initLocalStreams = () => {
        publishers.map(publisher => {
            initLocalStream(publisher).then(
                mStream => {
                    if(mStream)
                        setLocalMediaStreams([... localMediaStreams, mStream])
                }
            )
        })
    } 

    const addPublishers = () => {
        const newPublisher:IPublisher = {
            index: publishers.length,
            deviceId: '',
            streamId: crypto.randomUUID(),
            resolution: ResolutionClass.HD,
            audioEnabled: false
        }
        setPublishers([...publishers, newPublisher])
    }

    const removePublishers = () => {
        publishers.pop()
        setPublishers([...publishers])
    }

    const changeRemoteResolutionClass = (newResolution:ResolutionClass) => {
        setRemoteResolutionClass(newResolution)
    }

    useEffect(()=>{
        if(!peerCon)
        {
            peerCon = new PeerConnection({
                appendStream:appendStream,
                removeStream:removeStream,
                setPeerId:setPeerId,
                initLocalStreams: initLocalStreams,
                recvMessage: addRecvDataMessage
            })
        }

        if(peerCon.waitingForLocalStream && localMediaStreams.length == publishers.length)
        {
            peerCon.initStreams(localMediaStreams)
        }
    }) 
    
    return (
        <AppContext.Provider value={{
            myPeerId,
            remoteResolutionClass,
            remoteMediaStreams,
            localMediaStreams,
            publishers,
            incomingMessages,
            changeRemoteResolutionClass,
            appendStream,
            removeStream,
            addPublishers,
            removePublishers,
            initLocalStreams,
            setPeerId,
            callPeer,
            sendDataMessage,
            addRecvDataMessage
        }}>{children}
        </AppContext.Provider>
    )
}