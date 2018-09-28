import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { LoggerService } from './../logger.service';
import { SearchInformationComponent } from './search-information.component';

describe('SearchInformationComponent', () => {
  let component: SearchInformationComponent;
  let fixture: ComponentFixture<SearchInformationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SearchInformationComponent],
      providers: [LoggerService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
