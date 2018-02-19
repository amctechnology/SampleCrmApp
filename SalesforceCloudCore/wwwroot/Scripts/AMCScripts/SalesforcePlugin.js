(function (AMCSalesforcePlugin) {

    var Config = {};
    var userID = '';
    var lstTranscript = {};
    var previousStatus = '';
    var activityIdValue = '';
    var enableAudio = false;
    var enableVideo = false;
    var customerName = "";
    var customerInfo = "";
    var dictChatName = {};
    var dictChatMeetingDetails = {};
    var objChatTranscript = '';
    var lstMinMax = {};
    var lstContacts = {};
    var lstMeetings = {};
    var lstEmailAddress = {};
    var lstPreviousState = {};
    var lstConversations = {};
    var lstAddedListeners = {};
    var lstPersons = {};
    var lstPreviousAudioState = {};
    var lstPreviousVideoState = {};
    var lstAlertConversations = {};
    var lstTransferRequests = {};
    var lstVideoConversations = {};
    var lstAudioConversations = {};
    var lstRelations = {};
    var lstPreviousHoldAudioState = {};
    var lstPreviousParticipantHoldAudioState = {};
    var lstPreviousMuteAudioState = {};
    var lstPreviousParticipantMuteAudioState = {};
    var lstMuteDisconnected = {};
    var lstHoldDisconnected = {};
    var lstDisplayContacts = {};
    var lstPhones = {};
    var lstContactData = {};

    var maxRecordsDefault = 50;

    var scenarioInteractionMappings = {};

    var searchLayout = null;
    var screenpopControlOn = true;

    var salesforceBridgeAPIMethodNames = {
        SCREEN_POP: "SalesforceBridgeAPIScreenPop",
        SEARCH: "SalesforceBridgeAPISearch",
        CAD_SEARCH: "SalesforceBridgeAPICADSearch",
        CAD_SEARCH_AND_SCREEN_POP: "SalesforceBridgeAPICADSearchAndScreenPop",
        SEARCH_AND_SCREEN_POP: "SalesforceBridgeAPISearchAndScreenPop",
        SET_SP_HT: "SalesforceBridgeAPISET_SP_HT",
        SET_SP_WTH: "SalesforceBridgeAPISET_SP_WTH",
        GET_SP_LAYOUT: "SalesforceBridgeAPIGET_SP_LAYOUT",
        ENB_CLICK_TO_DIAL: "SalesforceBridgeAPIENB_CLICK_TO_DIAL",
        DSB_CLICK_TO_DIAL: "SalesforceBridgeAPIDSB_CLICK_TO_DIAL",
        CLICK_TO_DIAL_EVENT: "SalesforceBridgeAPICLICK_TO_DIAL_EVENT",
        GET_CALL_CENTER_SETTINGS: "SalesforceBridgeAPIGET_CALL_CENTER_SETTINGS",
        GET_PAGE_INFO: "SalesforceBridgeAPIGET_PAGE_INFO",
        ON_FOCUS_EVENT: "SalesforceBridgeAPION_FOCUS_EVENT",
        SAVE_ACTIVITY: "SalesforceBridgeSaveActivity",
        IS_VISIBLE: "SalesforceBridgeIsVisible",
        SET_VISIBLE: "SalesforceBridgeSetVisible",
        USER_INFO: "SalesforceBridgeUSER_INFO",
    };

    var requests = {};// requestId -> callback
    var sequenceId = 0;

    $(document).ready(function () {
        if (window.addEventListener) {
            window.addEventListener("message", listener, false);
        } else {
            window.attachEvent("onmessage", listener);
        }
        ContactCanvasApplicationAPI.loadBridgeScripts([
                "https://c.na1.visual.force.com/support/api/36.0/interaction.js",
                "https://na15.salesforce.com/support/console/35.0/integration.js",
                "https://gs0.lightning.force.com/support/api/38.0/lightning/opencti_min.js",
                location.origin + "/Scripts/AMCScripts/SalesforceBridgeAPI.js",
            ]).then(LoadScriptComplete);
        var data = {};
        data.pluginIconPath = window.location.origin + window.location.pathname + "/Images/salesforce.png";
        ContactCanvasApplicationAPI.registerScreenpop(screenPop);
        ContactCanvasApplicationAPI.registerGlobalSearch(search);
        ContactCanvasApplicationAPI.registerGlobalSearchAndScreenpop(searchAndScreenpop);
        ContactCanvasApplicationAPI.registerSearch(cadSearch);
        ContactCanvasApplicationAPI.registerEnableClickToDial(enableClickToDial);
        ContactCanvasApplicationAPI.registerSetSoftphoneHeight(setSoftPhoneHeight);
        ContactCanvasApplicationAPI.registerSetSoftphoneWidth(setSoftPhoneWidth);
        ContactCanvasApplicationAPI.registerGetSearchLayout(getSoftPhoneLayout);
        // ContactCanvasApplicationAPI.registerGetApplicationSettings(getApplicationSettings);
        ContactCanvasApplicationAPI.registerGetPageInfo(getPageInfo);
        ContactCanvasApplicationAPI.registerSaveActivity(saveActivity);
        ContactCanvasApplicationAPI.registerIsToolbarVisible(isVisible);
        // ContactCanvas.Application.registerSetToolbarVisible(ContactCanvas.Commons.getSequenceID(), setVisible);
        // ContactCanvas.Application.addPluginImage(ContactCanvas.Commons.getSequenceID(), data, null);

        ContactCanvasApplicationAPI.registerScreenpopControlChanged(function (screenPopEnabled) {
            if (typeof screenPopEnabled == 'boolean') {
                screenpopControlOn = screenPopEnabled;
                return Promise.resolve();
            }
            return Promise.reject('Invalid parameters!');
        });
        // ContactCanvas.Application.isScreenpopControlOn(function (msg) {
        //     if (typeof msg.response.data.screenpopControlOn == 'boolean') {
        //         screenpopControlOn = msg.response.data.screenpopControlOn;
        //     }
        // });
        ContactCanvasApplicationAPI.registerOnInteraction(onInteraction);

        ContactCanvasApplicationAPI.initializeComplete().then((config) => {
            maxRecordsDefault = parseInt(config.variables.maxRecordsDefault);
        });
    });

    function getSequenceID() { return sequenceId++; }

    function LoadScriptComplete()
    {
        getUserInfo();
    }

    function onInteraction(interaction) {
        try {
            var interactionId = interaction.interactionId;
            var scenarioIdInt = interaction.scenarioId;
            var isNewScenarioId = false;

            if (!scenarioInteractionMappings.hasOwnProperty(scenarioIdInt)) {
                scenarioInteractionMappings[scenarioIdInt] = {};
                isNewScenarioId = true;
            }
            scenarioInteractionMappings[scenarioIdInt][interactionId] = true;

            if ((interaction.state === ContactCanvasApplicationAPI.InteractionStates.Alerting || interaction.state === ContactCanvasApplicationAPI.InteractionStates.Connected)
                && Object.keys(scenarioInteractionMappings).length < 2
               && isNewScenarioId
            ) {
                if (screenpopControlOn && interaction.hasOwnProperty("details")) {
                    var details = ContactCanvasApplicationAPI.RecordItem.fromJSON(interaction.details);
                    if (details != null) {
                        if (details.getMetadata().hasOwnProperty("Id") && details.getMetadata().Id && details.getMetadata().hasOwnProperty("Type") && details.getMetadata().Type) {
                            var request = {
                                operation: salesforceBridgeAPIMethodNames.SCREEN_POP,
                                message: "screenPop",
                                objectId: details.getMetadata().Id,
                                objectType: details.getMetadata().Type,
                                interactionDirection: 'Inbound',
                            }
                            window.parent.postMessage(JSON.stringify(request), "*");
                        }
                        else if (details.getPhone() || details.getOtherPhone() || details.getHomePhone() || details.getMobile()) {
                            var request = {
                                operation: salesforceBridgeAPIMethodNames.SEARCH_AND_SCREEN_POP,
                                screenpop: screenpopControlOn,
                                queryString: (details.getPhone() || details.getOtherPhone() || details.getHomePhone() || details.getMobile()).Value,
                                interactionDirection: 'Inbound',
                            };
                            window.parent.postMessage(JSON.stringify(request), "*");
                        }
                        else if (details.getMetadata().hasOwnProperty("Type") && details.getMetadata().Type) {
                            var cadValue = "";
                            var filterKey = "";

                            if (details.getAccountName()) {
                                var field = details.getAccountName();
                                cadValue = field.Value;
                                filterKey = field.DevName;
                            } else if (details.getEmail()) {
                                var field = details.getEmail();
                                cadValue = field.Value;
                                filterKey = field.DevName;
                            } else if (details.getLastName()) {
                                var field = details.getLastName();
                                cadValue = field.Value;
                                filterKey = field.DevName;
                            } else {
                                for (var key in details.fields) {
                                    var field = details.fields[key];
                                    cadValue = field.Value;
                                    filterKey = field.DevName;
                                    break;
                                }
                            }


                            if (cadValue && filterKey) {
                                var request = {
                                    operation: salesforceBridgeAPIMethodNames.CAD_SEARCH_AND_SCREEN_POP,
                                    interactionDirection: 'Inbound',
                                    cadValue: cadValue,
                                    objectType: details.getMetadata().Type,
                                    filterKey: filterKey,
                                };
                                window.parent.postMessage(JSON.stringify(request), "*");
                            }
                        }
                    }
                }
            } else if (interaction.state === ContactCanvasApplicationAPI.InteractionStates.Disconnected) {
                delete scenarioInteractionMappings[scenarioIdInt][interactionId]
                if (Object.keys(scenarioInteractionMappings[scenarioIdInt]).length == 0) {
                    delete scenarioInteractionMappings[scenarioIdInt];
                }
            }
        }
        catch (e) {
            return Promise.reject('Error=' + e.toString());
        }
        return Promise.resolve();
    }    

    function enableClickToDial(enabled) {
        return new Promise((resolve, reject) => {
            var requestId = getSequenceID();
            var request = { requestId: requestId };
            if(enabled) request['operation'] = salesforceBridgeAPIMethodNames.ENB_CLICK_TO_DIAL;
            else request['operation'] = salesforceBridgeAPIMethodNames.DSB_CLICK_TO_DIAL;

            var timeout = setTimeout(() => {
                delete requests[requestId];
                reject('Timeout: Never received a response from salesforce!')
            }, 30 * 1000);
            requests[requestId] = (response) => {
                clearTimeout(timeout);
                delete requests[requestId];
                if(response.data.success){
                    resolve();
                }
                else{
                    reject('Error returned from salesforce! error=' + JSON.stringify(response.errors));
                }
            };

            window.parent.postMessage(JSON.stringify(request), "*");
        });
    }

    function getUserInfo() {
        try{
            var request = {
                operation: salesforceBridgeAPIMethodNames.USER_INFO
            };
            window.parent.postMessage(JSON.stringify(request),"*");
        } catch (err) {
            console.log("Error in getUserInfo. Exception Details : " + err.message);
        }
    }

    function setSoftPhoneHeight(height) {
        return new Promise((resolve, reject) => {
            var requestId = getSequenceID();
            var request = {
                operation: salesforceBridgeAPIMethodNames.SET_SP_HT,
                height: height,
                requestId: requestId
            };

            var timeout = setTimeout(() => {
                delete requests[requestId];
                reject('Timeout: Never received a response from salesforce!')
            }, 30 * 1000);
            requests[requestId] = (response) => {
                clearTimeout(timeout);
                delete requests[requestId];
                if(response.success){
                    resolve();
                }
                else{
                    reject('Error returned from salesforce! error=' + JSON.stringify(response.errors));
                }
            };

            window.parent.postMessage(JSON.stringify(request), "*");
        });
    }

    function setSoftPhoneWidth(width) {
        return new Promise((resolve, reject) => {
            var requestId = getSequenceID();
            var request = {
                operation: salesforceBridgeAPIMethodNames.SET_SP_WTH,
                width: width,
                requestId: requestId
            };

            var timeout = setTimeout(() => {
                delete requests[requestId];
                reject('Timeout: Never received a response from salesforce!')
            }, 30 * 1000);
            requests[requestId] = (response) => {
                clearTimeout(timeout);
                delete requests[requestId];
                if(response.success){
                    resolve();
                }
                else{
                    reject('Error returned from salesforce! error=' + JSON.stringify(response.errors));
                }
            };

            window.parent.postMessage(JSON.stringify(request), "*");
        });
    }

    function getSoftPhoneLayout() {
        return new Promise((resolve, reject) => {
            if (searchLayout) {
                resolve(searchLayout);
            } else {
                var requestId = getSequenceID();
                var request = {
                    operation: salesforceBridgeAPIMethodNames.GET_SP_LAYOUT,
                    requestId: requestId
                };

                var timeout = setTimeout(() => {
                    delete requests[requestId];
                    reject('Timeout: Never received a response from salesforce!')
                }, 30 * 1000);
                requests[requestId] = (response) => {
                    clearTimeout(timeout);
                    delete requests[requestId];
                    var data = response.data;
                    if (data.returnValue) {
                        searchLayout = createLayouts(data.returnValue);
                        resolve(searchLayout);
                    } else if (!data.errors) {
                        reject('Error returned from salesforce! error=' + JSON.stringify(response.errors));
                    } else {
                        resolve();
                    }
                };

                window.parent.postMessage(JSON.stringify(request), "*");
            }
        });
    }

    function getApplicationSettings() {
        return new Promise((resolve, reject) => {
            if (searchLayout) {
                resolve(searchLayout);
            } else {
                var requestId = getSequenceID();
                var request = {
                    operation: salesforceBridgeAPIMethodNames.GET_CALL_CENTER_SETTINGS,
                    requestId: requestId
                };

                var timeout = setTimeout(() => {
                    delete requests[requestId];
                    reject('Timeout: Never received a response from salesforce!')
                }, 30 * 1000);
                requests[requestId] = (response) => {
                    clearTimeout(timeout);
                    delete requests[requestId];
                    if (response.data.returnValue) {
                        var result = ContactCanvasApplicationAPI.ApplicationSettings(response.data.returnValue["/internalNameLabel"], response.data.returnValue["/displayNameLabel"], response.data.returnValue["/reqGeneralInfo/reqAdapterUrl"], response.data.returnValue["/reqGeneralInfo/reqStandbyUrl"], response.data.returnValue["/reqGeneralInfo/reqSoftphoneHeight"], response.data.returnValue["/reqGeneralInfo/reqSoftphoneWidth"], response.data.returnValue["/reqGeneralInfo/reqTimeout"]);
                        resolve(result);
                    } else {
                        reject('Salesforce did not return valid application settings!');
                    }
                };

                window.parent.postMessage(JSON.stringify(request), "*");
            }
        });
    }

    function getPageInfo() {
        return new Promise((resolve, reject) => {
            var requestId = getSequenceID();
            var request = {
                operation: salesforceBridgeAPIMethodNames.GET_PAGE_INFO,
                requestId: requestId
            };

            var timeout = setTimeout(() => {
                delete requests[requestId];
                reject('Timeout: Never received a response from salesforce!')
            }, 30 * 1000);
            requests[requestId] = (response) => {
                var records = new ContactCanvasApplicationAPI.SearchRecords();
                var data = response.data.records;
                Object.keys(data).forEach(function (k) {
                    var infoItem = new ContactCanvasApplicationAPI.RecordItem(data[k].Id, data[k].attributes.type, data[k].Name);
                    records.addSearchRecord(infoItem);
                });
                resolve(records);
            };

            window.parent.postMessage(JSON.stringify(request), "*");
        });
    }

    function clickToDial(msg) {
        try {
            var request = {
                operation: salesforceBridgeAPIMethodNames.CLICK_TO_DIAL_EVENT,

                msg: msg
            };
            window.parent.postMessage(JSON.stringify(request), "*");
        } catch (err) {
            console.log("Error in search. Exception Details : " + err.message);
        }
    }

    function onFocus(msg) {
        try {
            var request = {
                operation: salesforceBridgeAPIMethodNames.ON_FOCUS_EVENT,

                msg: msg
            };
            window.parent.postMessage(JSON.stringify(request), "*");
        } catch (err) {
            console.log("Error in search. Exception Details : " + err.message);
        }
    }

    function search(channel, direction, cad, query, maxRecords) {
        return new Promise((resolve, reject) => {
            var requestId = getSequenceID();
            var request = {
                operation: salesforceBridgeAPIMethodNames.SEARCH,
                cadString: cad,
                queryString: query,
                interactionDirection: direction,
                interactionType: channel,
                maxRecords: maxRecords,
                requestId: requestId,
            };
            if (direction == ContactCanvasApplicationAPI.InteractionDirectionTypes.Inbound) {
                request.interactionDirection = "Inbound";
            } else if (direction == ContactCanvasApplicationAPI.InteractionDirectionTypes.Outbound) {
                request.interactionDirection = "Outbound";
            } else if (direction == ContactCanvasApplicationAPI.InteractionDirectionTypes.Internal) {
                request.interactionDirection = "Internal";
            } else {
                request.interactionDirection = "Inbound";
            }

            var timeout = setTimeout(() => {
                delete requests[requestId];
                reject('Timeout: Never received a response from salesforce!')
            }, 30 * 1000);
            requests[requestId] = (response) => {
                clearTimeout(timeout);
                delete requests[requestId];
                if(response.success){
                    var data = JSON.parse(response.data.result);
                    var records = formatSearchResults(data);
                    resolve(records);      
                }
                else{
                    reject('Error returned from salesforce! error=' + JSON.stringify(response.errors));
                }
            }; 

            window.parent.postMessage(JSON.stringify(request), "*");
        });
    }

    function cadSearch(channel, direction, cadValue, objectFields, objectType, maxRecords) {
        return new Promise((resolve, reject) => {
            var requestId = getSequenceID();
            var request = {
                operation: salesforceBridgeAPIMethodNames.CAD_SEARCH,
                interactionDirection: direction,
                cadValue: cadValue,
                objectFields: objectFields,
                maxRecords: maxRecords,
                requestId: requestId
            };
            if (direction == ContactCanvasApplicationAPI.InteractionDirectionTypes.Inbound) {
                request.interactionDirection = "Inbound";
            } else if (direction == ContactCanvasApplicationAPI.InteractionDirectionTypes.Outbound) {
                request.interactionDirection = "Outbound";
            } else if (direction == ContactCanvasApplicationAPI.InteractionDirectionTypes.Internal) {
                request.interactionDirection = "Internal";
            } else {
                request.interactionDirection = "Inbound";
            }

            var timeout = setTimeout(() => {
                delete requests[requestId];
                reject('Timeout: Never received a response from salesforce!')
            }, 30 * 1000);
            requests[requestId] = (response) => {
                clearTimeout(timeout);
                delete requests[requestId];
                if(response.success){
                    var data = JSON.parse(response.data.result);
                    var records = formatSearchResults(data);
                    resolve(records);      
                }
                else{
                    reject('Error returned from salesforce! error=' + JSON.stringify(response.errors));
                }
            }; 

            window.parent.postMessage(JSON.stringify(request), "*");
        });
    }

    function searchAndScreenpop(channel, direction, cad, query, maxRecords) {
        return new Promise((resolve, reject) => {
            var request = {
                operation: salesforceBridgeAPIMethodNames.SEARCH_AND_SCREEN_POP,
                cadString: cad,
                queryString: query,
                interactionDirection: direction,
                interactionType: channel,
                maxRecords: maxRecords,
                requestId: requestId,
            };
            if (direction == ContactCanvasApplicationAPI.InteractionDirectionTypes.Inbound) {
                request.interactionDirection = "Inbound";
            } else if (direction == ContactCanvasApplicationAPI.InteractionDirectionTypes.Outbound) {
                request.interactionDirection = "Outbound";
            } else if (direction == ContactCanvasApplicationAPI.InteractionDirectionTypes.Internal) {
                request.interactionDirection = "Internal";
            } else {
                request.interactionDirection = "Inbound";
            }

            var timeout = setTimeout(() => {
                delete requests[requestId];
                reject('Timeout: Never received a response from salesforce!')
            }, 30 * 1000);
            requests[requestId] = (response) => {
                clearTimeout(timeout);
                delete requests[requestId];
                if(response.success){
                    var data = JSON.parse(response.data.result);
                    var records = formatSearchResults(data);
                    resolve(records);      
                }
                else{
                    reject('Error returned from salesforce! error=' + JSON.stringify(response.errors));
                }
            }; 

            window.parent.postMessage(JSON.stringify(request), "*");
        });
    }


    function screenPop(channel, direction, objectId, objectType) {
        return new Promise((resolve, reject ) => {
            console.log("Start : screenPop");
            if (screenpopControlOn) {
                var requestId = getSequenceID();
                var request = {
                    operation: salesforceBridgeAPIMethodNames.SCREEN_POP,
                    message: "screenPop",
                    objectId: objectId,
                    objectType: objectType,
                    interactionDirection: direction,
                    requestId: requestId,
                };
                if (direction == ContactCanvasApplicationAPI.InteractionDirectionTypes.Inbound) {
                    request.interactionDirection = "Inbound";
                } else if (direction == ContactCanvasApplicationAPI.InteractionDirectionTypes.Outbound) {
                    request.interactionDirection = "Outbound";
                } else if (direction == ContactCanvasApplicationAPI.InteractionDirectionTypes.Internal) {
                    request.interactionDirection = "Internal";
                } else {
                    request.interactionDirection = "Inbound";
                }
                
                var timeout = setTimeout(() => {
                    delete requests[requestId];
                    reject('Timeout: Never received a response from salesforce!')
                }, 30 * 1000);
                requests[requestId] = (response) => {
                    clearTimeout(timeout);
                    delete requests[requestId];
                    if(response.success){
                        resolve();                        
                    }
                    else{
                        reject('Error returned from salesforce! error=' + JSON.stringify(response.errors));
                    }
                };       
                window.parent.postMessage(JSON.stringify(request), "*");
            } else {
                resolve();
            }
            console.log("End : screenPop");
        });
    }

    function saveActivity(activity) {
        return new Promise((resolve, reject) => {
            var params = {};
            var objectType = "";
            if (activity.type == ContactCanvasApplicationAPI.ActivityType.Appointment) {
                objectType = "Event";
                params.Type = "Meeting";

                if (activity.start) {
                    params.Start = activity.start;
                }
                if (activity.end) {
                    params.End = activity.end;
                }
                if (activity.location) {
                    params.Location = activity.location;
                }
                if (activity.private) {
                    params.Private = private;
                }
            } else {
                objectType = "Task";
                if (activity.type == ContactCanvasApplicationAPI.ActivityType.PhoneCall) {
                    params.Type = "Call";
                } else if (activity.type == ContactCanvasApplicationAPI.ActivityType.Email) {
                    params.Type = "Email";
                } else if (activity.type == ContactCanvasApplicationAPI.ActivityType.Task) {
                    params.Type = "Other";
                } else { //default
                    params.Type = "Other";
                }

                if (activity.callDurationInMinutes && !isNaN(activity.callDurationInMinutes)) {
                    params.CallDurationInSeconds = 60 * activity.callDurationInMinutes;
                }
                if (activity.callResult) {
                    params.CallDisposition = activity.callResult;
                }
                if (activity.interactionDirection) {
                    if (activity.interactionDirection === ContactCanvasApplicationAPI.InteractionDirectionTypes.Inbound) {
                        params.CallType = "Inbound";
                    } else if (activity.interactionDirection === ContactCanvasApplicationAPI.InteractionDirectionTypes.Outbound) {
                        params.CallType = "Outbound";
                    } else if (activity.interactionDirection === ContactCanvasApplicationAPI.InteractionDirectionTypes.Internal) {
                        params.CallType = "Internal";
                    }
                }
                if (activity.dueDate) {
                    params.ActivityDate = activity.dueDate;
                }
                if (activity.priority) {
                    if (activity.priority === ContactCanvasApplicationAPI.ActivityPriority.High) {
                        params.Priority = "High";
                    } else if (activity.priority === ContactCanvasApplicationAPI.ActivityPriority.Normal) {
                        params.Priority = "Normal";
                    } else if (activity.priority === ContactCanvasApplicationAPI.ActivityPriority.Low) {
                        params.Priority = "Low";
                    }
                }
                if (activity.status) {
                    if (activity.status === ContactCanvasApplicationAPI.ActivityStatus.Open) {
                        params.Status = "Not Started";
                    } else if (activity.status === ContactCanvasApplicationAPI.ActivityStatus.Close) {
                        params.Status = "Completed";
                    }
                }
            }

            if (activity.id) {
                params.Id = activity.id;
            }
            if (activity.description) {
                params.Description = activity.description;
            }
            if (activity.subject) {
                params.Subject = activity.subject;
            }
            if (activity.phoneNumber) {
                params.Phone = activity.phoneNumber;
            }
            if (activity.email) {
                params.Email = activity.email;
            }
            if (activity.relatedTo && activity.relatedTo.Id) {
                params.WhatId = activity.relatedTo.Id;
            }

            var requestId = getSequenceID();
            var request = {
                operation: salesforceBridgeAPIMethodNames.SAVE_ACTIVITY,
                objectType: objectType,
                params: params,
                requestId: requestId
            }

            var timeout = setTimeout(() => {
                delete requests[requestId];
                reject('Timeout: Never received a response from salesforce!')
            }, 30 * 1000);
            requests[requestId] = (response) => {
                clearTimeout(timeout);
                delete requests[requestId];
                if(response.data && response.data.entity && response.data.entity.Id){
                    resolve(response.data.entity.Id);                        
                }
                else if(response.errors){
                    reject('Error returned from salesforce! error=' + JSON.stringify(response.errors));
                }
                else {
                    reject('Invalid response from salesforce!');
                }
            };    

            window.parent.postMessage(JSON.stringify(request), "*");
        });
        
    }

    function isVisible() {
        return new Promise((resolve, reject) => {
            var requestId = getSequenceID();
            var request = {
                operation: salesforceBridgeAPIMethodNames.IS_VISIBLE,
                requestId: requestId,
            }
    
            var timeout = setTimeout(() => {
                delete requests[requestId];
                reject('Timeout: Never received a response from salesforce!')
            }, 30 * 1000);
            requests[requestId] = (response) => {
                clearTimeout(timeout);
                delete requests[requestId];
                if(response.data.success){
                    resolve(response.data.visible);                        
                }
                else{
                    reject('Error returned from salesforce! error=' + JSON.stringify(response.data.errors));
                }
            };  
    
            window.parent.postMessage(JSON.stringify(request), "*");
        });
    }

    function setVisible(msg) {
        var request = {
            operation: salesforceBridgeAPIMethodNames.SET_VISIBLE,
            visible: msg.request.data.visible,
            msg: msg,
        }
        window.parent.postMessage(JSON.stringify(request), "*");
    }

    function listener(event) {
        try {

            var options = event.data;

            var parseData = JSON.parse(options);

            if(parseData.requestId in requests){
                requests[parseData.requestId](parseData.response.response);
                return;
            }
            else if (parseData.operation === salesforceBridgeAPIMethodNames.CLICK_TO_DIAL_EVENT) {
                var records = new ContactCanvasApplicationAPI.SearchRecords();
                var data = parseData.response;
                if (data.records && data.records.length > 0) {
                    data = data.records;
                    var infoItem = new ContactCanvasApplicationAPI.RecordItem(data[0].Id, data[0].attributes.type, data[0].attributes.type);
                    for (var key in data[0]) {
                        infoItem.setField(key, key, key, data[0][key]);
                    }
                    records.addSearchRecord(infoItem);
                    ContactCanvasApplicationAPI.clickToDial(parseData.response.number, records);
                }
            }
            else if (parseData.operation === salesforceBridgeAPIMethodNames.ON_FOCUS_EVENT) {
                var records = new ContactCanvasApplicationAPI.SearchRecords();
                var data = parseData.response;

                if (data.length > 0) {
                    var infoItem = new ContactCanvasApplicationAPI.RecordItem(data[0].Id, data[0].attributes.type, data[0].attributes.type);
                    for (var key in data[0]) {
                        infoItem.setField(key, key, key, data[0][key]);
                    }
                    records.addSearchRecord(infoItem);
                    ContactCanvasApplicationAPI.onFocus(records);
                }
            }
        } catch (err) {
            console.log("Error in listener. Exception details: " + err.message);
        }
    }
   
    function formatSearchResults(data) {
        var records = new ContactCanvasApplicationAPI.SearchRecords();
        Object.keys(data).forEach(function (k) {
            var record = new ContactCanvasApplicationAPI.RecordItem(k, data[k].object, data[k].displayName);
            for (var fieldName in data[k]) {
                if (data[k].object === "Account" && fieldName === "Name") {
                    record.setAccountName(fieldName, formatDisplayName(fieldName), data[k][fieldName]);
                } else if (fieldName === "Name") {
                    record.setFullName(fieldName, formatDisplayName(fieldName), data[k][fieldName]);
                } else if (fieldName === "PersonEmail" || fieldName === "Email") {
                    record.setEmail(fieldName, "Email", data[k][fieldName]);
                } else if (fieldName === "Fax") {
                    record.setFax(fieldName, formatDisplayName(fieldName), data[k][fieldName]);
                } else if (fieldName === "FirstName") {
                    record.setFirstName(fieldName, formatDisplayName(fieldName), data[k][fieldName]);
                } else if (fieldName === "LastName") {
                    record.setLastName(fieldName, formatDisplayName(fieldName), data[k][fieldName]);
                } else if (fieldName === "PersonHomePhone" || fieldName === "HomePhone") {
                    record.setHomePhone(fieldName, "Home Phone", data[k][fieldName]);
                } else if (fieldName === "MobilePhone") {
                    record.setMobile(fieldName, formatDisplayName(fieldName), data[k][fieldName]);
                } else if (fieldName === "OtherPhone") {
                    record.setOtherPhone(fieldName, formatDisplayName(fieldName), data[k][fieldName]);
                } else if (fieldName === "Phone") {
                    record.setPhone(fieldName, formatDisplayName(fieldName), data[k][fieldName]);
                } else {
                    record.setField(fieldName, fieldName, formatDisplayName(fieldName), data[k][fieldName]);
                }
            }
            records.addSearchRecord(record);
        });
        return records;
    }
    function formatDisplayName(name) {
        return name.replace(/([A-Z]+)/g, ' $1').trim();
    }

    function createLayouts(data) {
        var layouts = new ContactCanvasApplicationAPI.SearchLayouts();
        var inboundEntities = [];
        for (var key in data.Inbound.objects) {
            var fields = [];
            for (var i in data.Inbound.objects[key]) {
                fields.push({
                    DisplayName: data.Inbound.objects[key][i].displayName,
                    DevName: data.Inbound.objects[key][i].apiName
                });
            }

            inboundEntities.push(new ContactCanvasApplicationAPI.SearchLayoutForEntity(key, key, fields));
        }
        var aLayout = new ContactCanvasApplicationAPI.SearchLayout(false, inboundEntities);
        if (data.Inbound.screenPopSettings.NoMatch == 'undefined') {
            data.Inbound.screenPopSettings.NoMatch = {};
            data.Inbound.screenPopSettings.NoMatch.screenPopType = "DoNotPop";
        }
        if (data.Inbound.screenPopSettings.MultipleMatches == 'undefined') {
            data.Inbound.screenPopSettings.MultipleMatches = {};
            data.Inbound.screenPopSettings.MultipleMatches.screenPopType = "DoNotPop";
        }
        if (data.Inbound.screenPopSettings.SingleMatch == 'undefined') {
            data.Inbound.screenPopSettings.SingleMatch = {};
            data.Inbound.screenPopSettings.SingleMatch.screenPopType = "DoNotPop";
        }
        //No Match
        if (data.Inbound.screenPopSettings.NoMatch.screenPopType == "PopToEntity") {
            aLayout.setNoMatch(ContactCanvasApplicationAPI.NoMatchPopTypes.PopToNewEntity, data.Inbound.screenPopSettings.NoMatch.screenPopData);
        } else if (data.Inbound.screenPopSettings.NoMatch.screenPopType == "PopToVisaulForcePage") {

        } else {
            aLayout.setNoMatch(ContactCanvasApplicationAPI.NoMatchPopTypes.NoPop);
        }

        //SingleMatch
        if (data.Inbound.screenPopSettings.SingleMatch.screenPopType == "PopToEntity") {
            aLayout.setSingleMatch(ContactCanvasApplicationAPI.SingleMatchPopTypes.PopToDetails, data.Inbound.screenPopSettings.SingleMatch.screenPopData);
        } else if (data.Inbound.screenPopSettings.SingleMatch.screenPopType == "PopToVisaulForcePage") {

        } else {
            aLayout.setSingleMatch(ContactCanvasApplicationAPI.SingleMatchPopTypes.NoPop);
        }

        //MultiMatch
        if (data.Inbound.screenPopSettings.MultipleMatches.screenPopType == "PopToSearch") {
            aLayout.setMultiMatch(ContactCanvasApplicationAPI.MultiMatchPopTypes.PopToSearch);
        } else if (data.Inbound.screenPopSettings.MultipleMatches.screenPopType == "PopToVisaulForcePage") {

        } else {
            aLayout.setMultiMatch(ContactCanvasApplicationAPI.MultiMatchPopTypes.NoPop);
        }

        //Open New Window
        if (data.Inbound.screenPopSettings.screenPopsOpenWithin == "ExistingWindow") {
            aLayout.setOpenInNewWindow(false);
        } else {
            aLayout.setOpenInNewWindow(true);
        }

        layouts.setLayout([ContactCanvasApplicationAPI.ChannelTypes.Telephony], aLayout);
        return layouts;
    }
}(window.AMCSalesforcePlugin = window.AMCSalesforcePlugin || {}));