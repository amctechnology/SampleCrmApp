import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import * as api from '@amc/application-api';
import { Application, BridgeEventsService } from '@amc/applicationangularframework';
import { bind } from 'bind-decorator';
import { search } from '@amc/channel-api';
import { InteractionDirectionTypes } from '@amc/application-api';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'app-amcsalesforcehome',
  templateUrl: './amcsalesforcehome.component.html',
})
export class AMCSalesforceHomeComponent extends Application implements OnInit {
  interactionDisconnected: Subject<boolean> = new Subject();
  flag: boolean;
  interactions: Map<String, api.IInteraction>;
  whoList: Array<IActivityDetails>;
  whatList: Array<IActivityDetails>;
  currentInteraction: api.IInteraction;
  ActivityMap: Map<string, IActivity>;
  constructor() {
    super();
    this.flag = true;
    this.interactions = new Map();
    this.whoList = [];
    this.whatList = [];
    this.ActivityMap = new Map();
    this.appName = 'Salesforce';
    this.bridgeScripts = this.bridgeScripts.concat([
      window.location.origin + '/bridge.bundle.js',
      'https://c.na1.visual.force.com/support/api/42.0/interaction.js',
      'https://na15.salesforce.com/support/console/42.0/integration.js',
      'https://gs0.lightning.force.com/support/api/42.0/lightning/opencti_min.js'
    ]);

  }
  async ngOnInit() {
    await super.ngOnInit();
    this.bridgeEventsService.subscribe('clickToDial', event => {
      api.clickToDial(event.number, this.formatCrmResults(event.records));
    });

    this.bridgeEventsService.subscribe('setActivityDetails', this.setActivityDetails);
    this.bridgeEventsService.subscribe('saveActivityResponse', this.saveActivityResponse);

  }

  formatCrmResults(crmResults: any): api.SearchRecords {
    const ignoreFields = ['Name', 'displayName', 'object', 'Id', 'RecordType'];
    const result = new api.SearchRecords();
    for (const id of Object.keys(crmResults)) {
      let recordItem: api.RecordItem = null;
      if (crmResults[id].Id && crmResults[id].RecordType) {
        recordItem = new api.RecordItem(crmResults[id].Id, crmResults[id].RecordType, crmResults[id].RecordType);
      } else if (crmResults[id].object && crmResults[id].displayName) {
        recordItem = new api.RecordItem(id, crmResults[id].object, crmResults[id].displayName);
      }

      if (recordItem !== null) {
        if (crmResults[id].Name) {
          if (recordItem.getMetadata().Type === 'Account') {
            recordItem.setAccountName('Name', 'Name', crmResults[id].Name);
          } else if (recordItem.getMetadata().Type === 'Contact') {
            recordItem.setFullName('Name', 'Name', crmResults[id].Name);
          } else {
            recordItem.setField('Name', 'Name', 'Name', crmResults[id].Name);
          }
        }

        for (const fieldName of Object.keys(crmResults[id])) {
          if (ignoreFields.indexOf(fieldName) < 0) {
            recordItem.setField(fieldName, fieldName, fieldName, crmResults[id][fieldName]);
          }
        }

        result.addSearchRecord(recordItem);
      }
    }
    return result;
  }

  protected getUserInfoHandler() {
    return this.bridgeEventsService.sendEvent('getUserInfo');
  }

