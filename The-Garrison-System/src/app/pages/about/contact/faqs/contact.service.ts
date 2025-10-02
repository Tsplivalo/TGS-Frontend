import { Injectable } from '@angular/core';


export type ContactPayload = {
name: string; email: string; subject: string; message: string; agree: boolean
};


@Injectable({ providedIn: 'root' })
export class ContactService {
async send(payload: ContactPayload): Promise<{ ok: true }>{
// Simulación de llamada HTTP
await new Promise(r => setTimeout(r, 800));
console.log('[ContactService] payload', payload);
return { ok: true };
}
}