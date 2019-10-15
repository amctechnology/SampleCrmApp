import { Component, OnInit } from '@angular/core';
import * as api from '@amc-technology/davinci-api';
import { Application } from '@amc-technology/applicationangularframework';
import { bind } from 'bind-decorator';
import {
  IInteraction,
  registerOnLogout,
  ChannelTypes
} from '@amc-technology/davinci-api';
import { IActivity } from '../Model/IActivity';
import { ICreateNewSObjectParams } from '../Model/ICreateNewSObjectParams';
import { LoggerService } from '../logger.service';
import { StorageService } from '../storage.service';
@Component({
  selector: 'app-home',
  templateUrl: './home-salesforce.component.html'
})
export class HomeSalesforceComponent extends Application implements OnInit {
  protected phoneNumberFormat: string;
  protected quickCommentList: string[];
  protected QuickCreateEntities: any;
  protected cadActivityMap: Object;
  screenpopOnAlert: Boolean;
  wasClickToDial: boolean;
  lastOnFocusWasAnEntity: boolean;
  ScreenpopOnClickToDialListView: boolean;
  lastClickToDialSearchRecord: any;
  clickToDialEntity: any;
  DisplayQuickCreate: boolean;
  public quickCommentOptionRequiredCadArray: any;


  constructor(
    private loggerService: LoggerService,
    protected storageService: StorageService
  ) {
    super(loggerService.logger);
    this.loggerService.logger.logDebug(
      'AMCSalesforceHomeComponent: constructor start'
    );
    this.storageService.syncWithLocalStorage();
    this.screenpopOnAlert = true;
    this.ScreenpopOnClickToDialListView = false;
    this.phoneNumberFormat = null;
    this.DisplayQuickCreate = true;
    this.wasClickToDial = false;
    this.appName = 'Salesforce';
    this.quickCommentOptionRequiredCadArray = {};
    this.loggerService.logger.logDebug(
      'AMCSalesforceHomeComponent: constructor complete'
    );
  }

  async ngOnInit() {
    const config = await api.getConfig();
    let salesforceOrg = 'https://na53.salesforce.com';
    if (
      config['variables']['salesforceOrg'] !== undefined &&
      config['variables']['salesforceOrg'] !== null &&
      String(config['variables']['salesforceOrg']).length > 0
    ) {
      salesforceOrg = String(config['variables']['salesforceOrg']);
    }

    this.bridgeScripts = this.bridgeScripts.concat([
      this.getBridgeURL(),
      salesforceOrg + '/support/api/44.0/interaction.js',
      salesforceOrg + '/support/console/44.0/integration.js',
      salesforceOrg + '/support/api/44.0/lightning/opencti_min.js'
    ]);

    await super.ngOnInit();
    this.loggerService.logger.logDebug(
      'AMCSalesforceHomeComponent: ngOnInit start'
    );
    this.bridgeEventsService.subscribe('clickToDial', event => {
      this.wasClickToDial = true;
      this.lastOnFocusWasAnEntity = event.lastOnFocusWasAnEntity;
      this.clickToDialEntity = event.entity;
      let objectForFormatCrmResults = {};
      if (event.isLightning) {
        objectForFormatCrmResults = {
          [event.entity.recordId]: {
            Id: event.entity.recordId,
            Name: event.entity.recordName,
            RecordType: event.entity.objectType
          }
        };
        api.clickToDial(
          event.entity.number,
          this.formatCrmResults(objectForFormatCrmResults)
        );
      } else {
        const classicEntity = JSON.parse(event.entity.result);
        objectForFormatCrmResults = {
          [classicEntity.objectId]: {
            Id: classicEntity.objectId,
            Name: classicEntity.objectName,
            RecordType: classicEntity.object
          }
        };
        api.clickToDial(
          classicEntity.number,
          this.formatCrmResults(objectForFormatCrmResults)
        );
      }
    });
    this.bridgeEventsService.subscribe(
      'setActivityDetails',
      this.setActivityDetails
    );

    this.phoneNumberFormat = String(
      config['variables']['PhoneNumberFormat']
    ).toLowerCase();

    if (
      config['variables']['ScreenpopOnAlert'] !== null &&
      config['variables']['ScreenpopOnAlert'] !== undefined
    ) {
      this.screenpopOnAlert = Boolean(config['variables']['ScreenpopOnAlert']);
    }
    this.quickCommentList = <string[]>config['variables']['QuickComments'];
    for (let i = 0; i < this.quickCommentList.length; i++) {
      this.quickCommentList[i] = this.quickCommentList[i].replace(/\\n/g, String.fromCharCode(13, 10));
      this.quickCommentList[i] = this.quickCommentList[i].replace(/\\t/g, String.fromCharCode(9));
    }
    const CADQuickCommentRegex = /\{\{.*?\}\}/g;
    for (let i = 0; i < this.quickCommentList.length; i++) {
      this.quickCommentOptionRequiredCadArray[i] = this.quickCommentList[i].match(CADQuickCommentRegex);
    }
    this.QuickCreateEntities =
      config['QuickCreate']['variables']['QuickCreateKeyList'];
    this.DisplayQuickCreate = (Object.keys(this.QuickCreateEntities).length > 0);

    if (config['variables']['CADActivityMap']) {
      this.cadActivityMap = config['variables']['CADActivityMap'];
    } else {
      this.cadActivityMap = {};
    }
    this.ScreenpopOnClickToDialListView = <boolean>(
      config['variables']['ScreenpopOnClickToDialListView']
    );
    this.storageService.maxRecentItems = <Number>(
      config['variables']['MaxRecentItems']
    );
    registerOnLogout(this.removeLocalStorageOnLogout);
    this.loggerService.logger.logDebug(
      'AMCSalesforceHomeComponent: ngOnInit complete'
    );
  }

