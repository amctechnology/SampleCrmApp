import { Component, OnInit } from '@angular/core';
import * as api from '@amc-technology/davinci-api';
import { Application } from '@amc-technology/applicationangularframework';
import { bind } from 'bind-decorator';
import { IActivity } from '../Model/IActivity';
import { ICreateNewSObjectParams } from '../Model/ICreateNewSObjectParams';
import { LoggerService } from '../logger.service';
import { StorageService } from '../storage.service';
import { IActivityDetails } from '../Model/IActivityDetails';
import { ChannelTypes } from '@amc-technology/davinci-api';
@Component({
  selector: 'app-home',
  templateUrl: './home-salesforce.component.html'
})
export class HomeSalesforceComponent extends Application implements OnInit {
  protected phoneNumberFormat: Object;
  protected quickCommentList: string[];
  protected enableAutoSave: boolean;
  protected enableCallActivity: boolean;
  protected QuickCreateEntities: any;
  protected cadActivityMap: Object;
  public searchLayout: api.SearchLayouts;
  public activityLayout: any;
  screenpopOnAlert: Boolean;
  clickToDialList: {
    [key: string]: string
  };
  ctdWhoWhatList: {
    [key: string]: string
  };
  lastOnFocusWasAnEntityList: string[];
  ScreenpopOnClickToDialListView: boolean;
  DisplayQuickCreate: boolean;
  public quickCommentOptionRequiredCadArray: any;

  constructor(private loggerService: LoggerService, protected storageService: StorageService) {
    super(loggerService.logger);
    this.phoneNumberFormat = {};
    this.screenpopOnAlert = true;
    this.ScreenpopOnClickToDialListView = false;
    this.enableCallActivity = true;
    this.enableAutoSave = true;
    this.DisplayQuickCreate = true;
    this.clickToDialList = {};
    this.ctdWhoWhatList = {};
    this.lastOnFocusWasAnEntityList = [];
    this.appName = 'Salesforce';
    this.quickCommentOptionRequiredCadArray = {};
  }

