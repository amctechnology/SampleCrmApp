To use:
- Connect to AMC's npm registry
    - See https://cccf-api-docs.azurewebsites.net/
- Install use `dotnet new -i <location of the folder containing this file>`
- Create new with subdirectory `dotnet new amc-app-angular -n <name of project>`
- Create new without subdirectory `dotnet new amc-app-angular -n <name of project> -o .`
- Open folder in vscode
- Run project by hitting F5 in vscode
    - Make sure you restore NuGet packages first: `dotnet restore` or click on vscode prompt
- Use npm scripts for testing and linting(run from ClientApp or vscode task runner)
    - `npm run lint` To lint the project
    - `npm run test` to test the project

Note: for bridge event service to work the title of your plugin in admin tool must equal the name passed when you initialized bridge event service!
    This name by default is the name you specified when creating this project

Note: hot reloading will not work for bridge script as the framework loads that script

TODOs: this template has TODO comments written through out to indicate parts that need to be filled out by you

CadPopKeys: see dynamics for example of admin tool config for this