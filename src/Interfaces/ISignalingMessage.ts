export enum MSG_TYPE {
    RTC_OFFER= 'rtc-offer',
    RTC_ANSWER= 'rtc-answer',
    RTC_ICE_CANDIDATE= 'rtc-icecandidate',
    RTC_BYE= 'rtc-bye'
}

export interface ISignalingMessage {
    src: string
    target?: string
    type: MSG_TYPE
    data: any
}