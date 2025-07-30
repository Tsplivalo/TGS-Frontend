import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Zona } from './zona';

describe('Zona', () => {
  let component: Zona;
  let fixture: ComponentFixture<Zona>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Zona]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Zona);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
