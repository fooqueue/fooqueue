export type LogInterface = {
  info: (message: string) => void,
  debug: (message: string) => void,
  warn: (message: string) => void,
  error: (message: string) => void,
}

export default function (LOG_LEVEL: 'info' | 'debug' | 'warn' | 'error') {
  return  {
    info: (message: string) => {
      if(LOG_LEVEL === 'info' || LOG_LEVEL === 'warn' || LOG_LEVEL === 'debug' || LOG_LEVEL === 'error') console.info(`INFO: ${message}`);
    },
    debug: (message: string) => {
      if(LOG_LEVEL === 'debug' || LOG_LEVEL === 'warn' || LOG_LEVEL === 'error' ) console.debug(`DEBUG: ${message}`);
    },
    warn: (message: string) => {
      if(LOG_LEVEL === 'warn' || LOG_LEVEL === 'error' ) console.warn(`WARN: ${message}`);
    },
    error: (message: string) => {
      if(LOG_LEVEL === 'error') console.error(`ERROR: ${message}`);
  }
  }
}