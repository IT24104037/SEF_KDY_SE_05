var builder = WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers();

// Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS - React and Flutter will use this API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClients", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowClients");

// Authentication and Authorization will be configured later
// when the common JWT feature is implemented.

app.MapControllers();

// Simple health endpoint for setup/testing/deployment
app.MapGet("/health", () =>
{
    return Results.Ok(new
    {
        status = "Healthy",
        application = "Smart Property Maintenance API"
    });
});

app.Run();

// Required later for ASP.NET integration testing
public partial class Program { }