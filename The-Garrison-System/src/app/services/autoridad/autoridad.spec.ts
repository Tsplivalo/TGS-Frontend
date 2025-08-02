import { TestBed } from '@angular/core/testing';

import { Autoridad } from './autoridad';

describe('Autoridad', () => {
  let service: Autoridad;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Autoridad);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