  protected removeLocalStorageOnLogout(): Promise<any> {
    return new Promise(() => {
      localStorage.clear();
    });
  }

  protected formatPhoneNumber(number: string) {
    let numberIndex = 0;
    let formatIndex = 0;
    let formattedNumber = '';
    number = number.replace(/\D/g, '');
    number = this.reverse(number);
    const phoneNumberFormat = this.reverse(this.phoneNumberFormat);
    if (number && phoneNumberFormat) {
      while (formatIndex < phoneNumberFormat.length) {
        if (numberIndex === number.length + 1) {
          return this.reverse(formattedNumber);
        }
        if (phoneNumberFormat[formatIndex] !== 'x') {
          formattedNumber = formattedNumber + phoneNumberFormat[formatIndex];
          formatIndex = formatIndex + 1;
          if (
            numberIndex < number.length &&
            isNaN(Number(number[numberIndex]))
          ) {
            numberIndex = numberIndex + 1;
          }
        } else if (isNaN(Number(number[numberIndex]))) {
          numberIndex = numberIndex + 1;
        } else {
          if (numberIndex === number.length) {
            return this.reverse(formattedNumber);
          }
          while (
            formatIndex < phoneNumberFormat.length &&
            phoneNumberFormat[formatIndex] === 'x'
          ) {
            formatIndex = formatIndex + 1;
            if (
              numberIndex < number.length &&
              !isNaN(Number(number[numberIndex]))
            ) {
              formattedNumber = formattedNumber + number[numberIndex];
              numberIndex = numberIndex + 1;
            } else {
              formatIndex = formatIndex - 1;
              break;
            }
          }
        }
      }
    }
    return this.reverse(formattedNumber);
  }

  protected reverse(input: string): string {
    let reverse = '';
    for (let i = 0; i < input.length; i++) {
      reverse = input[i] + reverse;
    }
    return reverse;
  }

