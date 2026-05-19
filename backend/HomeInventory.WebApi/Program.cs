using HomeInventory.Infrastructure;
using HomeInventory.Repository;
using HomeInventory.Application;
using HomeInventory.Application.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();

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

// Register services
builder.Services.AddScoped<ITagService, TagService>();
builder.Services.AddScoped<ITagNormalizer, TagNormalizer>();

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
    Console.WriteLine("Database migrations applied successfully");
}

Console.WriteLine("Application configured, starting...");

try
{
    Console.WriteLine("About to call app.Run()...");
    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine($"Application failed to start: {ex.Message}");
    Console.WriteLine($"Stack trace: {ex.StackTrace}");
    if (ex.InnerException != null)
    {
        Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
        Console.WriteLine($"Inner stack trace: {ex.InnerException.StackTrace}");
    }
    throw;
}
