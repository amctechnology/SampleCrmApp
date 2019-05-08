using System;
using System.IO;
using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.NodeServices.Npm;
using Microsoft.AspNetCore.NodeServices.Util;
using Microsoft.AspNetCore.SpaServices.AngularCli;
using Microsoft.AspNetCore.SpaServices.Util;
using Microsoft.AspNetCore.SpaServices.Webpack;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Salesforce.Models;
using SalesforceCloudCore.Models;

namespace Salesforce {
    public class Startup {
        private static CustomJwtDataFormat CustomJwtDataFormat = new CustomJwtDataFormat ();

        public Startup (IConfiguration configuration) {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices (IServiceCollection services) {
            services.AddOptions ();
            services.Configure<ClientConfiguration> (Configuration.GetSection ("ClientConfiguration"));
            services.AddMvc ();

            services.AddAuthentication (options => {
                options.DefaultAuthenticateScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            }).AddCookie (options => {
                options.Cookie.Expiration = TimeSpan.FromDays (14);
                options.Cookie.Name = "access_token";
                options.Cookie.Domain = Environment.GetEnvironmentVariable ("AUTH_COOKIE_DOMAIN");
                options.TicketDataFormat = CustomJwtDataFormat;
            });

            // In production, the Angular files will be served from this directory
            services.AddSpaStaticFiles (configuration => {
                configuration.RootPath = "ClientApp/dist";
            });

        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure (IApplicationBuilder app, IHostingEnvironment env) {
            if (env.IsDevelopment ()) {
                app.UseDeveloperExceptionPage ();
            }

            // Check auth of user
            bool useAuth = IsProduction() || Environment.GetEnvironmentVariable("USE_AUTH") == "true";
            app.Use(async (context, next) =>
            {

                if (useAuth)
                {
                    var authTicket = CustomJwtDataFormat.Unprotect(context.Request.Cookies["access_token"]);

                    if (authTicket != null && (authTicket.Principal.IsInRole("Agent") || authTicket.Principal.IsInRole("Admin") || authTicket.Principal.IsInRole("AMC-Admin")))
                    {
                        await next.Invoke();
                    }
                    else
                    {
                        context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                    }
                }
                else
                {
                    context.User = new ClaimsPrincipal();
                    var Id = new ClaimsIdentity();
                    Id.AddClaim(new Claim(ClaimTypes.Role, "Agent"));
                    context.User.AddIdentity(Id);
                    await next.Invoke();
                }
            });

            if (env.IsDevelopment ()) {
                app.UseWebpackDevMiddleware (new WebpackDevMiddlewareOptions {
                    HotModuleReplacement = true,
                        ProjectPath = Path.Combine (Directory.GetCurrentDirectory (), "ClientApp")
                });
            }

            app.UseDefaultFiles ();
            app.UseStaticFiles ();

            app.UseMvc (routes => {
                routes.MapRoute (
                    name: "default",
                    template: "{controller}/{action=Index}/{id?}");
            });
        }
        private static bool IsProduction () {
            string environment = Environment.GetEnvironmentVariable ("ASPNETCORE_ENVIRONMENT");
            return !string.IsNullOrEmpty (environment) && environment.Equals ("Production");
        }
    }
}