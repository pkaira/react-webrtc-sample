export interface IMediaConstraints {
    exact?: number
    min?: number
}

export interface IDeviceId {
    exact: string
}

export interface IVideoConstraints {
    width?: IMediaConstraints
    height?: IMediaConstraints
    frameRate?: IMediaConstraints
    deviceId:IDeviceId
}

export interface IAudioConstraints {
    deviceId:IDeviceId|undefined
}

export interface IAVConstraints {
    video: IVideoConstraints
    audio?: IAudioConstraints
}