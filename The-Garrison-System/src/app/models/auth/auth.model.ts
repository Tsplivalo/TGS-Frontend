export interface UsuarioDTO {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  username: string;
  email: string;
  password: string;
}

/** Tu ApiResponse actual solo usa { data }, lo mantenemos igual. */
export interface ApiResponse<T> {
  data: T;
}
