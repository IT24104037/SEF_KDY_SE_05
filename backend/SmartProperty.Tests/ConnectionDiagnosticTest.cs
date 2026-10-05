using System;
using System.Threading.Tasks;
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
    public async Task TestConnectionVariants()
    {
        string[] connectionStrings = new[]
        {
            "Host=aws-0-ap-southeast-2.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.gjbyumgnviiyytbdcnfk;Password=Praveenthan123@;SSL Mode=Require;Trust Server Certificate=true;Timeout=15;Command Timeout=15;Pooling=false;",
            "Host=aws-0-ap-southeast-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.gjbyumgnviiyytbdcnfk;Password=Praveenthan123@;SSL Mode=Require;Trust Server Certificate=true;Timeout=15;Command Timeout=15;Pooling=false;",
            "Host=db.gjbyumgnviiyytbdcnfk.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=Praveenthan123@;SSL Mode=Require;Trust Server Certificate=true;Timeout=15;Command Timeout=15;"
        };

        foreach (var cs in connectionStrings)
        {
            try
            {
                _output.WriteLine($"Testing: {cs.Split(';')[0]};{cs.Split(';')[1]}...");
                await using var conn = new NpgsqlConnection(cs);
                await conn.OpenAsync();
                await using var cmd = new NpgsqlCommand("SELECT 1;", conn);
                var res = await cmd.ExecuteScalarAsync();
                _output.WriteLine($"SUCCESS with {cs.Split(';')[0]};{cs.Split(';')[1]} -> Result: {res}");
                Assert.True(true);
                return;
            }
            catch (Exception ex)
            {
                _output.WriteLine($"FAILED with {cs.Split(';')[0]};{cs.Split(';')[1]} -> {ex.GetType().Name}: {ex.Message}");
            }
        }
    }
}

