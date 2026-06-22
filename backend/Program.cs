using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.OpenApi.Models;
using Triweb.Api.Controllers;
using Triweb.Api.Services;
using System.Text;

Console.OutputEncoding = Encoding.UTF8;
Console.InputEncoding = Encoding.UTF8;

var builder = WebApplication.CreateBuilder(args);

// -------------------- Services --------------------

// Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Triweb API", Version = "v1" });
});

// CORS pour Angular
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
        policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());
});


// Dashboard services
builder.Services.AddSingleton<DashboardService>();
builder.Services.AddHttpClient("DashboardSource");

// PlanningSync services
builder.Services.AddHttpClient<PlanningSyncService>(client =>
{
    client.Timeout = TimeSpan.FromMinutes(5);
});
builder.Services.AddHostedService<BackgroundPlanningSyncService>();

// ML API service
builder.Services.AddHttpClient<MlApiService>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["MlApi:BaseUrl"] ?? "http://127.0.0.1:8000");
    client.Timeout = TimeSpan.FromSeconds(120);
});

// Chatbot Controller HttpClient
builder.Services.AddHttpClient<ChatbotController>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(180);
});

// -------------------- Keycloak JWT (optionnel) --------------------
var keycloakEnabled = builder.Configuration.GetValue<bool>("Keycloak:Enabled");
if (keycloakEnabled)
{
    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.Authority = builder.Configuration["Keycloak:Authority"];
            options.Audience = builder.Configuration["Keycloak:Audience"];
            options.RequireHttpsMetadata =
                builder.Configuration.GetValue<bool>("Keycloak:RequireHttpsMetadata");
        });

    builder.Services.AddAuthorization();
}

// -------------------- Build app --------------------
var app = builder.Build();

// -------------------- Middleware --------------------
app.UseCors("frontend");

if (keycloakEnabled)
{
    app.UseAuthentication();
}
app.UseAuthorization();

// Swagger
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Triweb API v1");
});

// -------------------- Endpoints --------------------

// Health / user / menu
app.MapGet("/api/health", () => Results.Ok(new { status = "ok", backend = ".NET 8", database = "TriwebDW" }));
app.MapGet("/api/user", () => Results.Ok(new { id = 1, name = "Admin Triweb", email = "admin@triweb.com", role = "admin" }));
app.MapGet("/api/menu", () => Results.Ok(new[]
{
    new { id = "dashboard", title = "Dashboard général", icon = "heroicons_outline:chart-square-bar", link = "/triweb/dashboard" },
    new { id = "planification", title = "Planification", icon = "heroicons_outline:calendar", link = "/triweb/planification" },
    new { id = "powerbi", title = "Power BI", icon = "heroicons_outline:presentation-chart-bar", link = "/triweb/powerbi" },
    new { id = "triweb.models", title = "Modèles IA", icon = "heroicons_outline:chip", link = "/triweb/models" }
}));

// Dashboard endpoints
app.MapGet("/api/dashboard/meta", async (DashboardService service) => Results.Ok(await service.GetMetaAsync()));
app.MapGet("/api/dashboard/overview", async (DashboardService service) => Results.Ok(await service.GetOverviewAsync()));
app.MapGet("/api/dashboard/items", async (DashboardService service) => Results.Ok(await service.GetItemsAsync()));
app.MapGet("/api/dashboard/production", async (DashboardService service) => Results.Ok(await service.GetProductionAsync()));
app.MapGet("/api/dashboard/performance", async (DashboardService service) => Results.Ok(await service.GetPerformanceAsync()));
app.MapGet("/api/dashboard/planification", async (DashboardService service) => Results.Ok(await service.GetPlanificationAsync()));
app.MapGet("/api/dashboard/disponibilite", async (DashboardService service) => Results.Ok(await service.GetDisponibiliteAsync()));
app.MapGet("/api/dashboard/models-ia", async (DashboardService service) => Results.Ok(await service.GetModelsIaAsync()));

// Controllers (Chatbot, Planning, etc.)
app.MapControllers();

// -------------------- Run --------------------
app.Run();