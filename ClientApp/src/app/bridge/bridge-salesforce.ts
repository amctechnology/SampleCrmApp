import { Bridge } from '@amc-technology/applicationangularframework';
import { InteractionDirectionTypes } from '@amc-technology/davinci-api';
import { bind } from 'bind-decorator';
import { safeJSONParse } from '../utils';
import { IActivity } from '../Model/IActivity';
import { ICreateNewSObjectParams } from '../Model/ICreateNewSObjectParams';
declare var sforce: any;

class BridgeSalesforce extends Bridge {
  private isLightning = false;
  private currentOnFocusEvent: ISalesforceClassicOnFocusEvent | ISalesforceLightningOnFocusEvent;
  activity: IActivity = null;
  layoutObjectList: string[];
  searchLayout: any;

  constructor() {
    super();
    this.currentOnFocusEvent = null;
    this.appName = 'Salesforce';
    this.layoutObjectList = [];
    this.VerifyMode();
    this.initialize();
    this.eventService.subscribe('getSearchLayout', this.getSearchLayout);
    this.eventService.subscribe('isToolbarVisible', this.isToolbarVisible);
    this.eventService.subscribe('saveActivity', this.saveActivity);
    this.eventService.subscribe('createNewEntity', this.createNewEntity);
    this.eventService.subscribe('agentSelectedCallerInformation', this.tryScreenpop);
  }

  async afterScriptsLoad(): Promise<any> {
    this.eventService.sendEvent('logDebug', 'bridge: scripts loaded');
    await super.afterScriptsLoad();
    if (this.isLightning) {
      sforce.opencti.onClickToDial({ listener: this.clickToDialListener });
      sforce.opencti.onNavigationChange({ listener: this.onFocusListener });
      sforce.opencti.getSoftphoneLayout({
        callback: this.buildLayoutObjectList
      });
    } else {
      sforce.interaction.cti.onClickToDial(this.clickToDialListener);
      sforce.interaction.onFocus(this.onFocusListener);
      sforce.interaction.cti.getSoftphoneLayout(this.buildLayoutObjectList);
    }
    if (this.isLightning) {
      this.eventService.sendEvent('logDebug', 'bridge: App running in lightning');
    } else {
      this.eventService.sendEvent('logDebug', 'bridge: App running in classic');
    }
  }
  @bind
  protected buildLayoutObjectList(result) {
    if (this.isLightning) {
      this.layoutObjectList = Object.keys(result.returnValue.Inbound.objects);
      this.searchLayout = result.returnValue.Inbound.objects;
    } else {
      this.layoutObjectList = Object.keys(JSON.parse(result.result).Inbound.objects);
      this.searchLayout = JSON.parse(result.result).Inbound.objects;
    }
    this.eventService.sendEvent('logInformation', `bridge: Sofphone layout: ${this.layoutObjectList}`);
  }
  @bind
  isToolbarVisible() {
    return new Promise((resolve, reject) => {
      if (this.isLightning) {
        sforce.opencti.isSoftphonePanelVisible({
          callback: response => {
            if (response.errors) {
              reject(response.errors);
            } else {
              resolve(response.returnValue.visible);
            }
          }
        });
      } else {
        sforce.interaction.isVisible(response => {
          if (response.error) {
            reject(response.error);
          } else {
            resolve(response.result);
          }
        });
      }
    });
  }

  @bind
  getSearchLayout() {
    return new Promise((resolve, reject) => {
      if (this.isLightning) {
        sforce.opencti.getSoftphoneLayout({
          callback: response => resolve(response.returnValue)
        });
      } else {
        sforce.interaction.cti.getSoftphoneLayout(response => resolve(safeJSONParse(response.result)));
      }
    });
  }
  @bind
  async onFocusListener(event) {
    if (event !== this.currentOnFocusEvent) {
      this.currentOnFocusEvent = event;
      this.eventService.sendEvent('logDebug', `bridge: onFocus event: ${JSON.stringify(event)}`);
      const entity = {
        objectType: '',
        displayName: '',
        objectName: '',
        objectId: '',
        url: ''
      };
      if (this.isLightning) {
        entity.objectType = event.objectType;
        entity.displayName = event.objectType;
        entity.objectId = event.recordId;
        entity.objectName = event.recordName;
        entity.url = event.url;
      } else {
        const temp = JSON.parse(event.result);
        entity.objectType = temp.object;
        entity.displayName = temp.displayName;
        entity.objectId = temp.objectId;
        entity.objectName = temp.objectName;
        entity.url = temp.url;
      }
      if (this.layoutObjectList.includes(entity.objectType) && entity.objectId !== '') {
        this.eventService.sendEvent('setActivityDetails', entity);
        this.eventService.sendEvent('logDebug', 'bridge: onFocus event sent to home');
      }
    }
  }

