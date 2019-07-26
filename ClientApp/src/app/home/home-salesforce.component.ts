import { Component, OnInit } from '@angular/core';
import * as api from '@amc-technology/davinci-api';
import { Application } from '@amc-technology/applicationangularframework';
import { bind } from 'bind-decorator';
import {
  IInteraction,
  registerOnLogout,
  ChannelTypes
} from '@amc-technology/davinci-api';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import { IActivity } from '../Model/IActivity';
import { ICreateNewSObjectParams } from '../Model/ICreateNewSObjectParams';
import { LoggerService } from '../logger.service';
import { StorageService } from '../storage.service';
import { stringify } from '@angular/core/src/util';
@Component({
  selector: 'app-home',
  templateUrl: './home-salesforce.component.html'
})
export class HomeSalesforceComponent extends Application implements OnInit {
  protected interactionDisconnected: Subject<boolean> = new Subject();
  protected autoSave: BehaviorSubject<number> = new BehaviorSubject(0);
  protected phoneNumberFormat: string;
  protected quickCommentList: string[];
  protected cadActivityMap: Object;
  screenpopOnAlert: Boolean;
  wasClickToDial: boolean;
  lastOnFocusWasAnEntity: boolean;
  ScreenpopOnClickToDialListView: boolean;
  lastClickToDialSearchRecord: any;

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
    this.wasClickToDial = false;
    this.appName = 'Salesforce';
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
      this.lastClickToDialSearchRecord = event.clickedSearchRecord;
      this.lastClickToDialSearchRecord['id'] = event.clickedEntity.objectId;
      api.clickToDial(event.number, this.formatCrmResults(event.records));
    });
    this.bridgeEventsService.subscribe(
      'setActivityDetails',
      this.setActivityDetails
    );

    this.phoneNumberFormat = String(
      config['variables']['PhoneNumberFormat']
    ).toLowerCase();

    if (config['variables']['ScreenpopOnAlert'] !== null && config['variables']['ScreenpopOnAlert'] !== undefined) {
      this.screenpopOnAlert = Boolean(config['variables']['ScreenpopOnAlert']);
    }
    this.quickCommentList = <string[]>config['variables']['QuickComments'];
    if (config['variables']['CADActivityMap']) {
      this.cadActivityMap = config['variables']['CADActivityMap'];
    } else {
      this.cadActivityMap = {};
    }
    this.ScreenpopOnClickToDialListView = <boolean>config['variables']['ScreenpopOnClickToDialListView'];
    this.storageService.maxRecentItems = <Number>config['variables']['MaxRecentItems'];
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

  protected formatPhoneNumber(number: string, phoneNumberFormat: string) {
    let numberIndex = 0;
    let formatIndex = 0;
    let formattedNumber = '';
    number = number.replace(/\D/g, '');
    number = this.reverse(number);
    phoneNumberFormat = this.reverse(phoneNumberFormat);
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

  protected async saveActivity(activity): Promise<string> {
    this.loggerService.logger.logDebug(
      'AMCSalesforceHomeComponent: Save activity: ' + JSON.stringify(activity),
      api.ErrorCode.ACTIVITY
    );
    if (this.storageService.activityListContains(activity.InteractionId)) {
      activity.ActivityId = this.storageService.getActivity(
        activity.InteractionId
      ).ActivityId;
    }
    if (activity.Status === 'Completed') {
      this.storageService.clearWhoList();
      this.storageService.clearWhatList();
      this.storageService.removeActivity(activity.InteractionId);
    }
    this.loggerService.logger.logDebug(
      `AMCSalesforceHomeComponent: Sending activity: ${JSON.stringify(
        activity
      )} to bridge to be saved`,
      api.ErrorCode.ACTIVITY
    );
    if (activity.saveToSalesforce) {
      activity = await this.bridgeEventsService.sendEvent(
        'saveActivity',
        activity
      );
    }
    this.loggerService.logger.logDebug(
      `AMCSalesforceHomeComponent: Updated activity received from bridge: ${JSON.stringify(
        activity
      )}`,
      api.ErrorCode.ACTIVITY
    );
    if (this.storageService.activityListContains(activity.InteractionId)) {
      this.storageService.updateActivity(activity);
    } else {
      this.storageService.updateRecentActivity(activity);
    }
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
      const interactionId = interaction.interactionId;
      const scenarioIdInt = interaction.scenarioId;
      this.storageService.updateCadFields(interaction, this.cadActivityMap);
      if (this.storageService.recentActivityListContains(interactionId)) {
        this.saveActivity(this.storageService.getRecentActivity(interactionId));
      }
      let isNewScenarioId = false;
      if (
        interaction.channelType === ChannelTypes.Telephony ||
        interaction.channelType === ChannelTypes.SMS
      ) {
        interaction.details.fields.Phone.Value = this.formatPhoneNumber(
          interaction.details.fields.Phone.Value,
          this.phoneNumberFormat
        );
      }
      if (
        !this.scenarioInteractionMappings.hasOwnProperty(scenarioIdInt) &&
        !this.storageService.getCurrentInteraction() &&
        interaction.state !== api.InteractionStates.Disconnected
      ) {
        if (
          (this.screenpopOnAlert === true &&
            interaction.state === api.InteractionStates.Alerting) ||
          (this.screenpopOnAlert === false &&
            interaction.state === api.InteractionStates.Connected)
        ) {
          this.scenarioInteractionMappings[scenarioIdInt] = {};
          isNewScenarioId = true;
          this.scenarioInteractionMappings[scenarioIdInt][
            interactionId
          ] = true;
        } else if (this.wasClickToDial) {
          this.scenarioInteractionMappings[scenarioIdInt] = {};
          isNewScenarioId = true;
          this.scenarioInteractionMappings[scenarioIdInt][
            interactionId
          ] = true;
        }
      }
      if (
        this.shouldPreformScreenpop(interaction, isNewScenarioId) &&
        !this.storageService.getCurrentInteraction() &&
        interaction.state !== api.InteractionStates.Disconnected
      ) {
        if (
          (this.screenpopOnAlert === true &&
            interaction.state === api.InteractionStates.Alerting) ||
          (this.screenpopOnAlert === false &&
            interaction.state === api.InteractionStates.Connected) ||
          this.wasClickToDial
        ) {
        if (this.ScreenpopOnClickToDialListView && !this.lastOnFocusWasAnEntity && this.wasClickToDial) {
          interaction.details.id = this.lastClickToDialSearchRecord['id'];
          interaction.details.type = this.lastClickToDialSearchRecord['object'];
        }

        this.loggerService.logger.logDebug(
          `AMCSalesforceHomeComponent: screenpop for new interaction: ${JSON.stringify(
            interaction
          )}`,
          api.ErrorCode.SCREEN_POP
        );
        const searchRecord = await this.preformScreenpop(interaction);
        if (this.ScreenpopOnClickToDialListView && !this.lastOnFocusWasAnEntity && this.wasClickToDial) {
          this.storageService.setsearchRecordList([this.lastClickToDialSearchRecord]);
        } else {
          this.storageService.setsearchRecordList(searchRecord.toJSON());
        }
        this.loggerService.logger.logDebug(
          `AMCSalesforceHomeComponent: Search results: ${JSON.stringify(
            searchRecord.toJSON()
          )}`,
          api.ErrorCode.SEARCH_RECORD
        );
        if (this.storageService.getsearchRecordList().length > 1) {
          this.storageService.setSearchReturnedSingleResult(false);
          this.storageService.setSearchResultWasReturned(true);
        } else if (this.storageService.getsearchRecordList().length === 1) {
          this.storageService.setSearchReturnedSingleResult(true);
          this.storageService.setSearchResultWasReturned(true);
        }
        this.storageService.setCurrentInteraction(interaction);
        this.storageService.addActivity(this.createActivity(interaction));

        this.storageService.setSubject(
          interactionId,
          this.buildSubjectText(interaction)
        );
        this.loggerService.logger.logDebug(
          `AMCSalesforceHomeComponent: Autosave activity:
        ${JSON.stringify(
          this.storageService.getActivity(
            this.storageService.getCurrentInteraction().interactionId
          )
        )}`,
          api.ErrorCode.ACTIVITY
        );
        this.autoSave.next(0);
        this.wasClickToDial = false;
        return searchRecord;

          }
      } else if (interaction.state === api.InteractionStates.Disconnected) {
        this.loggerService.logger.logDebug(
          `AMCSalesforceHomeComponent: Disconnect interaction received: ${JSON.stringify(
            interaction
          )}`,
          api.ErrorCode.DISCONEECTED_INTERACTION
        );
        if (this.scenarioInteractionMappings[scenarioIdInt]) {
          delete this.scenarioInteractionMappings[scenarioIdInt][interactionId];
          if (
            Object.keys(this.scenarioInteractionMappings[scenarioIdInt])
              .length === 0
          ) {
            delete this.scenarioInteractionMappings[scenarioIdInt];
          }
        }
        if (
          this.storageService.getCurrentInteraction() &&
          this.storageService.getCurrentInteraction().interactionId ===
            interactionId
        ) {
          this.interactionDisconnected.next(true);
          this.wasClickToDial = false;
          this.storageService.onInteractionDisconnect();
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
      InteractionId: interaction.interactionId,
      contactSource: this.getContactSource(interaction),
      CadFields: {},
      saveToSalesforce: false,
    };
    for (const key in this.cadActivityMap) {
      if (interaction.details.fields[key]) {
        if (!activity.CadFields) {
          activity.CadFields = {};
        }
        activity.CadFields[this.cadActivityMap[key]] = interaction.details.fields[key].Value;
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
    this.loggerService.logger.logDebug(
      `AMCSalesforceHomeComponent: Activity details received from bridge: ${JSON.stringify(
        eventObject
      )}`,
      api.ErrorCode.ACTIVITY
    );
    if (this.storageService.getCurrentInteraction()) {
      if (
        eventObject.objectType === 'Contact' ||
        eventObject.objectType === 'Lead'
      ) {
        if (!this.storageService.whoListContains(eventObject)) {
          this.storageService.setWhoList(eventObject);
          this.autoSave.next(1);
        }
      } else if (eventObject.objectId !== undefined) {
        if (!this.storageService.whatListContains(eventObject)) {
          this.storageService.setWhatList(eventObject);
          this.autoSave.next(1);
        }
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
    if (this.storageService.getCurrentInteraction()) {
      if (
        this.storageService.activityListContains(
          this.storageService.getCurrentInteraction().interactionId
        )
      ) {
        const activity = this.storageService.getActivity(
          this.storageService.getCurrentInteraction().interactionId
        );
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
    if (this.storageService.getCurrentInteraction()) {
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
          this.storageService.activity.contactSource.sourceType
        ] = this.storageService.activity.contactSource.source;
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