  protected async getSearchLayout() {
    const salesforceLayouts = await this.bridgeEventsService.sendEvent('getSearchLayout');

    const result = new api.SearchLayouts();

    const telephonyLayout = new api.SearchLayout(false, []);


    if (salesforceLayouts.Internal) {
      telephonyLayout.setInternal(this.parseSearchLayoutEntities(salesforceLayouts.Internal));
    }

    if (salesforceLayouts.Inbound) {
      const openInNewWindow =
        salesforceLayouts.Inbound.screenPopSettings &&
        salesforceLayouts.Inbound.screenPopSettings.screenPopOpenWithin &&
        salesforceLayouts.Inbound.screenPopSettings.screenPopOpenWithin !== 'ExistingWindow';

      switch (salesforceLayouts.Inbound.screenPopSettings.NoMatch.screenPopType) {
        case 'PopToEntity':
          telephonyLayout.setNoMatch({
            type: api.NoMatchPopTypes.PopToNewEntity,
            data: salesforceLayouts.Inbound.screenPopSettings.NoMatch.screenPopData
          });
          break;
        case 'DoNotPop':
          telephonyLayout.setNoMatch({
            type: api.NoMatchPopTypes.NoPop
          });
          break;
        case 'PopToVisualforce':
          telephonyLayout.setNoMatch({
            type: api.NoMatchPopTypes.PopToUrl,
            data: salesforceLayouts.Inbound.screenPopSettings.NoMatch.screenPopData
          });
      }

      switch (salesforceLayouts.Inbound.screenPopSettings.SingleMatch.screenPopType) {
        case 'PopToEntity':
          telephonyLayout.setSingleMatch({
            type: api.SingleMatchPopTypes.PopToDetials
          });
          break;
        case 'DoNotPop':
          telephonyLayout.setSingleMatch({
            type: api.SingleMatchPopTypes.NoPop
          });
          break;
        case 'PopToVisualforce':
          telephonyLayout.setSingleMatch({
            type: api.SingleMatchPopTypes.PopToUrl,
            data: salesforceLayouts.Inbound.screenPopSettings.SingleMatch.screenPopData
          });
      }

      switch (salesforceLayouts.Inbound.screenPopSettings.MultipleMatches.screenPopType) {
        case 'PopToEntity':
          telephonyLayout.setMultiMatch({
            type: api.MultiMatchPopTypes.PopToSearch
          });
          break;
        case 'DoNotPop':
          telephonyLayout.setMultiMatch({
            type: api.MultiMatchPopTypes.NoPop
          });
          break;
        case 'PopToVisualforce':
          telephonyLayout.setMultiMatch({
            type: api.MultiMatchPopTypes.PopToUrl,
            data: salesforceLayouts.Inbound.screenPopSettings.MultipleMatches.screenPopData
          });
      }

      telephonyLayout.setInbound(this.parseSearchLayoutEntities(salesforceLayouts.Inbound));

      telephonyLayout.setDefault(telephonyLayout.getInbound());
      telephonyLayout.setOpenInNewWindow(openInNewWindow);
    }

    if (salesforceLayouts.Outbound) {
      telephonyLayout.setOutbound(this.parseSearchLayoutEntities(salesforceLayouts.Outbound));
    }


    result.setLayout([api.ChannelTypes.Telephony], telephonyLayout);
    return result;

  }
  private parseSearchLayoutEntities(salesforceLayout: any): api.ISearchLayoutForEntity[] {
    const layoutsForEntities: api.ISearchLayoutForEntity[] = [];
    for (const entityName of Object.keys(salesforceLayout.objects)) {
      const layoutForEntity: api.ISearchLayoutForEntity = {
        DisplayName: entityName,
        DevName: entityName,
        DisplayFields: [],
        PhoneFields: [],
        EmailFields: [],
        SocialFields: [],
        NameFields: []
      };

      for (const field of Object.values<{ apiName, displayName }>(salesforceLayout.objects[entityName])) {
        layoutForEntity.DisplayFields.push({
          DevName: field.apiName,
          DisplayName: field.displayName,
          Value: null,
        });
      }

      layoutsForEntities.push(layoutForEntity);
    }

    return layoutsForEntities;
  }

  protected isToolbarVisible(): Promise<boolean> {
    return this.bridgeEventsService.sendEvent('isToolbarVisible');
  }