  @bind
  async clickToDialListener(event) {
    let entity = {
      object: '',
      objectId: '',
      number: ''
    };
    if (this.isLightning) {
      entity.object = event.objectType;
      entity.objectId = event.recordId;
      entity.number = event.number;
    } else {
      entity = JSON.parse(event.result);
    }

    const records = await this.trySearch(entity.number, InteractionDirectionTypes.Outbound, '', false);
    this.eventService.sendEvent('clickToDial', {
      number: entity.number,
      records: records
    });
  }

  @bind
  async screenpopHandler(event): Promise<any> {
    this.eventService.sendEvent('logVerbose', `bridge: screenpopHandler START: ${event}`);
    try {
      let screenpopRecords = null;
      if (event.id && event.type) {
        screenpopRecords = await this.tryScreenpop(event.id);
      }
      if (event.cadFields && screenpopRecords == null && event.cadFields.length > 0) {

        for (const cadField of event.cadFields) {
          screenpopRecords = await this.cadSearch(cadField);
          if (screenpopRecords != null) {
            screenpopRecords = this.trySearch(cadField.value, InteractionDirectionTypes.Inbound, event.cadString, true);
            break;
          }
        }
      }
      if (event.phoneNumbers && screenpopRecords == null && event.phoneNumbers.length > 0) {
        for (const phoneNumber of event.phoneNumbers) {
          screenpopRecords = await this.trySearch(phoneNumber, InteractionDirectionTypes.Inbound, event.cadString);
          if (screenpopRecords != null) { break; }
        }
      }
      if (event.otherFields) {
        if (event.otherFields.Email && screenpopRecords == null) {
          screenpopRecords = await this.trySearch(event.otherFields.Email.value, InteractionDirectionTypes.Inbound, event.cadString);
        }
        if (event.otherFields.FullName && screenpopRecords == null) {
          screenpopRecords = await this.trySearch(event.otherFields.FullName.value, InteractionDirectionTypes.Inbound, event.cadString);
        }
      }
      return screenpopRecords;
    } catch (e) {
      this.eventService.sendEvent('logError', `bridge: screenpopHandler ERROR= ${e}`);
      throw e;
    }
  }

