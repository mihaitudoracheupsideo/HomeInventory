using Coravel;
using HomeInventory.Infrastructure;
using HomeInventory.Repository;
using HomeInventory.Application;
using HomeInventory.Application.Alerts;
using HomeInventory.Application.Services;
using HomeInventory.WebApi.Alerts;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.OpenApi;
using Serilog;
using Swashbuckle.AspNetCore.SwaggerGen;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
var builder = WebApplication.CreateBuilder(args);

var dataProtectionKeysDirectory = new DirectoryInfo(Path.Combine(builder.Environment.ContentRootPath, ".keys"));
if (!dataProtectionKeysDirectory.Exists)
{
    dataProtectionKeysDirectory.Create();
}

builder.Host.UseSerilog((context, services, loggerConfiguration) => loggerConfiguration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext());

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();
builder.Services.AddScheduler();
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(dataProtectionKeysDirectory)
    .SetApplicationName("HomeInventory");

builder.Services.AddControllers();

// Adăugăm DbContext cu SQLite
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"),
        b => b.MigrationsAssembly("HomeInventory.Infrastructure")));

// Register repositories
builder.Services.AddScoped<IItemRepository, ItemRepository>();
builder.Services.AddScoped<IItemTypeRepository, ItemTypeRepository>();
builder.Services.AddScoped<ILocationRepository, LocationRepository>();
builder.Services.AddScoped<ITagRepository, TagRepository>();
builder.Services.AddScoped<IItemTagRepository, ItemTagRepository>();
builder.Services.AddScoped<IAlertDefinitionRepository, AlertDefinitionRepository>();
builder.Services.AddScoped<IAlertOccurrenceRepository, AlertOccurrenceRepository>();
builder.Services.AddScoped<IAlertNotificationSettingsRepository, AlertNotificationSettingsRepository>();

// Register services
builder.Services.AddScoped<ITagService, TagService>();
builder.Services.AddScoped<ITagNormalizer, TagNormalizer>();
builder.Services.AddScoped<IAlertScheduleCalculator, AlertScheduleCalculator>();
builder.Services.AddScoped<IAlertDefinitionService, AlertDefinitionService>();
builder.Services.AddScoped<IAlertOccurrenceService, AlertOccurrenceService>();
builder.Services.AddScoped<IAlertProcessingService, AlertOccurrenceService>();
builder.Services.AddScoped<ISecretProtector, DataProtectionSecretProtector>();
builder.Services.AddScoped<IAlertNotificationSettingsService, AlertNotificationSettingsService>();
builder.Services.AddScoped<IAlertNotificationService, SmtpAlertNotificationService>();
builder.Services.AddTransient<ProcessAlertOccurrencesInvocable>();

// Add caching
builder.Services.AddMemoryCache();

// Adăugăm CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "https://localhost:5173",
                "http://192.168.1.152:5173",
                "https://192.168.1.152:5173",
                "http://localhost:5174",
                "https://localhost:5174",
                "http://localhost:5005",
                "https://localhost:5005",
                "https://localhost:5443",
                "https://192.168.1.152:5443"
              )
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
var app = builder.Build();
app.Services.UseScheduler(scheduler =>
{
    scheduler.Schedule<ProcessAlertOccurrencesInvocable>().EveryFiveMinutes();
});
app.UseCors("AllowFrontend"); // Activează politica
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.MapControllers();
app.UseHttpsRedirection(); // HTTPS enabled for secure camera access

// Ensure database is created and migrations are applied
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await dbContext.Database.MigrateAsync();
    var alertProcessingService = scope.ServiceProvider.GetRequiredService<IAlertProcessingService>();
    await alertProcessingService.ProcessAsync();
    Log.Information("Database migrations applied successfully.");
}

Log.Information("Application configured, starting...");

app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application failed to start.");
    throw;
}
finally
{
    await Log.CloseAndFlushAsync();
}
