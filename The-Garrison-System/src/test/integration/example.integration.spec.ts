import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from '../../app/app.component';

describe('App integration: bootstraps and fetches config', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [HttpClientTestingModule, RouterTestingModule],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should create the app and call /assets/i18n/es.json once', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const req = httpMock.expectOne(/assets\/.*\.json$/);
    expect(req.request.method).toBe('GET');
    req.flush({});
    httpMock.verify();

    expect(fixture.componentInstance).toBeTruthy();
  });
});


