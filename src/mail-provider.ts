export type MailAccount={id:string;provider:"gmail"|"outlook"|"imap"|"smtp";emailAddress:string;displayName?:string};
export interface EmailProvider{connect():Promise<void>;disconnect():Promise<void>;listThreads(cursor?:string):Promise<{threads:unknown[];nextCursor?:string}>;getThread(id:string):Promise<unknown>;send(message:{to:string[];cc?:string[];bcc?:string[];subject:string;text:string;html?:string}):Promise<{messageId:string}>;}
export class ProviderConfigurationError extends Error{constructor(message:string){super(message);this.name="ProviderConfigurationError"}}
