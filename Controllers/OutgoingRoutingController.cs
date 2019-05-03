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
using Salesforce.Models;

namespace DynamicsApp.Controllers {
    public class OutgoingRoutingController : Controller {
        private static HttpClient httpClient;
        private static string AccessToken;
        private AppRoutingConfig appRoutingConfig;
        public OutgoingRoutingController (AppRoutingConfig appRoutingConfig) {
            httpClient = new HttpClient ();
            this.appRoutingConfig = appRoutingConfig;
        }

        [HttpPost]
        public async Task<IActionResult> Index ([FromBody] Payload payload) {
            try {
                string tenantId = payload.config.crm["TenantId"];
                string applicationId = payload.config.crm["ApplicationId"];
                string webKey = payload.config.crm["WebKey"];
                string org = payload.config.crm["DynamicsOrg"];
                string baseApiUrl = payload.config.crm["DynamicsOrg"] + "api/data/v9.0/";
                if (payload.agentWork != null) {
                    Log ("Agent Work", "Outgoing Routing", JsonConvert.SerializeObject (payload.agentWork));
                    JObject agentWork = new JObject ();
                    agentWork.Add ("new_workitemid", payload.agentWork.workItem.id);
                    agentWork.Add ("new_isengaged", false);
                    agentWork.Add ("new_workitemtype", payload.agentWork.workItem.type);
                    agentWork.Add ("new_OriginQueue_new_omnichannel_work@odata.bind", "/queues(" + payload.config.crm["QueueId"] + ")");
                    agentWork.Add ("new_haspopped", false);
                    AccessToken = await Authenticate (tenantId, applicationId, webKey, org);
                    CreateWork (baseApiUrl, agentWork);
                    string userQueueId = await retrieveAgentQueueId (baseApiUrl, payload.agentWork.userId);
                    string queueItemId = await CreateQueueItem (baseApiUrl, userQueueId, payload.agentWork.workItem.type.ToLower (), payload.agentWork.workItem.id);
                }
            } catch (HttpRequestException ex) {
                return StatusCode (500, ex.Message);
            }
            return Ok ();
        }

        public async Task<string> Authenticate (string tenantId, string applicationId, string webKey, string org) {
            ClientCredential credential = new ClientCredential (applicationId, webKey);
            string authorityUri = appRoutingConfig.dynamicsBaseAuthUri + tenantId;
            TokenCache tokenCache = new TokenCache ();
            AuthenticationContext context = new AuthenticationContext (authorityUri);
            AuthenticationResult result = await context.AcquireTokenAsync (org, credential);
            return result.AccessToken;
        }
        public async void CreateWork (string baseApiUrl, JObject agentWork) {
            try {
                HttpRequestMessage CreateWork =
                    new HttpRequestMessage (HttpMethod.Post, baseApiUrl + "new_omnichannel_works");
                CreateWork.Headers.Authorization = new AuthenticationHeaderValue ("Bearer", AccessToken);
                string content = JsonConvert.SerializeObject (agentWork);
                var httpContent = new StringContent (content, Encoding.UTF8, "application/json");
                CreateWork.Content = httpContent;
                HttpResponseMessage CreateWorkResponse =
                    await httpClient.SendAsync (CreateWork);
            } catch (Exception ex) {
                throw ex;
            }
        }
        public async Task<string> CreateQueueItem (string baseApiUrl, string userQueueId, string type, string workItemId) {
            try {
                HttpRequestMessage CreateQueueItem =
                    new HttpRequestMessage (HttpMethod.Post, baseApiUrl + "queues(" + userQueueId + ")/Microsoft.Dynamics.CRM.AddToQueue");
                CreateQueueItem.Headers.Authorization = new AuthenticationHeaderValue ("Bearer", AccessToken);
                JObject queueItem = new JObject ();
                JObject Target = new JObject ();
                JObject QueueItemProperties = new JObject ();
                Target.Add (type + "id", workItemId);
                QueueItemProperties.Add ("new_isomnichannelqueueitem", true);
                Target.Add ("@odata.type", "Microsoft.Dynamics.CRM." + type);
                queueItem.Add ("Target", Target);
                queueItem.Add ("QueueItemProperties", QueueItemProperties);
                string content = JsonConvert.SerializeObject (queueItem);
                var httpContent = new StringContent (content, Encoding.UTF8, "application/json");
                CreateQueueItem.Content = httpContent;
                HttpResponseMessage CreateQueueItemResponse =
                    await httpClient.SendAsync (CreateQueueItem);
                JObject RetrievedUser = JsonConvert.DeserializeObject<JObject> (
                    await CreateQueueItemResponse.Content.ReadAsStringAsync ());
                return RetrievedUser.GetValue ("QueueItemId").ToString ();
            } catch (Exception ex) {
                throw ex;
            }
        }
        public async Task<string> retrieveAgentQueueId (string baseApiUrl, string userId) {
            try {
                HttpRequestMessage RetrieveUser =
                    new HttpRequestMessage (HttpMethod.Get, baseApiUrl + "systemusers(" + userId + ")");
                RetrieveUser.Headers.Authorization = new AuthenticationHeaderValue ("Bearer", AccessToken);
                HttpResponseMessage RetrieveUserResponse =
                    await httpClient.SendAsync (RetrieveUser);
                JObject RetrievedUser = JsonConvert.DeserializeObject<JObject> (
                    await RetrieveUserResponse.Content.ReadAsStringAsync ());
                return RetrievedUser.GetValue ("_queueid_value").ToString ();
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
    }
}