using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Xunit;
using Xunit.Abstractions;

namespace SmartProperty.Tests;

public class ConnectionDiagnosticTest
{
    private readonly ITestOutputHelper _output;

    public ConnectionDiagnosticTest(ITestOutputHelper output)
    {
        _output = output;
    }

    [Fact]
    public async Task TestConfiguredDatabaseConnection()
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddUserSecrets(typeof(SmartProperty.Api.Data.AppDbContext).Assembly, optional: true)
            .AddEnvironmentVariables()
            .Build();

        string connectionString = config.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection configuration string is missing.");

        _output.WriteLine("Loaded DefaultConnection configuration from User Secrets.");

        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();
        await using var cmd = new NpgsqlCommand("SELECT current_database(), current_user;", conn);
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string dbName = reader.GetString(0);
            string dbUser = reader.GetString(1);
            _output.WriteLine($"Connected successfully! Database: {dbName}, User: {dbUser}");
        }

        Assert.True(conn.State == System.Data.ConnectionState.Open, "Database connection should be open.");
    }
}
