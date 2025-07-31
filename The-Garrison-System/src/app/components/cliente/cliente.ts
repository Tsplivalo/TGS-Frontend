import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from '../../models/cliente/cliente.model';
import { ClienteService } from '../../services/cliente/cliente';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cliente.html',
  styleUrls: ['./cliente.scss']
})
export class ClienteComponent implements OnInit {
  clientes: Cliente[] = [];

  constructor(private clienteService: ClienteService) {}

  ngOnInit(): void {
    this.clienteService.getAllClientes().subscribe((data) => {
      this.clientes = data;
    });
  }
}