import { Peer } from "peerjs"
import { ISignalingMessage } from "../Interfaces/ISignalingMessage"

const PEER_SUFFIX = 'lvdsxdw9douiu6uzfz288bnp3lfg'

export class SignalingConnection {
    peer:Peer
    public peerId:string = ''
    conn:any = undefined    
    handleIncomingData: (msg:ISignalingMessage) => void
    handleConnection: (data:string) => void
    setPeerId: (peerId:string|undefined) => void

    constructor(
        handleIncomingData: (msg:ISignalingMessage) => void ,
        handleConnection: (msg:string) => void,
        setPeerId: (peerId:string|undefined) => void
        ) {
        
        this.handleIncomingData = handleIncomingData
        this.handleConnection = handleConnection
        this.setPeerId = setPeerId
        
        this.peer = new Peer(this.getRandomPrefix()+'-'+PEER_SUFFIX)
        
        this.peer.on('open', (id) => {
            this.peerId = id
            console.log(id)
            if(id.indexOf('-')>0 && id.indexOf('-')<7)
            {
                id = id.substring(0,id.indexOf('-'))
            }
            this.setPeerId(id)
        })
        this.peer.on('error', (error) => {
            console.error(error)
        })
        
        this.peer.on('connection', (conn) => {
            this.conn = conn
            this.handleConnection('incoming')
            conn.on('data', (data:any) => {
                this.handleIncomingData(JSON.parse(data) as ISignalingMessage)
            })
        })
    }

    sendData(data:string)
    {
        this.conn?.send(data)
    }

    connectToPeer(remotePeer:string)
    {
        if(remotePeer.length < 6) {
            remotePeer = remotePeer+"-"+PEER_SUFFIX
        }
        const conn = this.peer.connect(remotePeer)
        this.conn = conn
        conn.on('open', ()=> {
            this.handleConnection('outgoing')
        })
        conn.on('data', (data:any) => {
            this.handleIncomingData(JSON.parse(data) as ISignalingMessage)
        })
    }

    getRandomPrefix = () => {
        return Math.floor(Math.random() * 10007)+1;
    }
}