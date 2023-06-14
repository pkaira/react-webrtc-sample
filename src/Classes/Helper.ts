import IPublisher from "../Interfaces/IPublisher"
import { ResolutionClass } from "./SharedEnums"
import { IResolution } from "../Interfaces/IResolution"
import { IAVConstraints } from "../Interfaces/IAVConstraints"
import { IMediaStream } from "../Interfaces/IMediaStream"

export const getAVPermissions = ():Promise<boolean> => {
    return navigator.mediaDevices.getUserMedia({audio:true, video:true})
        .then((stream) => {
            stream.getTracks().forEach(trk => trk.stop())
            return true
        })
        .catch(() => {return false})
        
} 
export const getResolution = (res:IResolution) => {
    return `${res.width}x${res.height}`
} 

export const getConstraints = (pub:IPublisher) => {
    let res:IResolution = {
        width: 320,
        height: 240
    }
    if(pub.resolution == ResolutionClass.VGA)
    {
        res = {
            width: 640,
            height: 480
        }
    }
    else if(pub.resolution == ResolutionClass.qHD)
    {
        res = {
            width: 320,
            height: 180
        }
    }
    else if(pub.resolution == ResolutionClass.HHD)
    {
        res = {
            width: 640,
            height: 360
        }
    }
    else if(pub.resolution == ResolutionClass.HD || pub.resolution == ResolutionClass.DYNAMIC)
    {
        res = {
            width: 1280,
            height: 720
        }
    }
    else if(pub.resolution == ResolutionClass.FHD)
    {
        res = {
            width: 1920,
            height: 1080
        }
    }
    let constraints:IAVConstraints = {
        video: {
            width: {
                exact: res.width
            },
            height: {
                exact: res.height
            },
            deviceId: {
                exact: pub.deviceId
            },
            frameRate: { 
                min: 30
            }
        }
    }
    if(pub.audioEnabled)
    {
        constraints.audio = {
            deviceId: pub.audioDeviceId ? { exact: pub.audioDeviceId} : undefined
        }
    }
    return constraints
}

export const getLocalStream = async (publisher:IPublisher):Promise<MediaStream|null> => {
    let av_const:IAVConstraints = getConstraints(publisher)
    return await navigator.mediaDevices.getUserMedia(av_const).catch(
        e => {
            console.error(`Error in getUserMedia: ${e.message} , ${e.name}`)
            delete av_const["video"]["frameRate"]
            return navigator.mediaDevices.getUserMedia(av_const).catch( e=> {
                console.error(`Error in getUserMedia: ${e.message} , ${e.name}`)
                delete av_const["video"]["width"]
                delete av_const["video"]["height"]
                return navigator.mediaDevices.getUserMedia(av_const).catch( e => {
                    console.error(`Error in getUserMedia: ${e.message} , ${e.name}`)
                    return null
                })
            })
        })
}

export const initLocalStream = async (publisher:IPublisher):Promise<IMediaStream|null> => {
    const strm = await getLocalStream(publisher)
    if(strm)
    {
        publisher.streamId = strm.id
        /*const videoElement = document.createElement("video")
        videoElement.autoplay = true
        videoElement.playsInline = true
        videoElement.muted=true
        videoElement.srcObject = strm*/
        //publisher.stream = videoElement
        let mStream:IMediaStream = {
            videoStream: strm,
            id: strm.id,
            isAudioAvailable: publisher.audioEnabled,
            tracks: []
        }
        for(const trk of strm.getTracks())
        {
            mStream.tracks?.push(trk)
        }
        return mStream
    }
    return null
}
