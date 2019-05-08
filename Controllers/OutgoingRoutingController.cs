using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Clients.ActiveDirectory;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SalesforceCloudCore.Models;

namespace SalesforceCloudCore.Controllers {
    public class OutgoingRoutingController : Controller {
        private static HttpClient httpClient;
        private static string AccessToken;
        public OutgoingRoutingController () {
            httpClient = new HttpClient ();
        }

        [HttpPost]
        public async Task<IActionResult> Index ([FromBody] Payload payload) {
            try {
                HttpContent HttpContent = null;
                SalesforceAuthParams SalesforceAuth = JsonConvert.DeserializeObject<SalesforceAuthParams> (JsonConvert.SerializeObject (payload.config.routingEngine));
                AuthenticationResponse AuthenticationResponse = await this.Authenticate (SalesforceAuth);
                if (AuthenticationResponse.access_token == null) {
                    return StatusCode (401, "Authentication with Salesforce failed!");
                } else {
                    if (payload.agentWork != null) {
                        Log ("Agent Work", "Outgoing Routing", JsonConvert.SerializeObject (payload.agentWork));

                    }
                }
            } catch (HttpRequestException ex) {
                return StatusCode (500, ex.Message);
            }
            return Ok ();
        }

        public async Task<AuthenticationResponse> Authenticate (SalesforceAuthParams SalesforceAuth) {
            try {
                HttpRequestMessage Authenticate =
                    new HttpRequestMessage (HttpMethod.Post, "https://login.salesforce.com/services/oauth2/token");
                var AuthString = "grant_type=password&client_id=" + SalesforceAuth.ClientId + "&client_secret=" + SalesforceAuth.ClientSecret + "&username=" + SalesforceAuth.ClientUsername + "&password=" + SalesforceAuth.ClientAuth;
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
        public async Task<Dictionary<string, object>> RetrievePendingServiceRouting (AuthenticationResponse Auth, PendingWork PendingWork) {
            try {
                HttpRequestMessage RetrievePendingServiceRouting =
                    new HttpRequestMessage (HttpMethod.Get, Auth.instance_url + "/services/data/v45.0/sobjects/PendingServiceRouting/" + PendingWork.id);
                RetrievePendingServiceRouting.Headers.Authorization = new AuthenticationHeaderValue ("Bearer", Auth.access_token);
                HttpResponseMessage RetrievePendingServiceRoutingResponse =
                    await httpClient.SendAsync (RetrievePendingServiceRouting);
                Dictionary<string, object> PendingServiceRouting = JsonConvert.DeserializeObject<Dictionary<string, object>> (
                    await RetrievePendingServiceRoutingResponse.Content.ReadAsStringAsync ());
                return PendingServiceRouting;
            } catch (Exception ex) {
                throw ex;
            }
        }
        public CreateAgentWork (AuthenticationResponse Auth, AgentWork AgentWork, Dictionary<string, object> PendingServiceRouting) {
            try {
                string SObjectType = AgentWork.workItem.type;
                PendingWork PendingWork = AgentWork.pendingWork;
                HttpRequestMessage RetrievePresenceName =
                    new HttpRequestMessage (HttpMethod.Post, Auth.instance_url + "/services/data/v45.0/sobjects/" + SObjectType);
                RetrievePresenceName.Headers.Authorization = new AuthenticationHeaderValue ("Bearer", Auth.access_token);
                NewAgentWorkParams NewAgentWorkParams = NewAgentWorkParams (PendingWork.id, )
                string Content = JsonConvert.SerializeObject (agentWork);
                var HttpContent = new StringContent (content, Encoding.UTF8, "application/json");
                CreateWork.Content = httpContent;
                HttpResponseMessage RetrievePresenceNameResponse =
                    await httpClient.SendAsync (RetrievePresenceName);
                SalesforceObjects.ServicePresenceStatus ServicePresenceStatus = JsonConvert.DeserializeObject<SalesforceObjects.ServicePresenceStatus> (
                    await RetrievePresenceNameResponse.Content.ReadAsStringAsync ());
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
        public class SalesforceAuthParams {
            [JsonProperty (PropertyName = "ClientId")]
            public string ClientId { get; set; }

            [JsonProperty (PropertyName = "ClientSecret")]
            public string ClientSecret { get; set; }

            [JsonProperty (PropertyName = "ClientUsername")]
            public string ClientUsername { get; set; }

            [JsonProperty (PropertyName = "ClientAuth")]
            public string ClientAuth { get; set; }
        }
        public class NewAgentWorkParams {
            public string PendingServiceRoutingId { get; set; }
            public string ServiceChannelId { get; set; }
            public string UserId { get; set; }
            public string WorkItemId { get; set; }
            public NewAgentWorkParams () { }
            public NewAgentWorkParams (string PendingServiceRoutingId, string ServiceChannelId, string UserId, string WorkItemId) {
                this.PendingServiceRoutingId = PendingServiceRoutingId;
                this.ServiceChannelId = ServiceChannelId;
                this.UserId = UserId;
                this.WorkItemId = WorkItemId;
            }
        }
    }
}