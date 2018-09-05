import { Component, OnInit, Input } from '@angular/core';
import * as api from '@amc/application-api';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.css']
})
export class ActivityComponent implements OnInit {
  @Input() interactionList: Array<api.IInteraction>;
  @Input() navigationDetailsCollection: Array<api.SearchRecords>;
  public selectedInteraction: api.IInteraction;
  constructor() { }

  ngOnInit() {
    this.selectedInteraction = {
      interactionId: '',
      direction: api.InteractionDirectionTypes.Inbound
    };
  }
  setSelectedInteraction(interactionList) {
    console.log('interaction ' + interactionList.srcElement[0].id );
    this.selectedInteraction = this.getInteraction(interactionList.srcElement[0].id);
    
    
  }
  getInteraction(interactionId) {
    for ( let i = 0; i < this.interactionList.length; i++) {
      if (this.interactionList[i].interactionId === interactionId) {
        return this.interactionList[i];
  }
}
