using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Reflection;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SalesforceCloudCore.Models;

namespace SalesforceCloudCore.Controllers {
    [AllowAnonymous]
    public class IncomingRoutingController : Controller {
        private AppRoutingConfig appRoutingConfig;
        private static HttpClient httpClient;
        public IncomingRoutingController (AppRoutingConfig appRoutingConfig) {
            httpClient = new HttpClient ();
            this.appRoutingConfig = appRoutingConfig;
        }

        [HttpPost]
        public async Task<IActionResult> Index ([FromBody] PushTopic PushTopic) {
            try {
                HttpContent HttpContent = null;
                AuthenticationResponse AuthenticationResponse = await this.Authenticate (PushTopic);
                if (AuthenticationResponse.access_token == null) {
                    return StatusCode (401, "Authentication with Salesforce failed!");
                } else {
                    Payload Payload = new Payload ();
                    Payload.config = new RoutingConfig (PushTopic.Config.appId, PushTopic.Config.davinciAccountId, PushTopic.Config.davinciProfileId, PushTopic.Config.davinciUsername, PushTopic.Config.davinciPassword);
                    if (PushTopic.EventType == "presence") {
                        HttpContent = await this.ProcessPresence (Payload, AuthenticationResponse, PushTopic);
                    } else if (PushTopic.EventType == "pending_service_routing") {
                        HttpContent = await this.ProcessPendingWork (Payload, AuthenticationResponse, PushTopic);
                    } else if (PushTopic.EventType == "agent_work") {
                        HttpContent = await this.ProcessAgentWork (Payload, AuthenticationResponse, PushTopic);
                    }
                    var response = httpClient.PostAsync (appRoutingConfig.cloudRoutingUri, HttpContent);
                }
            } catch (Exception ex) {
                return StatusCode (500, ex.Message);
            }
            return Ok ();

        }
        public async Task<HttpContent> ProcessPresence (Payload Payload, AuthenticationResponse AuthenticationResponse, PushTopic PushTopic) {
            SalesforceObjects.Presence Presence = JsonConvert.DeserializeObject<SalesforceObjects.Presence> (JsonConvert.SerializeObject (PushTopic.SObject));
            SalesforceObjects.ServicePresenceStatus ServicePresenceStatus = await this.RetrievePresenceName (AuthenticationResponse, Presence);
            User User = await this.RetrieveUser (AuthenticationResponse, Presence.UserId);
            Payload.presence = new Presence (ServicePresenceStatus.MasterLabel, User.Name, Presence.UserId);
            string Content = JsonConvert.SerializeObject (Payload);
            return new StringContent (Content, Encoding.UTF8, "application/json");
        }
        public async Task<HttpContent> ProcessPendingWork (Payload Payload, AuthenticationResponse AuthenticationResponse, PushTopic PushTopic) {
            SalesforceObjects.PendingServiceRouting PendingServiceRouting = JsonConvert.DeserializeObject<SalesforceObjects.PendingServiceRouting> (JsonConvert.SerializeObject (PushTopic.SObject));
            string SObjectPrefix = PendingServiceRouting.WorkItemId.Substring (0, 3);
            Dictionary<string, string> PrefixList = await this.RetrieveSObjects (AuthenticationResponse);
            string SObjectType = PrefixList.Where (Prefix => Prefix.Key == SObjectPrefix).FirstOrDefault ().Value;
            WorkItem WorkItem = new WorkItem (PendingServiceRouting.WorkItemId, SObjectType);
            PendingWork PendingWork = new PendingWork (PendingServiceRouting.Id, PendingServiceRouting.CreatedDate.ToString (), PendingServiceRouting.LastModifiedDate.ToString (), "create", WorkItem);
            Payload.pendingWork = PendingWork;
            string Content = JsonConvert.SerializeObject (Payload);
            return new StringContent (Content, Encoding.UTF8, "application/json");
        }
        public async Task<HttpContent> ProcessAgentWork (Payload Payload, AuthenticationResponse AuthenticationResponse, PushTopic PushTopic) {
            SalesforceObjects.AgentWork AgentWork = JsonConvert.DeserializeObject<SalesforceObjects.AgentWork> (JsonConvert.SerializeObject (PushTopic.SObject));
            string SObjectPrefix = AgentWork.WorkItemId.Substring (0, 3);
            Dictionary<string, string> PrefixList = await this.RetrieveSObjects (AuthenticationResponse);
            string SObjectType = PrefixList.Where (Prefix => Prefix.Key == SObjectPrefix).FirstOrDefault ().Value;
            WorkItem WorkItem = new WorkItem (AgentWork.WorkItemId, SObjectType);
            PicklistValue[] Statuses = await this.RetrieveStatuses (AuthenticationResponse);
            string status = Statuses[AgentWork.Status].Label;
            User User = await RetrieveUser (AuthenticationResponse, AgentWork.UserId);
            string UserName = User.Name;
            AgentWorkStatus AgentWorkStatus = this.GetAgentStatus (status);
            AgentWork _AgentWork = new AgentWork (AgentWork.Id, AgentWork.CreatedDate.ToString (), AgentWork.CreatedDate.ToString (), "update", AgentWorkStatus, WorkItem, UserName, AgentWork.UserId);
            Payload.agentWork = _AgentWork;
            string Content = JsonConvert.SerializeObject (Payload);
            return new StringContent (Content, Encoding.UTF8, "application/json");
        }
        public async Task<AuthenticationResponse> Authenticate (PushTopic PushTopic) {
            try {
                HttpRequestMessage Authenticate =
                    new HttpRequestMessage (HttpMethod.Post, "https://login.salesforce.com/services/oauth2/token");
                var AuthString = "grant_type=password&client_id=" + PushTopic.Config.ClientId + "&client_secret=" + PushTopic.Config.ClientSecret + "&username=" + PushTopic.Config.ClientUsername + "&password=" + PushTopic.Config.ClientAuth;
                var httpContent = new StringContent (AuthString, Encoding.UTF8, "application/x-www-form-urlencoded");
                Authenticate.Content = httpContent;
                HttpResponseMessage AuthenticateResponse =
                    await httpClient.SendAsync (Authenticate);
                AuthenticationResponse Auth = JsonConvert.DeserializeObject<AuthenticationResponse> (
                    await AuthenticateResponse.Content.ReadAsStringAsync ());
                return Auth;
            } catch (Exception ex) {
                throw ex;
            }
        }
        public AgentWorkStatus GetAgentStatus (string status) {
            AgentWorkStatus AgentWorkStatus = new AgentWorkStatus ();
            if (status == "Assigned") {
                // todo
            } else if (status == "Unavailable") {
                AgentWorkStatus.reject = true;
            } else if (status == "Declined") {
                AgentWorkStatus.reject = true;
            } else if (status == "Opened") {
                AgentWorkStatus.accept = true;
            } else if (status == "Closed") {
                AgentWorkStatus.close = true;
            } else if (status == "DeclinedOnPushTimeout") {
                AgentWorkStatus.reject = true;
            } else if (status == "Canceled") {
                // todo
            } else if (status == "Transferred") {
                AgentWorkStatus.transferToUser = true;
            }
            return AgentWorkStatus;
        }
        public async Task<User> RetrieveUser (AuthenticationResponse Auth, string UserId) {
            try {
                HttpRequestMessage RetrieveUser =
                    new HttpRequestMessage (HttpMethod.Get, Auth.instance_url + "/services/data/v45.0/sobjects/User/" + UserId);
                RetrieveUser.Headers.Authorization = new AuthenticationHeaderValue ("Bearer", Auth.access_token);
                HttpResponseMessage RetrieveUserResponse =
                    await httpClient.SendAsync (RetrieveUser);
                User User = JsonConvert.DeserializeObject<User> (
                    await RetrieveUserResponse.Content.ReadAsStringAsync ());
                return User;
            } catch (Exception ex) {
                throw ex;
            }
        }
        public async Task<SalesforceObjects.ServicePresenceStatus> RetrievePresenceName (AuthenticationResponse Auth, SalesforceObjects.Presence presence) {
            try {
                HttpRequestMessage RetrievePresenceName =
                    new HttpRequestMessage (HttpMethod.Get, Auth.instance_url + "/services/data/v45.0/sobjects/ServicePresenceStatus/" + presence.ServicePresenceStatusId);
                RetrievePresenceName.Headers.Authorization = new AuthenticationHeaderValue ("Bearer", Auth.access_token);
                HttpResponseMessage RetrievePresenceNameResponse =
                    await httpClient.SendAsync (RetrievePresenceName);
                SalesforceObjects.ServicePresenceStatus ServicePresenceStatus = JsonConvert.DeserializeObject<SalesforceObjects.ServicePresenceStatus> (
                    await RetrievePresenceNameResponse.Content.ReadAsStringAsync ());
                return ServicePresenceStatus;
            } catch (Exception ex) {
                throw ex;
            }
        }
        public async Task<PicklistValue[]> RetrieveStatuses (AuthenticationResponse Auth) {
            try {
                HttpRequestMessage DescribeAgentWork =
                    new HttpRequestMessage (HttpMethod.Get, Auth.instance_url + "/services/data/v45.0/sobjects/AgentWork/describe/");
                DescribeAgentWork.Headers.Authorization = new AuthenticationHeaderValue ("Bearer", Auth.access_token);
                HttpResponseMessage DescribeAgentWorkResponse =
                    await httpClient.SendAsync (DescribeAgentWork);
                DescribeAgentWork AgentWork = JsonConvert.DeserializeObject<DescribeAgentWork> (
                    await DescribeAgentWorkResponse.Content.ReadAsStringAsync ());
                return AgentWork.Fields.Where (field => field.Name == "Status").FirstOrDefault ().PicklistValues;
            } catch (Exception ex) {
                throw ex;
            }
        }

