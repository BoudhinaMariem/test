using Triweb.Api.Services;
using System.Diagnostics;
using System.Text;
using System.Text.Json;

Console.OutputEncoding = System.Text.Encoding.UTF8;
Console.InputEncoding = System.Text.Encoding.UTF8;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddSingleton<DashboardService>();
builder.Services.AddHttpClient("DashboardSource");
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
        policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());
});

builder.Services.AddControllers();

builder.Services.AddHttpClient<MlApiService>(client =>
{
    client.BaseAddress = new Uri(
        builder.Configuration["MlApi:BaseUrl"] ?? "http://127.0.0.1:8000"
    );

    client.Timeout = TimeSpan.FromSeconds(120);
});

var app = builder.Build();
app.UseCors("frontend");

app.MapGet("/api/health", () => Results.Ok(new { status = "ok", backend = ".NET 8", database = "TriwebDW" }));
app.MapGet("/api/user", () => Results.Ok(new { id = 1, name = "Admin Triweb", email = "admin@triweb.com", role = "admin" }));
app.MapGet("/api/menu", () => Results.Ok(new[] {
    new { id = "dashboard", title = "Dashboard général", icon = "heroicons_outline:chart-square-bar", link = "/triweb/dashboard" },
    new { id = "planification", title = "Planification", icon = "heroicons_outline:calendar", link = "/triweb/planification" },
    new { id = "powerbi", title = "Power BI", icon = "heroicons_outline:presentation-chart-bar", link = "/triweb/powerbi" },
    new { id = "triweb.models", title = "Modèles IA", icon = "heroicons_outline:chip", link = "/triweb/models" }
}));
app.MapGet("/api/dashboard/meta", async (DashboardService service) => Results.Ok(await service.GetMetaAsync()));
app.MapGet("/api/dashboard/overview", async (DashboardService service) => Results.Ok(await service.GetOverviewAsync()));
app.MapGet("/api/dashboard/items", async (DashboardService service) => Results.Ok(await service.GetItemsAsync()));
app.MapGet("/api/dashboard/production", async (DashboardService service) => Results.Ok(await service.GetProductionAsync()));
app.MapGet("/api/dashboard/performance", async (DashboardService service) => Results.Ok(await service.GetPerformanceAsync()));
app.MapGet("/api/dashboard/planification", async (DashboardService service) => Results.Ok(await service.GetPlanificationAsync()));
app.MapGet("/api/dashboard/disponibilite", async (DashboardService service) => Results.Ok(await service.GetDisponibiliteAsync()));
app.MapGet("/api/dashboard/models-ia", async (DashboardService service) => Results.Ok(await service.GetModelsIaAsync()));



app.MapControllers();

app.Run();

public class ChatbotRequest
{
    public string Question { get; set; } = string.Empty;
}

public class ChatbotResponse
{
    public bool Success { get; set; }
    public string Answer { get; set; } = string.Empty;
    public int Count { get; set; }
}