import { Component, OnInit } from '@angular/core';
import * as api from '@amc/application-api';
import { Application, BridgeEventsService } from '@amc/applicationangularframework';
import { bind } from 'bind-decorator';
import { search } from '@amc/channel-api';

@Component({
  selector: 'app-amcsalesforcehome',
  templateUrl: './amcsalesforcehome.component.html',
})
export class AMCSalesforceHomeComponent extends Application implements OnInit {
  interactions: Map<String, api.IInteraction>;
  interactionList: Array<api.IInteraction>;
  navigationDetailsCollection: Array<api.SearchRecords>;
  currentInteraction: api.IInteraction;
  constructor() {
    super();
    this.interactions = new Map();
    this.interactionList = [];
    this.navigationDetailsCollection = [];
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

    this.bridgeEventsService.subscribe('setNavigationDetails', this.setNavigationDetails);

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

  protected saveActivity(activity: api.Activity): Promise<string> {
    return Promise.reject('Not Implemented!'); // Note: this has not been implemented because it is going to be reworked soon
  }

    /**
   * This listens for onInteraction events. It will call preformScreenpop if needed.
   * Note: if overridden you do not need to bind the new method
   */
  protected async onInteraction(interaction: api.IInteraction): Promise<api.SearchRecords> {
    try {
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
        let searchRecord: api.SearchRecords = null;
        searchRecord = await this.preformScreenpop(interaction);
        interaction = this.addSearchResultsToInteraction(interaction, searchRecord);
        // interaction does not exist.
        this.mapInteraction(interaction);
        return searchRecord;
      } else if (interaction.state === api.InteractionStates.Disconnected) {
        delete this.scenarioInteractionMappings[scenarioIdInt][interactionId];

        if (Object.keys(this.scenarioInteractionMappings[scenarioIdInt]).length === 0) {

          delete this.scenarioInteractionMappings[scenarioIdInt];

        }
      }
      // map interaction if interaction already is mapped.
      this.mapInteraction(interaction);
    } catch (e) {
      const msg = 'Error in onInteraction! Exception details: ' + e.message;
      this.logger.logError(msg);
      throw msg;
    }
    this.logger.logVerbose('onInteraction END');
    return;
  }

  protected setInteractionDetails(details) {
    const detailsObject = {

    };
   // this.interactions.set(detailsObject);
  }

  // Add the current interaction to the interaction map
  protected mapInteraction(interaction: api.IInteraction) {
    if (this.interactions.has(interaction.interactionId)) {
      if (interaction.state === api.InteractionStates.Disconnected) {
        this.interactions.delete(interaction.interactionId);
        this.saveActivity(this.createActivity(interaction));
      }
    } else {
      let callNotes = new api.RecordItem('Call Notes', 'Call Notes', 'Call Notes');
      callNotes.fields['Callnotes'] = {
      DevName: 'Call Notes',
      DisplayName: 'Call Notes',
      Value: ''
      };
      // add a field for call notes to this interaction
      interaction.details['Call Notes'] = callNotes;
      this.interactions.set(interaction.interactionId, interaction);
    }

  }
  protected addSearchResultsToInteraction(interaction: api.IInteraction, searchResults: api.SearchRecords): api.IInteraction {
    let searchRecord = new api.RecordItem('Search Record', 'Search Record', 'Search Record');
    searchRecord.fields['search Record'] = {
    DevName: 'Search Record',
    DisplayName: 'Search Record',
    Value: searchResults
    };
    interaction.details['Search Record'] = searchRecord;
    if (!this.interactionsListContains(interaction)) {
      this.interactionList.push(interaction);
    }
    return interaction;
  }

  protected createActivity(interaction: api.IInteraction): api.Activity {
    let activity: api.Activity = null;
    activity.id = interaction.interactionId;

    return activity;
  }
@bind
  setNavigationDetails(navigationDetails) {
    if (!navigationDetails['']) {
      if (!this.navigationDetailsCollection.includes(navigationDetails)) {
        this.navigationDetailsCollection.push(navigationDetails);
      }
    }
  }
protected interactionsListContains(interaction: api.IInteraction): boolean {
  for ( let i = 0; i < this.interactionList.length; i++) {
    if (this.interactionList[i].interactionId === interaction.interactionId) {
      return true;
    }
    return false;
  }
}




}