  protected saveActivity(activity): Promise<string> {
    return Promise.resolve(this.bridgeEventsService.sendEvent('saveActivity', activity));
  }
  @bind
  protected saveActivityResponse(response) {
    console.log(response);
  }
    /**
   * This listens for onInteraction events. It will call preformScreenpop if needed.
   * Note: if overridden you do not need to bind the new method
   */
  protected async onInteraction(interaction: api.IInteraction): Promise<api.SearchRecords> {
    try {
      if (!this.ActivityMap.has(interaction.interactionId)) {
        this.ActivityMap.set(interaction.interactionId, this.createActivity(interaction));
      }
      this.logger.logVerbose('onInteraction START: ' + interaction);
      const interactionId = interaction.interactionId;
      const scenarioIdInt = interaction.scenarioId;
      let isNewScenarioId = false;
      if (!this.scenarioInteractionMappings.hasOwnProperty(scenarioIdInt)) {

        this.scenarioInteractionMappings[scenarioIdInt] = {};

        isNewScenarioId = true;
      }
      this.scenarioInteractionMappings[scenarioIdInt][interactionId] = true;


      if (this.shouldPreformScreenpop(interaction, isNewScenarioId)) {
        let searchRecord = null;
        searchRecord = await this.preformScreenpop(interaction);
        this.currentInteraction = interaction;
        return searchRecord;
      } else if (interaction.state === api.InteractionStates.Disconnected) {
        delete this.scenarioInteractionMappings[scenarioIdInt][interactionId];
        this.interactionDisconnected.next(!this.flag);
        if (Object.keys(this.scenarioInteractionMappings[scenarioIdInt]).length === 0) {
          delete this.scenarioInteractionMappings[scenarioIdInt];
        }
      }
    } catch (e) {
      const msg = 'Error in onInteraction! Exception details: ' + e.message;
      this.logger.logError(msg);
      throw msg;
    }
    this.logger.logVerbose('onInteraction END');
    return;
  }


  // Add the current interaction to the interaction map
  protected mapInteraction(interaction: api.IInteraction) {
    if (this.interactions.has(interaction.interactionId)) {
      if (interaction.state === api.InteractionStates.Disconnected) {
        this.interactions.delete(interaction.interactionId);
       // this.saveActivity(this.createActivity(interaction));
      }
    } else {
      this.interactions.set(interaction.interactionId, interaction);
    }

  }

  protected createActivity(interaction: api.IInteraction): IActivity {
    const date = new Date();
    const activity: IActivity = {
      WhatId: '',
      WhoId: '',
      Subject: '',
      CallType: '',
      CallDurationInSeconds: '0',
      Description: '',
      Status: 'Completed',
      ActivityDate: date,
      ActivityId: '',
      InteractionId: interaction.interactionId
    };

    return activity;
  }
protected whatListContains(whatObject: IActivityDetails): boolean {
  for ( let i = 0; i < this.whatList.length; i++) {
    if (this.whatList[i].objectId === whatObject.objectId) {
      return true;
    }
  }
  return false;
}
protected whoListContains(whoObject) {
  for ( let i = 0; i < this.whoList.length; i++) {
    if (this.whoList[i].objectId === whoObject.objectId) {
      return true;
    }
  }
  return false;
}
@bind
protected setActivityDetails(eventObject) {
  if (eventObject.objectType === 'Contact' || eventObject.objectType === 'Lead') {
    if (!this.whoListContains(eventObject)) {
      this.whoList.push(eventObject);
    }
  } else {
    if (!this.whatListContains(eventObject)) {
      this.whatList.push(eventObject);
    }
  }

}
@bind
protected createNewEntity(type) {
  const params = this.buildParams(type);
  this.bridgeEventsService.sendEvent('createNewEntity', params);
}

protected buildParams(type) {
  const params: IParams = {
    entityName: type,
    defaultFieldValues: {
      Phone: this.currentInteraction.details.fields.Phone.Value
    }
  };
  return params;
}

}
interface IActivityDetails  {
  objectType: string;
  displayName: string;
  objectName: string;
  objectId: string;
  url: string;
}

interface IActivity {
  WhoId: string;
  WhatId: string;
  CallType: string;
  CallDurationInSeconds: string;
  Subject: string;
  Description: string;
  Status: string;
  ActivityDate: Date;
  ActivityId: string;
  InteractionId: string;
}
interface IParams {
  entityName: string;
  defaultFieldValues?: {
    Phone: string
  };
}