  protected formatCrmResults(crmResults: any): api.SearchRecords {
    const ignoreFields = ['Name', 'displayName', 'object', 'Id', 'RecordType'];
    const result = new api.SearchRecords();
    for (const id of Object.keys(crmResults)) {
      let recordItem: api.RecordItem = null;
      if (crmResults[id].Id && crmResults[id].RecordType) {
        recordItem = new api.RecordItem(
          crmResults[id].Id,
          crmResults[id].RecordType,
          crmResults[id].RecordType
        );
      } else if (crmResults[id].object && crmResults[id].displayName) {
        recordItem = new api.RecordItem(
          id,
          crmResults[id].object,
          crmResults[id].displayName
        );
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
            recordItem.setField(
              fieldName,
              fieldName,
              fieldName,
              crmResults[id][fieldName]
            );
          }
        }
        result.addSearchRecord(recordItem);
      }
    }
    return result;
  }

  protected async getSearchLayout() {
    const salesforceLayouts = await this.bridgeEventsService.sendEvent(
      'getSearchLayout'
    );
    const result = new api.SearchLayouts();
    const telephonyLayout = new api.SearchLayout(false, []);
    if (salesforceLayouts.Internal) {
      telephonyLayout.setInternal(
        this.parseSearchLayoutEntities(salesforceLayouts.Internal)
      );
    }
    if (salesforceLayouts.Inbound) {
      const openInNewWindow =
        salesforceLayouts.Inbound.screenPopSettings &&
        salesforceLayouts.Inbound.screenPopSettings.screenPopOpenWithin &&
        salesforceLayouts.Inbound.screenPopSettings.screenPopOpenWithin !==
          'ExistingWindow';
      switch (
        salesforceLayouts.Inbound.screenPopSettings.NoMatch.screenPopType
      ) {
        case 'PopToEntity':
          telephonyLayout.setNoMatch({
            type: api.NoMatchPopTypes.PopToNewEntity,
            data:
              salesforceLayouts.Inbound.screenPopSettings.NoMatch.screenPopData
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
            data:
              salesforceLayouts.Inbound.screenPopSettings.NoMatch.screenPopData
          });
      }
      switch (
        salesforceLayouts.Inbound.screenPopSettings.SingleMatch.screenPopType
      ) {
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
            data:
              salesforceLayouts.Inbound.screenPopSettings.SingleMatch
                .screenPopData
          });
      }
      switch (
        salesforceLayouts.Inbound.screenPopSettings.MultipleMatches
          .screenPopType
      ) {
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
            data:
              salesforceLayouts.Inbound.screenPopSettings.MultipleMatches
                .screenPopData
          });
      }
      telephonyLayout.setInbound(
        this.parseSearchLayoutEntities(salesforceLayouts.Inbound)
      );
      telephonyLayout.setDefault(telephonyLayout.getInbound());
      telephonyLayout.setOpenInNewWindow(openInNewWindow);
    }
    if (salesforceLayouts.Outbound) {
      telephonyLayout.setOutbound(
        this.parseSearchLayoutEntities(salesforceLayouts.Outbound)
      );
    }
    result.setLayout([api.ChannelTypes.Telephony], telephonyLayout);
    return result;
  }

  private parseSearchLayoutEntities(
    salesforceLayout: any
  ): api.ISearchLayoutForEntity[] {
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

      for (const field of Object.values<{ apiName; displayName }>(
        salesforceLayout.objects[entityName]
      )) {
        layoutForEntity.DisplayFields.push({
          DevName: field.apiName,
          DisplayName: field.displayName,
          Value: null
        });
      }

      layoutsForEntities.push(layoutForEntity);
    }

    return layoutsForEntities;
  }

  protected isToolbarVisible(): Promise<boolean> {
    return this.bridgeEventsService.sendEvent('isToolbarVisible');
  }

  protected async saveActivity(scenarioId, isComplete = false): Promise<string> {
    let activity = this.storageService.getActivity(scenarioId);
    this.loggerService.logger.logDebug('Salesforce Home: Save activity: ' + JSON.stringify(activity), api.ErrorCode.ACTIVITY);
    if (activity.IsActive && isComplete) {
      activity.IsActive = false;
    }
    activity.Status = (isComplete) ? 'Completed' : 'Not Completed';
    this.loggerService.logger.logDebug(`SalesforceHome: Sending activity: ${JSON.stringify(activity)} to bridge to be saved`,
      api.ErrorCode.ACTIVITY
    );
    activity = await this.bridgeEventsService.sendEvent('saveActivity', activity);
    this.loggerService.logger.logDebug(`AMCSalesforceHomeComponent: Updated activity received from bridge: ${JSON.stringify(activity)}`,
      api.ErrorCode.ACTIVITY
    );
    this.storageService.updateActivity(activity);
    return Promise.resolve(activity.ActivityId);
  }

  protected formatDate(date: Date): string {
    let month = '' + (date.getMonth() + 1);
    let day = '' + date.getDate();
    const year = '' + date.getFullYear();
    if (month.length < 2) {
      month = '0' + month;
    }
    if (day.length < 2) {
      day = '0' + day;
    }
    return year + '-' + month + '-' + day;
  }

  protected async onInteraction(
    interaction: api.IInteraction
  ): Promise<api.SearchRecords> {
    this.loggerService.logger.logDebug(
      `AMCSalesforceHomeComponent: Interaction recieved: ${JSON.stringify(
        interaction
      )}`,
      api.ErrorCode.INTERACTION_EVENT
    );
    try {
      const scenarioId = interaction.scenarioId;
      let isNewScenarioId = false;
      this.storageService.updateCadFields(interaction, this.cadActivityMap);
      if (this.storageService.recentActivityListContains(scenarioId) && this.storageService.currentScenarioId !== scenarioId) {
        this.saveActivity(scenarioId, true);
        return;
      }

      if (interaction.details.fields.Phone && interaction.details.fields.Phone.Value) {
        interaction.details.fields.Phone.Value = this.formatPhoneNumber(interaction.details.fields.Phone.Value);
      }

      isNewScenarioId = await this.processIfNewScenario(interaction);

      if (interaction['userFocus'] || (this.storageService.activeScenarioIdList.length === 1 &&
        this.storageService.activeScenarioIdList.indexOf(scenarioId) >= 0)) {
        this.storageService.setCurrentScenarioId(scenarioId);
      }

      if (interaction.state === api.InteractionStates.Disconnected) {
        this.loggerService.logger.logDebug(`Salesforce Home: Disconnect interaction received:${JSON.stringify(interaction)}`,
          api.ErrorCode.DISCONEECTED_INTERACTION
        );
        this.wasClickToDial = false;
        this.deleteExistingScenario(interaction);
      } else if (!(interaction.state === api.InteractionStates.Alerting && this.screenpopOnAlert === false)) {
        if (!this.lastOnFocusWasAnEntity && this.wasClickToDial) {
          if (this.ScreenpopOnClickToDialListView) {
            interaction.details.type = 'ClickToDialScreenpop';
          } else {
            interaction.details.type = 'ClickToDialNoScreenpop';
          }
          interaction.details.id = this.clickToDialEntity;
        }
        if (!this.storageService.searchRecordList[scenarioId]) {
            const searchRecord = await this.searchAndScreenpop(interaction, isNewScenarioId);
            this.storageService.setsearchRecordList(searchRecord.toJSON(), scenarioId);
            this.wasClickToDial = false;
            return searchRecord;
        }
      }
    } catch (e) {
      const msg = `Error in onInteraction! Exception details: ${e.message}`;
      this.logger.logError(msg);
      this.wasClickToDial = false;
      throw msg;
    }
    this.wasClickToDial = false;
    return;
  }

  private async searchAndScreenpop(interaction: api.IInteraction, isNewScenarioId: boolean) {
    if (this.shouldPreformScreenpop(interaction, isNewScenarioId)) {
      return await this.preformScreenpop(interaction);
    } else {
      this.logger.logDebug('searchAndScreenpop START:' +  JSON.stringify(interaction));
      const event = this.generateEventForScreenpop(interaction);
      event['search'] = true;
      const screenpopResult = await this.bridgeEventsService.sendEvent('search', event);
      this.logger.logDebug('searchAndScreenpop searchResults=' + screenpopResult);
      const records = this.formatCrmResults(screenpopResult);
      this.logger.logDebug('searchAndScreenpop records=' + screenpopResult);
      this.logger.logDebug('searchAndScreenpop END');
      return records;
    }
  }

  protected deleteExistingScenario(interaction: api.IInteraction): void {
    if (this.scenarioInteractionMappings[interaction.scenarioId]) {
      delete this.scenarioInteractionMappings[interaction.scenarioId][interaction.interactionId];
      if (Object.keys(this.scenarioInteractionMappings[interaction.scenarioId]).length === 0) {
        this.saveActivity(interaction.scenarioId, true);
        this.storageService.onInteractionDisconnect(interaction.scenarioId);
        delete this.scenarioInteractionMappings[interaction.scenarioId];
      }
    }
  }

  protected async processIfNewScenario(interaction: api.IInteraction): Promise<boolean> {
    if (!this.scenarioInteractionMappings.hasOwnProperty(interaction.scenarioId)) {
      this.scenarioInteractionMappings[interaction.scenarioId] = {};
      this.scenarioInteractionMappings[interaction.scenarioId][interaction.interactionId] = true;
      this.storageService.addActivity(this.createActivity(interaction));
      await this.saveActivity(interaction.scenarioId);
      return true;
    }
    return false;
  }

  protected buildSubjectText(interaction: IInteraction) {
    const channelType = ChannelTypes[interaction.channelType];
    if (interaction.details.fields) {
      const fields = interaction.details.fields;
      if (fields.Email) {
        return `${channelType}[${fields.Email.Value}]`;
      } else if (fields.Phone) {
        return `${channelType}[${fields.Phone.Value}]`;
      } else if (fields.FullName) {
        return `${channelType}[${fields.FullName.Value}]`;
      }
    }
    return 'Unknown';
  }

  protected getContactSource(interaction: IInteraction) {
    if (interaction.details.fields) {
      const fields = interaction.details.fields;
      if (fields.Email) {
        return { sourceType: 'Email', source: fields.Email.Value };
      } else if (fields.Phone) {
        return { sourceType: 'Phone', source: fields.Phone.Value };
      } else if (fields.FullName) {
        return { sourceType: 'Name', source: fields.FullName.Value };
      }
    }
    return { sourceType: 'Name', source: '' };
  }

  protected createActivity(interaction: api.IInteraction): IActivity {
    const date = new Date();
    const activity: IActivity = {
      WhoObject: {
        objectType: '',
        displayName: '',
        objectName: '',
        objectId: '',
        url: ''
      },
      WhatObject: {
        objectType: '',
        displayName: '',
        objectName: '',
        objectId: '',
        url: ''
      },
      Subject: '',
      CallType: '',
      CallDurationInSeconds: '0',
      Description: '',
      Status: 'Open',
      ActivityDate: this.formatDate(date),
      TimeStamp: date,
      ActivityId: '',
      ScenarioId: interaction.scenarioId,
      contactSource: this.getContactSource(interaction),
      CadFields: {},
      IsActive: true
    };
    for (const key in this.cadActivityMap) {
      if (interaction.details.fields[key]) {
        if (!activity.CadFields) {
          activity.CadFields = {};
        }
        activity.CadFields[this.cadActivityMap[key]] =
          interaction.details.fields[key].Value;
      }
    }
    this.loggerService.logger.logDebug(
      `AMCSalesforceHomeComponent: Create new activity: ${JSON.stringify(
        activity
      )}`,
      api.ErrorCode.ACTIVITY
    );
    return activity;
  }

  @bind
  protected setActivityDetails(eventObject) {
    this.loggerService.logger.logDebug(`AMCSalesforceHomeComponent: Activity details received from bridge: ${JSON.stringify(
      eventObject)}`, api.ErrorCode.ACTIVITY);
    if (this.storageService.getCurrentScenarioId() || eventObject.hasOwnProperty('AddToList')) {
      if (this.storageService.currentScenarioId) {
        this.storageService.updateWhoWhatLists(eventObject, this.storageService.currentScenarioId);
      }
      if (this.storageService.workingRecentScenarioId) {
        this.storageService.updateWhoWhatLists(eventObject, this.storageService.workingRecentScenarioId);
      }
    }
  }

  @bind
  protected createNewEntity(entityType) {
    this.loggerService.logger.logDebug(
      `AMCSalesforceHomeComponent: Screenpop new Salesforce object of type:
    ${JSON.stringify(entityType)}`,
      api.ErrorCode.SCREEN_POP
    );
    let params: ICreateNewSObjectParams;
    if (this.storageService.currentScenarioId) {
      if (this.storageService.activityList[this.storageService.currentScenarioId]) {
        const activity = this.storageService.getActivity(this.storageService.currentScenarioId);
        params = this.buildParams(entityType, activity);
      }
    } else {
      params = this.buildParams(entityType, null);
    }
    this.loggerService.logger.logDebug(
      `AMCSalesforceHomeComponent: Send screenpop request to bridge with params:
    ${JSON.stringify(params)}`,
      api.ErrorCode.SCREEN_POP
    );
    this.bridgeEventsService.sendEvent('createNewEntity', params);
  }

  protected buildParams(entityType, activity) {
    const params: ICreateNewSObjectParams = {
      entityName: entityType,
      caseFields: {},
      opportunityFields: {},
      leadFields: {}
    };
    if (this.storageService.currentScenarioId) {
      if (entityType === 'Case') {
        if (activity.WhatObject.objectType === 'Account') {
          params.caseFields.AccountId = activity.WhatObject.objectId;
        }
        if (activity.WhoObject.objectId !== '') {
          params.caseFields.ContactId = activity.WhoObject.objectId;
        }
        params.caseFields.Description = activity.Description;
      } else if (entityType === 'Opportunity') {
        if (activity.WhatObject.objectType === 'Account') {
          params.opportunityFields.AccountId = activity.WhatObject.objectId;
        }
        params.opportunityFields.CloseDate = activity.ActivityDate;
        params.opportunityFields.Description = activity.Description;
        params.opportunityFields.StageName = 'Prospecting';
      } else if (entityType === 'Lead') {
        params.leadFields[
          this.storageService.activityList[this.storageService.currentScenarioId].contactSource.sourceType
        ] = this.storageService.activityList[this.storageService.currentScenarioId].contactSource.source;
        params.leadFields.Description = activity.Description;
      }
    }
    return params;
  }

  protected agentSelectedCallerInformation(id) {
    this.loggerService.logger.logDebug(
      'AMCSalesforceHomeComponent: Screenpop selected caller information'
    );
    this.bridgeEventsService.sendEvent('agentSelectedCallerInformation', id);
  }
}
