import { Bridge } from '@amc-technology/applicationangularframework';
import { InteractionDirectionTypes } from '@amc-technology/davinci-api';
import { bind } from 'bind-decorator';
import { safeJSONParse } from '../utils';
import { IActivity } from '../Model/IActivity';
import { ICreateNewSObjectParams } from '../Model/ICreateNewSObjectParams';
import { NotificationType } from '@amc-technology/davinci-api';
declare var sforce: any;

class BridgeSalesforce extends Bridge {
  private isLightning = false;
  private isConsoleView = true;
  private currentOnFocusEvent: ISalesforceClassicOnFocusEvent | ISalesforceLightningOnFocusEvent;
  protected prefixList: any;
  activityLayout: any;
  activity: IActivity = null;
  layoutObjectList: string[];
  searchLayout: any;
  lastOnFocusWasAnEntity: boolean;

  constructor() {
    super();
    this.currentOnFocusEvent = null;
    this.appName = 'Salesforce';
    this.prefixList = {};
    this.layoutObjectList = [];
    this.VerifyMode();
    this.initialize();
    this.eventService.subscribe('getSearchLayout', this.getSearchLayout);
    this.eventService.subscribe('updateActivityLayout', this.updateActivityLayout);
    this.eventService.subscribe('isToolbarVisible', this.isToolbarVisible);
    this.eventService.subscribe('search', this.screenpopHandler);
    this.eventService.subscribe('getActivity', this.getActivity);
    this.eventService.subscribe('saveActivity', this.saveActivity);
    this.eventService.subscribe('createNewEntity', this.createNewEntity);
    this.eventService.subscribe('agentSelectedCallerInformation', this.tryScreenpop);
    this.eventService.subscribe('setIsInConsoleView', this.setIsInConsoleViewCallback);
    this.lastOnFocusWasAnEntity = false;
  }

  @bind
  setIsInConsoleView(event) {
    this.isConsoleView = event.result;
  }

  @bind
  setIsInConsoleViewCallback() {
    return new Promise<any>((resolve, reject) => {
      resolve(this.isConsoleView);
    });
  }
  async afterScriptsLoad(): Promise<any> {
    this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Bridge Scripts Loaded');
    await super.afterScriptsLoad();
    if (this.isLightning) {
      sforce.opencti.onClickToDial({ listener: this.clickToDialListener });
      sforce.opencti.onNavigationChange({ listener: this.onFocusListener });
      sforce.opencti.getSoftphoneLayout({
        callback: this.buildLayoutObjectList
      });
      sforce.interaction.isInConsole(this.setIsInConsoleView);
    } else {
      sforce.interaction.cti.onClickToDial(this.clickToDialListener);
      sforce.interaction.onFocus(this.onFocusListener);
      sforce.interaction.cti.getSoftphoneLayout(this.buildLayoutObjectList);
      sforce.interaction.isInConsole(this.setIsInConsoleView);
    }
    if (this.isLightning) {
      this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : App running in Lightning');
    } else {
      this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : App running in Classic');
    }
  }

