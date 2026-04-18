export enum HTTPErrorCode {
  ErrNoAvailablePort = 'ERR_NO_AVAILABLE_PORT',
  ErrHttpNotSupportRaw = 'ERR_HTTP_NOT_SUPPORT_RAW',
  ErrHttpListenerNotSupportSendRequest = 'ERR_HTTP_LISTENER_NOT_SUPPORT_SEND_REQUEST',
  ErrHttpClientOnlySupportRequest = 'ERR_HTTP_CLIENT_ONLY_SUPPORT_REQUEST',
  ErrHttpBodyParseFailed = 'ERR_HTTP_BODY_PARSE_FAILED',
}
