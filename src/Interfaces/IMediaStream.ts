export interface IMediaStream {
    tracks?: MediaStreamTrack[]
    videoStream: MediaStream
    isAudioAvailable: boolean
    id: string
}