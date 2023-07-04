import { SignalingConnection } from "./Siganling"
import { ISignalingMessage, MSG_TYPE } from "../Interfaces/ISignalingMessage"
import { IMediaStream } from "../Interfaces/IMediaStream"
import { useContext } from "react"
import { AppContext } from "../Classes/AppContext"
import { initLocalStream } from "./Helper"
import IPublisher from "../Interfaces/IPublisher"

type PeerConnectionProp = {
    appendStream: (newStream:IMediaStream) => void
    removeStream: (removeId:string) => void
    setPeerId: (peerId:string|undefined) => void
    initLocalStreams: () => void
    recvMessage: (msg:string, src:string) => void
}

export class PeerConnection {
    sCon:SignalingConnection
    rtcConn:RTCPeerConnection|null = null
    sendDataConn:RTCDataChannel|undefined = undefined
    recvDataConn:RTCDataChannel|undefined = undefined
    props:PeerConnectionProp

    connState:string = 'init'
    waitingForLocalStream:boolean = false

    connConfig:RTCConfiguration = {}

    public constructor(props:PeerConnectionProp) {
        this.props = props
        this.sCon = new SignalingConnection(
            this.handleIncomingData,
            this.handleConnection,
            this.props.setPeerId
        )
        fetch('https://pcuvfqpavqwz5jfsdnb5bdsige0akonw.lambda-url.us-west-2.on.aws/')
            .then(res => res.json())
            .then((params) => {
                this.connConfig = {
                    iceServers: [
                        { 
                            urls: params.turn_uri, 
                            username: params.username,
                            credential: params.password
                        }
                    ],
                    iceTransportPolicy: 'all'
                };
            })
    }

    public connectToPeer = (remotePeer:string) => {
        this.sCon.connectToPeer(remotePeer)
    }

    startConnection = () =>
    {
        this.rtcConn = new RTCPeerConnection(this.connConfig)
        this.rtcConn.onicecandidate = (candidates) => {
            if(candidates.candidate) {
                this.sendData(
                    {
                        src: this.sCon.peerId,
                        type: MSG_TYPE.RTC_ICE_CANDIDATE,
                        data: {
                            candiate: candidates.candidate.toJSON()
                        }
                    }
                )
            }
        }

        this.rtcConn.onicegatheringstatechange = () => {
            console.log("Ice State:" + this.rtcConn?.iceGatheringState)
        }

        this.rtcConn.onicecandidateerror = (e) => {
            console.error(e)
        }

        this.rtcConn.onconnectionstatechange = () => {
            console.log("Conn State:" + this.rtcConn?.connectionState)
            switch(this.rtcConn?.connectionState)
            {
                case "connected":
                    break
                case "disconnected":
                case "failed":
                    this.close()
                    break
                case "closed":
                    this.removePeerConnection()
                    break
            }
        }

        this.rtcConn.onnegotiationneeded = (e) => {
            if (this.rtcConn?.signalingState != "stable") return
        }

        this.rtcConn.ontrack = this.handleTracks
        this.rtcConn.ondatachannel = this.handleRecvChannelCallback
    }

    handleIncomingData = (msg:ISignalingMessage) => {
        switch(msg.type)
        {
            case MSG_TYPE.RTC_OFFER:
                this.onOffer(msg)
                break
            case MSG_TYPE.RTC_ANSWER:
                this.onAnswer(msg)
                break
            case MSG_TYPE.RTC_ICE_CANDIDATE:
                this.onCandidate(msg)
                break
            case MSG_TYPE.RTC_BYE:
                this.close()
                break;
            default:
                console.error(`Message not supported ${msg.type}`)
        }
    }

    handleConnection = (data:string) => {
        this.startConnection()
        this.props.initLocalStreams()
        this.waitingForLocalStream = true
        if(data=='outgoing') {
            this.connState='creating-offer'
        } else if(data=='incoming') {
            // nothing
        }
    }

    initStreams = (localStreams:IMediaStream[]) => {
        this.waitingForLocalStream = false
        localStreams.map((mStream) => {
            if(mStream.tracks)
            {
                mStream.tracks.map(trk => this.rtcConn?.addTrack(trk, mStream.videoStream))
            }
        })
        if(this.connState=='creating-offer') {
            this.createOffer()
        } else if(this.connState=='creating-answer') {
            this.createAnswer()
        }
    }

    muteAudio = () => {
    }

    unmuteAudio = () => {

    }

    sendData = (msg:ISignalingMessage) => {
        this.sCon?.sendData(JSON.stringify(msg))
    }

    handleTracks = ( event:RTCTrackEvent ) => {
        event.streams.forEach(stream => {
            stream.getTracks().forEach(trk => {
                if(trk.kind==='video') {
                    /*let videoElement = document.createElement("video")
                    videoElement.autoplay = true
                    videoElement.playsInline = true
                    videoElement.muted=true
                    videoElement.srcObject = stream*/
                    const remoteStream:IMediaStream = {
                        videoStream: stream,
                        isAudioAvailable: false,
                        id: trk.id
                    } 
                    this.props.appendStream(remoteStream)
                }
            });
            stream.onremovetrack = (ev) => {
                console.log(ev);
            };                
        });
        event.track.onmute = (ev) => {
            console.log(ev);
        };
        //setTimeout(this.getICEStats, 5000, this);
    }

