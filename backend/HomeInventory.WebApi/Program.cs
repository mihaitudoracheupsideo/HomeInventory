using HomeInventory.Infrastructure;
using HomeInventory.Repository;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddControllers();

// Adăugăm DbContext cu SQLite
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register repositories
builder.Services.AddScoped<IItemRepository, ItemRepository>();
builder.Services.AddScoped<IItemTypeRepository, ItemTypeRepository>();

// Add caching
builder.Services.AddMemoryCache();

// Adăugăm CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin => new Uri(origin).Host == "localhost")
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
}
app.MapControllers();
app.UseHttpsRedirection();



app.Run();
