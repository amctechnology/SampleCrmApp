# SampleCrmApp

## AMC API
* Da-Vinci API Reference (important): https://apidocs.contactcanvas.com/modules/davinci_api.html 

* Check out AMCs node repositories:

   * Da-Vinci API: https://www.npmjs.com/package/@amc-technology/davinci-api
   * Application Angular Framework: https://www.npmjs.com/package/@amc-technology/applicationangularframework

## To use:
* Clone the repository using `git clone https://github.com/amctechnology/SampleCrmApp.git`
* Install template using `dotnet new -i <location of the folder containing this file>`
* Create new project in another directory `dotnet new amc-app-angular -n Salesforce -o newDirectoryPath`. For example, `dotnet new amc-app-angular -n Salesforce -o ../CRM/`.
* Open the folder used in previous step in vscode
* Go to the `home-salesforce.component.ts` (line 24) file and change the Salesforce org to point to your org.
* Run project by hitting F5 in vscode
* Download Fiddler from https://www.telerik.com/download/fiddler
* Open Fiddler and go to Tools > HOSTS. Ensure that the checkbox is checked and insert the line `127.0.0.1:5012 sfcrmapp.contactcanvas.com` in the box. Save and close the HOSTS window.
* Go to https://studio-dev.contactcanvas.com and create an app similar to how you created the SampleChannelApp. Name this app SampleCrmApp.
* Configure this app's URL to be the url you put in Fiddler and prefix `https://` i.e., `https://sfcrmapp.contactcanvas.com`.
* Now if you go to your Salesforce instance, you should see these two apps in the softphone. Now your job is to complete the given objectives.
* Use npm scripts for testing and linting (run from ClientApp or vscode task runner)
    * `npm run lint` To lint the project
    * `npm run test` to test the project

Note: for bridge event service to work the title of your plugin in admin tool must equal the name passed when you initialized bridge event service!
    This name by default is the name you specified when creating this project

Note: hot reloading will not work for bridge script as the framework loads that script

TODOs: this template has TODO comments written through out to indicate parts that need to be filled out by you

CadPopKeys: see dynamics for example of admin tool config for this
