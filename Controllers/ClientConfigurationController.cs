using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using SalesforceCloudCore.Models;

namespace SalesforceCloudCore.Controllers
{
    public class ClientConfigurationController : Controller
    {
        ClientConfiguration clientConfig;
        public ClientConfigurationController(IOptions<ClientConfiguration> clientConfigOptions)
        {
            clientConfig = clientConfigOptions?.Value;
        }

        [HttpGet]
        public IActionResult Index()
        {
            return Json(clientConfig);
        }
    }
}