    createOffer()
    {
        this.startDataChannel()
        this.rtcConn?.createOffer()
            .then((offer) => this.rtcConn?.setLocalDescription(offer))
            .then( () => {
                this.sendData(
                    {
                        src: this.sCon.peerId,
                        type: MSG_TYPE.RTC_OFFER,
                        data: {
                            sdp: this.rtcConn?.localDescription
                        }
                    }
                )
                this.connState = 'waiting-answer'
            } )
            .catch((reason) => console.error(reason))
    }

    createAnswer()
    {
        this.startDataChannel()
        this.rtcConn?.createAnswer()
            .then((answer) => this.rtcConn?.setLocalDescription(answer))
            .then( () =>{
                this.sendData(
                    {
                        src: this.sCon.peerId,
                        type: MSG_TYPE.RTC_ANSWER,
                        data: {
                            sdp: this.rtcConn?.localDescription
                        }
                    }
                )
                this.connState = 'completed'
            })
            .catch((reason) => console.error(reason))
    }

    onOffer(offerMsg:ISignalingMessage)
    {
        this.rtcConn?.setRemoteDescription(new RTCSessionDescription(offerMsg.data.sdp))
        this.connState = 'creating-answer'
        if(!this.waitingForLocalStream)
            this.createAnswer()
        //handleStream(false);
        //setTimeout(this.addStream, 500, this, false);
    }

    onCandidate(candidateMsg:ISignalingMessage)
    {
        // Set the remote ICE candidates as recieved
        this.rtcConn?.addIceCandidate(new RTCIceCandidate(candidateMsg.data.candiate));
    }

    onAnswer(answerMsg:ISignalingMessage)
    {
        // Set the remote answer which was recieved for our offer
        this.rtcConn?.setRemoteDescription(new RTCSessionDescription(answerMsg.data.sdp))
        this.connState = 'completed'
        /*setTimeout((parent:PeerConnection) => {
            parent.startDataChannel()
        }, 5000, this)*/
    }

    getMyPeerId = () => {
        return this.sCon.peerId
    }

    sendDataChannelMessage = (msg:string) => {
        this.sendDataConn?.send(msg)
    }

    handleRecvMessage = (event:MessageEvent) => {
        console.log(event.data)
        this.props.recvMessage(event.data, this.recvDataConn?.label?this.recvDataConn?.label : '' )
    }

    startDataChannel = () => {
        this.sendDataConn = this.rtcConn?.createDataChannel('send-'+this.getMyPeerId())
        if(this.sendDataConn) {
            this.sendDataConn.onopen = (event) => this.handleSendChannelStatusChange(event)
            this.sendDataConn.onclose = (event) => this.handleSendChannelStatusChange(event)
        }
    }

    handleSendChannelStatusChange = (event:Event) => {
        if(this.sendDataConn) {
            //do something
        }
    }

    handleRecvChannelStatusChange = (event:Event) => {
        if(this.recvDataConn) {
            //do something
        }
    }

    handleRecvChannelCallback = (event:RTCDataChannelEvent) => {
        if(!this.recvDataConn) {
            this.recvDataConn = event.channel
            if(this.recvDataConn) {
                this.recvDataConn.onmessage = this.handleRecvMessage
                this.recvDataConn.onopen = (event) => {
                    /*if(!this.sendDataConn)
                    {
                        this.startDataChannel()
                    }*/
                    this.handleRecvChannelStatusChange(event)
                }  
                this.recvDataConn.onclose =  (event) => {
                    this.handleRecvChannelStatusChange(event)
                }
            }

        }
    }

    /*addStream(parent, shouldCreateOffer)
    {
        if(allStreamsLoaded && pubStream.length > 0)
        {
            let isFHD = false;
            pubStream.forEach(stream => {
                stream.getTracks().forEach(track => {
                    parent.rtcConn.addTrack(track, stream);
                    if(track.kind=="video" && track.getSettings().height == "1080")
                    {
                        isFHD = true;
                    }
                });
            }); 
            if(shouldCreateOffer)
            {
                parent.createOffer();
            }
            else
            {
                parent.createAnswer();
            }
            if(isFHD)
            {
                setTimeout(parent.updateBwTarget, 5000, parent, 4999);
            }
        }
        else
        {
            setTimeout(parent.addStream, 500, parent, shouldCreateOffer);
        }

    }*/

    close = () => {
        this.sendDataConn?.close()
        this.recvDataConn?.close()

        this.rtcConn?.close()

        this.sendDataConn = undefined
        this.recvDataConn = undefined
        this.rtcConn = null
    }

    removePeerConnection = () => {

    }
}