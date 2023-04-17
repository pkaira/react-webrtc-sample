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

    connConfig:RTCConfiguration = {
        iceServers: [
            /*{ 
                urls: 'stun:turn1.udp.intouchstaging.net:35001?transport=udp'
            },
            { 
                urls: 'stun:turn3.udp.intouchstaging.net:35001?transport=udp'
            },
            { 
                url: 'turn:turn3.udp.intouchstaging.net:35001?transport=udp', 
                username: turn_user_name,
                credential: turn_credential
            },
            { 
                url: 'turn:turn1.udp.intouchstaging.net:35001?transport=udp', 
                username: turn_user_name,
                credential: turn_credential
            },
            { 
                url: 'turn:turn2.udp.intouchstaging.net:35001?transport=udp', 
                username: turn_user_name,
                credential: turn_credential
            }
            /*{ 
                url: 'turn:turn3.udp.intouchconnect.net:35001?transport=udp', 
                username: turn_user_name,
                credential: turn_credential
            },
            { 
                url: 'turn:turn1.udp.intouchconnect.net:35001?transport=udp', 
                username: turn_user_name,
                credential: turn_credential
            },
            { 
                url: 'turn:turn2.udp.intouchconnect.net:35001?transport=udp', 
                username: turn_user_name,
                credential: turn_credential
            },
            { 
                url: 'turn:turn4.udp.intouchconnect.net:35001?transport=udp', 
                username: turn_user_name,
                credential: turn_credential
            }*/
            
        ],
        iceTransportPolicy: 'all'
    };

    public constructor(props:PeerConnectionProp) {
        this.props = props
        this.sCon = new SignalingConnection(
            this.handleIncomingData,
            this.handleConnection,
            this.props.setPeerId
        )
    }

    public connectToPeer = (remotePeer:string) => {
        this.sCon.connectToPeer(remotePeer)
    }

    startConnection = () =>
    {
        this.rtcConn = new RTCPeerConnection(this.connConfig)
        this.rtcConn.onicecandidate = (candidates) => {
            if(candidates.candidate)
            {
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
        if(data=='outgoing')
        {
            this.connState='creating-offer'
        }
        else if(data=='incoming')
        {
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
        if(this.connState=='creating-offer')
        {
            this.createOffer()
        }
        else if(this.connState=='creating-answer')
        {
            this.createAnswer()
        }
    }



    sendData = (msg:ISignalingMessage) => {
        this.sCon?.sendData(JSON.stringify(msg))
    }

    handleTracks = ( event:RTCTrackEvent ) => {
        event.streams.forEach(stream => {
            stream.getTracks().forEach(trk => {
                if(trk.kind==='video')
                {
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
            .then( () =>{
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
        if(this.sendDataConn)
        {
            this.sendDataConn.onopen = (event) => this.handleSendChannelStatusChange(event)
            this.sendDataConn.onclose = (event) => this.handleSendChannelStatusChange(event)
        }
    }

    handleSendChannelStatusChange = (event:Event) => {
        if(this.sendDataConn)
        {
            //do something
        }
    }

    handleRecvChannelStatusChange = (event:Event) => {
        if(this.recvDataConn)
        {
            //do something
        }
    }

    handleRecvChannelCallback = (event:RTCDataChannelEvent) => {
        if(!this.recvDataConn)
        {
            this.recvDataConn = event.channel
            if(this.recvDataConn)
            {
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
    /*constructor(_remotePeerId, _incomingOffer = null) {
        
        
        this.remoteTracks = [];
        this.remotePeerId = _remotePeerId;
        this.rtcConn = new RTCPeerConnection(connConfig);
        this.rtcConn.onicecandidate = (candidates) => {
            if(candidates.candidate)
            {
                // send the candidates to other connection via signaling
                this.send(MSG_TYPE.RTC_ICE_CANDIDATE, candidates.candidate);
            }
        };
        this.rtcConn.onicegatheringstatechange = () => {
            console.log("Ice State:" + this.rtcConn.iceGatheringState);
        };
        this.rtcConn.onicecandidateerror = (e) => {
            console.error(e.errorText);
        };
        this.rtcConn.onconnectionstatechange = () => {
            console.log("Conn State:" + this.rtcConn.connectionState);
            switch(this.rtcConn.connectionState)
            {
                case "connected":
                    break;
                case "disconnected":
                case "failed":
                    this.close();
                    break;
                case "closed":
                    removePeerConnection();
                    break;
            }
        };
        this.rtcConn.onnegotiationneeded = (e) => {
            if (this.rtcConn.signalingState != "stable") return;
        };
        
        this.rtcConn.ontrack = ({ track, streams}) => {
            streams.forEach(stream => {
                stream.getTracks().forEach(trk => {
                    if(trk.kind==='video')
                    {
                        addRemoteVideo(trk.id, stream);
                        this.remoteTracks.push(trk.id);
                    }
                });
                stream.onremovetrack = (ev) => {
                    console.log(ev);
                };                
            });
            track.onmuted = (ev) => {
                console.log(ev);
            };
            setTimeout(this.getICEStats, 5000, this);
        };
        
        this.rtcConn.onremovetrack = (event) => {

        };

        if(_incomingOffer)
        {
            this.handleMessages(_remotePeerId, _incomingOffer);
        }
        else
        {
            setTimeout(this.addStream, 500, this, true);
        }
    }

    getICEStats(parent)
    {
        if(parent.rtcConn)
        {
            parent.rtcConn.getStats(null).then(results => { GetICEInfo(results) });
            setTimeout(parent.getRTCStats, 3000, parent);
        }
    }

    getRTCStats(parent)
    {
        if(parent.rtcConn)
        {
            parent.rtcConn.getStats(null).then(results => {
                let tracks = [];
                results.forEach(report => {
                    if(report.type == "inbound-rtp" && report.kind=="video" && report.trackId)
                    {
                        let textContent = report.frameWidth+"x"+report.frameHeight+"@"+report.framesPerSecond;
                        tracks.push({ "id": report.trackId, "content":  textContent });
                    }
                });
                if(tracks.length>0)
                {
                    results.forEach(report => {
                        if(report.type == "track" && report.kind=="video" && report.remoteSource==true)
                        {
                            tracks.forEach(trackInfo => {
                                if(trackInfo.id  == report.id)
                                {
                                    let guid = GetCleanTrackId(report.trackIdentifier);
                                    let srm = document.querySelector('#srm-'+guid);
                                    if(srm)
                                    {
                                        if(srm.textContent=="...")
                                        {
                                            srm.classList.remove("hide");
                                        }
                                        srm.textContent = trackInfo.content;
                                    }
                                }
                            });
                        }
                    });
                } 
            });
            setTimeout(parent.getRTCStats, 2000, parent);
        }
    }

    
    addStream(parent, shouldCreateOffer)
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

    }
    isForThisConnection(_peerId) {
        return (_peerId != "") && ((_peerId === this.remotePeerId) || (_peerId === 'ALL'));
    }
    handleMessages(_peerId, data)
    {
        if(this.isForThisConnection(_peerId))
        {
            var msg = data;
            var msgString = msg["body"];
            switch(msg["msgtype"])
            {
                case MSG_TYPE.RTC_ICE_CANDIDATE:
                    this.onCandidate(msgString);
                    break;
                case MSG_TYPE.RTC_OFFER:
                    this.onOffer(msgString);
                    break;
                case MSG_TYPE.RTC_ANSWER:
                    this.onAnswer(msgString)
                    break;
                case MSG_TYPE.RTC_BYE:
                    this.close();
                    break;
                case MSG_TYPE.CHAT:
                    // to be implemented
                    console.error("Message Type["+msg["type"]+"] not yet implemented.");
                    break;
                default:
                    console.error("Message Type["+msg["type"]+"] unknown.");
                    break;
            }
        }
    }
    sendChat(_peerId, _msg) {
        var sent = false;
        if(this.isForThisConnection(_peerId))
        {
            this.send(MSG_TYPE.CHAT, _msg);
            sent = true;
        }
        return sent;
    }
    send(_type, _msg) {
        // to be implemented
        SendMessage(this.remotePeerId, null, "room.m.signal", _type, JSON.stringify(_msg), null);
    }
    isConnected()
    {
        return this.rtcConn.connectionState==="connected" ;
    }
    removeVideoTracks()
    {
        this.rtcConn.getTransceivers().forEach(tr => {
            //if(tr.sender.track.kind === 'video')
            if(tr && tr.sender)
            {
                this.rtcConn.removeTrack(tr.sender);
            }
        });
    }
    initiateShutdown()
    {
        this.removeVideoTracks();
        this.send(MSG_TYPE.RTC_BYE, "bye");
        setTimeout(this.close, 2000);
    }
    close()
    {
        this.remoteTracks.forEach(id => removeVideoElement("div-"+GetCleanTrackId(id)));
        this.remoteTracks = [];
        this.rtcConn.close();
        this.rtcConn = null;
        removePeerConnection();
    }
    updateMediaConstraints(desc)
    {
        let modifier = 'AS';
        let bandwidth = 5000;
        if (adapter.browserDetails.browser === 'firefox') {
            bandwidth = (bandwidth >>> 0) * 1000;
            modifier = 'TIAS';
        }
        let sdp = desc.sdp;
        if (sdp.indexOf('b=' + modifier + ':') === -1) {
            // insert b= after c= line.
            sdp = sdp.replace(/c=IN (.*)\r\n/, 'c=IN $1\r\nb=' + modifier + ':' + bandwidth + '\r\n');
        } else {
            sdp = sdp.replace(new RegExp('b=' + modifier + ':.*\r\n'), 'b=' + modifier + ':' + bandwidth + '\r\n');
        }
        desc.sdp = sdp;
        return desc;
    }
    updateBwTarget(parent, bandwidth)
    {
        if((adapter.browserDetails.browser === 'chrome' || 
            adapter.browserDetails.browser === 'safari' ||
            adapter.browserDetails.browser === 'firefox') && 
            'RTCRtpSender' in window &&
            'setParameters' in window.RTCRtpSender.prototype) 
        {
            const senders = parent.rtcConn.getSenders();
            senders.forEach(sender => {
                if(sender.track.kind==='video')
                {
                    const parameters = sender.getParameters();
                    if(!parameters.encodings){
                        parameters.encodings = [{}];
                    }
                    if(bandwidth==='unlimited')
                    {
                        delete parameters.encodings[0].maxBitrate;
                    }
                    else
                    {
                        parameters.encodings[0].maxBitrate = bandwidth * 1000;
                    }
                    sender.setParameters(parameters)
                        .then(() => {
                            console.log('Bandwidth parameters changed to '+bandwidth);
                        })
                        .catch(e => console.error(e));
                }
            });
        }
    }
}*/