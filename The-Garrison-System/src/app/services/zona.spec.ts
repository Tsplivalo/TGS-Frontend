import { TestBed } from '@angular/core/testing';

import { Zona } from './zona';

describe('Zona', () => {
  let service: Zona;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Zona);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
