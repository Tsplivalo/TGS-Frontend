import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 100, transform: 'translateY(20px)' }),
        animate('600ms ease-out', style({ opacity: 100, transform: 'none' }))
      ])
    ])
  ]
})
export class HomeComponent {}
