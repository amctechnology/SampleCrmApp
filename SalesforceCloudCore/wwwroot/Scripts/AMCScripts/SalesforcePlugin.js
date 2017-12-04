(function (AMCSalesforcePlugin) {
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

    var interactions = {};

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

    $(document).ready(function () {
        if (window.addEventListener) {
            window.addEventListener("message", listener, false);
        } else {
            window.attachEvent("onmessage", listener);
        }
        ContactCanvas.Application.loadScript(ContactCanvas.Commons.getSequenceID(), {
            urls: [
                "https://c.na1.visual.force.com/support/api/36.0/interaction.js",
                "https://na15.salesforce.com/support/console/35.0/integration.js",
                "https://gs0.lightning.force.com/support/api/38.0/lightning/opencti_min.js",
                location.origin + "/Scripts/AMCScripts/SalesforceBridgeAPI.js",
            ]
        }, LoadScriptComplete);
        var data = {};
        data.pluginIconPath = window.location.origin + window.location.pathname + "/Images/salesforce.png";
        ContactCanvas.Application.registerScreenPop(ContactCanvas.Commons.getSequenceID(), screenPop);
        ContactCanvas.Application.registerGlobalSearch(ContactCanvas.Commons.getSequenceID(), search);
        ContactCanvas.Application.registerGlobalSearchAndScreenpop(ContactCanvas.Commons.getSequenceID(), searchAndScreenpop);
        ContactCanvas.Application.registerSearch(ContactCanvas.Commons.getSequenceID(), cadSearch);
        ContactCanvas.Application.registerEnableClickToDial(ContactCanvas.Commons.getSequenceID(), enableClickToDial);
        ContactCanvas.Application.registerDisableClickToDial(ContactCanvas.Commons.getSequenceID(), disableClickToDial);
        //ContactCanvas.Application.registerClickToDial(clickToDial);
        ContactCanvas.Application.registerSetSoftPhoneHeight(ContactCanvas.Commons.getSequenceID(), setSoftPhoneHeight);
        ContactCanvas.Application.registerSetSoftPhoneWidth(ContactCanvas.Commons.getSequenceID(), setSoftPhoneWidth);
        ContactCanvas.Application.registerGetSearchLayout(ContactCanvas.Commons.getSequenceID(), getSoftPhoneLayout);
        ContactCanvas.Application.registerGetApplicationSettings(ContactCanvas.Commons.getSequenceID(), getApplicationSettings);
        ContactCanvas.Application.registerGetPageInfo(ContactCanvas.Commons.getSequenceID(), getPageInfo);
        ContactCanvas.Application.registerSaveActivity(ContactCanvas.Commons.getSequenceID(), saveActivity);
        ContactCanvas.Application.registerIsToolbarVisible(ContactCanvas.Commons.getSequenceID(), isVisible);
        ContactCanvas.Application.registerSetToolbarVisible(ContactCanvas.Commons.getSequenceID(), setVisible);
        ContactCanvas.Application.addPluginImage(ContactCanvas.Commons.getSequenceID(), data, null);

        ContactCanvas.Application.registerScreenpopControlChanged(ContactCanvas.Commons.getSequenceID(), function (msg) {
            if (typeof msg.request.data.screenpopControlOn == 'boolean') {
                screenpopControlOn = msg.request.data.screenpopControlOn;
            }
        });
        ContactCanvas.Application.isScreenpopControlOn(ContactCanvas.Commons.getSequenceID(), function (msg) {
            if (typeof msg.response.data.screenpopControlOn == 'boolean') {
                screenpopControlOn = msg.response.data.screenpopControlOn;
            }
        });
        ContactCanvas.Application.registerOnInteraction(ContactCanvas.Commons.getSequenceID(), onInteraction);

        ContactCanvas.Application.initializationComplete(ContactCanvas.Commons.getSequenceID(), {}, null);
    });

    function LoadScriptComplete(msg)
    {
        getUserInfo();
    }

    function onInteraction(msg) {
        try {
            var pluginId = msg.request.metadata.pluginId;
            if (!interactions.hasOwnProperty(pluginId)) {
                interactions[pluginId] = {};
            }

            var interactionId = msg.request.data.interactionId;
            if ((msg.request.data.state === ContactCanvas.Commons.interactionStates.Alerting || msg.request.data.state === ContactCanvas.Commons.interactionStates.Connected) &&
                !interactions[pluginId].hasOwnProperty(interactionId)) {

                interactions[pluginId][interactionId] = true;
                if (screenpopControlOn && msg.request.data.hasOwnProperty("details")) {
                    var details = ContactCanvas.Commons.RecordItem.fromJSON(msg.request.data.details);
                    if (details != null) {
                        if (details.getMetadata().hasOwnProperty("Id") && details.getMetadata().Id && details.getMetadata().hasOwnProperty("Type") && details.getMetadata().Type) {
                            var request = {
                                operation: salesforceBridgeAPIMethodNames.SCREEN_POP,
                                message: "screenPop",
                                objectId: details.getMetadata().Id,
                                objectType: details.getMetadata().Type,
                                //interactionDirection: msg.request.data.interactionDirection || 'Inbound',
                                interactionDirection: 'Inbound',
                            }
                            window.parent.postMessage(JSON.stringify(request), "*");
                        }
                        else if (details.getPhone() || details.getOtherPhone() || details.getHomePhone() || details.getMobile()) {
                            var request = {
                                operation: salesforceBridgeAPIMethodNames.SEARCH_AND_SCREEN_POP,
                                screenpop: screenpopControlOn,
                                queryString: JSON.parse(details.getPhone() || details.getOtherPhone() || details.getHomePhone() || details.getMobile()).value,
                                //interactionDirection: msg.request.data.interactionDirection || 'Inbound',
                                interactionDirection: 'Inbound',
                            };
                            window.parent.postMessage(JSON.stringify(request), "*");
                        }
                        else if (details.getMetadata().hasOwnProperty("Type") && details.getMetadata().Type) {
                            var cadValue = "";
                            var filterKey = "";

                            if (details.getAccountName()) {
                                var field = JSON.parse(details.getAccountName());
                                cadValue = field.value;
                                filterKey = field.fieldName;
                            } else if (details.getEmail()) {
                                var field = JSON.parse(details.getEmail());
                                cadValue = field.value;
                                filterKey = field.fieldName;
                            } else if (details.getLastName()) {
                                var field = JSON.parse(details.getLastName());
                                cadValue = field.value;
                                filterKey = field.fieldName;
                            } else {
                                for (var key in details.entity) {
                                    var field = JSON.parse(details.entity[key]);
                                    cadValue = field.value;
                                    filterKey = field.fieldName;
                                    break;
                                }
                            }

                            if (cadValue && filterKey) {
                                var data = msg.request.data;
                                var request = {
                                    operation: salesforceBridgeAPIMethodNames.CAD_SEARCH_AND_SCREEN_POP,
                                    //interactionDirection: msg.request.data.interactionDirection || 'Inbound',
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
            } else if (msg.request.data.state === ContactCanvas.Commons.interactionStates.Disconnected) {
                delete interactions[pluginId][interactionId];
            }
            msg.response = {
                data: {
                    success: true,
                }
            };
            ContactCanvas.Application.onInteractionResponse(ContactCanvas.Commons.getSequenceID(), msg);
        }
        catch (e) {
            msg.response = {
                data: {
                    success: false,
                    errors: ["Error executing request!"],
                }
            };
            ContactCanvas.Application.onInteractionResponse(ContactCanvas.Commons.getSequenceID(), msg);
        }
    }    

    function enableClickToDial(msg) {
        try {
            var request = {
                operation: salesforceBridgeAPIMethodNames.ENB_CLICK_TO_DIAL,
                msg: msg
            };
            window.parent.postMessage(JSON.stringify(request), "*");
        } catch (err) {
            console.log("Error in search. Exception Details : " + err.message);
        }
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

    function disableClickToDial(msg) {
        try {
            var request = {
                operation: salesforceBridgeAPIMethodNames.DSB_CLICK_TO_DIAL,
                msg: msg
            };
            window.parent.postMessage(JSON.stringify(request), "*");
        } catch (err) {
            console.log("Error in search. Exception Details : " + err.message);
        }
    }

    function setSoftPhoneHeight(msg) {
        try {
            var request = {
                operation: salesforceBridgeAPIMethodNames.SET_SP_HT,
                height: msg.request.data.height,
                msg: msg
            };
            window.parent.postMessage(JSON.stringify(request), "*");
        } catch (err) {
            console.log("Error in search. Exception Details : " + err.message);
        }
    }

    function setSoftPhoneWidth(msg) {
        try {
            var request = {
                operation: salesforceBridgeAPIMethodNames.SET_SP_WTH,
                width: msg.request.data.width,
                msg: msg
            };
            window.parent.postMessage(JSON.stringify(request), "*");
        } catch (err) {
            console.log("Error in search. Exception Details : " + err.message);
        }
    }

    function getSoftPhoneLayout(msg) {
        try {
            if (searchLayout) {
                msg.response = {
                    data: searchLayout.getAllLayouts()
                }
                ContactCanvas.Application.getSearchLayoutResponse(getResponseId(), msg);
            } else {
                var request = {
                    operation: salesforceBridgeAPIMethodNames.GET_SP_LAYOUT,
                    msg: msg
                };
                window.parent.postMessage(JSON.stringify(request), "*");
            }
        } catch (err) {
            console.log("Error in search. Exception Details : " + err.message);
        }
    }

    function getApplicationSettings(msg) {
        try {
            var request = {
                operation: salesforceBridgeAPIMethodNames.GET_CALL_CENTER_SETTINGS,
                msg: msg
            };
            window.parent.postMessage(JSON.stringify(request), "*");
        } catch (err) {
            console.log("Error in search. Exception Details : " + err.message);
        }
    }

    function getPageInfo(msg) {
        try {
            var request = {
                operation: salesforceBridgeAPIMethodNames.GET_PAGE_INFO,
                msg: msg
            };
            window.parent.postMessage(JSON.stringify(request), "*");
        } catch (err) {
            console.log("Error in search. Exception Details : " + err.message);
        }
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

    //function search(operation, objectId, objectType, cadString, queryString, interactionType, interactionDirection, cadValue, filterKey, objectFields, msg, maxRecords, searchFieldType) {
    function search(msg) {
        try {
            var data = msg.request.data;
            var request = {
                operation: salesforceBridgeAPIMethodNames.SEARCH,
                objectId: data.objectId,
                objectType: data.objectType,
                cadString: data.cadString,
                queryString: data.queryString,
                interactionDirection: data.interactionDirection,
                interactionType: data.interactionType,
                cadValue: data.cadValue,
                filterKey: data.filterKey,
                objectFields: data.objectFields,
                maxRecords: data.maxRecords,
                msg: msg,
            };
            if (data.interactionDirection == ContactCanvas.Commons.InteractionDirectionTypes.Inbound) {
                request.interactionDirection = "Inbound";
            } else if (data.interactionDirection == ContactCanvas.Commons.InteractionDirectionTypes.Outbound) {
                request.interactionDirection = "Outbound";
            } else if (data.interactionDirection == ContactCanvas.Commons.InteractionDirectionTypes.Internal) {
                request.interactionDirection = "Internal";
            } else {
                request.interactionDirection = "Inbound";
            }
            window.parent.postMessage(JSON.stringify(request), "*");
        } catch (err) {
            console.log("Error in search. Exception Details : " + err.message);
        }
    }

    function cadSearch(msg) {
        try {
            var data = msg.request.data;
            var request = {
                operation: salesforceBridgeAPIMethodNames.CAD_SEARCH,
                objectId: data.objectId,
                objectType: data.objectType,
                cadString: data.cadString,
                queryString: data.queryString,
                interactionDirection: data.interactionDirection,
                cadValue: data.cadValue,
                filterKey: data.filterKey,
                objectFields: data.objectFields,
                maxRecords: data.maxRecords,
                msg: msg,
            };
            if (data.interactionDirection == ContactCanvas.Commons.InteractionDirectionTypes.Inbound) {
                request.interactionDirection = "Inbound";
            } else if (data.interactionDirection == ContactCanvas.Commons.InteractionDirectionTypes.Outbound) {
                request.interactionDirection = "Outbound";
            } else if (data.interactionDirection == ContactCanvas.Commons.InteractionDirectionTypes.Internal) {
                request.interactionDirection = "Internal";
            } else {
                request.interactionDirection = "Inbound";
            }
            window.parent.postMessage(JSON.stringify(request), "*");
        } catch (err) {
            console.log("Error in cadSearch. Exception Details : " + err.message);
        }
    }

    //function searchAndScreenpop(operation, objectId, objectType, cadString, queryString, interactionType, interactionDirection, cadValue, filterKey, objectFields, msg, maxRecords, searchFieldType) {
    function searchAndScreenpop(msg) {
        try {
            var data = msg.request.data;
            var request = {
                operation: salesforceBridgeAPIMethodNames.SEARCH_AND_SCREEN_POP,
                screenpop: screenpopControlOn,
                objectId: data.objectId,
                objectType: data.objectType,
                cadString: data.cadString,
                queryString: data.queryString,
                interactionDirection: data.interactionDirection,
                interactionType: data.interactionType,
                cadValue: data.cadValue,
                filterKey: data.filterKey,
                objectFields: data.objectFields,
                maxRecords: data.maxRecords,
                msg: msg,
            };
            if (data.interactionDirection == ContactCanvas.Commons.InteractionDirectionTypes.Inbound) {
                request.interactionDirection = "Inbound";
            } else if (data.interactionDirection == ContactCanvas.Commons.InteractionDirectionTypes.Outbound) {
                request.interactionDirection = "Outbound";
            } else if (data.interactionDirection == ContactCanvas.Commons.InteractionDirectionTypes.Internal) {
                request.interactionDirection = "Internal";
            } else {
                request.interactionDirection = "Inbound";
            }
            window.parent.postMessage(JSON.stringify(request), "*");

        } catch (err) {
            console.log("Error in searchAndScreenpop. Exception Details : " + err.message);
        }
    }


    //  function screenPop(popType, objectId, objectType, cadString, filterKey, cadValue, queryString, interactionType, interactionDirection, callMode, msg, maxRecords, searchFieldType) {
    function screenPop(msg) {

        try {
            console.log("Start : screenPop");
            var data = msg.request.data;

            if (screenpopControlOn) {
                var request = {
                    operation: salesforceBridgeAPIMethodNames.SCREEN_POP,
                    type: data.popType,
                    message: "screenPop",
                    objectId: data.objectId,
                    objectType: data.objectType,
                    cadString: data.cadString,
                    filterKey: data.filterKey,
                    cadValue: data.cadValue,
                    queryString: data.queryString,
                    interactionDirection: data.interactionDirection,
                    callMode: data.callMode,
                    msg: msg,
                }
                if (data.interactionDirection == ContactCanvas.Commons.InteractionDirectionTypes.Inbound) {
                    request.interactionDirection = "Inbound";
                } else if (data.interactionDirection == ContactCanvas.Commons.InteractionDirectionTypes.Outbound) {
                    request.interactionDirection = "Outbound";
                } else if (data.interactionDirection == ContactCanvas.Commons.InteractionDirectionTypes.Internal) {
                    request.interactionDirection = "Internal";
                } else {
                    request.interactionDirection = "Inbound";
                }
                window.parent.postMessage(JSON.stringify(request), "*");
            } else {
                msg.response = { success: true };
                ContactCanvas.Application.screenPopResponse(getResponseId(), msg);
            }
            console.log("End : screenPop");
        } catch (err) {
            console.log("Error in screenPop. Exception details: " + err.message);
        }
    }

    function saveActivity(msg) {
        var params = {};
        var objectType = "";
        // var activity = msg.request.data.activity;
        var activity = new ContactCanvas.Commons.ActivityLayout.fromJSON(msg.request.data.activity);
        if (activity.getType() == ContactCanvas.Commons.ActivityTypes.Appointment) {
            objectType = "Event";
            params.Type = "Meeting";

            if (activity.getStart()) {
                params.Start = activity.getStart();
            }
            if (activity.getEnd()) {
                params.End = activity.getEnd();
            }
            if (activity.getLocation()) {
                params.Location = activity.getLocation();
            }
            if (activity.getPrivate()) {
                params.Location = activity.getPrivate();
            }
        } else {
            objectType = "Task";
            if (activity.getType() == ContactCanvas.Commons.ActivityTypes.PhoneCall) {
                params.Type = "Call";
            } else if (activity.getType() == ContactCanvas.Commons.ActivityTypes.Email) {
                params.Type = "Email";
            } else if (activity.getType() == ContactCanvas.Commons.ActivityTypes.Task) {
                params.Type = "Other";
            } else { //default
                params.Type = "Other";
            }

            if (activity.getCallDurationInMinutes() && !isNaN(activity.getCallDurationInMinutes())) {
                params.CallDurationInSeconds = 60 * activity.getCallDurationInMinutes();
            }
            if (activity.getCallResult()) {
                params.CallDisposition = activity.getCallResult();
            }
            if (activity.getInteractionDirection()) {
                if (activity.getInteractionDirection() === ContactCanvas.Commons.InteractionDirectionTypes.Inbound) {
                    params.CallType = "Inbound";
                } else if (activity.getInteractionDirection() === ContactCanvas.Commons.InteractionDirectionTypes.Outbound) {
                    params.CallType = "Outbound";
                } else if (activity.getInteractionDirection() === ContactCanvas.Commons.InteractionDirectionTypes.Internal) {
                    params.CallType = "Internal";
                }
            }
            if (activity.getDueDate()) {
                params.ActivityDate = activity.getDueDate();
            }
            if (activity.getPriority()) {
                if (activity.getPriority() === ContactCanvas.Commons.ActivityPriority.High) {
                    params.Priority = "High";
                } else if (activity.getPriority() === ContactCanvas.Commons.ActivityPriority.Normal) {
                    params.Priority = "Normal";
                } else if (activity.getPriority() === ContactCanvas.Commons.ActivityPriority.Low) {
                    params.Priority = "Low";
                }
            }
            if (activity.getStatus()) {
                if (activity.getStatus() === ContactCanvas.Commons.ActivityStatus.Open) {
                    params.Status = "Not Started";
                } else if (activity.getStatus() === ContactCanvas.Commons.ActivityStatus.Close) {
                    params.Status = "Completed";
                }
            }
        }

        if (activity.getId()) {
            params.Id = activity.getId();
        }
        if (activity.getDescription()) {
            params.Description = activity.getDescription();
        }
        if (activity.getSubject()) {
            params.Subject = activity.getSubject();
        }
        if (activity.getPhoneNumber()) {
            params.Phone = activity.getPhoneNumber();
        }
        if (activity.getEmail()) {
            params.Email = activity.getEmail();
        }
        if (activity.getRelatedTo() && activity.getRelatedTo().Id) {
            params.WhatId = activity.getRelatedTo().Id;
        }

        var request = {
            operation: salesforceBridgeAPIMethodNames.SAVE_ACTIVITY,
            objectType: objectType,
            params: params,
            msg: msg,
        }
        window.parent.postMessage(JSON.stringify(request), "*");
    }

    function isVisible(msg) {
        var request = {
            operation: salesforceBridgeAPIMethodNames.IS_VISIBLE,
            msg: msg,
        }
        window.parent.postMessage(JSON.stringify(request), "*");
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

            if (parseData != undefined) {
                if (parseData.operation === salesforceBridgeAPIMethodNames.SCREEN_POP) {
                    ContactCanvas.Application.screenPopResponse(getResponseId(), parseData.response);
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.SEARCH) {
                    var data = JSON.parse(parseData.response.response.data.result);
                    var records = formatSearchResults(data);
                    var msg = parseData.response;

                    var maxrecords = msg.request.data.maxRecords;
                    parseData.response.response = {
                        data: records.toJSON(maxrecords || maxRecordsDefault)
                    };
                    ContactCanvas.Application.globalSearchResponse(getResponseId(), parseData.response);
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.SEARCH_AND_SCREEN_POP) {
                    var data = JSON.parse(parseData.response.response.data.result);
                    var records = formatSearchResults(data);
                    var msg = parseData.response;
                    var maxrecords = msg.request.data.maxRecords;
                    parseData.response.response = {
                        data: records.toJSON(maxrecords || maxRecordsDefault)
                    };
                    ContactCanvas.Application.globalSearchAndScreenpopResponse(getResponseId(), parseData.response);
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.CAD_SEARCH) {
                    var records = new ContactCanvas.Commons.SearchRecords();
                    var data = JSON.parse(parseData.response.response.data.result);
                    for (i = 0; i < data.length; i++) {
                        var infoItem = new ContactCanvas.Commons.RecordItem(data[i].Id, data[i].attributes.type, data[i].displayName);
                        infoItem.setField("url", "url", "url", data[i].attributes.url);
                        infoItem.setEmail("Email", "Email", data[i].Email);
                        records.addSearchRecord(infoItem);
                    }
                    var msg = parseData.response;
                    var maxrecords = msg.request.data.maxRecords;
                    parseData.response.response = {
                        data: records.toJSON(maxrecords || maxRecordsDefault)
                    };
                    ContactCanvas.Application.searchResponse(getResponseId(), parseData.response);
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.ENB_CLICK_TO_DIAL) {
                    ContactCanvas.Application.enableClickToDialResponse(getResponseId(), parseData.response);
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.DSB_CLICK_TO_DIAL) {
                    ContactCanvas.Application.disableClickToDialResponse(getResponseId(), parseData.response);
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.SET_SP_HT) {
                    ContactCanvas.Application.setSoftphoneHeightResponse(getResponseId(), parseData.response);
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.SET_SP_WTH) {
                    ContactCanvas.Application.setSoftphoneWidthResponse(getResponseId(), parseData.response);
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.GET_SP_LAYOUT) {
                    var data = parseData.response.response.data;
                    if (data.returnValue) {
                        searchLayout = createLayouts(data.returnValue);
                        parseData.response.response.data = searchLayout.getAllLayouts();
                        ContactCanvas.Application.getSearchLayoutResponse(getResponseId(), parseData.response);
                    } else if (!data.errors) {
                        parseData.response.response.data.errors = ["Failed to get SearchLayout!"];
                        ContactCanvas.Application.getSearchLayoutResponse(getResponseId(), parseData.response);
                    } else {
                        ContactCanvas.Application.getSearchLayoutResponse(getResponseId(), parseData.response);
                    }
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.CLICK_TO_DIAL_EVENT) {
                    //var msg = {
                    //    response: { data: parseData.response },
                    //    request: {}
                    //};
                    var records = new ContactCanvas.Commons.SearchRecords();
                    var data = parseData.response;
                    if (data.records && data.records.length > 0) {
                        data = data.records;
                        var infoItem = new ContactCanvas.Commons.RecordItem(data[0].Id, data[0].attributes.type, data[0].attributes.type);
                        //infoItem.setFullName("objectName", "Full Name", data[0].Name);
                        //infoItem.setPhone("url", "url", data[0].attributes.url);
                        for (var key in data[0]) {
                            infoItem.setField(key, key, key, data[0][key]);
                        }
                        records.addSearchRecord(infoItem);
                        var tmp = {
                            number: parseData.response.number,
                            records: records.toJSON()
                        };
                        parseData.response.response = {};
                        parseData.response.response.data = tmp;
                        ContactCanvas.Application.ClickToDialEvent(getResponseId(), parseData.response);
                    }
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.ON_FOCUS_EVENT) {

                    var records = new ContactCanvas.Commons.SearchRecords();
                    var data = parseData.response;

                    if (data.length > 0) {
                        var infoItem = new ContactCanvas.Commons.RecordItem(data[0].Id, data[0].attributes.type, data[0].attributes.type);
                        //infoItem.setFullName("objectName", "Full Name", data[0].Name);
                        //infoItem.setPhone("url", "url", data[0].attributes.url);
                        for (var key in data[0]) {
                            infoItem.setField(key, key, key, data[0][key]);
                        }
                        records.addSearchRecord(infoItem);
                        parseData.response.response = {};
                        var tmp = {
                            records: records.toJSON()
                        };
                        parseData.response.response.data = tmp;
                        ContactCanvas.Application.OnFocusEvent(getResponseId(), parseData.response);
                    }
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.GET_CALL_CENTER_SETTINGS) {
                    var result = parseData.response;
                    if (result.response.data.returnValue) {
                        result.response.data = ContactCanvas.Application.ApplicationSettings(result.response.data.returnValue["/internalNameLabel"], result.response.data.returnValue["/displayNameLabel"], result.response.data.returnValue["/reqGeneralInfo/reqAdapterUrl"], result.response.data.returnValue["/reqGeneralInfo/reqStandbyUrl"], result.response.data.returnValue["/reqGeneralInfo/reqSoftphoneHeight"], result.response.data.returnValue["/reqGeneralInfo/reqSoftphoneWidth"], result.response.data.returnValue["/reqGeneralInfo/reqTimeout"]);
                    } else {
                        result.response.data = "";
                    }

                    ContactCanvas.Application.getApplicationSettingsResponse(getResponseId(), result);
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.GET_PAGE_INFO) {
                    var records = new ContactCanvas.Commons.SearchRecords();
                    var data = parseData.response.response.data.records;
                    Object.keys(data).forEach(function (k) {
                        var infoItem = new ContactCanvas.Commons.RecordItem(data[k].Id, data[k].attributes.type, data[k].Name);
                        //infoItem.setFullName("Name","Full Name",data[k].Name);
                        records.addSearchRecord(infoItem);
                    });
                    //parseData.response.response = {};
                    parseData.response.response.data = records.toJSON();
                    ContactCanvas.Application.getPageInfoResponse(getResponseId(), parseData.response);
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.SAVE_ACTIVITY) {
                    ContactCanvas.Application.saveActivityResponse(getResponseId(), parseData.response);
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.IS_VISIBLE) {
                    ContactCanvas.Application.isToolbarVisibleResponse(getResponseId(), parseData.response);
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.SET_VISIBLE) {
                    ContactCanvas.Application.setToolbarVisibleResponse(getResponseId(), parseData.response);
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.USER_INFO) {
                    parseData.msg = {};
                    parseData.msg.response = {
                        data: {
                            success: true,
                            userinfo: parseData.response.response.data.userinfo,
                        }
                    };
                    ContactCanvas.Application.sendUserInfo(ContactCanvas.Commons.getSequenceID(), parseData.msg);
                }
            }
        } catch (err) {
            console.log("Error in listener. Exception details: " + err.message);
        }
    }
   
    function formatSearchResults(data) {
        var records = new ContactCanvas.Commons.SearchRecords();
        Object.keys(data).forEach(function (k) {
            var record = new ContactCanvas.Commons.RecordItem(k, data[k].object, data[k].displayName);
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

            //record.setFullName("Name", "Name", data[k].Name);

            records.addSearchRecord(record);
        });
        return records;
    }
    function formatDisplayName(name) {
        return name.replace(/([A-Z]+)/g, ' $1').trim();
    }

    // var responseId = 0;
    // function getResponseId() { return "SalesforceResponse" + responseId++ }
    function getResponseId() {
        return ContactCanvas.Commons.getSequenceID()
    }

    function createLayouts(data) {
        var layouts = new ContactCanvas.Commons.SearchLayouts();
        var inboundEntities = [];
        for (var key in data.Inbound.objects) {
            var fields = [];
            for (var i in data.Inbound.objects[key]) {
                fields.push({
                    DisplayName: data.Inbound.objects[key][i].displayName,
                    DevName: data.Inbound.objects[key][i].apiName
                });
            }

            inboundEntities.push(new ContactCanvas.Commons.SearchLayoutEntity(key, key, fields, null, null, null));
        }
        var aLayout = new ContactCanvas.Commons.SearchLayoutItem(false, inboundEntities);
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
            aLayout.setNoMatch(ContactCanvas.Commons.NoMatchPopTypes.PopToNewEntity, data.Inbound.screenPopSettings.NoMatch.screenPopData);
        } else if (data.Inbound.screenPopSettings.NoMatch.screenPopType == "PopToVisaulForcePage") {

        } else {
            aLayout.setNoMatch(ContactCanvas.Commons.NoMatchPopTypes.NoPop);
        }

        //SingleMatch
        if (data.Inbound.screenPopSettings.SingleMatch.screenPopType == "PopToEntity") {
            aLayout.setSingleMatch(ContactCanvas.Commons.SingleMatchPopTypes.PopToDetails, data.Inbound.screenPopSettings.SingleMatch.screenPopData);
        } else if (data.Inbound.screenPopSettings.SingleMatch.screenPopType == "PopToVisaulForcePage") {

        } else {
            aLayout.setSingleMatch(ContactCanvas.Commons.SingleMatchPopTypes.NoPop);
        }

        //MultiMatch
        if (data.Inbound.screenPopSettings.MultipleMatches.screenPopType == "PopToSearch") {
            aLayout.setMultiMatch(ContactCanvas.Commons.MultiMatchPopTypes.PopToSearch);
        } else if (data.Inbound.screenPopSettings.MultipleMatches.screenPopType == "PopToVisaulForcePage") {

        } else {
            aLayout.setMultiMatch(ContactCanvas.Commons.MultiMatchPopTypes.NoPop);
        }

        //Open New Window
        if (data.Inbound.screenPopSettings.screenPopsOpenWithin == "ExistingWindow") {
            aLayout.setOpenInNewWindow(false);
        } else {
            aLayout.setOpenInNewWindow(true);
        }

        layouts.setLayout(ContactCanvas.Commons.ChannelTypes.Telephony, aLayout);
        return layouts;
    }
}(window.AMCSalesforcePlugin = window.AMCSalesforcePlugin || {}));