/// <reference types="jasmine" />

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, RouterTestingModule],
  }).compileComponents();
});
