export interface Usuario {
  id?: string;
  dni: string;
  nombre: string;
  username: string;
  email: string;
  password: string;
  rol: 'ADMIN' | 'CLIENTE'; 
}
