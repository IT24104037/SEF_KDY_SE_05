$project = Join-Path $PSScriptRoot "SmartProperty.Api\SmartProperty.Api.csproj"

dotnet run --project $project --launch-profile http
