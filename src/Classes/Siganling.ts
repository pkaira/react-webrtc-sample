import { Peer } from "peerjs"
import { ISignalingMessage } from "../Interfaces/ISignalingMessage"

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
        this.peer = new Peer()
        
        this.peer.on('open', (id) => {
            this.peerId = id
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
        const conn = this.peer.connect(remotePeer)
        this.conn = conn
        conn.on('open', ()=> {
            this.handleConnection('outgoing')
        })
        conn.on('data', (data:any) => {
            this.handleIncomingData(JSON.parse(data) as ISignalingMessage)
        })
    }
}