  @bind
  private tryScreenpop(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isLightning) {
        const screenPopObject = {
          type: sforce.opencti.SCREENPOP_TYPE.SOBJECT,
          callback: result => {
            resolve(result.returnValue);
          },
          params: {
            recordId: id
          }
        };
        sforce.opencti.screenPop(screenPopObject);
      } else {
        sforce.interaction.screenPop('/' + id, true, result => {
          resolve(safeJSONParse(result.result));
        });
      }
    });
  }
  @bind
  protected cadSearch(cad): Promise<any> {
    const entityType = cad.entity;
    if (this.searchLayout.hasOwnProperty(entityType)) {
      return new Promise((resolve, reject) => {
        const fields = this.searchLayout[entityType];
        let finalfields = 'fields=';
        for (let index = 0; index < fields.length; index++) {
          if (index !== fields.length - 1) {
            finalfields = finalfields + fields[index].apiName + ',';
          } else {
            finalfields = finalfields + fields[index].apiName;
          }
        }
        const finalObject = `SFObject=${entityType}`;
        const finalKey = `key=${cad.field}`;
        const finalValue = `value=${cad.value}`;
        const finalquery = `${finalfields}&${finalObject}&${finalKey}&${finalValue}`;
        const cadSearchRequest = {
          apexClass: 'AMCOpenCTINS.ObjectRetrieval',
          methodName: 'getObject',
          methodParams: finalquery,
          callback: function (response) {
            resolve(response.returnValue);
          }
        };
        sforce.opencti.runApex(cadSearchRequest);
      });

    }
  }
  private trySearch(queryString: string, callDirection: InteractionDirectionTypes, cadString: string, shouldScreenpop: boolean = true)
    : Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isLightning) {
        const screenPopObject = {
          callback: result => {
            if (!result.returnValue) {
              this.eventService.sendEvent('logDebug', `bridge: No results returned from screenpop request, error:
              ${JSON.stringify(result.errors)}; PhoneNumberFormat Needs to be configured for CRM`);
              reject({});
            }
            resolve(result.returnValue);
          },
          searchParams: queryString,
          queryParams: cadString,
          deferred: !shouldScreenpop,
          callType: null
        };

        switch (callDirection) {
          case InteractionDirectionTypes.Inbound:
            screenPopObject.callType = sforce.opencti.CALL_TYPE.INBOUND;
            break;
          case InteractionDirectionTypes.Outbound:
            screenPopObject.callType = sforce.opencti.CALL_TYPE.OUTBOUND;
            break;
          case InteractionDirectionTypes.Internal:
            screenPopObject.callType = sforce.opencti.CALL_TYPE.INTERNAL;
            break;
        }
        sforce.opencti.searchAndScreenPop(screenPopObject);
      } else {
        let salesforceCallDirection = '';
        switch (callDirection) {
          case InteractionDirectionTypes.Inbound:
            salesforceCallDirection = 'inbound';
            break;
          case InteractionDirectionTypes.Outbound:
            salesforceCallDirection = 'outbound';
            break;
          case InteractionDirectionTypes.Internal:
            salesforceCallDirection = 'internal';
            break;
        }

        const callback = result => {
          resolve(safeJSONParse(result.result));
        };
        if (shouldScreenpop) {
          sforce.interaction.searchAndScreenPop(queryString, cadString, salesforceCallDirection, callback);
        } else {
          sforce.interaction.searchAndGetScreenPopUrl(queryString, cadString, salesforceCallDirection, callback);
        }
      }
    });
  }

  private VerifyMode() {
    const fullUrl = document.location.href;
    const parameters = fullUrl.split('&');
    for (const itr1 in parameters) {
      if (parameters[itr1].indexOf('mode') >= 0) {
        const parameter = parameters[itr1].split('=');
        if (parameter.length === 2) {
          if (parameter[1] === 'Lightning') {
            this.isLightning = true;
          }
        }
      }
    }
  }

  @bind
  enableClickToDialHandler(clickToDialEnabled: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const callback = result => {
        if (result.success || result.result) {
          resolve();
        } else {
          reject(result.errors || result.error);
        }
      };
      if (this.isLightning) {
        if (clickToDialEnabled) {
          sforce.opencti.enableClickToDial({ callback: callback });
        } else {
          sforce.opencti.disableClickToDial({ callback: callback });
        }
      } else {
        if (clickToDialEnabled) {
          sforce.interaction.cti.enableClickToDial(callback);
        } else {
          sforce.interaction.cti.disableClickToDial(callback);
        }
      }
    });
  }

  protected setSoftphoneHeight(heightInPixels: number) {
    return new Promise<void>((resolve, reject) => {
      // Salesforce allows a MAX of 700 pixels height
      const AdjustedheightInPixels = ((heightInPixels > 700) ? 700 : heightInPixels);
      if (this.isLightning) {
        sforce.opencti.setSoftphonePanelHeight({
          heightPX: AdjustedheightInPixels,
          callback: response => {
            if (response.errors) {
              reject(response.errors);
            } else {
              resolve();
            }
          }
        });
      } else {
        sforce.interaction.cti.setSoftphoneHeight(AdjustedheightInPixels, response => {
          if (response.error) {
            reject(response.error);
          } else {
            resolve();
          }
        });
      }
    });
  }

  protected setSoftphoneWidth(widthInPixels: number) {
    return new Promise<void>((resolve, reject) => {
      if (this.isLightning) {
      } else {
        sforce.interaction.cti.setSoftphoneWidth(widthInPixels, response => {
          if (response.error) {
            reject(response.error);
          } else {
            resolve();
          }
        });
      }
    });
  }
  @bind
  protected saveActivity(activity: IActivity): Promise<IActivity> {
    this.eventService.sendEvent('logDebug', `bridge: Activity from home received to save: ${JSON.stringify(activity)}`);
    if (this.isLightning) {
      return new Promise((resolve, reject) => {
        const activityObject: object = {
          value: {
            entityApiName: 'Task',
            WhoId: activity.WhoObject.objectId,
            WhatId: activity.WhatObject.objectId,
            CallType: activity.CallType,
            CallDurationInSeconds: activity.CallDurationInSeconds,
            Subject: activity.Subject,
            Description: activity.Description,
            Status: activity.Status,
            ActivityDate: activity.ActivityDate
          },
          callback: result => {
            if (result.success) {
              this.eventService.sendEvent('logDebug', `Activity ${JSON.stringify(activity)}
              saved in Lightning, sending updated activity back to home`);
              resolve(activity);
            } else {
              this.eventService.sendEvent('logDebug', `bridge: Activity ${JSON.stringify(activity)}
              could not be saved, error: ${JSON.stringify(result.errors['0'].details.fieldErrors)}`);
            }
          }
        };
        if (activity.ActivityId) {
          activityObject['value']['Id'] = activity.ActivityId;
        }
        sforce.opencti.saveLog(activityObject);
      });
    }
    return new Promise((resolve, reject) => {
      let activityString = '';
      activityString = `WhoId=${activity.WhoObject.objectId}&WhatId=${activity.WhatObject.objectId}` +
        `&CallType=${activity.CallType}&CallDurationInSeconds=${activity.CallDurationInSeconds}` +
        `&Subject=${activity.Subject}&Description=${activity.Description}&Status=${activity.Status}` +
        `&ActivityDate=${activity.ActivityDate}`;
      if (activity.ActivityId) {
        activityString = activityString + '&Id=' + activity.ActivityId;
      }
      sforce.interaction.saveLog('Task', activityString, result => {
        activity.ActivityId = result.result;
        console.log('Activity ID = ' + result.result);
        this.eventService.sendEvent('logDebug', `bridge: Activity ${JSON.stringify(activity)} saved in Classic`);
        resolve(activity);
      });
    });
  }
  @bind
  protected createNewEntity(params: ICreateNewSObjectParams) {
    let URL = '';
    this.eventService.sendEvent('logDebug', `bridge: New Salesforce object requested with params: ${JSON.stringify(params)}`);
    if (this.isLightning) {
      const screenPopObject: IScreenPopObject = {
        type: sforce.opencti.SCREENPOP_TYPE.NEW_RECORD_MODAL,
        params: {
          entityName: params.entityName,
          defaultFieldValues: {}
        },
        callback: (result: ISaveLogResult) => {
          if (result.success) {
            this.eventService.sendEvent('logDebug', `bridge: Salesforce object with params:
            ${JSON.stringify(params)} screenpop successful: ${result.returnValue}`);
          } else {
            this.eventService.sendEvent('logDebug', `bridge: Salesforce object with params:
            ${JSON.stringify(params)} screenpop unsuccessful ${result.errors}`);
          }
        }
      };
      if (params.entityName === 'Case') {
        screenPopObject.params.defaultFieldValues = params.caseFields;
      } else if (params.entityName === 'Opportunity') {
        screenPopObject.params.defaultFieldValues = params.opportunityFields;
      } else if (params.entityName === 'Lead') {
        screenPopObject.params.defaultFieldValues = params.leadFields;
      }
      sforce.opencti.screenPop(screenPopObject);
    } else {
      if (params.entityName === 'Case') {
        URL = '/500/e?';
      } else if (params.entityName === 'Lead') {
        URL = '/00Q/e?';
      } else if (params.entityName === 'Opportunity') {
        URL = '/006/e';
      }
      sforce.interaction.screenPop(URL, true, function (result) {
        if (result) {
          this.eventService.sendEvent('logDebug', `bridge: Salesforce object with params:
          ${JSON.stringify(params)} screenpop successful`);
        } else {
          this.eventService.sendEvent('logDebug', `bridge: Salesforce object with params:
          ${JSON.stringify(params)} screenpop unsuccessful`);
        }
      });
    }
  }

}

const bridge = new BridgeSalesforce();

interface IScreenPopObject {
  type: string;
  params: {
    entityName: string;
    defaultFieldValues?: Object;
  };
  callback: (result: ISaveLogResult) => void;
}
interface ISaveLogResult {
  success?: boolean;
  returnValue?: object;
  errors?: string[];
}
interface ISalesforceClassicOnFocusEvent {
  result: {
    url: string;
    objectId: string;
    objectName: string;
    object: string;
    displayName: string;
  };
  error: string;
}

interface ISalesforceLightningOnFocusEvent {
  url: string;
  recordId: string;
  recordName: string;
  objectType: string;
  accountId?: string;
  contactId?: string;
  personAccount: boolean;
}
