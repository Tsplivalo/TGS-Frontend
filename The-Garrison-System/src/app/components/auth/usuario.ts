import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../services/auth/usuario';
import { Usuario } from '../../models/auth/usuario.model';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuario.html',
  styleUrls: ['./usuario.scss']
})
export class UsuarioComponent implements OnInit {
  usuarios: Usuario[] = [];

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.obtenerUsuarios();
  }

  obtenerUsuarios(): void {
    this.usuarioService.getAll().subscribe(data => {
      this.usuarios = data;
    });
  }
}
