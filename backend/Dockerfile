FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY . .

RUN dotnet restore "SmartProperty.Api/SmartProperty.Api.csproj"

RUN dotnet publish "SmartProperty.Api/SmartProperty.Api.csproj" \
    --configuration Release \
    --output /app/publish \
    --no-restore \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

COPY --from=build /app/publish .

RUN mkdir -p /app/wwwroot/uploads/workers

ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 10000

ENTRYPOINT ["sh", "-c", "exec dotnet SmartProperty.Api.dll --urls http://0.0.0.0:${PORT:-10000}"]