        public async Task<Dictionary<string, string>> RetrieveSObjects (AuthenticationResponse Auth) {
            try {
                HttpRequestMessage RetrieveSObjects =
                    new HttpRequestMessage (HttpMethod.Get, Auth.instance_url + "/services/data/v45.0/sobjects/");
                RetrieveSObjects.Headers.Authorization = new AuthenticationHeaderValue ("Bearer", Auth.access_token);
                HttpResponseMessage RetrieveSObjectsResponse =
                    await httpClient.SendAsync (RetrieveSObjects);
                SObjects SObjectsPayload = JsonConvert.DeserializeObject<SObjects> (
                    await RetrieveSObjectsResponse.Content.ReadAsStringAsync ());
                return this.GeneratePrefixList (SObjectsPayload.Sobjects);
            } catch (Exception ex) {
                throw ex;
            }
        }
        public Dictionary<string, string> GeneratePrefixList (Sobject[] SObjects) {
            Dictionary<string, string> PrefixList = new Dictionary<string, string> ();
            foreach (var SObject in SObjects) {
                try {
                    PrefixList.Add (SObject.KeyPrefix, SObject.Name);
                } catch (Exception) { }
            }
            return PrefixList;
        }
        public async Task<Sobject> RetrieveSObject (AuthenticationResponse Auth, string Type, string Id) {
            try {
                HttpRequestMessage RetrieveSObject =
                    new HttpRequestMessage (HttpMethod.Get, Auth.instance_url + "/services/data/v45.0/sobjects/" + Type + "/" + Id);
                RetrieveSObject.Headers.Authorization = new AuthenticationHeaderValue ("Bearer", Auth.access_token);
                HttpResponseMessage RetrieveSObjectResponse =
                    await httpClient.SendAsync (RetrieveSObject);
                Sobject SObject = JsonConvert.DeserializeObject<Sobject> (
                    await RetrieveSObjectResponse.Content.ReadAsStringAsync ());
                return SObject;
            } catch (Exception ex) {
                throw ex;
            }
        }
        public void Log (string type, string controller, string details) {
            Console.Write ("\n" + type + " received on " + controller + " controller " + DateTime.Now.ToString ("MM/dd/yyyy HH:mm:ss tt") + "\n");
            JObject parsed = JObject.Parse (details);

            foreach (var pair in parsed) {
                Console.WriteLine ("{0}: {1}", pair.Key, pair.Value);
            }
            Console.Write ("\n");
        }
        public class AuthenticationResponse {
            public string access_token { get; set; }
            public string instance_url { get; set; }
            public string id { get; set; }
            public string token_type { get; set; }
            public string issued_at { get; set; }
            public string signature { get; set; }
        }

    }
}