  protected async softphoneInit(objectFields) {
    this.eventService.sendEvent('logTrace', 'Salesforce - Bridge : Initializing Softphone. Object Fields : '
      + JSON.stringify(objectFields));
    for (const object of objectFields) {
      if (object) {
        const objectPrefix = await this.loadPrefixList(object).catch(error => {
          this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : Getting Prefix Info from Salesforce : '
            + JSON.stringify(error));
        });
        this.prefixList[objectPrefix] = object;
      }
    }
    this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Initializing Softphone. Prefix List : '
      + JSON.stringify(this.prefixList));
  }

  protected async loadPrefixList(object): Promise<any> {
    this.eventService.sendEvent('logTrace', 'Salesforce - Bridge : Load Salesforce prefix definitions');
    return new Promise((resolve, reject) => {
      try {

        if (this.isLightning) {
          const getIDRequest = {
            apexClass: 'AMCOpenCTINS.ObjectRetrieval',
            methodName: 'getIdPrefix',
            methodParams: `objectType=${object}`,
            callback: response => {
              if (response.success) {
                resolve(response.returnValue.runApex.replace(/["'replace]/g, ''));
              } else {
                reject(response.errors);
              }
            }
          };
          sforce.opencti.runApex(getIDRequest);
        } else {
          sforce.interaction.runApex(
            'AMCOpenCTINS.ObjectRetrieval',
            'getIdPrefix',
            `objectType=${object}`, response => {
              if (response.result) {
                resolve(response.result.replace(/["'replace]/g, ''));
              } else {
                reject(response.error);
              }
            });
        }
      } catch (error) {
        this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : Load Prefix List: ' + JSON.stringify(error));
      }
    });
  }

  @bind
  protected getType(entityId: string): string {
    try {
      this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Fetching type for work item: ' + entityId);
      const prefix = entityId.substring(0, 3);
      const type = this.prefixList[prefix];
      this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Type for work item: ' + entityId + ' is ' + type);
      return type;
    } catch (error) {
      this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : Fetching Type for work Item. Entity ID : '
        + entityId + ' and Prefix List is ' + JSON.stringify(this.prefixList));
    }
  }

  @bind
  protected buildLayoutObjectList(result) {
    try {
      this.eventService.sendEvent('logTrace', 'Salesforce - Bridge : Building Layout Object List. Input : ' + JSON.stringify(result));
      if (this.isLightning) {
        this.layoutObjectList = Object.keys(result.returnValue.Inbound.objects);
        this.searchLayout = result.returnValue.Inbound.objects;
      } else {
        this.layoutObjectList = Object.keys(JSON.parse(result.result).Inbound.objects);
        this.searchLayout = JSON.parse(result.result).Inbound.objects;
      }
      this.softphoneInit(this.layoutObjectList);
      if (!this.isLightning) {
        sforce.interaction.getPageInfo(this.onFocusListener);
      }
      this.eventService.sendEvent('logTrace', 'Salesforce - Bridge : Building Layout Object List. Input : '
        + JSON.stringify(result) + ', Output : ' + JSON.stringify(this.layoutObjectList));
    } catch (error) {
      this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : Building Layout Object List. Error Information : '
        + JSON.stringify(error));
    }
  }

  @bind
  isToolbarVisible() {
    return new Promise((resolve, reject) => {
      if (this.isLightning) {
        sforce.opencti.isSoftphonePanelVisible({
          callback: response => {
            if (response.errors) {
              this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : Checking if toolbar is visible. Error Information : '
                + JSON.stringify(response));
              reject(response.errors);
            } else {
              this.eventService.sendEvent('logTrace', 'Salesforce - Bridge : Checking if toolbar is visible. Received Response : '
                + JSON.stringify(response));
              resolve(response.returnValue.visible);
            }
          }
        });
      } else {
        sforce.interaction.isVisible(response => {
          if (response.error) {
            this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : Checking if toolbar is visible. Error Information : '
              + JSON.stringify(response));
            reject(response.error);
          } else {
            this.eventService.sendEvent('logTrace', 'Salesforce - Bridge : Checking if toolbar is visible. Received Response : '
              + JSON.stringify(response));
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
          callback: response => {
            if (response.success) {
              this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Fetching Search Layout from CRM. Response : '
                + JSON.stringify(response));
              resolve(response.returnValue);
            } else {
              this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : Fetching Search Layout from CRM. Response : '
                + JSON.stringify(response));
              reject();
            }
          }
        });
      } else {
        sforce.interaction.cti.getSoftphoneLayout(response => {
          if (response.result) {
            this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Fetching Search Layout from CRM. Response : '
              + JSON.stringify(response));
            resolve(safeJSONParse(response.result));
          } else {
            this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : Fetching Search Layout from CRM. Response : '
              + JSON.stringify(response));
            reject();
          }
        });
      }
    });
  }

  @bind
  async onFocusListener(event) {
    if (JSON.stringify(event) !== JSON.stringify(this.currentOnFocusEvent)) {
      try {
        this.currentOnFocusEvent = event;
        this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Received On Focus Event from Salesforce : ' + JSON.stringify(event));
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
          entity.url = event.url;
        } else {
          const temp = JSON.parse(event.result);
          entity.objectType = temp.object;
          entity.displayName = temp.displayName;
          entity.objectId = temp.objectId;
          entity.url = temp.url;
        }
        if (
          (!entity.objectType || entity.objectType === '') &&
          (!entity.displayName || entity.displayName === '') &&
          (!entity.objectId || entity.objectId === '') &&
          (!entity.objectName || entity.objectName === '')
        ) {
          this.lastOnFocusWasAnEntity = false;
        } else {
          this.lastOnFocusWasAnEntity = true;
        }
        if (this.layoutObjectList.includes(entity.objectType) && entity.objectId !== '') {
          const record = await this.cadSearch({ entity: entity.objectType, field: 'Id', value: entity.objectId });
          if (record.length > 0) {
            entity.objectName = record[0][this.searchLayout[entity.objectType][0].apiName];
          }
          this.eventService.sendEvent('onFocus', entity);
          this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Sent On Focus Event to Home : ' + JSON.stringify(entity));
        }
      } catch (error) {
        this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : On Focus Event. Error Information : '
          + JSON.stringify(event));
      }
    }
  }

  @bind
  async clickToDialListener(event) {
    try {
      this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Received Click to Dial Event from Salesforce. Event Information : '
        + JSON.stringify(event));

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

      const clickToDialRecord = {
        lastOnFocusWasAnEntity: this.lastOnFocusWasAnEntity,
        isLightning: this.isLightning,
        entity: event
      };

      this.eventService.sendEvent('clickToDial', clickToDialRecord);

      this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Click to Dial Event sent to Home. Event Information : '
        + JSON.stringify(clickToDialRecord));

    } catch (error) {
      this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : Click to Dial listener. Error Information : '
        + JSON.stringify(error));
    }
  }

  @bind
  async getActivity(activity: IActivity): Promise<any> {
    this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Get Activity. Input Details : '
      + JSON.stringify(activity));
    return new Promise(async (resolve, reject) => {
      try {
        const activityRecord = await this.getTaskDetails(activity);
        const refFields: string[] = this.activityLayout[activity.ChannelType]['Fields'];
        const lookupFields: Object = this.activityLayout[activity.ChannelType]['LookupFields'];
        const updatedActivity = {};
        for (const field of refFields) {
          let refEntity = {
            objectType: '',
            displayName: '',
            objectName: '',
            objectId: '',
            url: ''
          };
          let fieldValue: string = activityRecord[0][field];
          if (lookupFields[field]) {
            if (fieldValue && fieldValue.length === 18 && !this.isLightning) {
              fieldValue = fieldValue.substring(0, 15);
            }
            updatedActivity[lookupFields[field]] = refEntity;
          } else {
            if (!fieldValue) {
              fieldValue = '';
            }
            updatedActivity[field] = fieldValue;
          }
          if (fieldValue && lookupFields[field]) {
            const entityType: string = this.getType(fieldValue);
            const entityRecord = await this.cadSearch({ entity: entityType, field: 'Id', value: fieldValue });
            if (entityRecord && entityRecord.length > 0) {
              refEntity = {
                objectType: entityType,
                displayName: entityType,
                objectName: entityRecord[0][this.searchLayout[entityType][0].apiName],
                objectId: fieldValue,
                url: entityRecord[0].attributes.url
              };
            } else if (!entityRecord) {
              refEntity = {
                objectType: '',
                displayName: '',
                objectName: fieldValue,
                objectId: fieldValue,
                url: ''
              };
            }
            updatedActivity[lookupFields[field]] = refEntity;
          }
        }
        this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Sending Activity Information from CRM to Home. Updated Activity : '
          + JSON.stringify(updatedActivity));
        resolve(updatedActivity);
      } catch (error) {
        this.eventService.sendEvent('logError', 'Salesforce - Bridge. Error Retrieving Activity. Input Activity : '
          + JSON.stringify(activity) + '. Error Details : ' + JSON.stringify(error));
        reject('Error retrieving Activity Details');
      }
    });
  }

  async getTaskDetails(activity: IActivity): Promise<any> {
    try {
      this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Get Task Details. Activity Details : ' + JSON.stringify(activity));
      const entityType = this.activityLayout[activity.ChannelType]['APIName'];
      if (entityType) {
        return new Promise((resolve, reject) => {
          const fields = this.activityLayout[activity.ChannelType]['Fields'];
          let finalfields = 'fields=';
          for (let index = 0; index < fields.length; index++) {
            if (index !== fields.length - 1) {
              finalfields = finalfields + fields[index] + ',';
            } else {
              finalfields = finalfields + fields[index];
            }
          }
          const finalObject = `SFObject=${entityType}`;
          const finalKey = `key=Id`;
          const finalValue = `value=${activity.ActivityId}`;
          const finalquery = `${finalfields}&${finalObject}&${finalKey}&${finalValue}`;
          const cadSearchRequest = {
            apexClass: 'AMCOpenCTINS.ObjectRetrieval',
            methodName: 'getObject',
            methodParams: finalquery,
            callback: async response => {
              if (response.success) {
                this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Get Task Details Successful. Response : '
                  + JSON.stringify(response));
                resolve(safeJSONParse(response.returnValue.runApex));
              } else {
                this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : Get Task Details. Error Information : '
                  + JSON.stringify(response));
                reject();
              }
            }
          };
          if (this.isLightning) {
            sforce.opencti.runApex(cadSearchRequest);
          } else {
            sforce.interaction.runApex(cadSearchRequest.apexClass, cadSearchRequest.methodName, cadSearchRequest.methodParams,
              response => {
                if (response.result) {
                  this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Get Task Details Successful. Response : '
                    + JSON.stringify(response));
                  resolve(safeJSONParse(response.result));
                } else {
                  this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : Get Task Details. Error Information : '
                    + JSON.stringify(response));
                  reject();
                }
              });
          }
        });
      }
    } catch (error) {
      this.eventService.sendEvent('logError', 'Salesforce - Bridge : Error Retrieving task Details. Input Activity : '
        + JSON.stringify(activity) + '. Error Information : ' + JSON.stringify(error));
    }
  }

  @bind
  async updateActivityLayout(event): Promise<any> {
    this.activityLayout = event;
    this.eventService.sendEvent('logTrace', 'Salesforce - Bridge : Activity Layout updated. Info : ' + JSON.stringify(this.activityLayout));
  }

  @bind
  async screenpopHandler(event): Promise<any> {
    this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Received Screen Pop Handler Event. Info : ' + JSON.stringify(event));
    try {
      const isSearch = event['search'] ? true : false;
      let screenpopRecords = null;
      const versionIsLightning = this.isLightning;
      if (event.type === 'ClickToDialNoScreenpop' || event.type === 'ClickToDialScreenpop') {
        if (event.id) {
          let formattedRecord = {};
          if (versionIsLightning) {
            formattedRecord = {
              [event.id.recordId]:
              {
                'Id': event.id.recordId,
                'Name': event.id.recordName,
                'RecordType': event.id.objectType
              }
            };
          } else {
            const classicEntity = JSON.parse(event.id.result);
            formattedRecord = {
              [classicEntity.objectId]:
              {
                'Id': classicEntity.objectId,
                'Name': classicEntity.objectName,
                'RecordType': classicEntity.object
              }
            };
          }

          const entityId = Object.keys(formattedRecord);
          if (event.type === 'ClickToDialScreenpop' && !isSearch) {
            screenpopRecords = await this.tryScreenpop(entityId[0]);
          }
          this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Sending CRM Records to Home. Output : '
            + JSON.stringify(formattedRecord));
          return formattedRecord;
        }
      }
      if (event.id && event.type) {
        screenpopRecords = await this.tryScreenpop(event.id);
      }
      if (event.cadFields && screenpopRecords == null && event.cadFields.length > 0) {

        for (const cadField of event.cadFields) {
          screenpopRecords = await this.cadSearch(cadField);
          if (screenpopRecords != null) {
            screenpopRecords = this.trySearch(cadField.value, InteractionDirectionTypes.Inbound, event.cadString, !isSearch);
            break;
          }
        }
      }
      if (event.phoneNumbers && screenpopRecords == null && event.phoneNumbers.length > 0) {
        for (const phoneNumber of event.phoneNumbers) {
          screenpopRecords = await this.trySearch(phoneNumber, InteractionDirectionTypes.Inbound, event.cadString, !isSearch);
          if (screenpopRecords != null) { break; }
        }
      }
      if (event.otherFields) {
        if (event.otherFields.Email && screenpopRecords == null) {
          screenpopRecords = await this.trySearch(event.otherFields.Email.value, InteractionDirectionTypes.Inbound, event.cadString,
            !isSearch);
        }
        if (event.otherFields.FullName && screenpopRecords == null) {
          screenpopRecords = await this.trySearch(event.otherFields.FullName.value, InteractionDirectionTypes.Inbound, event.cadString,
            !isSearch);
        }
      }
      this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Sending CRM Records to Home. Output : '
        + JSON.stringify(screenpopRecords));
      return screenpopRecords;
    } catch (error) {
      this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : Screen Pop Handler. Error Information : '
        + JSON.stringify(error));
      throw error;
    }
  }

  @bind
  private tryScreenpop(id: string): Promise<any> {
    try {
      this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Screenpop. ID : ' + id);
      return new Promise((resolve, reject) => {
        if (this.isLightning) {
          const screenPopObject = {
            type: sforce.opencti.SCREENPOP_TYPE.SOBJECT,
            callback: response => {
              if (response.success) {
                this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Screenpop Successful. ID : '
                  + id + '. Received Response : ' + JSON.stringify(response));
                resolve(response.returnValue);
              } else {
                this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : Screenpop. ID : '
                  + id + '. Error Information : ' + JSON.stringify(response));
                reject();
              }
            },
            params: {
              recordId: id
            }
          };
          sforce.opencti.screenPop(screenPopObject);
        } else {
          sforce.interaction.screenPop('/' + id, true, response => {
            if (response.result) {
              this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Screenpop Successful. ID : '
                + id + '. Received Response : ' + JSON.stringify(response));
              resolve(safeJSONParse(response.result));
            } else {
              this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : Screenpop. ID : '
                + id + '. Error Information : ' + JSON.stringify(response));
              reject();
            }
          });
        }
      });
    } catch (error) {
      this.eventService.sendEvent('logError', 'Salesforce - Bridge. ERROR : Screenpop. ID : '
        + id + '. Error Information : ' + JSON.stringify(error));
    }
  }

  @bind
  protected cadSearch(cad): Promise<any> {
    try {
      this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Cad Search. Input : ' + JSON.stringify(cad));
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
            callback: response => {
              if (response.success) {
                this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Cad Search Successful. Input : '
                  + JSON.stringify(cad) + '. Received Response : ' + JSON.stringify(response));
                resolve(safeJSONParse(response.returnValue.runApex));
              } else {
                this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : Cad Search. Input : '
                  + JSON.stringify(cad) + '. Error Information : ' + JSON.stringify(response));
                reject();
              }
            }
          };
          if (this.isLightning) {
            sforce.opencti.runApex(cadSearchRequest);
          } else {
            sforce.interaction.runApex(cadSearchRequest.apexClass, cadSearchRequest.methodName, cadSearchRequest.methodParams,
              response => {
                if (response.result) {
                  this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Cad Search Successful. Input : '
                    + JSON.stringify(cad) + '. Received Response : ' + JSON.stringify(response));
                  resolve(safeJSONParse(response.result));
                } else {
                  this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : Cad Search. Input : '
                    + JSON.stringify(cad) + '. Error Information : ' + JSON.stringify(response));
                  reject();
                }
              });
          }
        });
      }
    } catch (error) {
      this.eventService.sendEvent('logError', 'Salesforce - Bridge. ERROR : Cad Search. Input : '
        + JSON.stringify(cad) + '. Error Information : ' + JSON.stringify(error));
    }
  }

  private trySearch(queryString: string, callDirection: InteractionDirectionTypes, cadString: string, shouldScreenpop: boolean = true)
    : Promise<any> {
    this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Search. Parameters : Query String : '
      + queryString + ', Call Direction : ' + JSON.stringify(callDirection) + ', Cad String : '
      + cadString + ' and Should Screen Pop : ' + shouldScreenpop);
    return new Promise((resolve, reject) => {
      if (this.isLightning) {
        const screenPopObject = {
          callback: response => {
            if (!response.success) {
              this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : Search. Parameters : Query String : '
                + queryString + ', Call Direction : ' + JSON.stringify(callDirection) + ', Cad String : '
                + cadString + ' and Should Screen Pop : ' + shouldScreenpop + '. Error Information : ' + JSON.stringify(response));
              reject();
            } else {
              this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Search Successful. Parameters : Query String : '
                + queryString + ', Call Direction : ' + JSON.stringify(callDirection) + ', Cad String : '
                + cadString + ' and Should Screen Pop : ' + shouldScreenpop + '. Response Information : ' + JSON.stringify(response));
              resolve(response.returnValue);
            }
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

        const callback = response => {
          if (response.result) {
            this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : ERROR : Search. Parameters : Query String : '
              + queryString + ', Call Direction : ' + JSON.stringify(callDirection) + ', Cad String : '
              + cadString + ' and Should Screen Pop : ' + shouldScreenpop + '. Error Information : ' + JSON.stringify(response));
            resolve(safeJSONParse(response.result));
          } else {
            this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : Search. Parameters : Query String : '
              + queryString + ', Call Direction : ' + JSON.stringify(callDirection) + ', Cad String : '
              + cadString + ' and Should Screen Pop : ' + shouldScreenpop + '. Error Information : ' + JSON.stringify(response));
            reject();
          }

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
            break;
          }
        }
      }
    }
  }

  @bind
  enableClickToDialHandler(clickToDialEnabled: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const callback = response => {
        if (response.success || response.result) {
          this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Click to Dial Enable/Disable Successful. Paramter - Enabled : '
            + clickToDialEnabled);
          resolve();
        } else {
          this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : Click to Dial Enable/Disable. Parameter - Enabled : '
            + clickToDialEnabled + 'Error Info : ' + JSON.stringify(response));
          reject(response.errors || response.error);
        }
      };
      this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Enabling Click to Dial. Parameter - Enabled : ' + clickToDialEnabled);
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
      const AdjustedheightInPixelsLightning = ((heightInPixels > 650) ? 650 : heightInPixels);
      const AdjustedheightInPixelsClassic = ((heightInPixels > 685) ? 685 : heightInPixels);
      if (this.isLightning) {
        sforce.opencti.setSoftphonePanelHeight({
          heightPX: AdjustedheightInPixelsLightning + 50,
          callback: response => {
            if (response.errors) {
              this.eventService.sendEvent('logError', 'Salesforce - Bridge: ERROR : Set Softphone Height. Error Information : '
                + JSON.stringify(response));
              reject(response.errors);
            } else {
              resolve();
            }
          }
        });
      } else {
        sforce.interaction.cti.setSoftphoneHeight(AdjustedheightInPixelsClassic + 15, response => {
          if (response.error) {
            this.eventService.sendEvent('logError', 'Salesforce - Bridge: ERROR : Set Softphone Height. Error Information : '
              + response);
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
            this.eventService.sendEvent('logError', 'Salesforce - Bridge: ERROR : Set Softphone Width. Error Information : '
              + JSON.stringify(response));
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
    this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Activity received  for Scenario ID : ' + activity.ScenarioId +
      '. Activity Info : ' + JSON.stringify(activity));
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
            ActivityDate: activity.ActivityDate,
            TaskSubtype: activity.TaskSubtype
          },
          callback: response => {
            if (response.success) {
              activity.ActivityId = response.returnValue.recordId;
              this.eventService.sendEvent('logInformation', 'Salesforce - Bridge : Activity for Scenario ID : '
                + activity.ScenarioId + ' saved in CRM. Activity Info : ' + JSON.stringify(activity));
              resolve(activity);
            } else {
              this.eventService.sendEvent('sendNotification', {
                notification: 'Save activity failed.',
                notificationType: NotificationType.Error
              });
              this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : Save Activity failed for Scenario ID : '
                + activity.ScenarioId + '. Activity Info : ' + JSON.stringify(activity) + '. Error Info : '
                + JSON.stringify(response));
              reject();
            }
          }
        };
        if (activity.ActivityId) {
          activityObject['value']['Id'] = activity.ActivityId;
        }
        for (const key of Object.keys(activity.CadFields)) {
          activityObject['value'][key] = activity.CadFields[key];
        }
        sforce.opencti.saveLog(activityObject);
      });
    } else {
      return new Promise((resolve, reject) => {
        let activityString = '';
        activityString = `WhoId=${activity.WhoObject.objectId}&WhatId=${activity.WhatObject.objectId}` +
          `&CallType=${activity.CallType}&CallDurationInSeconds=${activity.CallDurationInSeconds}` +
          `&Subject=${activity.Subject}&Description=${activity.Description}&Status=${activity.Status}` +
          `&ActivityDate=${activity.ActivityDate}&TaskSubtype=${activity.TaskSubtype}`;
        if (activity.ActivityId) {
          activityString = activityString + '&Id=' + activity.ActivityId;
        }
        for (const key of Object.keys(activity.CadFields)) {
          activityString = activityString + '&' + key + '=' + activity.CadFields[key];
        }
        sforce.interaction.saveLog('Task', activityString, response => {
          if (response.result) {
            activity.ActivityId = response.result;
            this.eventService.sendEvent('logInformation', 'Salesforce - Bridge : Activity for Scenario ID : '
              + activity.ScenarioId + ' saved in CRM. Activity Info : ' + JSON.stringify(activity));
            resolve(activity);
          } else {
            this.eventService.sendEvent('sendNotification', {
              notification: 'Save activity failed.',
              notificationType: NotificationType.Error
            });
            this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : Save Activity failed for Scenario ID : '
              + activity.ScenarioId + '. Activity Info : ' + JSON.stringify(activity) + '. Error Info : '
              + JSON.stringify(response));
            reject();
          }
        });
      });
    }
  }

  @bind
  protected createNewEntity(params: ICreateNewSObjectParams) {
    try {
      let URL = '';
      this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Quick Create Salesforce Entity : '
        + JSON.stringify(params));
      if (this.isLightning) {
        const screenPopObject: IScreenPopObject = {
          type: sforce.opencti.SCREENPOP_TYPE.NEW_RECORD_MODAL,
          params: {
            entityName: params.entityName,
            defaultFieldValues: {}
          },
          callback: (response: ISaveLogResult) => {
            if (response.success) {
              this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Quick Create Successful. Response : ' + response.returnValue);
            } else {
              this.eventService.sendEvent('logError', 'Salesforce - Bridge: ERROR : Quick Create. Parameters : '
                + JSON.stringify(params) + '. Error Information : ' + JSON.stringify(response));
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
        sforce.interaction.screenPop(URL, true, response => {
          if (response.result) {
            this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Quick Create Successful');
          } else {
            this.eventService.sendEvent('logError', 'Salesforce - Bridge: ERROR : Quick Create. Parameters : '
              + JSON.stringify(params) + '. Error Information : ' + JSON.stringify(response));
          }
        });
      }
    } catch (error) {
      this.eventService.sendEvent('logError', 'Salesforce - Bridge: ERROR : Quick Create. Parameters : '
        + JSON.stringify(params) + '. Error Information : ' + JSON.stringify(error));
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
