import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthorityComponent } from './authority';

describe('AuthorityComponent', () => {
  let component: AuthorityComponent;
  let fixture: ComponentFixture<AuthorityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthorityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthorityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