  async ngOnInit() {
    try {
      this.logger.logDebug('Salesforce - Home : START : Fetching Salesforce App Configuration');
      const config = await api.getConfig();
      this.logger.logDebug('Salesforce - Home : Configuration from Salesforce App : ' + JSON.stringify(config));
      let salesforceOrg = 'https://na53.salesforce.com';
      if (config['variables']['salesforceOrg'] !== undefined && config['variables']['salesforceOrg'] !== null &&
      String(config['variables']['salesforceOrg']).length > 0) {
        salesforceOrg = String(config['variables']['salesforceOrg']);
      }

      this.bridgeScripts = this.bridgeScripts.concat([
        this.getBridgeURL(),
        salesforceOrg + '/support/api/44.0/interaction.js',
        salesforceOrg + '/support/console/44.0/integration.js',
        salesforceOrg + '/support/api/44.0/lightning/opencti_min.js'
      ]);

      await super.ngOnInit();

      this.getActivityLayout();
      this.bridgeEventsService.sendEvent('updateActivityLayout', this.activityLayout);
      this.bridgeEventsService.subscribe('clickToDial', this.clickToDialHandler);
      this.bridgeEventsService.subscribe('sendNotification', this.sendNotification);
      this.searchLayout = await this.getSearchLayout();
      this.readConfig(config);
      api.registerOnLogout(this.removeLocalStorageOnLogout);
      this.storageService.syncWithLocalStorage();
      this.logger.logDebug('Salesforce - Home : END : Fetching Salesforce App Configuration');
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Fetching Configuration. Error Information : '
       + JSON.stringify(error));
    }
  }

  private readConfig(config: api.IAppConfiguration) {
    try {
      this.logger.logDebug('Salesforce - Home : START : Reading Configuration from Salesforce App');
      const configPhoneFormat = config.variables['PhoneNumberFormat'];
      if (typeof configPhoneFormat === 'string') {
        const tempFormat = String(configPhoneFormat).toLowerCase();
        this.phoneNumberFormat[tempFormat] = tempFormat;
      } else {
        this.phoneNumberFormat = configPhoneFormat;
      }
      this.quickCommentList =  <string[]>(config['CallActivity'] ? config['CallActivity']['variables']['QuickComments']
      : config['variables']['QuickComments']);
      this.cadActivityMap = config['CallActivity'] ? config['CallActivity']['variables']['CADActivityMap'] :
      (config['variables']['CADActivityMap'] ? config['variables']['CADActivityMap'] : {});
      if (config['variables']['ScreenpopOnAlert'] !== null && config['variables']['ScreenpopOnAlert'] !== undefined) {
        this.screenpopOnAlert = Boolean(config['variables']['ScreenpopOnAlert']);
      }
      for (let i = 0; i < this.quickCommentList.length; i++) {
        this.quickCommentList[i] = this.quickCommentList[i].replace(/\\n/g, String.fromCharCode(13, 10));
        this.quickCommentList[i] = this.quickCommentList[i].replace(/\\t/g, String.fromCharCode(9));
      }
      const CADQuickCommentRegex = /\{\{.*?\}\}/g;
      for (let i = 0; i < this.quickCommentList.length; i++) {
        this.quickCommentOptionRequiredCadArray[i] = this.quickCommentList[i].match(CADQuickCommentRegex);
      }
      this.QuickCreateEntities = config['QuickCreate']['variables']['QuickCreateKeyList'];
      this.DisplayQuickCreate = (Object.keys(this.QuickCreateEntities).length > 0);
      this.ScreenpopOnClickToDialListView = <boolean>(config['variables']['ScreenpopOnClickToDialListView']);
      if (config['CallActivity'] && config['CallActivity']['variables'] &&
      config['CallActivity']['variables']['EnableCallActivity'] !== undefined) {
        this.enableCallActivity = <boolean>(config['CallActivity']['variables']['EnableCallActivity']);
      }
      if (config['CallActivity'] && config['CallActivity']['variables'] &&
      config['CallActivity']['variables']['EnableAutoSave'] !== undefined) {
        this.enableAutoSave = <boolean>(config['CallActivity']['variables']['EnableAutoSave']);
      }
      this.storageService.maxRecentItems = <Number>(config['CallActivity'] ? config['CallActivity']['variables']['MaxRecentItems']
      : config['variables']['MaxRecentItems']);
      if (config['CallActivity'] && config['CallActivity']['variables'] && config['CallActivity']['variables']['NameObjects']) {
        this.storageService.setNameObjects(config['CallActivity']['variables']['NameObjects']);
      }
      this.logger.logDebug('Salesforce - Home : END : Reading Configuration from Salesforce App');
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Reading Configuration. Config Info : ' + JSON.stringify(config)
      + '. Error Information : ' + JSON.stringify(error));
    }
  }

  protected formatPhoneNumber(inputNumber: string, phoneNumberFormat: Object): string {
    try {
      this.logger.logTrace('Salesforce - Home : START : Formatting Phone Number. Input Number : ' + inputNumber +
      '. Configured Format : ' + JSON.stringify(phoneNumberFormat));
      const configuredInputFormats = Object.keys(phoneNumberFormat);
      for (let index = 0; index < configuredInputFormats.length; index++) {
        let formatCheck = true;
        const inputFormat = configuredInputFormats[index];
        const outputFormat = phoneNumberFormat[inputFormat];
        if (inputFormat.length === inputNumber.length) {
          const arrInputDigits = [];
          let outputNumber = '';
          let outputIncrement = 0;
          if (((inputFormat.match(/x/g) || []).length) !== ((outputFormat.match(/x/g) || []).length)) {
            continue;
          }
          for (let j = 0; j < inputFormat.length; j++) {
            if (inputFormat[j] === 'x') {
              arrInputDigits.push(j);
            } else if (inputFormat[j] !== '?' && inputNumber[j] !== inputFormat[j]) {
              formatCheck = false;
              break;
            }
          }
          if (formatCheck) {
            for (let j = 0; j < outputFormat.length; j++) {
              if (outputFormat[j] === 'x') {
              outputNumber = outputNumber + inputNumber[arrInputDigits[outputIncrement]];
              outputIncrement++;
              } else {
                outputNumber = outputNumber + outputFormat[j];
              }
            }
            this.logger.logTrace('Salesforce - Home : END : Formatting Phone Number. Input Number : ' + inputNumber +
            '. Configured Format : ' + JSON.stringify(phoneNumberFormat) + '. Output Number : ' + outputNumber);
            return outputNumber;
          }
        }
      }
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Formatting Phone Number. Input Number : ' + inputNumber +
      '. Configured Format : ' + JSON.stringify(phoneNumberFormat) + '. Error Information : ' + JSON.stringify(error));
    }
    this.logger.logTrace('Salesforce - Home : END : Formatting Phone Number. Input Number : ' + inputNumber +
            '. Configured Format : ' + JSON.stringify(phoneNumberFormat) + '. Output Number : ' + inputNumber);
    return inputNumber;
  }

  protected checkIfRecentActivitiesExist() {
    try {
      return (this.storageService.recentScenarioIdList.length > 0) ? true : false;
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Checking if Recent Activities Exist. Error Information : '
      + JSON.stringify(error));
    }
  }

  protected removeLocalStorageOnLogout(): Promise<any> {
    localStorage.clear();
    return new Promise((resolve, reject) => {});
  }

  protected async onInteraction(interaction: api.IInteraction): Promise<api.SearchRecords> {
    this.logger.logDebug('Salesforce - Home : Interaction recieved: ' + JSON.stringify(interaction));
    this.logger.logInformation('Salesforce - Home : Interaction recieved. Scenario ID : ' + interaction.scenarioId
     + ' . Interaction State : ' + interaction.state);
    try {
      const scenarioId = interaction.scenarioId;
      let isNewScenarioId = false;
      let clickToDialEntity = '';
      let ctdWhoWhatEntity = {};
      let lastOnFocusWasAnEntity = false;
      this.storageService.updateCadFields(interaction, this.cadActivityMap);
      if (this.storageService.recentActivityListContains(scenarioId) && this.storageService.currentScenarioId !== scenarioId) {
        this.saveActivity(scenarioId, true, this.enableAutoSave);
        return;
      }

      if (interaction.details && interaction.details.fields && interaction.details.fields.Phone && interaction.details.fields.Phone.Value) {
        const phoneNum = interaction.details.fields.Phone.Value;
        if (this.clickToDialList[phoneNum]) {
          clickToDialEntity = this.clickToDialList[phoneNum];
          ctdWhoWhatEntity = this.ctdWhoWhatList[phoneNum];
          delete this.clickToDialList[phoneNum];
          delete this.ctdWhoWhatList[phoneNum];
        }
        if (this.lastOnFocusWasAnEntityList.indexOf(phoneNum) > -1) {
          lastOnFocusWasAnEntity = true;
          const index = this.lastOnFocusWasAnEntityList.indexOf(phoneNum, 0);
          if (index > -1) {
            this.lastOnFocusWasAnEntityList.splice(index, 1);
          }
        }
        interaction.details.fields.Phone.Value = this.formatPhoneNumber(phoneNum, this.phoneNumberFormat);
      }

      isNewScenarioId = await this.processIfNewScenario(interaction);

      if (interaction['userFocus'] || (this.storageService.activeScenarioIdList.length === 1 &&
        this.storageService.activeScenarioIdList.indexOf(scenarioId) >= 0)) {
        this.storageService.setCurrentScenarioId(scenarioId, interaction.direction);
      }

      if (interaction.state === api.InteractionStates.Disconnected) {
        this.deleteExistingScenario(interaction);
      } else if (!(interaction.state === api.InteractionStates.Alerting && this.screenpopOnAlert === false)) {
        if (clickToDialEntity) {
          if (this.ScreenpopOnClickToDialListView && !lastOnFocusWasAnEntity) {
            interaction.details.type = 'ClickToDialScreenpop';
          } else {
            interaction.details.type = 'ClickToDialNoScreenpop';
          }
          interaction.details.id = clickToDialEntity;
          this.updateClickToDialWhoWhatLists(ctdWhoWhatEntity, scenarioId);
        }
        if (!this.storageService.searchRecordList[scenarioId]) {
            const searchRecord = await this.searchAndScreenpop(interaction, isNewScenarioId);
            this.storageService.setsearchRecordList(searchRecord.toJSON(), scenarioId);
            this.logger.logDebug('Salesforce - Home : END : Interaction recieved: ' + JSON.stringify(interaction));
            return searchRecord;
        }
      }
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : On Interaction. More Info : ' + JSON.stringify(error));
    }
    this.logger.logDebug('Salesforce - Home : END : Interaction recieved: ' + JSON.stringify(interaction));
    return;
  }

  private updateClickToDialWhoWhatLists(entity: Object, scenarioId: string): void {
    try {
      this.logger.logTrace('Salesforce - Home : START : Update Click To Dial Who/What Lists. Scenario ID : '
       + scenarioId + '. Entity Info : ' + JSON.stringify(entity));
      if (entity) {
        const entityForSetActivityDetails: IActivityDetails = {
            displayName: entity['RecordType'],
            objectId: entity['Id'],
            objectName: entity['Name'],
            objectType: entity['RecordType'],
            url: ''
        };
        this.storageService.updateWhoWhatLists(entityForSetActivityDetails, scenarioId);
      }
      this.logger.logTrace('Salesforce - Home : END : Update Click To Dial Who/What Lists. Scenario ID : '
       + scenarioId + '. Entity Info : ' + JSON.stringify(entity));
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Updating Click to Dial Who/What Lists. Scenario ID : ' + scenarioId
      + '. Entity Info : ' + JSON.stringify(entity) + '. Error Information : ' + JSON.stringify(error));
    }
  }

  private async searchAndScreenpop(interaction: api.IInteraction, isNewScenarioId: boolean) {
    try {
      if (this.shouldPreformScreenpop(interaction, isNewScenarioId)) {
        this.logger.logInformation('Salesforce - Home : Screen pop on interaction. Scenario ID : ' + interaction.scenarioId);
        this.logger.logDebug('Salesforce - Home : Screen pop on interaction. Interaction Info : ' + JSON.stringify(interaction));
        const records = await this.preformScreenpop(interaction);
        this.logger.logDebug('Salesforce - Home : Screen pop on interaction. Results : ' + JSON.stringify(records));
        return records;
      } else {
        this.logger.logInformation('Salesforce - Home : Search on interaction. Scenario ID : ' + interaction.scenarioId);
        this.logger.logDebug('Salesforce - Home : Search on interaction. Interaction Info : ' + JSON.stringify(interaction));
        const event = this.generateEventForScreenpop(interaction);
        event['search'] = true;
        const screenpopResult = await this.bridgeEventsService.sendEvent('search', event);
        const records = this.formatCrmResults(screenpopResult);
        this.logger.logDebug('Salesforce - Home : Search on interaction. Results after formatting : ' + JSON.stringify(records));
        return records;
      }
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Search and Screen pop. Interaction Info : ' + JSON.stringify(interaction)
      + '. Error Information : ' + JSON.stringify(error));
    }
  }

  protected deleteExistingScenario(interaction: api.IInteraction): void {
    try {
      this.logger.logInformation('Salesforce - Home : START : Removing Scenario ID : ' + interaction.scenarioId);
      if (this.scenarioInteractionMappings[interaction.scenarioId]) {
        delete this.scenarioInteractionMappings[interaction.scenarioId][interaction.interactionId];
        if (Object.keys(this.scenarioInteractionMappings[interaction.scenarioId]).length === 0) {
          this.saveActivity(interaction.scenarioId, true, this.enableAutoSave);
          this.storageService.onInteractionDisconnect(interaction.scenarioId, this.enableAutoSave);
          delete this.scenarioInteractionMappings[interaction.scenarioId];
        }
      }
      this.logger.logInformation('Salesforce - Home : END : Removing Scenario ID : ' + interaction.scenarioId);
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Deleting existing Scenario. Scenario ID : '
       + interaction.scenarioId + '. Interaction Info : ' + JSON.stringify(interaction) + '. Error Information : ' + JSON.stringify(error));
    }
  }

  protected async processIfNewScenario(interaction: api.IInteraction): Promise<boolean> {
    try {
      this.logger.logTrace('Salesforce - Home : START : Checking if the interaction is new or existing. Interaction Info : '
       + JSON.stringify(interaction));
      if (!this.scenarioInteractionMappings.hasOwnProperty(interaction.scenarioId)) {
        this.scenarioInteractionMappings[interaction.scenarioId] = {};
        this.scenarioInteractionMappings[interaction.scenarioId][interaction.interactionId] = true;
        if (this.storageService.activeScenarioIdList.indexOf(interaction.scenarioId) < 0) {
          if (this.enableCallActivity) {
            this.storageService.addActivity(this.createActivity(interaction));
            await this.saveActivity(interaction.scenarioId, false, this.enableAutoSave);
          }
        }
        this.logger.logInformation('Salesforce - Home : New Scenario with Scenario ID : ' + interaction.scenarioId);
        this.logger.logTrace('Salesforce - Home : END : Checking if the interaction is new or existing. Interaction Info : '
       + JSON.stringify(interaction));
        return true;
      }
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Checking if the interaction is new or existing. Interaction Info : '
       + JSON.stringify(interaction) + '. Error Information : ' + JSON.stringify(error));
    }
    this.logger.logTrace('Salesforce - Home : END : Checking if the interaction is new or existing. Interaction Info : '
       + JSON.stringify(interaction));
    return false;
  }

  protected buildSubjectText(interaction: api.IInteraction) {
    this.logger.logTrace('Salesforce - Home : START : Building Subject Text. Interaction Info : ' + JSON.stringify(interaction));
    let subjectText = '';
    try {
    const channelType = api.ChannelTypes[interaction.channelType];
    if (interaction.details.fields) {
      const fields = interaction.details.fields;
      if (fields.Email) {
        subjectText = `${channelType}[${fields.Email.Value}]`;
      } else if (fields.Phone) {
        subjectText = `${channelType}[${fields.Phone.Value}]`;
      } else if (fields.FullName) {
        subjectText = `${channelType}[${fields.FullName.Value}]`;
      }
    }
    this.logger.logInformation('Salesforce - Home : Subject text for Scenario ID : ' + interaction.scenarioId + ' is ' + subjectText);
    this.logger.logTrace('Salesforce - Home : END : Building Subject Text. Interaction Info : ' + JSON.stringify(interaction));
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Creating new activity. Scenario ID : ' + interaction.scenarioId
      + '. Interaction Info : ' + JSON.stringify(interaction) + '. Error Information : ' + JSON.stringify(error));
    }
    return subjectText;
  }

  protected buildTaskSubType(interaction: api.IInteraction): string {
    this.logger.logTrace('Salesforce - Home : START : Building Task Sub Type. Scenario ID : ' + interaction.scenarioId);
    let channelType = '';
    try {
      switch (interaction.channelType) {
        case api.ChannelTypes.Telephony: {
          channelType = 'Call';
          break;
        }
        case api.ChannelTypes.Email: {
          channelType = 'Email';
          break;
        }
        default: {
          channelType = 'Task';
          break;
        }
      }
      this.logger.logInformation('Salesforce - Home : Task Sub Type for Scenario ID : ' + interaction.scenarioId + ' is ' + channelType);
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Building Task Sub Type. Scenario ID : ' + interaction.scenarioId
      + '. Error Information : ' + JSON.stringify(error));
    }
    this.logger.logTrace('Salesforce - Home : END : Building Task Sub Type. Scenario ID : ' + interaction.scenarioId);
    return channelType;
  }

  protected formatCrmResults(crmResults: any): api.SearchRecords {
    const result = new api.SearchRecords();
    try {
      this.logger.logTrace('Salesforce - Home : START : Formatting CRM Results. CRM Results : ' + JSON.stringify(crmResults));
      const ignoreFields = ['Name', 'displayName', 'object', 'Id', 'RecordType'];
      for (const id of Object.keys(crmResults)) {
        if (crmResults[id]) {
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
      }
      this.logger.logTrace('Salesforce - Home : END : Formatting CRM Results. CRM Results : ' + JSON.stringify(crmResults));
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Formatting CRM Results. CRM Results : ' + JSON.stringify(crmResults)
      + '. Error Information : ' + JSON.stringify(error));
    }
    return result;
  }

  protected createActivity(interaction: api.IInteraction): IActivity {
    try {
      this.logger.logDebug('Salesforce - Home : START : Creating new Activity. Scenario ID : ' + interaction.scenarioId);
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
        Subject: this.buildSubjectText(interaction),
        CallType: (interaction.direction === api.InteractionDirectionTypes.Inbound ? 'Inbound' :
          (interaction.direction === api.InteractionDirectionTypes.Outbound ? 'Outbound' : 'Internal')),
        ChannelType: api.ChannelTypes[interaction.channelType],
        CallDurationInSeconds: 0,
        Description: '',
        Status: 'Open',
        ActivityDate: this.formatDate(date),
        TimeStamp: date,
        ActivityId: '',
        ScenarioId: interaction.scenarioId,
        TaskSubtype: this.buildTaskSubType(interaction),
        contactSource: this.getContactSource(interaction),
        CadFields: {},
        IsActive: true,
        IsProcessing: false,
        IsUnSaved: false,
        IsRecentWorkItemLoading: false,
      };
      for (const key in this.cadActivityMap) {
        if (interaction.details.fields[key] || interaction[key]) {
          if (!activity.CadFields) {
            activity.CadFields = {};
          }
          activity.CadFields[this.cadActivityMap[key]] = interaction.details.fields[key] ?
            interaction.details.fields[key].Value : interaction[key];
        }
      }
      this.storageService.setWhoEmptyRecord(interaction.scenarioId);
      this.storageService.setWhatEmptyRecord(interaction.scenarioId);
      this.logger.logDebug('Salesforce - Home : New activity Info : ' + JSON.stringify(activity));
      this.logger.logDebug('Salesforce - Home : END : Creating new Activity. Scenario ID : ' + interaction.scenarioId);
      return activity;
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Creating new activity. Scenario ID : ' + interaction.scenarioId
      + '. Error Information : ' + JSON.stringify(error));
    }
  }

  protected async saveActivity(scenarioId, isComplete = false, saveToCRM = true): Promise<string> {
    try {
    this.logger.logInformation('Salesforce  - Home : START : Saving Activity to CRM. Scenario ID : ' + scenarioId);
    let activity = this.storageService.getActivity(scenarioId);
    if (activity && activity.IsActive && isComplete) {
      activity.CallDurationInSeconds = this.getSecondsElapsed(activity.TimeStamp);
      activity.IsActive = false;
    }
    if (!activity || !saveToCRM) {
      return;
    }
    activity.Status = (isComplete) ? 'Completed' : 'Not Completed';
    this.logger.logDebug('Salesforce - Home : Activity Info to be sent to bridge. Scenario ID : '
    + scenarioId + '. Activity Info : ' + JSON.stringify(activity));
    activity = await this.bridgeEventsService.sendEvent('saveActivity', activity);
    this.logger.logDebug('Salesforce - Home : Received Activity Info from bridge. Scenario ID : '
    + scenarioId + '. Activity Info : ' + JSON.stringify(activity));
    this.storageService.updateActivity(activity);
    this.storageService.activityList[scenarioId].IsProcessing = false;
    this.storageService.updateActivityFields(scenarioId);
    this.storageService.compareActivityFields(scenarioId);
    return Promise.resolve(activity.ActivityId);
    } catch (error) {
      this.storageService.activityList[scenarioId].IsProcessing = false;
      api.sendNotification('Error saving activity.', api.NotificationType.Error);
      this.logger.logError('Salesforce - Home : ERROR : Saving Activity to CRM. Scenario ID : '
      + scenarioId + '. Error Information : ' + JSON.stringify(error));
    }
  }

  protected async getRecentWorkItem(scenarioId): Promise<void> {
    try {
    this.logger.logInformation('Salesforce - Home : START : Recent Work Item Details from CRM. Scenario ID : ' + scenarioId);
    const activity = this.storageService.getActivity(scenarioId);
    const recentWorkItem = await this.bridgeEventsService.sendEvent('getActivity', activity);
    this.storageService.updateRecentWorkItem(recentWorkItem, scenarioId, this.activityLayout);
    this.storageService.activityList[scenarioId].IsRecentWorkItemLoading = false;
    this.logger.logInformation('Salesforce - Home : END : Recent Work Item Details from CRM. Scenario ID : ' + scenarioId);
    } catch (error) {
      this.storageService.activityList[scenarioId].IsRecentWorkItemLoading = false;
      api.sendNotification('Error Retrieving Activity Details', api.NotificationType.Error);
      this.logger.logError('Salesforce - Home : ERROR : Recent Work Item Details from CRM. Scenario ID : '
      + scenarioId + '. Error Information : ' + JSON.stringify(error));
    }
  }

  protected agentSelectedCallerInformation(id: string) {
    this.logger.logDebug('Salesforce - Home : START : Agent Selected Entity to screenpop. Entity ID : ' + id);
    this.bridgeEventsService.sendEvent('agentSelectedCallerInformation', id);
    this.logger.logDebug('Salesforce - Home : END : Agent Selected Entity to screenpop. Entity ID : ' + id);
  }

  protected async getActivityLayout() {
    try {
      this.logger.logTrace('Salesforce - Home : START : Fetching Activity Layout');
      this.activityLayout = {};
      for (const item in ChannelTypes) {
        if (isNaN(Number(item))) {
          this.activityLayout[item] = {};
          this.activityLayout[item]['APIName'] = 'Task';
          this.activityLayout[item]['Fields'] = ['WhatId', 'WhoId', 'Subject', 'Description'];
          this.activityLayout[item]['LookupFields'] = {'WhatId': 'WhatObject', 'WhoId' : 'WhoObject'};
        }
      }
      this.logger.logDebug('Salesforce - Home : Activity Layout information : ' + JSON.stringify(this.activityLayout));
      this.logger.logTrace('Salesforce - Home : END : Fetching Activity Layout');
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Fetching Activity Layout. More information : ' + JSON.stringify(error));
    }
  }

  protected async getSearchLayout() {
    try {
      this.logger.logTrace('Salesforce - Home : START : Search Layout');
      const salesforceLayouts = await this.bridgeEventsService.sendEvent('getSearchLayout');
      this.logger.logDebug('Salesforce - Home : Received Search Layout information from Bridge : ' + JSON.stringify(salesforceLayouts));
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
      this.logger.logDebug('Salesforce - Home : Modified Search Layout Object : ' + JSON.stringify(result));
      this.logger.logTrace('Salesforce - Home : END : Search Layout');
      return result;
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Search Layout. More information : ' + JSON.stringify(error));
    }
  }

  protected getSecondsElapsed(startDate): number {
    try {
      this.logger.logLoop('Salesforce - Home : START : Get Seconds Elapsed');
      const EndDate = new Date();
      if (typeof startDate === 'string') {
        startDate = new Date(startDate);
      }
      this.logger.logLoop('Salesforce - Home : END : Get Seconds Elapsed');
      return Math.round((EndDate.getTime() - startDate.getTime()) / 1000);
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Get Seconds Elapsed. Start Date : ' + startDate
      + '. Error Information : ' + JSON.stringify(error));
    }
  }

  @bind
  protected createNewEntity(entityType) {
    try {
      this.logger.logTrace('Salesforce - Home : START : Quick Create Entity Type : ' + entityType);
      let params: ICreateNewSObjectParams;
      if (this.storageService.currentScenarioId) {
        if (this.storageService.activityList[this.storageService.currentScenarioId]) {
          const activity = this.storageService.getActivity(this.storageService.currentScenarioId);
          params = this.buildParams(entityType, activity);
        }
      } else {
        params = this.buildParams(entityType, null);
      }
      this.logger.logDebug('Salesforce - Home : Quick create request to bridge with params : ' + JSON.stringify(params));
      this.bridgeEventsService.sendEvent('createNewEntity', params);
      this.logger.logTrace('Salesforce - Home : END : Quick Create Entity Type : ' + entityType);
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Quick Create. Entity Type : ' + entityType
       + '. More Info : ' + JSON.stringify(error));
    }
  }

  protected onFocusHandler(entity) {
    try {
      this.logger.logDebug('Salesforce - Home : START : Received On Focus Event. Event Info : ' + JSON.stringify(entity));
      if (this.storageService.currentScenarioId || entity.hasOwnProperty('AddToList')) {
        this.storageService.updateWhoWhatLists(entity, this.storageService.currentScenarioId);
      }
      if (this.storageService.workingRecentScenarioId) {
        this.storageService.updateWhoWhatLists(entity, this.storageService.workingRecentScenarioId);
      }
      this.logger.logDebug('Salesforce - Home : END : Received On Focus Event. Event Info : ' + JSON.stringify(entity));
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : On Focus Event. Received Entity info : ' + JSON.stringify(entity) +
       '. Error Information : ' + JSON.stringify(error));
    }
  }

  protected isToolbarVisible(): Promise<boolean> {
    return this.bridgeEventsService.sendEvent('isToolbarVisible');
  }

  @bind
  protected sendNotification(event: any) {
    api.sendNotification(event.notification, event.notificationType);
  }

  @bind
  protected clickToDialHandler(event: any) {
    try {
      this.logger.logDebug('Salesforce - Home : START: Click to Dial Event : ' + JSON.stringify(event));
      let phoneNum = '';
      let objectForFormatCrmResults = {};
      if (event.isLightning) {
        objectForFormatCrmResults = {
          [event.entity.recordId]: {
            Id: event.entity.recordId,
            Name: event.entity.recordName,
            RecordType: event.entity.objectType
          }
        };
        phoneNum = event.entity.number;
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
        phoneNum = classicEntity.number;
        api.clickToDial(
          classicEntity.number,
          this.formatCrmResults(objectForFormatCrmResults)
        );
      }
      this.clickToDialList[phoneNum] = event.entity;
      this.ctdWhoWhatList[phoneNum] = objectForFormatCrmResults[Object.keys(objectForFormatCrmResults)[0]];
      if (event.lastOnFocusWasAnEntity) {
        this.lastOnFocusWasAnEntityList.push(phoneNum);
      }
      this.logger.logDebug('Salesforce - Home : END: Click to Dial Event : ' + JSON.stringify(event));
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Click to Dial Event. Event Info : ' + JSON.stringify(event)
       + '. Error Info : ' + JSON.stringify(error));
    }
  }

  protected getContactSource(interaction: api.IInteraction) {
    this.logger.logTrace('Salesforce - Home : START : Get Contact Source. Interaction Info : ' + JSON.stringify(interaction));
    let contactSource = { sourceType: 'Name', source: '' };
    try {
      if (interaction.details.fields) {
        const fields = interaction.details.fields;
        if (fields.Email) {
          contactSource = { sourceType: 'Email', source: fields.Email.Value };
        } else if (fields.Phone) {
          contactSource = { sourceType: 'Phone', source: fields.Phone.Value };
        } else if (fields.FullName) {
          contactSource = { sourceType: 'Name', source: fields.FullName.Value };
        }
      }
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Get Contact Source. Interaction Info : '
       + JSON.stringify(interaction) + '. Error Information : ' + JSON.stringify(error));
    }
    this.logger.logDebug('Salesforce - Home : Contact Source for interaction with Scenario ID : '
     + interaction.scenarioId + ' is ' + JSON.stringify(contactSource));
    this.logger.logTrace('Salesforce - Home : END : Get Contact Source. Interaction Info : ' + JSON.stringify(interaction));
    return contactSource;
  }

  protected buildParams(entityType: string, activity: IActivity) {
    this.logger.logTrace('Salesforce - Home : START : Building parameters for Quick Create. Entity Type : '
     + entityType + '. Activity Info : ' + JSON.stringify(activity));
    const params: ICreateNewSObjectParams = {
      entityName: entityType,
      caseFields: {},
      opportunityFields: {},
      leadFields: {}
    };
    try {
      if (this.storageService.currentScenarioId) {
        if (entityType === 'Case') {
          if (activity.WhatObject.objectType === 'Account') {
            params.caseFields.AccountId = activity.WhatObject.objectId;
          }
          if (activity.WhoObject.objectType === 'Contact') {
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
      this.logger.logTrace('Salesforce - Home : END : Building parameters for Quick Create. Entity Type : '
     + entityType + '. Activity Info : ' + JSON.stringify(activity));
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Building Parameters for Quick Create. Entity Type : '
       + entityType + '. Activity Info : ' + JSON.stringify(activity) + '. Error Info : ' + JSON.stringify(error));
    }
    return params;
  }

  private parseSearchLayoutEntities(salesforceLayout: any): api.ISearchLayoutForEntity[] {
    this.logger.logTrace('Salesforce - Home : START : Parse Search Layout. Info : ' + JSON.stringify(salesforceLayout));
    const layoutsForEntities: api.ISearchLayoutForEntity[] = [];
    try {
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
      this.logger.logDebug('Salesforce - Home : Parse Search Layout. Input Layout : ' + JSON.stringify(salesforceLayout)
      + '. Modified Layout : ' + JSON.stringify(layoutsForEntities));
      this.logger.logTrace('Salesforce - Home : END : Parse Search Layout. Info : ' + JSON.stringify(salesforceLayout));
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Parse Search Layout. Input Layout : '
       + JSON.stringify(salesforceLayout));
    }
    return layoutsForEntities;
  }

  protected formatDate(date: Date): string {
    try {
      this.logger.logLoop('Salesforce - Home : START : Format Date. Input Date : ' + date);
      let month = '' + (date.getMonth() + 1);
      let day = '' + date.getDate();
      const year = '' + date.getFullYear();
      if (month.length < 2) {
        month = '0' + month;
      }
      if (day.length < 2) {
        day = '0' + day;
      }
      this.logger.logLoop('Salesforce - Home : END : Format Date. Input Date : ' + date);
      return year + '-' + month + '-' + day;
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Format Date. Input Date : ' + date
      + '. Error Information : ' + JSON.stringify(error));
    }
  }
}
