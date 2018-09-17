import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as api from '@amc/application-api';

@Component({
  selector: 'app-search-information',
  templateUrl: './search-information.component.html',
  styleUrls: ['./search-information.component.css']
})
export class SearchInformationComponent implements OnInit {
  @Input() singleResult: boolean;
  @Input() searchRecordList: Array<api.IRecordItem>;
  @Output() screenPopSelectedSearchResult: EventEmitter<string> = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  protected onSearchSelectChange(event) {
    this.screenPopSelectedSearchResult.emit(event.currentTarget.value);
  }
  protected getSearchRecord(id): IActivityDetails {
    for (let i = 0; i < this.searchRecordList.length; i++) {
      if (this.searchRecordList[i].id === id) {
        return this.searchRecordList[i];
      }
    }
  }
}
