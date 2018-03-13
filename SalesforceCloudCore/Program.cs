using System;
using System.Net;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;

namespace SalesforceCloudCore
{
    public class Program
    {
        public static void Main(string[] args)
        {
            if (!isDevelopment())
            {
                BuildWebHost(args).Run();
            }
            else
            {
                BuildWebHostDev(args).Run();
            }
        }


        public static IWebHost BuildWebHost(string[] args) =>
            WebHost.CreateDefaultBuilder(args)    
            .UseStartup<Startup>()
            .Build();


        public static IWebHost BuildWebHostDev(string[] args) =>

           WebHost.CreateDefaultBuilder(args)
               .UseKestrel((options) =>
               {
                   if (isDevelopment())
                   {
                       options.Listen(IPAddress.Loopback, 5008);
                       options.Listen(IPAddress.Loopback, 5007, listenOptions =>
                       {
                           listenOptions.UseHttps(@"Certificates\localhost.pfx", "password");
                       });
                   }
               })
               .UseStartup<Startup>()
               .Build();

        public static bool isDevelopment()
        {
            string environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
            return !string.IsNullOrEmpty(environment) && environment.Equals("Development");
        }
    }
}
